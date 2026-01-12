'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DeviceApiClient } from '@/lib/device-api-client';
import { Device } from '@/types/device';
import { Server, Activity, Clock, ArrowLeft, RefreshCw } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const apiClient = new DeviceApiClient();

  const fetchDevices = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient.getAllDevices();
      if (response.success) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={20} />
              Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Device Management</h1>
              <p className="text-sm text-zinc-600">Monitor and manage all devices</p>
            </div>
          </div>
          <button
            onClick={fetchDevices}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {devices.length === 0 ? (
          <div className="text-center py-20">
            <Server size={64} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 text-lg">No devices connected</p>
            <p className="text-zinc-600 text-sm mt-2">Devices will appear here when they connect</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Link
                key={device.deviceId}
                href={`/devices/${device.deviceId}`}
                className="group p-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Server size={24} className="text-zinc-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-zinc-300 transition-colors">
                        {device.name || device.deviceId}
                      </h3>
                      <p className="text-xs text-zinc-600 font-mono">{device.deviceId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    device.status === 'online' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}>
                    {device.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock size={14} />
                    <span>Last seen: {new Date(device.lastSeen).toLocaleString()}</span>
                  </div>
                  {device.connectedAt && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Activity size={14} />
                      <span>Connected: {new Date(device.connectedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {device.metadata && Object.keys(device.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-600 mb-2">Metadata</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(device.metadata).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
