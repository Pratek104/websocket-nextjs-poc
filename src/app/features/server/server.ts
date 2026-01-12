import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
const { deviceStore } = require('../../../lib/shared-device-store.js');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store connections by instance ID
const instances = new Map<string, Set<WebSocket>>();

const WS_PORT = process.env.WS_PORT || 3013;

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
    const instanceId = url.searchParams.get('deviceId') || url.searchParams.get('instanceId');

    if (!instanceId) {
      ws.close(1008, 'Device ID required');
      return;
    }

    // Register or update device
    const existingDevice = deviceStore.getDevice(instanceId);
    if (!existingDevice) {
      deviceStore.registerDevice(instanceId);
      deviceStore.addLog({
        deviceId: instanceId,
        level: 'info',
        message: 'Device registered',
      });
    } else {
      deviceStore.updateDeviceStatus(instanceId, 'online');
    }

    // Add to instance room
    if (!instances.has(instanceId)) {
      instances.set(instanceId, new Set());
    }
    instances.get(instanceId)!.add(ws);

    console.log(`Client connected to device: ${instanceId}`);

    // Log connection interaction
    deviceStore.addInteraction({
      deviceId: instanceId,
      type: 'message',
      direction: 'inbound',
      data: { event: 'connected' },
    });

    // Send last operation to newly connected client
    const lastOperation = deviceStore.getLastOperation(instanceId);
    if (lastOperation) {
      ws.send(JSON.stringify({
        type: 'last_operation',
        data: lastOperation,
        timestamp: new Date().toISOString(),
      }));
      console.log(`Sent last operation to device: ${instanceId}`);
    }

    // Send connection acknowledgment with device info
    ws.send(JSON.stringify({
      type: 'connection_ack',
      deviceId: instanceId,
      timestamp: new Date().toISOString(),
      message: 'Connected successfully',
    }));

    // Keepalive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      console.log(`Pong received from instance: ${instanceId}`);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Log interaction
        deviceStore.addInteraction({
          deviceId: instanceId,
          type: 'message',
          direction: 'inbound',
          data: message,
        });

        // Handle operation messages
        if (message.type === 'operation') {
          const operation = deviceStore.addOperation({
            deviceId: instanceId,
            type: message.operationType || 'command',
            action: message.action,
            payload: message.payload,
            status: 'pending',
          });

          // Log operation
          deviceStore.addLog({
            deviceId: instanceId,
            level: 'info',
            message: `Operation ${message.action} initiated`,
            metadata: { operationId: operation.id },
          });
        }

        // Handle operation status updates
        if (message.type === 'operation_status' && message.operationId) {
          deviceStore.updateOperationStatus(
            instanceId,
            message.operationId,
            message.status,
            message.error
          );

          deviceStore.addLog({
            deviceId: instanceId,
            level: message.status === 'failed' ? 'error' : 'info',
            message: `Operation ${message.operationId} ${message.status}`,
            metadata: { error: message.error },
          });
        }

        // Handle log messages
        if (message.type === 'log') {
          deviceStore.addLog({
            deviceId: instanceId,
            level: message.level || 'info',
            message: message.message,
            metadata: message.metadata,
          });
        }

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
              
              // Log outbound interaction
              deviceStore.addInteraction({
                deviceId: instanceId,
                type: 'message',
                direction: 'outbound',
                data: message,
              });
            }
          });
        }
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Invalid JSON' }));
        deviceStore.addLog({
          deviceId: instanceId,
          level: 'error',
          message: 'Invalid JSON received',
        });
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      const clients = instances.get(instanceId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          instances.delete(instanceId);
          deviceStore.updateDeviceStatus(instanceId, 'offline');
        }
      }

      // Log disconnection
      deviceStore.addInteraction({
        deviceId: instanceId,
        type: 'message',
        direction: 'inbound',
        data: { event: 'disconnected' },
      });

      deviceStore.addLog({
        deviceId: instanceId,
        level: 'info',
        message: 'Device disconnected',
      });

      console.log(`Client disconnected from device: ${instanceId}`);
    });
  });

  const PORT = process.env.PORT || 3012;
  server.listen(PORT, () => {
    console.log(`> Next.js ready on http://localhost:${PORT}`);
  });

  wsServer.listen(WS_PORT, () => {
    console.log(`> WebSocket server ready on ws://localhost:${WS_PORT}`);
  });
});
