// Client library for interacting with the Device API

const API_BASE = '/api';

export class DeviceApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // Device endpoints
  async getAllDevices() {
    const response = await fetch(`${this.baseUrl}/devices`);
    return response.json();
  }

  async registerDevice(deviceId: string, metadata?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, metadata }),
    });
    return response.json();
  }

  async getDevice(deviceId: string) {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}`);
    return response.json();
  }

  // Operation endpoints
  async getOperations(deviceId: string, limit?: number) {
    const url = limit
      ? `${this.baseUrl}/devices/${deviceId}/operations?limit=${limit}`
      : `${this.baseUrl}/devices/${deviceId}/operations`;
    const response = await fetch(url);
    return response.json();
  }

  async createOperation(
    deviceId: string,
    type: string,
    action: string,
    payload?: any
  ) {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, action, payload }),
    });
    return response.json();
  }

  async getLastOperation(deviceId: string) {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/operations/last`);
    return response.json();
  }

  // Log endpoints
  async getLogs(deviceId: string, limit?: number) {
    const url = limit
      ? `${this.baseUrl}/devices/${deviceId}/logs?limit=${limit}`
      : `${this.baseUrl}/devices/${deviceId}/logs`;
    const response = await fetch(url);
    return response.json();
  }

  async addLog(
    deviceId: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: Record<string, any>
  ) {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, metadata }),
    });
    return response.json();
  }

  // History endpoint
  async getDeviceHistory(deviceId: string, limit?: number) {
    const url = limit
      ? `${this.baseUrl}/devices/${deviceId}/history?limit=${limit}`
      : `${this.baseUrl}/devices/${deviceId}/history`;
    const response = await fetch(url);
    return response.json();
  }
}

// WebSocket client helper
export class DeviceWebSocketClient {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(deviceId: string, wsUrl: string = 'ws://localhost:3013') {
    this.deviceId = deviceId;
    this.wsUrl = wsUrl;
  }

  connect(
    onMessage?: (data: any) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    const url = `${this.wsUrl}?deviceId=${this.deviceId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`Connected to device: ${this.deviceId}`);
      this.reconnectAttempts = 0;
      if (onConnect) onConnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log(`Disconnected from device: ${this.deviceId}`);
      if (onDisconnect) onDisconnect();
      this.attemptReconnect(onMessage, onConnect, onDisconnect);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(
    onMessage?: (data: any) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect(onMessage, onConnect, onDisconnect);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendOperation(operationType: string, action: string, payload?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'operation',
        operationType,
        action,
        payload,
      }));
    }
  }

  sendOperationStatus(operationId: string, status: 'success' | 'failed', error?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'operation_status',
        operationId,
        status,
        error,
      }));
    }
  }

  sendLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'log',
        level,
        message,
        metadata,
      }));
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
