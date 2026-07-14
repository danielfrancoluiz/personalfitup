import React, { useMemo, useState } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { generateId } from '../../lib/fitpro-storage';
import { textoServicoEspecialista } from '../../lib/especialista-texto';
import ModalCheckoutStripe from './ModalCheckoutStripe';

const EMOJIS = { Médico: '👨‍⚕️', Nutricionista: '🥗', Fisioterapeuta: '🏥', Psicólogo: '🧠', Cardiologista: '❤️', Ortopedista: '🦴', 'Professor de Educação Física': '💪', 'Personal Trainer': '🏋️' };
const BORDER = 'rgba(255,255,255,0.07)';

export default function ModalPagamentoParceiro({
  especialista,
  usuario,
  tipoUsuario = 'aluno',
  focoInicial = 'pagamento',
  podeContratar = true,
  incluirObsComerciais = false,
  onClose,
  onSuccess,
}) {
  const [pago, setPago] = useState(false);
  const [showStripe, setShowStripe] = useState(false);
  const [etapa, setEtapa] = useState(focoInicial === 'descricao' ? 'detalhes' : 'pagamento');

  const valor = parseFloat(especialista.valorConsulta) || 0;
  const comissao = valor * (parseFloat(especialista.percentualComissao) || 0) / 100;

  const salvarAgendamento = () => {
    const pedidoId = generateId();
    const novo = {
      id: pedidoId,
      solicitanteId: usuario?.id || '',
      solicitanteEmail: usuario?.email || '',
      tipoSolicitante: tipoUsuario,
      especialistaId: especialista.id,
      dataAgendamento: new Date().toISOString().split('T')[0],
      horario: '',
      status: 'confirmado',
      observacoes: `Pago via Stripe — contratado pelo app`,
      valorConsulta: valor,
      comissaoPlataforma: parseFloat(especialista.percentualComissao) || 0,
      formaPagamento: 'stripe',
      createdAt: new Date().toISOString(),
    };
    try {
      const existentes = JSON.parse(localStorage.getItem('fitpro_pedidos_especialistas') || '[]');
      localStorage.setItem('fitpro_pedidos_especialistas', JSON.stringify([novo, ...existentes]));
    } catch {}
    return pedidoId;
  };

  const transacaoVirtual = useMemo(() => ({
    id: `parceiro_${especialista.id}_${Date.now()}`,
    descricao: `Consulta — ${especialista.nome}`,
    valor,
  }), [especialista.id, especialista.nome, valor]);

  if (pago) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
        <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#00E87A20', border: '2px solid #00E87A' }}>
            <CheckCircle2 size={32} color="#00E87A" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Pagamento Confirmado!</h3>
          <p className="text-sm text-slate-400 mb-1">Sua consulta com <strong className="text-white">{especialista.nome}</strong> foi agendada.</p>
          <p className="text-xs text-slate-500 mb-4">Você receberá uma confirmação em breve.</p>
          <div className="p-3 rounded-xl mb-5 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Método</span><span className="text-white">Cartão via Stripe</span></div>
            <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Valor pago</span><span className="font-bold" style={{ color: '#00E87A' }}>R$ {valor.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Status</span><span style={{ color: '#00E87A' }}>✓ Aprovado</span></div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #00E87A, #059669)' }}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const titulo = etapa === 'detalhes' ? 'Sobre o serviço' : 'Pagamento Seguro via Stripe';
  const textoServico = textoServicoEspecialista(especialista, { incluirObsComerciais });

  return (
    <>
      {showStripe ? (
        <ModalCheckoutStripe
          transacao={transacaoVirtual}
          aluno={usuario}
          onClose={() => setShowStripe(false)}
          onSucesso={() => {
            const id = salvarAgendamento();
            setShowStripe(false);
            setPago(true);
            if (onSuccess) onSuccess({ metodo: 'stripe', valor, comissao, id });
          }}
        />
      ) : (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              {etapa === 'pagamento' && <Lock size={14} color="#a5b4fc" />}
              <span className="text-sm font-bold text-white">{titulo}</span>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Especialista */}
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, background: '#635bff08' }}>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: '#1e2a3a' }}>
                  {especialista.imagemUrl
                    ? <img src={especialista.imagemUrl} alt={especialista.nome} className="w-full h-full object-cover" />
                    : <span className="text-3xl">{EMOJIS[especialista.especialidade] || '👨‍⚕️'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">{especialista.nome}</div>
                  <div className="text-xs text-slate-400">{especialista.especialidade}</div>
                  {especialista.disponibilidade && <div className="text-xs text-slate-500 mt-0.5">🕐 {especialista.disponibilidade}</div>}
                </div>
                {valor > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black" style={{ color: '#34d399' }}>R$ {valor.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">Consulta</div>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição completa */}
            {textoServico && (
              <div className="px-5 py-4" style={{ borderBottom: etapa === 'pagamento' ? `1px solid ${BORDER}` : 'none' }}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descrição do serviço</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{textoServico}</p>
              </div>
            )}

            {/* Pagamento */}
            {etapa === 'pagamento' && podeContratar && (
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Valor da consulta</span><span className="text-white">R$ {valor.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-white">Total</span>
                    <span style={{ color: '#a5b4fc' }}>R$ {valor.toFixed(2)}</span>
                  </div>
                </div>

                <button type="button" onClick={() => setShowStripe(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #635bff, #00AAFF)' }}>
                  Pagar — R$ {valor.toFixed(2)}
                </button>

                <p className="text-xs text-center text-slate-600 flex items-center justify-center gap-1">
                  <Lock size={10} />Pagamento processado com segurança pelo Stripe
                </p>
              </div>
            )}
          </div>

          {/* Rodapé — detalhes */}
          {etapa === 'detalhes' && (
            <div className="p-5 flex-shrink-0 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              {podeContratar && valor > 0 && (
                <button type="button" onClick={() => setEtapa('pagamento')}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                  Contratar — R$ {valor.toFixed(2)}
                </button>
              )}
              <button type="button" onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}` }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
