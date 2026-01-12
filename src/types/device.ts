// Device and operation types

export interface Device {
  deviceId: string;
  name?: string;
  status: 'online' | 'offline';
  lastSeen: string;
  connectedAt?: string;
  metadata?: Record<string, any>;
}

export interface Operation {
  id: string;
  deviceId: string;
  type: string;
  action: string;
  payload?: any;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DeviceHistory {
  deviceId: string;
  operations: Operation[];
  logs: DeviceLog[];
  interactions: Interaction[];
}

export interface Interaction {
  id: string;
  deviceId: string;
  type: 'message' | 'command' | 'response';
  direction: 'inbound' | 'outbound';
  data: any;
  timestamp: string;
}
