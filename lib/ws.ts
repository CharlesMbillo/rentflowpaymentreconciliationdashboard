import { WebSocket, WebSocketServer } from 'ws'
import { verifyJWT } from './auth'
import { env } from './env'

interface BroadcastMessage {
  type: string
  payload: any
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()

  /**
   * Initialize the WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      try {
        // ✅ Extract token from query string
        const url = new URL(req.url, `http://${req.headers.host}`)
        const token = url.searchParams.get('token')

        if (!token) {
          ws.close(1008, 'Missing authentication token')
          return
        }

        // ✅ Verify JWT
        const payload = await verifyJWT(token)
        if (!payload) {
          ws.close(1008, 'Invalid authentication token')
          return
        }

        // ✅ Add client to pool
        this.clients.add(ws)
        console.log(`🟢 Client connected. Total clients: ${this.clients.size}`)

        ws.on('close', () => {
          this.clients.delete(ws)
          console.log(`🔴 Client disconnected. Total clients: ${this.clients.size}`)
        })

      } catch (error) {
        console.error('WebSocket connection error:', error)
        ws.close(1011, 'Internal server error')
      }
    })
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(type: string, payload: any) {
    const message: BroadcastMessage = { type, payload }
    const data = JSON.stringify(message)

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  /**
   * Returns number of connected clients
   */
  getConnectedClients(): number {
    return this.clients.size
  }
}

// ✅ Export a single shared instance
export const wsManager = new WebSocketManager()

/**
 * Helper function to broadcast payment updates from IPN
 */
export async function broadcastPayment(
  type: 'payment.created' | 'payment.updated' | 'payment.reconciled',
  payload: any
) {
  try {
    wsManager.broadcast(type, payload)
  } catch (error) {
    console.error('Error broadcasting payment:', error)
  }
}
