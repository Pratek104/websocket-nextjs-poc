import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Standalone WebSocket server for deployment to Railway/Render/Fly.io
const instances = new Map<string, Set<WebSocket>>();

const PORT = process.env.PORT || 3013;

const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const instanceId = url.searchParams.get('instanceId');

  if (!instanceId) {
    ws.close(1008, 'Instance ID required');
    return;
  }

  if (!instances.has(instanceId)) {
    instances.set(instanceId, new Set());
  }
  instances.get(instanceId)!.add(ws);

  console.log(`Client connected to instance: ${instanceId}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const payload = JSON.stringify({
        ...message,
        instanceId,
        timestamp: new Date().toISOString(),
      });

      const clients = instances.get(instanceId);
      if (clients) {
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    const clients = instances.get(instanceId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        instances.delete(instanceId);
      }
    }
    console.log(`Client disconnected from instance: ${instanceId}`);
  });
});

server.listen(PORT, () => {
  console.log(`> WebSocket server ready on port ${PORT}`);
});
