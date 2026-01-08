'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  content?: string;
  pin?: { [key: number]: number };
  sender: string;
  instanceId: string;
  timestamp: string;
}

interface Device {
  pin: number;
  state: boolean;
}

export default function InstancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [sender, setSender] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [wsUrl, setWsUrl] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPin, setNewPin] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    const name = sender || `User-${Math.random().toString(36).slice(2, 6)}`;
    if (!sender) setSender(name);

    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:3013`;
    const fullUrl = `${baseUrl}?instanceId=${id}`;
    
    setWsUrl(baseUrl);
    console.log(`[WS] Connecting to: ${fullUrl}`);
    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      setReconnectAttempts(0);
    };

    ws.onclose = (event) => {
      console.log(`[WS] Disconnected - Code: ${event.code}, Reason: ${event.reason}`);
      setConnected(false);
      
      // Auto-reconnect after 3 seconds
      if (reconnectAttempts < 10) {
        console.log(`[WS] Reconnecting in 3s... (attempt ${reconnectAttempts + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, 3000);
      } else {
        console.log('[WS] Max reconnect attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      setConnected(false);
    };

    ws.onmessage = (event) => {
      console.log('[WS] Message received:', event.data);
      const msg = JSON.parse(event.data) as Message;
      setMessages((prev) => [...prev, msg]);
      
      // Sync device state from incoming pin messages
      if (msg.pin && msg.sender !== sender) {
        const pinKey = Number(Object.keys(msg.pin)[0]);
        const pinValue = msg.pin[pinKey];
        setDevices(prev => prev.map(d => 
          d.pin === pinKey ? { ...d, state: pinValue === 1 } : d
        ));
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const msg = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      content: input.trim(),
      sender,
    };

    wsRef.current.send(JSON.stringify(msg));
    setInput('');
  };

  const addDevice = () => {
    const pinNumber = parseInt(newPin);
    if (isNaN(pinNumber)) return;
    if (devices.some(d => d.pin === pinNumber)) {
      alert('This PIN already exists!');
      return;
    }
    setDevices(prev => [...prev, { pin: pinNumber, state: false }]);
    setNewPin('');
    setShowAddDialog(false);
  };

  const toggleDevice = (pin: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const device = devices.find(d => d.pin === pin);
    if (!device) return;

    const newState = !device.state;
    setDevices(prev => prev.map(d => 
      d.pin === pin ? { ...d, state: newState } : d
    ));

    const msg = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      pin: { [pin]: newState ? 1 : 0 },
      sender,
    };

    wsRef.current.send(JSON.stringify(msg));
  };

  const removeDevice = (pin: number) => {
    setDevices(prev => prev.filter(d => d.pin !== pin));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white">← Back</Link>
          <h1 className="font-mono text-lg">/{id}</h1>
        </div>
        <div className="flex items-center gap-4">
          {wsUrl && (
            <div className="text-xs text-zinc-500 font-mono">
              {wsUrl}
              {reconnectAttempts > 0 && (
                <span className="ml-2 text-yellow-500">
                  (reconnecting... {reconnectAttempts}/10)
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-zinc-400">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex gap-4">
        {/* Devices Panel */}
        <div className="w-64 shrink-0 border-r border-zinc-800 pr-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Devices</h2>
            <button
              onClick={() => setShowAddDialog(true)}
              disabled={!connected}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              + Add Device
            </button>
          </div>
          
          {devices.length === 0 ? (
            <p className="text-zinc-500 text-sm">No devices added yet.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.pin}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <span className="font-mono text-sm">PIN {device.pin}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDevice(device.pin)}
                      disabled={!connected}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        device.state ? 'bg-green-500' : 'bg-zinc-600'
                      } ${!connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          device.state ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => removeDevice(device.pin)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-zinc-500 text-center mt-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-md p-3 rounded-lg ${
                    msg.sender === sender
                      ? 'ml-auto bg-blue-600'
                      : 'bg-zinc-800'
                  }`}
                >
                  <p className="text-xs text-zinc-400 mb-1">{msg.sender}</p>
                  {msg.content && <p>{msg.content}</p>}
                  {msg.pin && (
                    <p className="font-mono text-sm">
                      PIN {Object.keys(msg.pin)[0]}: {Object.values(msg.pin)[0] === 1 ? '🟢 ON' : '🔴 OFF'}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Add Device Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-700 w-80">
            <h3 className="text-lg font-semibold mb-4">Add a Device</h3>
            <input
              type="number"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter PIN number"
              className="w-full px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowAddDialog(false); setNewPin(''); }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addDevice}
                disabled={!newPin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-4 border-t border-zinc-800">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
            disabled={!connected}
          />
          <button
            onClick={sendMessage}
            disabled={!connected}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
