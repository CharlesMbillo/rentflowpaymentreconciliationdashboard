import { WebSocketServer } from "ws";
import { env } from "@/lib/env";
let wss: WebSocketServer | null = null;
export const config = { runtime: "nodejs" };
export async function GET(req: Request) {
  const { socket } = (req as any);
  if (!socket || !socket.server) throw new Error("WebSocket server not available");
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    socket.server.on("upgrade", (req: any, sock: any, head: any) => {
      if (req.url === "/api/ws") {
        wss?.handleUpgrade(req, sock, head, (ws) => {
          wss?.clients.add(ws);
          ws.on("close", () => wss?.clients.delete(ws));
        });
      }
    });
  }
  return new Response("WebSocket endpoint ready", { status: 200 });
}
export function broadcastPaymentUpdate(update: any) {
  if (!wss) return;
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "payment_update", data: update }));
    }
  }
}
