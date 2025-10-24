/**
 * test-jenga-ipn.ts
 *
 * Continuously sends Jenga sandbox IPNs every 30 seconds
 * Tests localhost first, then automatically switches to ngrok if live
 * Logs results to rotating daily log files in /logs
 */

import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const JENGA_SECRET = 'x89Tt3XHT98HadFO2h67Lm8Mlj0fWw'
const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_INTERVAL_MS = 30_000

// --- Ensure log directory exists ---
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR)

/**
 * Helper: Write log message with date rotation
 */
function logMessage(type: 'info' | 'error', message: string) {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const logFile =
    type === 'error'
      ? path.join(LOG_DIR, `ipn-errors-${dateStr}.log`)
      : path.join(LOG_DIR, `ipn-test-${dateStr}.log`)

  const timestamp = date.toISOString()
  const line = `[${timestamp}] ${message}\n`
  fs.appendFileSync(logFile, line)
}

/**
 * Generate random test payload
 */
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

/**
 * Detect active ngrok HTTPS tunnel
 */
async function getNgrokUrl(): Promise<string> {
  try {
    const res = await axios.get<{ tunnels: { public_url: string }[] }>(
      'http://127.0.0.1:4040/api/tunnels'
    )
    const tunnels = res.data.tunnels
    const httpsTunnel = tunnels.find((t) => t.public_url.startsWith('https://'))
    if (!httpsTunnel) throw new Error('No active HTTPS ngrok tunnel found.')
    return httpsTunnel.public_url
  } catch (err: any) {
    throw new Error('⚠️ Could not fetch ngrok URL. Ensure ngrok is running.\n' + err.message)
  }
}

/**
 * Try hitting local server before using ngrok
 */
async function getActiveEndpoint(): Promise<string> {
  const localUrl = 'http://localhost:3000'
  try {
    await axios.post<Record<string, any>>(`${localUrl}/api/jenga/ipn`, { test: true }, { timeout: 3000 })
    console.log(`✅ Local server responding at ${localUrl}`)
    return localUrl
  } catch {
    console.log('⚠️ Localhost not responding, switching to ngrok...')
    const ngrokUrl = await getNgrokUrl()
    console.log(`🌍 Using ngrok URL: ${ngrokUrl}`)
    return ngrokUrl
  }
}

/**
 * Send one mock IPN
 */
async function sendIPN(baseUrl: string) {
  const payload = generatePayload()
  const endpoint = `${baseUrl}/api/jenga/ipn`
  const hmac = crypto.createHmac('sha256', JENGA_SECRET).update(JSON.stringify(payload)).digest('hex')

  console.log(`\n🚀 Sending IPN → ${endpoint}`)
  console.log(`🧾 Reference: ${payload.transaction.reference}`)
  console.log(`💰 Amount: ${payload.transaction.amount} ${payload.transaction.currency}`)

  try {
    const res = await axios.post<Record<string, any>>(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Jenga-HMAC': hmac,
      },
      timeout: 20_000,
    })

    const successMsg = `✅ [${payload.transaction.reference}] ${payload.transaction.amount} ${payload.transaction.currency} → ${res.status}`
    console.log(successMsg)
    logMessage('info', successMsg)
  } catch (err: any) {
    const errorMsg = `❌ [${payload.transaction.reference}] ${err.message || 'Unknown error'}`
    console.error(errorMsg)
    logMessage('error', errorMsg)
  }
}

/**
 * Main loop
 */
async function startLoop() {
  try {
    const baseUrl = await getActiveEndpoint()
    console.log('🕒 Starting continuous Jenga IPN tests every 30 seconds...\n')

    await sendIPN(baseUrl)
    setInterval(() => sendIPN(baseUrl), LOG_INTERVAL_MS)
  } catch (err: any) {
    console.error('❌ Setup failed:', err.message)
    logMessage('error', 'Setup failed: ' + err.message)
  }
}

startLoop()
