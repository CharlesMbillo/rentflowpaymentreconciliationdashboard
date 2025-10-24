// /api/jenga/ipn.ts (Next.js API route)
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ Jenga sends JSON
    const body = req.body

    // ✅ Verify signature (optional)
    const signature = req.headers['x-jenga-signature'] as string
    const secret = process.env.JENGA_SECRET || ''
    const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')

    if (signature !== hash) {
      console.error('Invalid signature')
      return res.status(403).json({ message: 'Invalid signature' })
    }

    console.log('🟢 Jenga IPN received:', body)

    // ✅ Example: broadcast to WebSocket clients
    // (Using your wsManager from before)
    // wsManager.broadcast('payment.updated', body)

    // ✅ Respond OK so Jenga knows it succeeded
    return res.status(200).json({ message: 'IPN received successfully' })

  } catch (err) {
    console.error('IPN Error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}
