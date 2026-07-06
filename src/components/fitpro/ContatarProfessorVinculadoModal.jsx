import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Mail, MapPin, UserCheck } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { base44 } from '@/api/base44Client';

const BORDER = 'rgba(255,255,255,0.07)';

function montarMensagemContato({ alunoNome, professorNome }) {
  return [
    `Olá ${professorNome || 'professor'},`,
    '',
    `Sou ${alunoNome || 'seu aluno'} e minha consultoria no Personal Fit Up está inativa.`,
    'Gostaria de solicitar a reativação ou entender como posso continuar o acompanhamento.',
    '',
    'Obrigado(a)!',
  ].join('\n');
}

export default function ContatarProfessorVinculadoModal({ professor: professorInicial, aluno, onClose }) {
  const { professores } = useApp();
  const { user } = useAuth();
  const [professor, setProfessor] = useState(professorInicial || null);
  const [carregando, setCarregando] = useState(!professorInicial && !!aluno?.id);

  const alunoNome = aluno?.nome || user?.nome || 'Aluno';

  useEffect(() => {
    if (professorInicial) {
      setProfessor(professorInicial);
      setCarregando(false);
      return;
    }
    if (!aluno?.id) {
      setCarregando(false);
      return;
    }

    let ativo = true;
    (async () => {
      try {
        const lista = await base44.entities.SolicitacaoVinculo.filter({ alunoId: aluno.id });
        const ordenada = [...lista].sort(
          (a, b) => new Date(b.created_date || b.updated_date || 0) - new Date(a.created_date || a.updated_date || 0)
        );
        const ultimaAceita = ordenada.find(s => s.status === 'aceito' && s.professorId);
        const ultimaQualquer = ordenada.find(s => s.professorId);
        const profId = ultimaAceita?.professorId || ultimaQualquer?.professorId;
        if (ativo && profId) {
          setProfessor(professores.find(p => p.id === profId) || null);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => { ativo = false; };
  }, [professorInicial, aluno?.id, professores]);

  const telefone = professor?.telefone?.replace(/\D/g, '') || '';
  const email = professor?.email?.trim() || '';
  const mensagem = montarMensagemContato({ alunoNome, professorNome: professor?.nome });

  const abrirWhatsApp = () => {
    if (!telefone) return;
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const abrirEmail = () => {
    if (!email) return;
    const url = `mailto:${email}?subject=${encodeURIComponent('[Personal Fit Up] Solicitação de reativação')}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#25d36620' }}>
              <MessageCircle size={16} color="#25d366" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Falar com meu Professor</h3>
              <p className="text-xs text-slate-500">Professor que cadastrou ou vinculou você</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={16} color="#6b7280" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {carregando ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#25d366] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !professor ? (
            <div className="text-center py-6 space-y-2">
              <UserCheck size={32} color="#64748b" className="mx-auto" />
              <p className="text-sm text-slate-400">
                Nenhum professor vinculado encontrado. Use &quot;Solicitar Professor&quot; para escolher um na lista.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: '#25d36610', border: '1px solid #25d36630' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{ background: '#25d36625' }}>
                  {professor.nome?.charAt(0)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold text-white truncate">{professor.nome}</p>
                  {professor.especialidade && (
                    <p className="text-xs text-slate-400">{professor.especialidade}</p>
                  )}
                  {(professor.endereco?.cidade || professor.endereco?.estado) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {[professor.endereco?.cidade, professor.endereco?.estado].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Escolha como deseja entrar em contato para solicitar a reativação da consultoria.
              </p>

              <div className="space-y-2">
                {telefone ? (
                  <button
                    type="button"
                    onClick={abrirWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                ) : null}

                {email ? (
                  <button
                    type="button"
                    onClick={abrirEmail}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: telefone ? '#1e2a3a' : 'linear-gradient(135deg, #60a5fa, #2563eb)', border: telefone ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
                  >
                    <Mail size={16} />
                    E-mail
                  </button>
                ) : null}

                {!telefone && !email && (
                  <p className="text-xs text-amber-400 text-center py-2">
                    Este professor não possui telefone ou e-mail cadastrado. Use &quot;Solicitar Professor&quot; para escolher outro.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
