/**
 * 24/7 Jenga IPN Stress Tester (Ultra-Resilient + Alerting Edition)
 * -----------------------------------------------------------------
 * ✅ Auto-detect localhost ports (3000–3010) → fallback to ngrok
 * ✅ Safe log buffering + flush to disk
 * ✅ Automatic ngrok recheck every 3 min
 * ✅ Crash recovery, OOM detection, and restart
 * ✅ Daily restart at midnight
 * ✅ Optional Email + Telegram alerts on restart or crash
 */

import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// ---------------- Config ----------------
const JENGA_SECRET = 'x89Tt3XHT98HadFO2h67Lm8Mlj0fWw'
const TEST_INTERVAL_MS = 30_000
const RETRY_INTERVAL_MS = 3 * 60_000
const LOG_FLUSH_INTERVAL = 5000
const RESTART_DELAY_MS = 10_000
const MEMORY_THRESHOLD_MB = 500
const LOG_DIR = path.resolve('logs')

// --- Optional alert settings ---
const ENABLE_EMAIL = !!process.env.EMAIL_USER
const ENABLE_TELEGRAM = !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID

// ---------------- Init ----------------
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

function getDateStr() {
  return new Date().toISOString().slice(0, 10)
}
function getLogPath(base: string) {
  return path.join(LOG_DIR, `${base}-${getDateStr()}.log`)
}

// ---------------- Buffered logging ----------------
let logBuffer: string[] = []
let errBuffer: string[] = []

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`
  console.log(line)
  logBuffer.push(line)
}

function logError(message: string) {
  const line = `[${new Date().toISOString()}] ERROR: ${message}`
  console.error(line)
  errBuffer.push(line)
}

function flushLogs() {
  try {
    if (logBuffer.length > 0) {
      fs.appendFileSync(getLogPath('ipn-test'), logBuffer.join(os.EOL) + os.EOL)
      logBuffer = []
    }
    if (errBuffer.length > 0) {
      fs.appendFileSync(getLogPath('ipn-errors'), errBuffer.join(os.EOL) + os.EOL)
      errBuffer = []
    }
  } catch (e) {
    console.error('⚠️ Failed to flush logs:', (e as any).message)
  }
}
setInterval(flushLogs, LOG_FLUSH_INTERVAL)

// ---------------- Alert System ----------------
async function sendTelegramAlert(message: string) {
  if (!ENABLE_TELEGRAM) return
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    })
    log(`📨 Telegram alert sent.`)
  } catch (err: any) {
    logError(`⚠️ Failed to send Telegram alert: ${err.message}`)
  }
}

async function sendEmailAlert(subject: string, text: string) {
  if (!ENABLE_EMAIL) return
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
    await transporter.sendMail({
      from: `"IPN Tester" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject,
      text,
    })
    log(`📧 Email alert sent.`)
  } catch (err: any) {
    logError(`⚠️ Failed to send email alert: ${err.message}`)
  }
}

async function sendAlert(title: string, msg: string) {
  await Promise.all([
    sendTelegramAlert(`⚙️ ${title}\n${msg}`),
    sendEmailAlert(title, msg),
  ])
}

// ---------------- IPN core logic ----------------
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

async function getAvailableLocalPort(): Promise<number | null> {
  for (let port = 3000; port <= 3010; port++) {
    try {
      const res = await axios.get(`http://localhost:${port}/api/health`, { timeout: 3000 })
      if (res.status === 200) {
        log(`✅ Found local server on port ${port}`)
        return port
      }
    } catch {}
  }
  return null
}

async function getNgrokUrl(): Promise<string | null> {
  try {
    const res = await axios.get<{ tunnels: { public_url: string }[] }>(
      'http://127.0.0.1:4040/api/tunnels',
      { timeout: 20000 }
    )
    const httpsTunnel = res.data.tunnels.find(t => t.public_url.startsWith('https://'))
    if (!httpsTunnel) throw new Error('No HTTPS ngrok tunnel found.')
    return httpsTunnel.public_url
  } catch (err: any) {
    logError(`⚠️ Could not fetch ngrok URL: ${err.message}`)
    return null
  }
}

async function sendIPN(baseUrl: string) {
  const payload = generatePayload()
  const endpoint = `${baseUrl}/api/jenga/ipn`
  const hmac = crypto.createHmac('sha256', JENGA_SECRET).update(JSON.stringify(payload)).digest('hex')

  try {
    log(`🚀 Sending IPN → ${endpoint}`)
    log(`🧾 Ref: ${payload.transaction.reference}, 💰 ${payload.transaction.amount} ${payload.transaction.currency}`)

    const res = await axios.post<any>(endpoint, payload, {
      headers: { 'Content-Type': 'application/json', 'X-Jenga-HMAC': hmac },
      timeout: 10_000,
    })

    log(`✅ Response: ${JSON.stringify(res.data).slice(0, 500)}`)
  } catch (err: any) {
    const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message
    logError(`❌ Error sending IPN: ${msg}`)
  }
}

// ---------------- Loop ----------------
async function startLoop() {
  let baseUrl: string | null = null

  const detectBaseUrl = async () => {
    const port = await getAvailableLocalPort()
    if (port) {
      baseUrl = `http://localhost:${port}`
    } else {
      baseUrl = await getNgrokUrl()
    }

    if (baseUrl) log(`🌍 Using endpoint: ${baseUrl}`)
    else logError('❌ No endpoint found. Retrying in 3 min...')
  }

  await detectBaseUrl()
  if (!baseUrl) return

  setInterval(async () => {
    const port = await getAvailableLocalPort()
    if (port) baseUrl = `http://localhost:${port}`
    else {
      const ngrok = await getNgrokUrl()
      if (ngrok) baseUrl = ngrok
    }
  }, RETRY_INTERVAL_MS)

  const sendLoop = async () => {
    if (!baseUrl) {
      logError('⚠️ Skipping — no active endpoint.')
      return
    }
    try {
      await sendIPN(baseUrl)
    } catch (err: any) {
      logError(`Send loop error: ${err.message}`)
    }
  }

  await sendLoop()
  setInterval(sendLoop, TEST_INTERVAL_MS)
}

// ---------------- Auto-Restart ----------------
function restartSelf(reason: string) {
  const msg = `♻️ Restarting due to: ${reason}\nTime: ${new Date().toLocaleString()}`
  logError(msg)
  flushLogs()
  sendAlert('IPN Tester Restart', msg)

  setTimeout(() => {
    const child = spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: 'inherit',
    })
    child.unref()
    process.exit(1)
  }, RESTART_DELAY_MS)
}

process.on('uncaughtException', (err) => {
  logError(`💥 Uncaught Exception: ${err.message}`)
  restartSelf('Uncaught Exception')
})

process.on('unhandledRejection', (reason: any) => {
  logError(`💥 Unhandled Rejection: ${reason}`)
  restartSelf('Unhandled Rejection')
})

process.on('SIGINT', () => {
  log('🛑 Graceful shutdown...')
  flushLogs()
  process.exit(0)
})

// Memory watchdog
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  if (used > MEMORY_THRESHOLD_MB) {
    const msg = `💣 Memory usage exceeded ${MEMORY_THRESHOLD_MB}MB (${used.toFixed(1)} MB). Restarting...`
    logError(msg)
    restartSelf('Memory threshold exceeded')
  }
}, 10_000)

// Daily auto-restart
function scheduleMidnightRestart() {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  const msUntilMidnight = nextMidnight.getTime() - now.getTime()

  log(`🕛 Scheduled next daily restart in ${(msUntilMidnight / 1000 / 60).toFixed(1)} minutes.`)

  setTimeout(() => {
    restartSelf('Scheduled daily midnight restart')
  }, msUntilMidnight)
}
scheduleMidnightRestart()

// ---------------- Run ----------------
startLoop().catch(err => restartSelf(`Startup Error: ${err.message}`))
