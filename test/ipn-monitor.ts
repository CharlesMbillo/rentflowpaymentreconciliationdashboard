/**
 * ipn-monitor.ts
 * ------------------------------------------------------------
 * Real-time Jenga IPN Tester Monitor
 * - Tails the latest ipn-test-YYYY-MM-DD.log in ./logs/
 * - Displays last 10 successful IPNs + uptime + memory stats
 * - Sends Telegram alert if no success in ALERT_TIMEOUT_MIN
 * ------------------------------------------------------------
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import os from 'os'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

// -------- CONFIG --------
const LOG_DIR = path.resolve('logs')
const ALERT_TIMEOUT_MIN = parseInt(process.env.ALERT_TIMEOUT_MIN || '15', 10)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const ENABLE_TELEGRAM = TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID

// -------- STATE --------
let lastSuccessTime = Date.now()
let lastTen: string[] = []
const startTime = Date.now()

// -------- UTILS --------
function getLatestLogFile(): string | null {
  if (!fs.existsSync(LOG_DIR)) return null
  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('ipn-test-') && f.endsWith('.log'))
    .sort((a, b) => fs.statSync(path.join(LOG_DIR, b)).mtimeMs - fs.statSync(path.join(LOG_DIR, a)).mtimeMs)
  return files[0] ? path.join(LOG_DIR, files[0]) : null
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

function memoryStats() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  const total = process.memoryUsage().rss / 1024 / 1024
  return `${used.toFixed(1)}MB / ${total.toFixed(1)}MB`
}

async function sendTelegram(msg: string) {
  if (!ENABLE_TELEGRAM) return
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
    })
    console.log(`📨 Telegram alert sent.`)
  } catch (err: any) {
    console.error(`⚠️ Telegram alert failed: ${err.message}`)
  }
}

// -------- MONITOR --------
async function startMonitor() {
  const file = getLatestLogFile()
  if (!file) {
    console.error('❌ No log files found in ./logs')
    process.exit(1)
  }

  console.log(`📂 Monitoring: ${file}`)
  console.log('─────────────────────────────────────────────')

  const stream = fs.createReadStream(file, { encoding: 'utf-8', flags: 'a+' })
  const rl = readline.createInterface({ input: stream })

  rl.on('line', (line: string) => {
    if (line.includes('✅ Response')) {
      lastSuccessTime = Date.now()
      lastTen.push(line)
      if (lastTen.length > 10) lastTen.shift()
    }
  })

  // Periodic status display
  setInterval(() => {
    const uptime = formatDuration(Date.now() - startTime)
    const sinceLastSuccess = (Date.now() - lastSuccessTime) / 60000
    console.clear()
    console.log('📊 Jenga IPN Monitor')
    console.log('──────────────────────────────')
    console.log(`🕓 Uptime: ${uptime}`)
    console.log(`💾 Memory: ${memoryStats()}`)
    console.log(`✅ Last success: ${sinceLastSuccess.toFixed(1)} min ago`)
    console.log(`📄 Showing last ${lastTen.length} successful IPNs:\n`)
    lastTen.slice(-10).forEach(l => console.log('   ' + l))
    console.log('\n──────────────────────────────')

    if (sinceLastSuccess > ALERT_TIMEOUT_MIN) {
      const msg = `⚠️ IPN Alert: No successful IPN in ${sinceLastSuccess.toFixed(
        1
      )} minutes.\nTime: ${new Date().toLocaleString()}`
      console.log(msg)
      sendTelegram(msg)
      lastSuccessTime = Date.now() // prevent repeated spam
    }
  }, 10_000)

  // Auto-detect new log file daily
  setInterval(() => {
    const latest = getLatestLogFile()
    if (latest && latest !== file) {
      console.log(`📂 Switched to new log file: ${latest}`)
      rl.close()
      stream.close()
      startMonitor()
    }
  }, 60_000)
}

startMonitor().catch(err => {
  console.error('❌ Monitor error:', err.message)
  process.exit(1)
})
