/**
 * test-jenga-ipn.ts
 *
 * Automated Jenga IPN tester:
 * - Tests localhost:3000 first
 * - Detects if port 3000 is busy
 * - Falls back to ngrok automatically
 * - Auto-retries ngrok detection and localhost reconnect every few minutes
 * - Logs success/error messages daily in /logs/
 * - Gracefully recovers if your local API or ngrok tunnel restarts mid-run
 */

import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import net from 'net'

const JENGA_SECRET = 'x89Tt3XHT98HadFO2h67Lm8Mlj0fWw'
const LOG_DIR = path.join(process.cwd(), 'logs')
const SEND_INTERVAL_MS = 30_000
const HEALTHCHECK_INTERVAL_MS = 5 * 60_000 // 5 minutes
const TIMEOUT_MS = 20_000 // 20s per request

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR)

/** --- Logging utilities --- */
function logMessage(type: 'info' | 'error', message: string) {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0]
  const logFile =
    type === 'error'
      ? path.join(LOG_DIR, `ipn-errors-${dateStr}.log`)
      : path.join(LOG_DIR, `ipn-test-${dateStr}.log`)

  const line = `[${date.toISOString()}] ${message}\n`
  fs.appendFileSync(logFile, line)
}

/** --- Random IPN payload --- */
function generatePayload() {
  return {
    callbackType: 'IPN',
    transaction: {
      reference: 'TXN' + Math.floor(Math.random() * 1_000_000),
      accountNumber: Math.random() > 0.5 ? 'LEASE-123' : 'TENANT-456',
      amount: Math.floor(Math.random() * 5000) + 1000,
      currency: 'KES',
      status: Math.random() > 0.2 ? 'SUCCESS' : 'FAILED',
      narrative: 'Automated test IPN callback',
      transactionDate: new Date().toISOString(),
    },
    timestamp: Date.now(),
  }
}

/** --- Check if port 3000 is occupied --- */
async function isPortBusy(port = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => {
      server.close(() => resolve(false))
    })
    server.listen(port)
  })
}

/** --- Try fetching ngrok HTTPS URL --- */
async function getNgrokUrl(): Promise<string> {
  try {
    const res = await axios.get<{ tunnels: { public_url: string }[] }>(
      'http://127.0.0.1:4040/api/tunnels',
      { timeout: TIMEOUT_MS }
    )
    const tunnels = res.data.tunnels
    const httpsTunnel = tunnels.find((t) => t.public_url.startsWith('https://'))
    if (!httpsTunnel) throw new Error('No active HTTPS ngrok tunnel found.')
    return httpsTunnel.public_url
  } catch (err: any) {
    throw new Error('⚠️ Could not fetch ngrok URL: ' + err.message)
  }
}

/** --- Try to reach localhost, else ngrok --- */
async function getActiveEndpoint(): Promise<string> {
  const localUrl = 'http://localhost:3000'

  // if 3000 port busy, skip direct localhost call
  if (await isPortBusy(3000)) {
    console.log('⚠️ Port 3000 is busy — trying ngrok instead...')
    const ngrokUrl = await getNgrokUrl()
    console.log(`🌍 Using ngrok URL: ${ngrokUrl}`)
    return ngrokUrl
  }

  try {
    await axios.post(`${localUrl}/api/jenga/ipn`, { ping: true }, { timeout: 3000 })
    console.log(`✅ Local server responding at ${localUrl}`)
    return localUrl
  } catch {
    console.log('⚠️ Localhost not responding, switching to ngrok...')
    const ngrokUrl = await getNgrokUrl()
    console.log(`🌍 Using ngrok URL: ${ngrokUrl}`)
    return ngrokUrl
  }
}

/** --- Send one IPN packet --- */
async function sendIPN(baseUrl: string) {
  const payload = generatePayload()
  const endpoint = `${baseUrl}/api/jenga/ipn`
  const hmac = crypto.createHmac('sha256', JENGA_SECRET).update(JSON.stringify(payload)).digest('hex')

  console.log(`\n🚀 Sending IPN → ${endpoint}`)
  console.log(`🧾 Reference: ${payload.transaction.reference}`)
  console.log(`💰 Amount: ${payload.transaction.amount} ${payload.transaction.currency}`)

  try {
    const res = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Jenga-HMAC': hmac,
      },
      timeout: TIMEOUT_MS,
    })

    const msg = `✅ [${payload.transaction.reference}] ${payload.transaction.amount} ${payload.transaction.currency} → ${res.status}`
    console.log(msg)
    logMessage('info', msg)
  } catch (err: any) {
    const msg = `❌ [${payload.transaction.reference}] ${err.message || 'Unknown error'}`
    console.error(msg)
    logMessage('error', msg)
  }
}

/** --- Auto health monitor: recheck localhost/ngrok status every few minutes --- */
async function monitorHealth(currentBaseUrl: string, setBaseUrl: (url: string) => void) {
  try {
    const localUrl = 'http://localhost:3000'
    // 1️⃣ Try localhost first
    try {
      await axios.post(`${localUrl}/api/jenga/ipn`, { ping: true }, { timeout: 2000 })
      if (currentBaseUrl !== localUrl) {
        console.log(`🔁 Local server back online → switching to ${localUrl}`)
        logMessage('info', 'Local server reconnected.')
        setBaseUrl(localUrl)
        return
      }
    } catch {
      // not available — try ngrok
      const ngrokUrl = await getNgrokUrl()
      if (ngrokUrl !== currentBaseUrl) {
        console.log(`🔁 Switching to new ngrok URL: ${ngrokUrl}`)
        logMessage('info', 'Ngrok URL updated: ' + ngrokUrl)
        setBaseUrl(ngrokUrl)
      }
    }
  } catch (err: any) {
    console.log('⚠️ Health check failed:', err.message)
    logMessage('error', 'Health check failed: ' + err.message)
  }
}

/** --- Main runner --- */
async function startLoop() {
  let baseUrl = await getActiveEndpoint()
  console.log('🕒 Starting continuous Jenga IPN tests every 30 seconds...\n')

  // Send first one immediately
  await sendIPN(baseUrl)
  setInterval(() => sendIPN(baseUrl), SEND_INTERVAL_MS)

  // Periodic reconnection & ngrok-refresh
  setInterval(() => monitorHealth(baseUrl, (newUrl) => (baseUrl = newUrl)), HEALTHCHECK_INTERVAL_MS)
}

startLoop().catch((err) => {
  console.error('❌ Startup error:', err.message)
  logMessage('error', 'Startup error: ' + err.message)
})
