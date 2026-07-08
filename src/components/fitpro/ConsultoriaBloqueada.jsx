import React, { useState } from 'react';
import { Lock, UserCheck, MessageCircle } from 'lucide-react';
import { MSG_CONSULTORIA_BLOQUEADA } from '../../lib/aluno-status';
import SolicitarVinculoModal from './SolicitarVinculoModal';
import ContatarProfessorVinculadoModal from './ContatarProfessorVinculadoModal';

export default function ConsultoriaBloqueada({
  message,
  showSolicitarProfessor = false,
  professorVinculado = null,
  alunoRecord = null,
}) {
  const [showModal, setShowModal] = useState(false);
  const [showContatoProfessor, setShowContatoProfessor] = useState(false);

  const podeContatarProfessor = !!(professorVinculado || alunoRecord?.professorId || alunoRecord?.id);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#a78bfa15', border: '1px solid #a78bfa30' }}>
          <Lock size={28} color="#a78bfa" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso limitado</h2>
        <p className="text-slate-400 text-sm max-w-md">{message || MSG_CONSULTORIA_BLOQUEADA}</p>

        {showSolicitarProfessor && (
          <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-xs">
            {podeContatarProfessor && (
              <button
                type="button"
                onClick={() => setShowContatoProfessor(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
              >
                <MessageCircle size={16} />
                Falar com meu Professor
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
            >
              <UserCheck size={16} />
              Solicitar Professor
            </button>
            <p className="text-xs text-slate-500 max-w-sm">
              {podeContatarProfessor
                ? 'Fale com quem cadastrou você ou escolha outro professor na lista.'
                : 'Você ainda pode acessar Serviços Parceiros, Meus Pedidos e Loja pelo menu.'}
            </p>
          </div>
        )}
      </div>

      {showModal && <SolicitarVinculoModal onClose={() => setShowModal(false)} />}
      {showContatoProfessor && (
        <ContatarProfessorVinculadoModal
          professor={professorVinculado}
          aluno={alunoRecord}
          onClose={() => setShowContatoProfessor(false)}
        />
      )}
    </>
  );
}
