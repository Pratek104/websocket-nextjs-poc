'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">WebSocket POC</h1>
        
        {currentUrl && (
          <div className="mb-8 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <p className="text-sm text-zinc-400 mb-1">HTTP Server:</p>
            <p className="font-mono text-sm text-blue-400">{currentUrl}</p>
            <p className="text-sm text-zinc-400 mt-3 mb-1">WebSocket Server:</p>
            <p className="font-mono text-sm text-green-400">ws://{currentUrl.replace(/^https?:\/\//, '')}:3013</p>
          </div>
        )}
        
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="Instance ID (optional)"
            className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={createInstance}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Create Instance
          </button>
        </div>

        <div className="space-y-3">
          {instances.length === 0 ? (
            <p className="text-zinc-500">No instances yet. Create one to get started.</p>
          ) : (
            instances.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700"
              >
                <button
                  onClick={() => router.push(`/${id}`)}
                  className="text-blue-400 hover:text-blue-300 font-mono"
                >
                  /{id}
                </button>
                <button
                  onClick={() => deleteInstance(id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
