'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home as HomeIcon, Server } from 'lucide-react';

export default function Home() {
  const [instances, setInstances] = useState<string[]>([]);
  const [newId, setNewId] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('ws-instances');
    if (saved) setInstances(JSON.parse(saved));
    setCurrentUrl(window.location.origin);
  }, []);

  const createInstance = () => {
    const id = newId.trim() || (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`).slice(0, 8);
    if (!instances.includes(id)) {
      const updated = [...instances, id];
      setInstances(updated);
      localStorage.setItem('ws-instances', JSON.stringify(updated));
    }
    setNewId('');
    router.push(`/${id}`);
  };

  const deleteInstance = (id: string) => {
    const updated = instances.filter((i) => i !== id);
    setInstances(updated);
    localStorage.setItem('ws-instances', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12 pt-12">
          <HomeIcon size={64} className="mx-auto mb-4 text-purple-400" />
          <h1 className="text-5xl font-bold mb-3 text-white">
            Smart Home Control
          </h1>
          <p className="text-purple-300/60 text-lg">Manage your IoT devices from anywhere</p>
        </div>
        
        {currentUrl && (
          <div className="mb-10 p-6 bg-purple-950/30 rounded-xl border border-purple-900/50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-purple-400/60 mb-2">HTTP Server</p>
                <p className="font-mono text-sm text-purple-300/80">{currentUrl}</p>
              </div>
              <div>
                <p className="text-sm text-purple-400/60 mb-2">WebSocket Server</p>
                <p className="font-mono text-sm text-purple-300/80">ws://194.163.172.56:3013</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mb-10">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createInstance()}
            placeholder="Enter instance name (optional)"
            className="flex-1 px-6 py-4 bg-purple-950/30 rounded-xl border border-purple-900/50 focus:outline-none focus:border-purple-700 transition-colors text-lg"
          />
          <button
            onClick={createInstance}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-all text-lg"
          >
            Create Instance
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Instances</h2>
          {instances.length === 0 ? (
            <div className="text-center py-16 bg-purple-950/30 rounded-xl border border-purple-900/50">
              <Server size={48} className="mx-auto mb-3 text-purple-700" />
              <p className="text-purple-300/60">No instances yet</p>
              <p className="text-purple-400/40 text-sm mt-2">Create your first instance to start controlling devices</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {instances.map((id) => (
                <div
                  key={id}
                  className="group relative p-6 bg-purple-950/30 hover:bg-purple-950/50 rounded-xl border border-purple-900/50 hover:border-purple-800/50 transition-all"
                >
                  <button
                    onClick={() => router.push(`/${id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <HomeIcon size={24} className="text-purple-400" />
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-200 transition-colors">
                        {id}
                      </h3>
                    </div>
                    <p className="text-sm text-purple-400/60">Click to manage devices</p>
                  </button>
                  <button
                    onClick={() => deleteInstance(id)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-purple-900/50 hover:bg-purple-800/50 text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
