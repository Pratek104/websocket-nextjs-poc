import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
const { deviceStore } = require('../../../lib/shared-device-store.js');

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

  if (!instances.has(instanceId)) {
    instances.set(instanceId, new Set());
  }
  instances.get(instanceId)!.add(ws);

  console.log(`Client connected to device: ${instanceId}`);

  // Log connection
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

  // Send connection acknowledgment
  ws.send(JSON.stringify({
    type: 'connection_ack',
    deviceId: instanceId,
    timestamp: new Date().toISOString(),
    message: 'Connected successfully',
  }));

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

      const clients = instances.get(instanceId);
      if (clients) {
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);

            deviceStore.addInteraction({
              deviceId: instanceId,
              type: 'message',
              direction: 'outbound',
              data: message,
            });
          }
        });
      }
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      deviceStore.addLog({
        deviceId: instanceId,
        level: 'error',
        message: 'Invalid JSON received',
      });
    }
  });

  ws.on('close', () => {
    const clients = instances.get(instanceId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        instances.delete(instanceId);
        deviceStore.updateDeviceStatus(instanceId, 'offline');
      }
    }

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

server.listen(PORT, () => {
  console.log(`> WebSocket server ready on port ${PORT}`);
});
