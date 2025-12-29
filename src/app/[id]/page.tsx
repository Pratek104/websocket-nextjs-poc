'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender: string;
  instanceId: string;
  timestamp: string;
}

export default function InstancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [sender, setSender] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = `User-${Math.random().toString(36).slice(2, 6)}`;
    setSender(name);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:3001`;
    const ws = new WebSocket(`${wsUrl}?instanceId=${id}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as Message;
      setMessages((prev) => [...prev, msg]);
    };

    return () => ws.close();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const msg = {
      id: crypto.randomUUID(),
      content: input.trim(),
      sender,
    };

    wsRef.current.send(JSON.stringify(msg));
    setInput('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white">← Back</Link>
          <h1 className="font-mono text-lg">/{id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-zinc-400">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
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
              <p>{msg.content}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

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
