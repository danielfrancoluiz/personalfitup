import React, { useState } from 'react';
import { Lock, UserCheck } from 'lucide-react';
import { MSG_CONSULTORIA_BLOQUEADA } from '../../lib/aluno-status';
import SolicitarVinculoModal from './SolicitarVinculoModal';

export default function ConsultoriaBloqueada({ message, showSolicitarProfessor = false }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#a78bfa15', border: '1px solid #a78bfa30' }}>
          <Lock size={28} color="#a78bfa" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso restrito</h2>
        <p className="text-slate-400 text-sm max-w-md">{message || MSG_CONSULTORIA_BLOQUEADA}</p>

        {showSolicitarProfessor && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
            >
              <UserCheck size={16} />
              Solicitar Professor
            </button>
            <p className="text-xs text-slate-500 max-w-sm">
              Você ainda pode acessar Serviços Parceiros, Meus Pedidos e Loja pelo menu.
            </p>
          </div>
        )}
      </div>

      {showModal && <SolicitarVinculoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
