import React, { useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Stethoscope } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import { resolveSolicitantePerfil } from '../../lib/resolve-solicitante';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const STATUS = {
  pendente:   { label: 'Pendente',   color: '#fbbf24', icon: Clock },
  confirmado: { label: 'Confirmado', color: '#60a5fa', icon: CheckCircle2 },
  realizado:  { label: 'Realizado',  color: '#34d399', icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',  color: '#ef4444', icon: XCircle },
};

const EMOJIS = {
  Médico: '👨‍⚕️', Nutricionista: '🥗', Fisioterapeuta: '🏥', Psicólogo: '🧠',
  Cardiologista: '❤️', Ortopedista: '🦴', 'Professor de Educação Física': '💪', 'Personal Trainer': '🏋️',
};

const METODO_LABEL = {
  pix: 'PIX via Stripe',
  credito: 'Cartão via Stripe',
  debito: 'Débito via Stripe',
  stripe: 'Cartão via Stripe',
};

function carregarPedidos() {
  try { return JSON.parse(localStorage.getItem('fitpro_pedidos_especialistas') || '[]'); }
  catch { return []; }
}

export default function MeusPedidosView() {
  const { especialistas, alunos, professores, loading } = useApp();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [pedidos] = useState(carregarPedidos);

  const { perfil, ids: idsSolicitante } = useMemo(
    () => resolveSolicitantePerfil(user, alunos, professores),
    [user, alunos, professores],
  );

  const emailNorm = (user?.email || '').trim().toLowerCase();

  // Não filtrar com id vazio — isso fazia pedidos órfãos aparecerem e sumirem
  const perfilPronto = !loading && idsSolicitante.length > 0;

  const meusPedidos = useMemo(() => {
    if (!perfilPronto) return [];
    return pedidos
      .filter((p) => {
        if (idsSolicitante.includes(p.solicitanteId)) return true;
        if (emailNorm && (p.solicitanteEmail || '').trim().toLowerCase() === emailNorm) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pedidos, perfilPronto, idsSolicitante, emailNorm]);

  const filtrados = filtroStatus === 'todos'
    ? meusPedidos
    : meusPedidos.filter(p => p.status === filtroStatus);

  const totalGasto = meusPedidos
    .filter(p => p.status === 'confirmado' || p.status === 'realizado')
    .reduce((acc, p) => acc + (p.valorConsulta || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={20} color="#60a5fa" />Meus Pedidos
        </h2>
        <p className="text-xs text-slate-500">Agendamentos de serviços de especialistas parceiros</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: meusPedidos.length, color: '#60a5fa' },
          { label: 'Confirmados', value: meusPedidos.filter(p => p.status === 'confirmado' || p.status === 'realizado').length, color: '#34d399' },
          { label: 'Total Gasto', value: `R$${totalGasto.toFixed(2)}`, color: '#a78bfa' },
        ].map((k, i) => (
          <div key={i} className="p-3 rounded-xl text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', ...Object.keys(STATUS)].map(s => {
          const color = s === 'todos' ? '#64748b' : STATUS[s].color;
          return (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filtroStatus === s ? `${color}20` : 'rgba(255,255,255,0.03)',
                color: filtroStatus === s ? color : '#64748b',
                border: filtroStatus === s ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.06)',
              }}>
              {s === 'todos' ? 'Todos' : STATUS[s].label}
            </button>
          );
        })}
      </div>

      {!perfilPronto ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">Carregando seus pedidos…</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum agendamento encontrado</p>
          <p className="text-xs mt-1">Contrate um especialista parceiro na seção de Parceiros.</p>
          {!perfil && (
            <p className="text-xs mt-2 text-amber-500/80">Perfil não vinculado — faça login novamente se os pedidos não aparecerem.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((pedido) => {
            const esp = especialistas.find(e => e.id === pedido.especialistaId);
            const st = STATUS[pedido.status] || STATUS.pendente;
            const StatusIcon = st.icon;
            const expanded = expandedId === pedido.id;

            return (
              <div key={pedido.id}
                className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <button type="button" onClick={() => setExpandedId(expanded ? null : pedido.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: `${st.color}15` }}>
                    {EMOJIS[esp?.especialidade] || '👨‍⚕️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{esp?.nome || 'Especialista'}</div>
                    <div className="text-xs text-slate-500">
                      {esp?.especialidade} • {new Date(pedido.dataAgendamento || pedido.createdAt).toLocaleDateString('pt-BR')}
                      {pedido.horario && ` • ${pedido.horario}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <div className="text-sm font-bold text-green-400">R$ {parseFloat(pedido.valorConsulta || 0).toFixed(2)}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{ background: `${st.color}15`, color: st.color }}>
                      <StatusIcon size={10} />{st.label}
                    </span>
                  </div>
                  {expanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-slate-500 mb-0.5">Especialidade</div>
                        <div className="font-semibold text-white">{esp?.especialidade || '—'}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-slate-500 mb-0.5">Forma de Pagamento</div>
                        <div className="font-semibold text-white">{METODO_LABEL[pedido.formaPagamento] || pedido.formaPagamento || '—'}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-slate-500 mb-0.5">Data da Contratação</div>
                        <div className="font-semibold text-white">
                          {new Date(pedido.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: '#34d39908', border: '1px solid #34d39920' }}>
                        <div className="text-slate-500 mb-0.5">Valor Pago</div>
                        <div className="font-bold text-green-400">R$ {parseFloat(pedido.valorConsulta || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    {esp?.whatsapp && (
                      <a href={`https://wa.me/${esp.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: '#25d36620', color: '#25d366', border: '1px solid #25d36630' }}>
                        {(pedido.status === 'confirmado' || pedido.status === 'realizado')
                          ? '📲 Entre em contato para realizar o agendamento'
                          : '📲 Entrar em contato via WhatsApp'}
                      </a>
                    )}
                    {pedido.observacoes && (
                      <p className="text-xs text-slate-500 px-1">📝 {pedido.observacoes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
