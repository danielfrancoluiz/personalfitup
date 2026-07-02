import React, { useState } from 'react';
import { DollarSign, Plus, X, TrendingUp, Clock, AlertCircle, CheckCircle2, UserCheck, Zap, Ban, Trash2, QrCode, Save, Copy, Eye, Edit2, CreditCard } from 'lucide-react';
import ModalIntegracaoStripe from '../../components/fitpro/ModalIntegracaoStripe';
import ModalCheckoutStripe from '../../components/fitpro/ModalCheckoutStripe';
import MaskedInput from '../../components/fitpro/MaskedInput';
import { motion } from 'framer-motion';
import { useApp } from '../../context/FitProContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ConfigPlanosGlobais from '../../components/fitpro/ConfigPlanosGlobais';
import { loadPlanos, getPrecoCobrancaProfessor, dadosRenovacaoMensalidade, PLANO_COLOR, contratoPrecoVigente } from '../../lib/planos-professor';

const PIX_DADOS_KEY = 'fitpro_admin_pix_dados';

// Gera payload PIX EMV simplificado para chave aleatória
function gerarPayloadPix(chave, nome, cidade, valor = null) {
  const nomeClean = nome.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const cidadeClean = cidade.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  const merchantAccountInfo = `0014BR.GOV.BCB.PIX01${String(chave.length).padStart(2,'0')}${chave}`;
  const mai = `26${String(merchantAccountInfo.length).padStart(2,'0')}${merchantAccountInfo}`;
  const mcc = '52040000';
  const currency = '5303986';
  const valorStr = valor ? `54${String(Number(valor).toFixed(2).length).padStart(2,'0')}${Number(valor).toFixed(2)}` : '';
  const country = '5802BR';
  const nomeField = `59${String(nomeClean.length).padStart(2,'0')}${nomeClean}`;
  const cidadeField = `60${String(cidadeClean.length).padStart(2,'0')}${cidadeClean}`;
  const txid = '62070503***';

  const payload = `000201${mai}${mcc}${currency}${valorStr}${country}${nomeField}${cidadeField}${txid}6304`;

  // CRC16 simples
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  crc = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payload + crc;
}

function gerarQrUrl(payload) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
}

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const STATUS_COLOR = { pago: '#34d399', pendente: '#fbbf24', vencido: '#ef4444', cancelado: '#64748b', a_vencer: '#60a5fa' };
const STATUS_LABEL = { pago: 'Cobrança em dia', pendente: 'Pendente', vencido: 'Vencido', cancelado: 'Cancelado', a_vencer: 'A vencer' };
const STATUS_ICON = { pago: CheckCircle2, pendente: Clock, vencido: AlertCircle, cancelado: X, a_vencer: Clock };

// Determina o status visual de uma transação considerando a data de vencimento
function resolverStatusTransacao(t) {
  if (t.status === 'pago' || t.status === 'cancelado') return t.status;
  if (!t.vencimento) return t.status; // sem vencimento, usa o status salvo
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(t.vencimento); venc.setHours(0, 0, 0, 0);
  if (venc > hoje) return 'a_vencer';
  if (venc < hoje) return 'vencido';
  return 'pendente'; // vence hoje
}

const PROF_STATUS_CONFIG = {
  pago:         { label: 'Em dia',       color: '#34d399', bg: '#34d39915', border: '#34d39930', icon: CheckCircle2 },
  a_vencer:     { label: 'A vencer',     color: '#60a5fa', bg: '#60a5fa15', border: '#60a5fa30', icon: Clock },
  pendente:     { label: 'Vence hoje',   color: '#fbbf24', bg: '#fbbf2415', border: '#fbbf2430', icon: Clock },
  vencido:      { label: 'Vencido',      color: '#ef4444', bg: '#ef444415', border: '#ef444430', icon: AlertCircle },
  sem_cobranca: { label: 'Sem cobrança', color: '#64748b', bg: '#64748b10', border: '#64748b25', icon: DollarSign },
};

function statusFinanceiroProfessor(profId, transacoes) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const mensalidades = transacoes.filter(t =>
    t.professorId === profId && t.tipo === 'Mensalidade' && t.categoria !== 'despesa'
  );
  if (mensalidades.length === 0) return 'sem_cobranca';

  // Verifica se alguma está vencida (vencimento < hoje e não paga)
  const temVencida = mensalidades.some(t => {
    if (t.status === 'pago') return false;
    const venc = t.vencimento ? new Date(t.vencimento) : new Date(t.data);
    venc.setHours(0, 0, 0, 0);
    return venc < hoje;
  });
  if (temVencida) return 'vencido';

  // Verifica se alguma vence hoje
  const temHoje = mensalidades.some(t => {
    if (t.status === 'pago') return false;
    const venc = t.vencimento ? new Date(t.vencimento) : new Date(t.data);
    venc.setHours(0, 0, 0, 0);
    return venc.getTime() === hoje.getTime();
  });
  if (temHoje) return 'pendente';

  // Verifica se há cobranças futuras ainda não pagas (a vencer)
  const temFutura = mensalidades.some(t => {
    if (t.status === 'pago') return false;
    const venc = t.vencimento ? new Date(t.vencimento) : new Date(t.data);
    venc.setHours(0, 0, 0, 0);
    return venc > hoje;
  });
  if (temFutura) return 'a_vencer';

  // Todas pagas
  return 'pago';
}

function emptyCobrancaProf(profId = '') {
  return {
    descricao: '',
    tipo: 'Mensalidade',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    vencimento: '',
    status: 'pendente',
    professorId: profId,
    alunoId: '',
    observacoes: '',
    categoria: 'receita',
  };
}

export default function FinanceiroAdminView() {
  const { transacoes, professores, addTransacao, updateTransacao, deleteTransacao, updateProfessor } = useApp();
  const planos = loadPlanos();

  // Apenas transações vinculadas a professores (plano do professor, não dos alunos)
  const transacoesProfessores = (transacoes || [])
    .filter(t => t.professorId && !t.alunoId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const meses = [...new Set(transacoesProfessores.map(t => t.data?.slice(0, 7)))].filter(Boolean).sort().reverse();

  const [abaAtiva, setAbaAtiva] = useState('professores'); // 'professores' | 'transacoes' | 'pix' | 'stripe'
  const [showStripe, setShowStripe] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroProfStatus, setFiltroProfStatus] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyCobrancaProf());
  const [saved, setSaved] = useState(false);
  const [confirmando, setConfirmando] = useState(null);
  const [checkoutTransacao, setCheckoutTransacao] = useState(null);

  // PIX config
  const pixDadosDefault = { chave: '', nome: '', cidade: '', banco: '', tipochave: 'cpf' };
  const [pixDados, setPixDados] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PIX_DADOS_KEY)) || pixDadosDefault; } catch { return pixDadosDefault; }
  });
  const [pixEditando, setPixEditando] = useState(!(() => { try { return JSON.parse(localStorage.getItem(PIX_DADOS_KEY))?.chave; } catch { return false; } })());
  const [pixForm, setPixForm] = useState(pixDados);
  const [pixSaved, setPixSaved] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixValorPreview, setPixValorPreview] = useState('');
  const [pixCopied, setPixCopied] = useState(false);

  const salvarPix = () => {
    localStorage.setItem(PIX_DADOS_KEY, JSON.stringify(pixForm));
    setPixDados(pixForm);
    setPixEditando(false);
    setPixSaved(true);
    setTimeout(() => { setPixSaved(false); }, 2000);
  };

  const pixPayload = pixDados.chave && pixDados.nome && pixDados.cidade
    ? gerarPayloadPix(pixDados.chave, pixDados.nome, pixDados.cidade, pixValorPreview || null)
    : null;
  const pixQrUrl = pixPayload ? gerarQrUrl(pixPayload) : null;

  const filtradas = transacoesProfessores.filter(t => {
    const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus;
    const matchMes = !filtroMes || t.data?.startsWith(filtroMes);
    return matchStatus && matchMes;
  });

  const totalPago = transacoesProfessores.filter(t => t.status === 'pago').reduce((a, t) => a + (parseFloat(t.valor) || 0), 0);
  const totalPendente = transacoesProfessores.filter(t => t.status === 'pendente').reduce((a, t) => a + (parseFloat(t.valor) || 0), 0);
  const totalVencido = transacoesProfessores.filter(t => t.status === 'vencido').reduce((a, t) => a + (parseFloat(t.valor) || 0), 0);
  const saldo = totalPago;

  const chartData = meses.slice(0, 6).reverse().map(mes => {
    const mt = transacoesProfessores.filter(t => t.data?.startsWith(mes));
    return {
      mes: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      recebido: mt.filter(t => t.status === 'pago').reduce((a, t) => a + (parseFloat(t.valor) || 0), 0),
      pendente: mt.filter(t => t.status === 'pendente').reduce((a, t) => a + (parseFloat(t.valor) || 0), 0),
    };
  });

  const professoresComStatus = professores.map(p => ({
    ...p,
    statusFinanceiro: statusFinanceiroProfessor(p.id, transacoesProfessores),
  }));

  const countsPorStatus = {
    pago: professoresComStatus.filter(p => p.statusFinanceiro === 'pago').length,
    a_vencer: professoresComStatus.filter(p => p.statusFinanceiro === 'a_vencer').length,
    pendente: professoresComStatus.filter(p => p.statusFinanceiro === 'pendente').length,
    vencido: professoresComStatus.filter(p => p.statusFinanceiro === 'vencido').length,
    sem_cobranca: professoresComStatus.filter(p => p.statusFinanceiro === 'sem_cobranca').length,
  };

  const professoresExibidos = filtroProfStatus === 'todos'
    ? professoresComStatus
    : professoresComStatus.filter(p => p.statusFinanceiro === filtroProfStatus);

  const getCobrancaPendenteProf = (profId) =>
    transacoesProfessores.find(t =>
      t.professorId === profId &&
      t.tipo === 'Mensalidade' &&
      (t.status === 'pendente' || t.status === 'vencido')
    );

  const gerarCobrancaProf = (prof) => {
    const plano = planos.find(pl => pl.id === prof.planoCobranca) || planos.find(pl => pl.id === 'profissional');
    const preco = getPrecoCobrancaProfessor(prof, prof.planoCobranca || plano?.id);
    setForm({
      ...emptyCobrancaProf(prof.id),
      descricao: `${plano?.nome || 'Mensalidade'} — ${prof.nome}`,
      valor: String(preco),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.valor) return alert('Preencha o valor');
    if (!form.descricao.trim()) return alert('Preencha a descrição');
    if (!form.professorId) return alert('Selecione um professor');
    if (editId) {
      updateTransacao(editId, { ...form, valor: parseFloat(form.valor) || 0 });
    } else {
      addTransacao({ ...form, valor: parseFloat(form.valor) || 0 });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyCobrancaProf()); }, 1200);
  };

  const abrirEdicao = (t) => {
    setForm({
      descricao: t.descricao || '',
      tipo: t.tipo || 'Mensalidade',
      valor: String(t.valor || ''),
      data: t.data || new Date().toISOString().split('T')[0],
      vencimento: t.vencimento || '',
      status: t.status || 'pendente',
      professorId: t.professorId || '',
      alunoId: t.alunoId || '',
      observacoes: t.observacoes || '',
      categoria: t.categoria || 'receita',
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const confirmarRecebido = async (id) => {
    setConfirmando(id);
    const transacao = transacoesProfessores.find(t => t.id === id);
    await updateTransacao(id, { status: 'pago' });
    if (transacao?.professorId) {
      const prof = professores.find(p => p.id === transacao.professorId);
      if (prof) {
        await updateProfessor(transacao.professorId, dadosRenovacaoMensalidade(prof));
      }
    }
    setConfirmando(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign size={20} color="#00d4ff" />Financeiro — Planos de Professores
          </h2>
          <p className="text-xs text-slate-500">Gerencie cobranças dos planos de assinatura dos professores</p>
        </div>
        <button onClick={() => { setForm(emptyCobrancaProf()); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#00d4ff20', color: '#00d4ff', border: '1px solid #00d4ff30' }}>
          <Plus size={14} />Nova Cobrança
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Recebido', value: totalPago, color: '#34d399', icon: TrendingUp },
          { label: 'Pendente', value: totalPendente, color: '#fbbf24', icon: Clock },
          { label: 'Vencido', value: totalVencido, color: '#ef4444', icon: AlertCircle },
          { label: 'Professores', value: professores.length, color: '#00d4ff', icon: UserCheck, isCount: true },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{k.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}20` }}>
                  <Icon size={14} style={{ color: k.color }} />
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: k.color }}>
                {k.isCount ? k.value : `R$ ${k.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico */}
      {chartData.length > 1 && (
        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h3 className="font-semibold text-white mb-4">Receitas de Planos por Mês</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                formatter={(val) => [`R$ ${val.toFixed(2)}`, '']} />
              <Bar dataKey="recebido" name="Recebido" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendente" name="Pendente" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[
          { id: 'professores', label: `👨‍🏫 Professores${countsPorStatus.vencido > 0 ? ` (${countsPorStatus.vencido} vencido${countsPorStatus.vencido > 1 ? 's' : ''})` : countsPorStatus.pendente > 0 ? ` (${countsPorStatus.pendente} vence hoje)` : ''}` },
          { id: 'planos', label: '📋 Planos' },
          { id: 'transacoes', label: '💳 Transações' },
          { id: 'pix', label: '🔳 Configurar PIX' },
          { id: 'stripe', label: '💳 Stripe' },
        ].map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: abaAtiva === a.id ? (a.id === 'professores' && countsPorStatus.vencido > 0 ? '#ef444415' : a.id === 'professores' && countsPorStatus.pendente > 0 ? '#fbbf2415' : a.id === 'stripe' ? '#00b94a15' : '#00d4ff15') : 'transparent',
              color: abaAtiva === a.id ? (a.id === 'professores' && countsPorStatus.vencido > 0 ? '#ef4444' : a.id === 'professores' && countsPorStatus.pendente > 0 ? '#fbbf24' : a.id === 'stripe' ? '#00b94a' : '#00d4ff') : '#64748b',
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA PROFESSORES */}
      {abaAtiva === 'professores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(PROF_STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={key} onClick={() => setFiltroProfStatus(filtroProfStatus === key ? 'todos' : key)}
                  className="p-3 rounded-2xl text-center transition-all"
                  style={{ background: filtroProfStatus === key ? cfg.bg : CARD, border: `1px solid ${filtroProfStatus === key ? cfg.border : BORDER}` }}>
                  <Icon size={18} className="mx-auto mb-1" style={{ color: cfg.color }} />
                  <div className="text-xl font-bold" style={{ color: cfg.color }}>{countsPorStatus[key]}</div>
                  <div className="text-xs text-slate-500">{cfg.label}</div>
                </button>
              );
            })}
          </div>

          {professoresExibidos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum professor nesta categoria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {professoresExibidos.map(prof => {
                const cfg = PROF_STATUS_CONFIG[prof.statusFinanceiro];
                const Icon = cfg.icon;
                const ultimaCobranca = transacoesProfessores
                  .filter(t => t.professorId === prof.id)
                  .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
                const cobrancaPendente = getCobrancaPendenteProf(prof.id);

                return (
                  <motion.div key={prof.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: CARD, border: `1px solid ${cfg.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: `${cfg.color}20` }}>
                      {prof.nome?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{prof.nome}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Icon size={11} style={{ color: cfg.color }} />
                        <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                        {ultimaCobranca && (
                          <span className="text-xs text-slate-500">
                            • R$ {parseFloat(ultimaCobranca.valor || 0).toFixed(0)}
                            {ultimaCobranca.vencimento && ` • venc. ${new Date(ultimaCobranca.vencimento).toLocaleDateString('pt-BR')}`}
                          </span>
                        )}
                        {prof.planoAssinatura && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#00d4ff15', color: '#00d4ff' }}>
                            {prof.planoAssinatura}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {cobrancaPendente && (
                        <button
                          onClick={() => confirmarRecebido(cobrancaPendente.id)}
                          disabled={confirmando === cobrancaPendente.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                          <CheckCircle2 size={11} />
                          {confirmando === cobrancaPendente.id ? '...' : 'Recebido'}
                        </button>
                      )}
                      <button
                        onClick={() => gerarCobrancaProf(prof)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: '#00d4ff15', color: '#00d4ff', border: '1px solid #00d4ff25' }}>
                        <Zap size={11} />Cobrar
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA PLANOS GLOBAIS */}
      {abaAtiva === 'planos' && (
        <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h3 className="font-semibold text-white mb-4">Planos da Plataforma</h3>
          <ConfigPlanosGlobais />
        </div>
      )}

      {/* ABA TRANSAÇÕES */}
      {abaAtiva === 'transacoes' && (
        <>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              {['todos', 'pago', 'pendente', 'vencido'].map(s => {
                const color = s === 'todos' ? '#64748b' : STATUS_COLOR[s];
                return (
                  <button key={s} onClick={() => setFiltroStatus(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: filtroStatus === s ? `${color}20` : 'rgba(255,255,255,0.03)', color: filtroStatus === s ? color : '#64748b', border: filtroStatus === s ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.06)' }}>
                    {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
            {meses.length > 0 && (
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Todos os meses</option>
                {meses.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>)}
              </select>
            )}
          </div>

          {filtradas.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma cobrança de professor registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtradas.map((t, i) => {
                const statusVisual = resolverStatusTransacao(t);
                const statusColor = STATUS_COLOR[statusVisual] || '#64748b';
                const StatusIcon = STATUS_ICON[statusVisual] || Clock;
                const prof = professores.find(p => p.id === t.professorId);
                return (
                  <motion.div key={t.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor}20` }}>
                      <StatusIcon size={16} style={{ color: statusColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{t.descricao}</div>
                      <div className="text-xs text-slate-500">
                        {prof?.nome || 'Professor'} • {new Date(t.data).toLocaleDateString('pt-BR')}
                        {t.vencimento && ` • venc. ${new Date(t.vencimento).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(statusVisual === 'pendente' || statusVisual === 'vencido' || statusVisual === 'a_vencer') && t.status !== 'pago' && (
                        <>
                          <button
                            onClick={() => setCheckoutTransacao(t)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                            style={{ background: '#635bff15', color: '#a5b4fc', border: '1px solid #635bff30' }}>
                            <CreditCard size={11} />Cartão
                          </button>
                          <button
                            onClick={() => confirmarRecebido(t.id)}
                            disabled={confirmando === t.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                            <CheckCircle2 size={11} />
                            {confirmando === t.id ? '...' : 'Recebido'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => abrirEdicao(t)}
                        title="Editar cobrança"
                        className="p-1.5 rounded-xl transition-all hover:opacity-90"
                        style={{ background: '#fbbf2415', color: '#fbbf24', border: '1px solid #fbbf2425' }}>
                        <Edit2 size={13} />
                      </button>
                      {t.status !== 'cancelado' && (
                        <button
                          onClick={() => updateTransacao(t.id, { status: 'cancelado' })}
                          title="Cancelar cobrança"
                          className="p-1.5 rounded-xl transition-all hover:opacity-90"
                          style={{ background: '#64748b15', color: '#94a3b8', border: '1px solid #64748b25' }}>
                          <Ban size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Excluir esta cobrança?')) deleteTransacao(t.id); }}
                        title="Excluir cobrança"
                        className="p-1.5 rounded-xl transition-all hover:opacity-90"
                        style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }}>
                        <Trash2 size={13} />
                      </button>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: '#34d399' }}>
                          R$ {parseFloat(t.valor || 0).toFixed(2)}
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
                          {STATUS_LABEL[statusVisual] || statusVisual}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ABA PIX */}
      {abaAtiva === 'pix' && (
        <div className="space-y-4">
          {/* Dados PIX do Administrador */}
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode size={18} color="#00d4ff" />
                <div>
                  <h3 className="font-semibold text-white">Dados PIX do Administrador</h3>
                  <p className="text-xs text-slate-500">Cadastre seus dados para gerar o QR Code PIX automaticamente</p>
                </div>
              </div>
              {!pixEditando && pixDados?.chave && (
                <button onClick={() => { setPixForm(pixDados); setPixEditando(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: '#fbbf2415', color: '#fbbf24', border: '1px solid #fbbf2425' }}>
                  <Edit2 size={12} />Alterar PIX
                </button>
              )}
            </div>

            {/* Modo visualização */}
            {!pixEditando && pixDados?.chave ? (
              <div className="space-y-2">
                {[
                  { label: 'Chave PIX', value: `${pixDados.tipochave?.toUpperCase()}: ${pixDados.chave}` },
                  { label: 'Beneficiário', value: pixDados.nome },
                  { label: 'Cidade', value: pixDados.cidade },
                  ...(pixDados.banco ? [{ label: 'Banco', value: pixDados.banco }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: '#00d4ff08', border: '1px solid #00d4ff20' }}>
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">{item.label}</span>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400">PIX configurado e salvo</span>
                </div>
              </div>
            ) : (
              /* Modo edição */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tipo de Chave</label>
                    <select value={pixForm.tipochave} onChange={e => setPixForm(f => ({ ...f, tipochave: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Chave PIX</label>
                    {['cpf', 'cnpj', 'telefone'].includes(pixForm.tipochave) ? (
                      <MaskedInput
                        mask={pixForm.tipochave === 'cnpj' ? 'cnpj' : pixForm.tipochave === 'telefone' ? 'telefone' : 'cpf'}
                        value={pixForm.chave}
                        onChange={e => setPixForm(f => ({ ...f, chave: e.target.value }))}
                        placeholder={pixForm.tipochave === 'cpf' ? '000.000.000-00' : pixForm.tipochave === 'cnpj' ? '00.000.000/0000-00' : '(11) 99999-9999'}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    ) : (
                      <input value={pixForm.chave} onChange={e => setPixForm(f => ({ ...f, chave: e.target.value }))}
                        placeholder={pixForm.tipochave === 'email' ? 'email@ex.com' : 'Chave PIX'}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nome do Beneficiário</label>
                  <input value={pixForm.nome} onChange={e => setPixForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome completo ou razão social"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cidade</label>
                    <input value={pixForm.cidade} onChange={e => setPixForm(f => ({ ...f, cidade: e.target.value }))}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Banco</label>
                    <input value={pixForm.banco} onChange={e => setPixForm(f => ({ ...f, banco: e.target.value }))}
                      placeholder="Ex: Nubank, Itaú..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={salvarPix}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: pixSaved ? '#34d39920' : '#00d4ff20', color: pixSaved ? '#34d399' : '#00d4ff', border: `1px solid ${pixSaved ? '#34d39930' : '#00d4ff30'}` }}>
                    <Save size={14} />{pixSaved ? '✓ Salvo!' : 'Salvar Dados PIX'}
                  </button>
                  {pixEditando && pixDados?.chave && (
                    <button onClick={() => setPixEditando(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Cancelar
                    </button>
                  )}
                  {pixQrUrl && (
                    <button onClick={() => setShowPixModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
                      <Eye size={14} />Ver QR Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview QR Code com valor */}
          {pixDados.chave && pixDados.nome && pixDados.cidade && (
            <div className="p-5 rounded-2xl" style={{ background: CARD, border: '1px solid #00d4ff20' }}>
              <h4 className="font-semibold text-white mb-3 text-sm flex items-center gap-2"><QrCode size={15} color="#00d4ff" />Pré-visualização do QR Code</h4>
              <div className="flex gap-2 mb-4 items-center">
                <span className="text-xs text-slate-400">Valor (opcional):</span>
                <input type="number" value={pixValorPreview} onChange={e => setPixValorPreview(e.target.value)}
                  placeholder="0.00" className="px-2 py-1.5 rounded-lg text-sm text-white outline-none w-28"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-slate-500">Deixe vazio para valor livre</span>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl" style={{ background: 'white' }}>
                  <img src={pixQrUrl} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{pixDados.nome}</div>
                  <div className="text-xs text-slate-400">{pixDados.banco && `${pixDados.banco} · `}{pixDados.tipochave?.toUpperCase()}: {pixDados.chave}</div>
                  <div className="text-xs text-slate-500">{pixDados.cidade}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(pixPayload); setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: pixCopied ? '#34d39920' : '#1e2a3a', color: pixCopied ? '#34d399' : '#94a3b8', border: `1px solid ${pixCopied ? '#34d39930' : 'rgba(255,255,255,0.08)'}` }}>
                  <Copy size={12} />{pixCopied ? 'Código copiado!' : 'Copiar código PIX (copia e cola)'}
                </button>
              </div>
            </div>
          )}

          {!pixDados.chave && (
            <div className="p-6 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <QrCode size={40} className="mx-auto mb-2 opacity-20 text-slate-500" />
              <p className="text-sm text-slate-500">Preencha os dados acima para gerar seu QR Code PIX</p>
            </div>
          )}
        </div>
      )}

      {/* ABA STRIPE */}
      {abaAtiva === 'stripe' && (
        <div className="space-y-4">
          {(() => {
            let cfg = {};
            try { cfg = JSON.parse(localStorage.getItem('fitpro_stripe_config')) || {}; } catch {}
            const conectado = !!(cfg.publishableKey && cfg.secretKey);
            return (
              <div className="p-5 rounded-2xl" style={{ background: '#0d1525', border: conectado ? '1px solid rgba(99,91,255,0.35)' : '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: 'linear-gradient(135deg, #635bff20, #00AAFF20)', border: '1px solid rgba(99,91,255,0.3)' }}>
                      💳
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Stripe</h3>
                      <p className="text-xs text-slate-500">Checkout Sessions · API v1</p>
                    </div>
                  </div>
                  {conectado
                    ? <span className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1.5" style={{ background: '#00E87A15', color: '#00E87A', border: '1px solid #00E87A30' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E87A' }} />Conectado
                      </span>
                    : <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>Não configurado</span>
                  }
                </div>

                {conectado && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Ambiente', value: cfg.ambiente === 'producao' ? '🚀 Produção' : '🧪 Teste' },
                      { label: 'Métodos', value: `${(cfg.metodos || []).length} ativos` },
                      { label: 'Parcelas', value: `Até ${cfg.parcelasMax || 12}x` },
                    ].map(k => (
                      <div key={k.label} className="p-2.5 rounded-xl text-center" style={{ background: '#635bff08', border: '1px solid #635bff20' }}>
                        <div className="text-sm font-bold text-white">{k.value}</div>
                        <div className="text-xs text-slate-500">{k.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                  {['💳 Cartão', '🔳 PIX', '📄 Boleto', '🔄 Checkout Session', '🔔 Webhooks', '↩️ Estorno'].map(r => (
                    <span key={r} className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,91,255,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,91,255,0.2)' }}>{r}</span>
                  ))}
                </div>

                <button onClick={() => setShowStripe(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: conectado ? 'linear-gradient(135deg, #1e2a3a, #253545)' : 'linear-gradient(135deg, #635bff, #00AAFF)', color: conectado ? '#94a3b8' : '#fff' }}>
                  {conectado ? '⚙️ Editar Configuração' : '🔗 Configurar Integração'}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal Stripe */}
      {showStripe && <ModalIntegracaoStripe onClose={() => setShowStripe(false)} />}

      {/* Checkout Stripe para mensalidade de professor */}
      {checkoutTransacao && (
        <ModalCheckoutStripe
          transacao={checkoutTransacao}
          aluno={professores.find(p => p.id === checkoutTransacao.professorId)}
          onClose={() => setCheckoutTransacao(null)}
          onSucesso={() => {
            updateTransacao(checkoutTransacao.id, { status: 'pago' });
            setCheckoutTransacao(null);
          }}
        />
      )}

      {/* Modal QR Code PIX expandido */}
      {showPixModal && pixQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPixModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">QR Code PIX</h3>
              <button onClick={() => setShowPixModal(false)} className="p-2 rounded-xl hover:bg-white/5"><X size={16} color="#6b7280" /></button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="p-5 rounded-2xl" style={{ background: 'white' }}>
                <img src={pixQrUrl} alt="QR Code PIX" className="w-56 h-56 object-contain" />
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-base font-bold text-white">{pixDados.nome}</div>
              <div className="text-xs text-slate-400 mt-1">{pixDados.banco && `${pixDados.banco} · `}{pixDados.tipochave?.toUpperCase()}: {pixDados.chave}</div>
              <div className="text-xs text-slate-500">{pixDados.cidade}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(pixPayload); setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: pixCopied ? '#34d39920' : '#00d4ff20', color: pixCopied ? '#34d399' : '#00d4ff', border: `1px solid ${pixCopied ? '#34d39930' : '#00d4ff30'}` }}>
              <Copy size={14} />{pixCopied ? '✓ Código Copiado!' : 'Copiar código PIX'}
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar Cobrança' : 'Nova Cobrança — Professor'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyCobrancaProf()); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Professor</label>
                <select value={form.professorId} onChange={e => {
                  const p = professores.find(pr => pr.id === e.target.value);
                  const plano = p ? planos.find(pl => pl.id === p.planoCobranca) || planos.find(pl => pl.id === 'profissional') : null;
                  setForm(f => ({
                    ...f,
                    professorId: e.target.value,
                    descricao: p ? `${plano?.nome || 'Mensalidade'} — ${p.nome}` : '',
                    valor: plano ? String(getPrecoCobrancaProfessor(p, p.planoCobranca || plano.id)) : '',
                  }));
                }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar professor</option>
                  {professores.map(p => {
                    const plano = planos.find(pl => pl.id === p.planoCobranca);
                    return <option key={p.id} value={p.id}>{p.nome}{plano ? ` — ${plano.nome}` : ''}</option>;
                  })}
                </select>
                {/* Info do plano do professor selecionado */}
                {form.professorId && (() => {
                  const p = professores.find(pr => pr.id === form.professorId);
                  const plano = p ? planos.find(pl => pl.id === p.planoCobranca) : null;
                  if (!plano) return null;
                  const color = PLANO_COLOR[plano.id] || '#00d4ff';
                  const precoCobrar = getPrecoCobrancaProfessor(p, plano.id);
                  const tabela = plano.preco;
                  const travado = p && contratoPrecoVigente(p);
                  return (
                    <div className="mt-1.5 px-3 py-2 rounded-xl space-y-1"
                      style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color }}>{plano.nome}</span>
                        <span className="text-xs font-bold text-white">R$ {precoCobrar.toFixed(2)}/mês</span>
                        {travado && precoCobrar !== tabela && (
                          <span className="text-[10px] text-slate-500">(tabela: R$ {tabela.toFixed(2)})</span>
                        )}
                      </div>
                      {travado && p.dataFimContrato && (
                        <p className="text-[10px] text-slate-500">Preço contratado até {new Date(p.dataFimContrato + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Plano Profissional — João" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor (R$)</label>
                  <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {Object.entries({ pendente: 'Pendente', pago: 'Cobrança em dia', vencido: 'Vencido' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vencimento</label>
                  <input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #00d4ff, #0088cc)' }}>
              {saved ? '✓ Salvo!' : editId ? 'Salvar Alterações' : 'Salvar Cobrança'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}