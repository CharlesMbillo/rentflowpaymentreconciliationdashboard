/**
 * test-jenga-ipn.ts
 *
 * Continuously sends Jenga sandbox IPNs every 30 seconds
 * to your live /api/jenga/ipn endpoint (auto-detects ngrok HTTPS tunnel).
 */

import axios from 'axios'
import crypto from 'crypto'

// 👇 Replace with your actual Jenga sandbox secret key if needed
const JENGA_SECRET = 'x89Tt3XHT98HadFO2h67Lm8Mlj0fWw'

/**
 * Generate a random IPN payload
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
 * Fetch the currently active ngrok HTTPS tunnel URL
 */
async function getNgrokUrl(): Promise<string> {
  try {
    const res = await axios.get<{ tunnels: { public_url: string }[] }>('http://127.0.0.1:4040/api/tunnels')
    const tunnels = res.data.tunnels

    const httpsTunnel = tunnels.find(t => t.public_url.startsWith('https://'))
    if (!httpsTunnel) throw new Error('No active HTTPS ngrok tunnel found.')

    return httpsTunnel.public_url
  } catch (err: any) {
    throw new Error('⚠️ Could not fetch ngrok URL. Ensure ngrok is running.\n' + err.message)
  }
}

/**
 * Send one mock IPN
 */
async function sendIPN(ngrokUrl: string) {
  const payload = generatePayload()
  const endpoint = `${ngrokUrl}/api/jenga/ipn`

  const hmac = crypto
    .createHmac('sha256', JENGA_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex')

  try {
    console.log(`\n🚀 Sending IPN → ${endpoint}`)
    console.log(`🧾 Reference: ${payload.transaction.reference}`)
    console.log(`💰 Amount: ${payload.transaction.amount} ${payload.transaction.currency}`)

    const res = await axios.post<Record<string, unknown>>(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Jenga-HMAC': hmac,
      },
      timeout: 10_000,
    })

    console.log(`✅ Response:`, res.data)
  } catch (err: any) {
    console.error('❌ Error sending IPN:', err.response?.data || err.message)
  }
}

/**
 * Main runner
 */
async function startLoop() {
  try {
    const ngrokUrl = await getNgrokUrl()
    console.log(`🌍 Using ngrok URL: ${ngrokUrl}`)
    console.log('🕒 Starting continuous Jenga IPN test every 30 seconds...\n')

    // Send one immediately, then repeat every 30 seconds
    await sendIPN(ngrokUrl)
    setInterval(() => sendIPN(ngrokUrl), 30_000)
  } catch (err: any) {
    console.error('❌ Setup failed:', err.message)
  }
}

startLoop()
