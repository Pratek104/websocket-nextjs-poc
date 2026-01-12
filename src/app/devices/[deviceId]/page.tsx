'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DeviceApiClient, DeviceWebSocketClient } from '@/lib/device-api-client';
import { Device, Operation, DeviceLog, Interaction } from '@/types/device';
import { 
  ArrowLeft, Activity, FileText, History, Wifi, WifiOff, 
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw,
  Terminal, Zap
} from 'lucide-react';

export default function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const [device, setDevice] = useState<Device | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeTab, setActiveTab] = useState<'operations' | 'logs' | 'interactions'>('operations');
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsClient, setWsClient] = useState<DeviceWebSocketClient | null>(null);
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);

  const apiClient = new DeviceApiClient();

  const fetchData = async () => {
    try {
      const [deviceRes, historyRes, lastOpRes] = await Promise.all([
        apiClient.getDevice(deviceId),
        apiClient.getDeviceHistory(deviceId, 50),
        apiClient.getLastOperation(deviceId),
      ]);

      if (deviceRes.success) setDevice(deviceRes.data);
      if (historyRes.success) {
        setOperations(historyRes.data.operations);
        setLogs(historyRes.data.logs);
        setInteractions(historyRes.data.interactions);
      }
      if (lastOpRes.success && lastOpRes.data) {
        setLastOperation(lastOpRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup WebSocket
    const ws = new DeviceWebSocketClient(deviceId, process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3013');
    ws.connect(
      (data) => {
        console.log('WS Message:', data);
        if (data.type === 'last_operation') {
          setLastOperation(data.data);
        }
        fetchData();
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );
    setWsClient(ws);

    const interval = setInterval(fetchData, 10000);

    return () => {
      ws.disconnect();
      clearInterval(interval);
    };
  }, [deviceId]);

  const sendTestOperation = async () => {
    if (wsClient && wsClient.isConnected()) {
      wsClient.sendOperation('command', 'test_command', { test: true });
    } else {
      await apiClient.createOperation(deviceId, 'command', 'test_command', { test: true });
    }
    setTimeout(fetchData, 500);
  };

  const sendTestLog = async () => {
    if (wsClient && wsClient.isConnected()) {
      wsClient.sendLog('info', 'Test log from dashboard');
    } else {
      await apiClient.addLog(deviceId, 'info', 'Test log from dashboard');
    }
    setTimeout(fetchData, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading device...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 text-lg">Device not found</p>
          <Link href="/devices" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Back to devices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/devices" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={20} />
                Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{device.name || device.deviceId}</h1>
                <p className="text-sm text-zinc-600 font-mono">{device.deviceId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                device.status === 'online'
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-400' : 'bg-zinc-500'}`} />
                <span className="text-sm font-medium">{device.status}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                wsConnected
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                {wsConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-sm font-medium">WS {wsConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Last Seen</p>
              <p className="text-sm text-white">{new Date(device.lastSeen).toLocaleString()}</p>
            </div>
            {device.connectedAt && (
              <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-500 mb-1">Connected At</p>
                <p className="text-sm text-white">{new Date(device.connectedAt).toLocaleString()}</p>
              </div>
            )}
            {lastOperation && (
              <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <p className="text-xs text-purple-400 mb-1">Last Operation</p>
                <p className="text-sm text-white">{lastOperation.action} - {lastOperation.status}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'operations'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Activity size={16} className="inline mr-2" />
              Operations ({operations.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'interactions'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <History size={16} className="inline mr-2" />
              Interactions ({interactions.length})
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendTestOperation}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Zap size={14} className="inline mr-1" />
              Send Test Operation
            </button>
            <button
              onClick={sendTestLog}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Terminal size={14} className="inline mr-1" />
              Send Test Log
            </button>
          </div>
        </div>

        {activeTab === 'operations' && (
          <div className="space-y-3">
            {operations.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <Activity size={48} className="mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">No operations yet</p>
              </div>
            ) : (
              operations.slice().reverse().map((op) => (
                <div key={op.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {op.status === 'success' && <CheckCircle size={20} className="text-green-400" />}
                        {op.status === 'failed' && <XCircle size={20} className="text-red-400" />}
                        {op.status === 'pending' && <Clock size={20} className="text-yellow-400" />}
                        <h3 className="text-lg font-semibold text-white">{op.action}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          op.status === 'success' ? 'bg-green-500/20 text-green-400' :
                          op.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {op.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>Type: {op.type}</span>
                        <span>•</span>
                        <span>{new Date(op.timestamp).toLocaleString()}</span>
                      </div>
                      {op.payload && (
                        <pre className="mt-2 p-2 bg-black rounded text-xs text-zinc-400 overflow-x-auto">
                          {JSON.stringify(op.payload, null, 2)}
                        </pre>
                      )}
                      {op.error && (
                        <p className="mt-2 text-sm text-red-400">Error: {op.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <FileText size={48} className="mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">No logs yet</p>
              </div>
            ) : (
              logs.slice().reverse().map((log) => (
                <div key={log.id} className={`p-3 rounded-lg border ${
                  log.level === 'error' ? 'bg-red-500/10 border-red-500/30' :
                  log.level === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  log.level === 'debug' ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-zinc-900 border-zinc-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                      log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400' :
                      log.level === 'debug' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{log.message}</p>
                      <p className="text-xs text-zinc-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="mt-2 p-2 bg-black rounded text-xs text-zinc-400 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-2">
            {interactions.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <History size={48} className="mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500">No interactions yet</p>
              </div>
            ) : (
              interactions.slice().reverse().map((interaction) => (
                <div key={interaction.id} className={`p-3 rounded-lg border ${
                  interaction.direction === 'inbound' 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-purple-500/10 border-purple-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      interaction.direction === 'inbound'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {interaction.direction === 'inbound' ? '→ IN' : '← OUT'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{interaction.type}</p>
                        <span className="text-xs text-zinc-500">{new Date(interaction.timestamp).toLocaleString()}</span>
                      </div>
                      <pre className="p-2 bg-black rounded text-xs text-zinc-400 overflow-x-auto">
                        {JSON.stringify(interaction.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
