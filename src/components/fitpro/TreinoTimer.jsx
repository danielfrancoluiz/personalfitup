import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';

export default function TreinoTimer({ onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleStop = () => {
    setRunning(false);
    setSeconds(0);
    if (onClose) onClose();
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
      style={{ background: '#0d1525', border: '1px solid #f472b640', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f472b620' }}>
        <Timer size={16} color="#f472b6" />
      </div>
      <span className="text-lg font-black text-white tabular-nums">{format(seconds)}</span>
      <div className="flex gap-1">
        <button onClick={() => setRunning(r => !r)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: running ? '#fbbf2420' : '#34d39920' }}>
          {running
            ? <Pause size={14} color="#fbbf24" />
            : <Play size={14} color="#34d399" fill="#34d399" />}
        </button>
        <button onClick={handleStop}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/20">
          <Square size={14} color="#ef4444" fill="#ef4444" />
        </button>
      </div>
    </div>
  );
}