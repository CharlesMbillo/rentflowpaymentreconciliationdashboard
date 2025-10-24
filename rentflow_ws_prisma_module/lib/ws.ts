import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

export function getWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    console.log("WebSocket server initialized");
  }
  return wss;
}

export function broadcastMessage(message: any) {
  if (!wss) return;
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}
