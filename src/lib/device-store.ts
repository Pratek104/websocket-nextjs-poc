// In-memory storage for devices and history
// In production, replace with a database (PostgreSQL, MongoDB, etc.)

import { Device, Operation, DeviceLog, Interaction, DeviceHistory } from '@/types/device';

class DeviceStore {
  private devices: Map<string, Device> = new Map();
  private operations: Map<string, Operation[]> = new Map();
  private logs: Map<string, DeviceLog[]> = new Map();
  private interactions: Map<string, Interaction[]> = new Map();

  // Device management
  registerDevice(deviceId: string, metadata?: Record<string, any>): Device {
    const device: Device = {
      deviceId,
      name: metadata?.name || deviceId,
      status: 'online',
      lastSeen: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
      metadata,
    };
    this.devices.set(deviceId, device);
    return device;
  }

  updateDeviceStatus(deviceId: string, status: 'online' | 'offline'): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date().toISOString();
      if (status === 'online') {
        device.connectedAt = new Date().toISOString();
      }
    }
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  // Operation management
  addOperation(operation: Omit<Operation, 'id' | 'timestamp'>): Operation {
    const newOperation: Operation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceOps = this.operations.get(operation.deviceId) || [];
    deviceOps.push(newOperation);
    this.operations.set(operation.deviceId, deviceOps);

    return newOperation;
  }

  updateOperationStatus(
    deviceId: string,
    operationId: string,
    status: Operation['status'],
    error?: string
  ): void {
    const ops = this.operations.get(deviceId);
    if (ops) {
      const op = ops.find((o) => o.id === operationId);
      if (op) {
        op.status = status;
        if (error) op.error = error;
      }
    }
  }

  getLastOperation(deviceId: string): Operation | undefined {
    const ops = this.operations.get(deviceId);
    return ops && ops.length > 0 ? ops[ops.length - 1] : undefined;
  }

  getOperations(deviceId: string, limit?: number): Operation[] {
    const ops = this.operations.get(deviceId) || [];
    return limit ? ops.slice(-limit) : ops;
  }

  // Log management
  addLog(log: Omit<DeviceLog, 'id' | 'timestamp'>): DeviceLog {
    const newLog: DeviceLog = {
      ...log,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceLogs = this.logs.get(log.deviceId) || [];
    deviceLogs.push(newLog);
    this.logs.set(log.deviceId, deviceLogs);

    return newLog;
  }

  getLogs(deviceId: string, limit?: number): DeviceLog[] {
    const logs = this.logs.get(deviceId) || [];
    return limit ? logs.slice(-limit) : logs;
  }

  // Interaction management
  addInteraction(interaction: Omit<Interaction, 'id' | 'timestamp'>): Interaction {
    const newInteraction: Interaction = {
      ...interaction,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    const deviceInteractions = this.interactions.get(interaction.deviceId) || [];
    deviceInteractions.push(newInteraction);
    this.interactions.set(interaction.deviceId, deviceInteractions);

    return newInteraction;
  }

  getInteractions(deviceId: string, limit?: number): Interaction[] {
    const interactions = this.interactions.get(deviceId) || [];
    return limit ? interactions.slice(-limit) : interactions;
  }

  // Get complete history
  getDeviceHistory(deviceId: string): DeviceHistory {
    return {
      deviceId,
      operations: this.getOperations(deviceId),
      logs: this.getLogs(deviceId),
      interactions: this.getInteractions(deviceId),
    };
  }

  // Utility
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear old data (optional cleanup)
  clearDeviceData(deviceId: string): void {
    this.devices.delete(deviceId);
    this.operations.delete(deviceId);
    this.logs.delete(deviceId);
    this.interactions.delete(deviceId);
  }
}

// Singleton instance
export const deviceStore = new DeviceStore();
