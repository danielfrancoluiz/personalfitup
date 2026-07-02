import React from 'react';
import { Lock } from 'lucide-react';
import { MSG_CONSULTORIA_BLOQUEADA } from '../../lib/aluno-status';

export default function ConsultoriaBloqueada() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: '#a78bfa15', border: '1px solid #a78bfa30' }}>
        <Lock size={28} color="#a78bfa" />
      </div>
      <h2 className="text-xl font-bold text-white">Acesso restrito</h2>
      <p className="text-slate-400 text-sm max-w-md">{MSG_CONSULTORIA_BLOQUEADA}</p>
    </div>
  );
}
