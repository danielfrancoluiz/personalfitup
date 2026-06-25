import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Send, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PERGUNTAS = [
  { id: 'p1', texto: 'Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionado por profissional de saúde?' },
  { id: 'p2', texto: 'Você sente dores no peito quando pratica atividade física?' },
  { id: 'p3', texto: 'No último mês, você sentiu dores no peito quando não estava praticando atividade física?' },
  { id: 'p4', texto: 'Você perdeu o equilíbrio devido a tontura ou perdeu a consciência em alguma ocasião recentemente?' },
  { id: 'p5', texto: 'Você tem algum problema ósseo ou articular (por exemplo, nas costas, joelho ou quadril) que poderia ser piorado pela prática de atividade física?' },
  { id: 'p6', texto: 'Algum médico já lhe receitou medicamentos para pressão arterial ou problema de coração?' },
  { id: 'p7', texto: 'Você tem conhecimento de alguma outra razão pela qual não deveria praticar atividade física?' },
];

export default function PARQResponderModal({ onClose }) {
  const [questionario, setQuestionario] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca o questionário pendente para este aluno
    base44.entities.PARQResposta.filter({ status: 'pendente' })
      .then(list => {
        setQuestionario(list[0] || null);
        // Inicializa respostas com null
        const init = {};
        PERGUNTAS.forEach(p => { init[p.id] = null; });
        setRespostas(init);
      })
      .finally(() => setLoading(false));
  }, []);

  const todosRespondidos = PERGUNTAS.every(p => respostas[p.id] !== null);

  const handleEnviar = async () => {
    if (!todosRespondidos) return;
    if (!questionario) return;
    setEnviando(true);
    await base44.entities.PARQResposta.update(questionario.id, {
      respostas,
      observacoes,
      status: 'respondido',
      dataResposta: new Date().toISOString(),
      lido: false,
    });
    setEnviado(true);
    setEnviando(false);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <ClipboardList size={16} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">PAR-Q</h3>
              <p className="text-xs text-slate-500">Questionário de Prontidão para Atividade Física</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : enviado ? (
            <div className="text-center py-16">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
              <p className="text-white font-bold text-lg">Enviado com sucesso!</p>
              <p className="text-slate-400 text-sm mt-1">Seu professor receberá suas respostas.</p>
            </div>
          ) : !questionario ? (
            <div className="text-center py-10">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-20 text-slate-400" />
              <p className="text-slate-500 text-sm">Nenhum questionário pendente no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Responda cada pergunta com <strong className="text-white">SIM</strong> ou <strong className="text-white">NÃO</strong>. Se responder SIM a qualquer pergunta, consulte seu médico antes de iniciar atividades físicas.
              </p>

              {PERGUNTAS.map((p, idx) => (
                <div key={p.id} className="p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>{p.texto}
                  </p>
                  <div className="flex gap-3">
                    {[{ label: 'SIM', value: true, color: '#ef4444' }, { label: 'NÃO', value: false, color: '#34d399' }].map(opt => (
                      <button key={opt.label} onClick={() => setRespostas(r => ({ ...r, [p.id]: opt.value }))}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: respostas[p.id] === opt.value ? `${opt.color}25` : 'rgba(255,255,255,0.04)',
                          color: respostas[p.id] === opt.value ? opt.color : '#64748b',
                          border: `1px solid ${respostas[p.id] === opt.value ? opt.color + '50' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações adicionais (opcional)</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
                  placeholder="Alguma informação extra para seu professor..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <button onClick={handleEnviar} disabled={!todosRespondidos || enviando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: todosRespondidos ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : '#1e2a3a',
                  color: todosRespondidos ? '#fff' : '#475569',
                  opacity: enviando ? 0.7 : 1,
                }}>
                <Send size={15} />
                {enviando ? 'Enviando...' : 'Enviar Respostas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}