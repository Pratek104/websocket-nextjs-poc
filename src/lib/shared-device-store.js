// Shared device store using CommonJS for compatibility with tsx
// This ensures the same instance is used across both Next.js API routes and WebSocket server

class DeviceStore {
  constructor() {
    this.devices = new Map();
    this.operations = new Map();
    this.logs = new Map();
    this.interactions = new Map();
  }

  // Device management
  registerDevice(deviceId, metadata) {
    const device = {
      deviceId,
      name: metadata?.name || deviceId,
      status: 'online',
      lastSeen: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
      metadata,
    };
    this.devices.set(deviceId, device);
    console.log(`[DeviceStore] Registered device: ${deviceId}`);
    return device;
  }

  updateDeviceStatus(deviceId, status) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date().toISOString();
      if (status === 'online') {
        device.connectedAt = new Date().toISOString();
      }
      console.log(`[DeviceStore] Updated device ${deviceId} status to ${status}`);
    }
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getAllDevices() {
    const devices = Array.from(this.devices.values());
    console.log(`[DeviceStore] Getting all devices: ${devices.length} found`);
    return devices;
  }

  // Operation management
  addOperation(operation) {
    const newOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceOps = this.operations.get(operation.deviceId) || [];
    deviceOps.push(newOperation);
    this.operations.set(operation.deviceId, deviceOps);

    return newOperation;
  }

  updateOperationStatus(deviceId, operationId, status, error) {
    const ops = this.operations.get(deviceId);
    if (ops) {
      const op = ops.find((o) => o.id === operationId);
      if (op) {
        op.status = status;
        if (error) op.error = error;
      }
    }
  }

  getLastOperation(deviceId) {
    const ops = this.operations.get(deviceId);
    return ops && ops.length > 0 ? ops[ops.length - 1] : undefined;
  }

  getOperations(deviceId, limit) {
    const ops = this.operations.get(deviceId) || [];
    return limit ? ops.slice(-limit) : ops;
  }

  // Log management
  addLog(log) {
    const newLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceLogs = this.logs.get(log.deviceId) || [];
    deviceLogs.push(newLog);
    this.logs.set(log.deviceId, deviceLogs);

    return newLog;
  }

  getLogs(deviceId, limit) {
    const logs = this.logs.get(deviceId) || [];
    return limit ? logs.slice(-limit) : logs;
  }

  // Interaction management
  addInteraction(interaction) {
    const newInteraction = {
      ...interaction,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceInteractions = this.interactions.get(interaction.deviceId) || [];
    deviceInteractions.push(newInteraction);
    this.interactions.set(interaction.deviceId, deviceInteractions);

    return newInteraction;
  }

  getInteractions(deviceId, limit) {
    const interactions = this.interactions.get(deviceId) || [];
    return limit ? interactions.slice(-limit) : interactions;
  }

  // Get complete history
  getDeviceHistory(deviceId) {
    return {
      deviceId,
      operations: this.getOperations(deviceId),
      logs: this.getLogs(deviceId),
      interactions: this.getInteractions(deviceId),
    };
  }

  // Utility
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear old data (optional cleanup)
  clearDeviceData(deviceId) {
    this.devices.delete(deviceId);
    this.operations.delete(deviceId);
    this.logs.delete(deviceId);
    this.interactions.delete(deviceId);
  }
}

// Singleton instance - shared across all imports
let instance;
if (!global.deviceStore) {
  global.deviceStore = new DeviceStore();
}
instance = global.deviceStore;

module.exports = { deviceStore: instance };
