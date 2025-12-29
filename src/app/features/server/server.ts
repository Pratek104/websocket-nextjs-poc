import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store connections by instance ID
const instances = new Map<string, Set<WebSocket>>();

const WS_PORT = 3001;

app.prepare().then(() => {
  // Next.js HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Separate WebSocket server on different port
  const wsServer = createServer();
  const wss = new WebSocketServer({ server: wsServer });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const instanceId = url.searchParams.get('instanceId');

    if (!instanceId) {
      ws.close(1008, 'Instance ID required');
      return;
    }

    // Add to instance room
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

        // Broadcast to all clients in the same instance
        const clients = instances.get(instanceId);
        if (clients) {
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      } catch (err) {
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

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Next.js ready on http://localhost:${PORT}`);
  });

  wsServer.listen(WS_PORT, () => {
    console.log(`> WebSocket server ready on ws://localhost:${WS_PORT}`);
  });
});
