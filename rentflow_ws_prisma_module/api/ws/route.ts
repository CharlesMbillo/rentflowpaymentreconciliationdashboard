import { getWebSocketServer } from "@/lib/ws";

export const config = {
  runtime: "nodejs",
};

export default function handler(req: any, res: any) {
  if (req.headers.upgrade !== "websocket") {
    res.status(400).send("Expected WebSocket");
    return;
  }

  const wss = getWebSocketServer();

  // @ts-ignore
  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    wss.emit("connection", ws, req);
    ws.send(JSON.stringify({ type: "welcome", message: "Connected to Rentflow WS" }));
  });
}
