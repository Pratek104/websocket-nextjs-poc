'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { 
  Lightbulb, Plug, Thermometer, Snowflake, Flame, Droplet, 
  DoorOpen, Wind, Tv, Music, Gamepad2, Monitor, Smartphone, 
  Zap, Battery, Moon, Sun, Star, Sparkles, Palette,
  Camera, Volume2, Wifi, Lock, Fan, ArrowLeft
} from 'lucide-react';
import { Toggle, GooeyFilter } from '@/components/ui/liquid-toggle';

interface Message {
  id: string;
  pin?: { [key: number]: number };
  sender: string;
  instanceId: string;
  timestamp: string;
}

interface Device {
  pin: number;
  state: boolean;
  label: string;
  icon: string;
}

const ICONS = [
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'Plug', component: Plug },
  { name: 'Thermometer', component: Thermometer },
  { name: 'Snowflake', component: Snowflake },
  { name: 'Flame', component: Flame },
  { name: 'Droplet', component: Droplet },
  { name: 'DoorOpen', component: DoorOpen },
  { name: 'Wind', component: Wind },
  { name: 'Tv', component: Tv },
  { name: 'Music', component: Music },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Monitor', component: Monitor },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Zap', component: Zap },
  { name: 'Battery', component: Battery },
  { name: 'Moon', component: Moon },
  { name: 'Sun', component: Sun },
  { name: 'Star', component: Star },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Palette', component: Palette },
  { name: 'Camera', component: Camera },
  { name: 'Volume2', component: Volume2 },
  { name: 'Wifi', component: Wifi },
  { name: 'Lock', component: Lock },
  { name: 'Fan', component: Fan },
];

export default function InstancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [sender, setSender] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [wsUrl, setWsUrl] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].name);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getIconComponent = (iconName: string) => {
    const icon = ICONS.find(i => i.name === iconName);
    return icon ? icon.component : Lightbulb;
  };

  const connectWebSocket = () => {
    const name = sender || `User-${Math.random().toString(36).slice(2, 6)}`;
    if (!sender) setSender(name);

    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://194.163.172.56:3013`;
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
      
      // Sync device state from incoming pin messages
      if (msg.pin) {
        const pinKey = Number(Object.keys(msg.pin)[0]);
        const pinValue = msg.pin[pinKey];
        setDevices(prev => {
          const updated = prev.map(d => 
            d.pin === pinKey ? { ...d, state: pinValue === 1 } : d
          );
          // Save to localStorage
          localStorage.setItem(`devices-${id}`, JSON.stringify(updated));
          return updated;
        });
      }
    };
  };

  useEffect(() => {
    // Load devices from localStorage
    const savedDevices = localStorage.getItem(`devices-${id}`);
    if (savedDevices) {
      try {
        setDevices(JSON.parse(savedDevices));
      } catch (e) {
        console.error('Failed to load devices:', e);
      }
    }

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

  const addDevice = () => {
    const pinNumber = parseInt(newPin);
    if (isNaN(pinNumber) || !newLabel.trim()) return;
    if (devices.some(d => d.pin === pinNumber)) {
      alert('This PIN already exists!');
      return;
    }
    const newDevice = { 
      pin: pinNumber, 
      state: false, 
      label: newLabel.trim(),
      icon: selectedIcon 
    };
    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);
    
    // Save to localStorage
    localStorage.setItem(`devices-${id}`, JSON.stringify(updatedDevices));
    
    setNewPin('');
    setNewLabel('');
    setSelectedIcon(ICONS[0].name);
    setShowAddDialog(false);
  };

  const toggleDevice = (pin: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const device = devices.find(d => d.pin === pin);
    if (!device) return;

    const newState = !device.state;
    const updatedDevices = devices.map(d => 
      d.pin === pin ? { ...d, state: newState } : d
    );
    setDevices(updatedDevices);
    
    // Save to localStorage
    localStorage.setItem(`devices-${id}`, JSON.stringify(updatedDevices));

    const msg = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      pin: { [pin]: newState ? 1 : 0 },
      sender,
    };

    wsRef.current.send(JSON.stringify(msg));
  };

  const removeDevice = (pin: number) => {
    const updatedDevices = devices.filter(d => d.pin !== pin);
    setDevices(updatedDevices);
    
    // Save to localStorage
    localStorage.setItem(`devices-${id}`, JSON.stringify(updatedDevices));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <GooeyFilter />
      <header className="bg-zinc-900 border-b border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={20} />
              Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {id}
              </h1>
              <p className="text-sm text-zinc-600">Automa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {wsUrl && reconnectAttempts > 0 && (
              <div className="text-xs text-zinc-500 font-mono">
                Reconnecting... {reconnectAttempts}/10
              </div>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(id);
                alert('Device ID copied to clipboard!');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              title="Copy Device ID"
            >
              <span className="text-xs text-zinc-500 font-mono">Device ID:</span>
              <span className="text-sm font-mono text-zinc-300">{id}</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Your Devices</h2>
          <button
            onClick={() => setShowAddDialog(true)}
            disabled={!connected}
            className="px-6 py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
          >
            + Add Device
          </button>
        </div>
        
        {devices.length === 0 ? (
          <div className="text-center py-20">
            <Monitor size={64} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 text-lg">No devices yet</p>
            <p className="text-zinc-600 text-sm mt-2">Add your first device to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {devices.map((device) => {
              const IconComponent = getIconComponent(device.icon);
              return (
                <div
                  key={device.pin}
                  className={`relative p-6 rounded-xl transition-all duration-300 ${
                    device.state
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : 'bg-black border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <button
                    onClick={() => removeDevice(device.pin)}
                    className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      device.state
                        ? 'bg-purple-900/50 hover:bg-purple-800/50 text-purple-300'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500'
                    }`}
                  >
                    ✕
                  </button>
                  
                  <IconComponent size={48} className={`mb-4 ${device.state ? 'text-purple-300' : 'text-zinc-500'}`} />
                  
                  <h3 className="text-lg font-semibold mb-1">{device.label}</h3>
                  <p className={`text-sm mb-4 font-mono ${device.state ? 'text-purple-400/50' : 'text-zinc-600'}`}>
                    PIN {device.pin}
                  </p>
                  
                  <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-500 ${
                    device.state
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <span className={`text-sm font-medium transition-colors duration-500 ${device.state ? 'text-purple-400' : 'text-zinc-500'}`}>
                      {device.state ? 'ON' : 'OFF'}
                    </span>
                    <Toggle
                      checked={device.state}
                      onCheckedChange={() => toggleDevice(device.pin)}
                      variant="default"
                      disabled={!connected}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Device Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  Add Device
                </h3>
                <p className="text-zinc-500 text-sm">Create a new smart device</p>
              </div>
              <button
                onClick={() => { 
                  setShowAddDialog(false); 
                  setNewPin(''); 
                  setNewLabel('');
                  setSelectedIcon(ICONS[0].name);
                }}
                className="text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Device Name</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Living Room Light"
                  className="w-full px-4 py-3 bg-black rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-700/50 transition-all text-white placeholder-zinc-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">GPIO PIN</label>
                <input
                  type="number"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g., 13"
                  className="w-full px-4 py-3 bg-black rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-700/50 transition-all text-white placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Select Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-3 bg-black rounded-xl border border-zinc-800">
                  {ICONS.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <button
                        key={icon.name}
                        onClick={() => setSelectedIcon(icon.name)}
                        className={`p-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
                          selectedIcon === icon.name
                            ? 'bg-white text-black scale-110'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-300'
                        }`}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-3 p-3 bg-black rounded-lg border border-zinc-800">
                  <div className="text-3xl">
                    {ICONS.find(i => i.name === selectedIcon)?.component && 
                      (() => {
                        const IconComponent = ICONS.find(i => i.name === selectedIcon)?.component;
                        return IconComponent ? <IconComponent size={32} className="text-zinc-400" /> : null;
                      })()
                    }
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600">Preview</p>
                    <p className="text-white font-medium">{newLabel || 'Device Name'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { 
                  setShowAddDialog(false); 
                  setNewPin(''); 
                  setNewLabel('');
                  setSelectedIcon(ICONS[0].name);
                }}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all font-medium text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={addDevice}
                disabled={!newPin || !newLabel.trim()}
                className="flex-1 px-4 py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed rounded-xl font-medium transition-all"
              >
                Create Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
