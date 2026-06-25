import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, ExternalLink, Shield, RefreshCw, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PAGBANK_KEY = 'fitpro_pagbank_config';
const WEBHOOK_URL = `${import.meta.env.VITE_APP_URL || 'https://personalfitup.com.br'}/api/pagbank-webhook`;

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(PAGBANK_KEY)) || {}; } catch { return {}; }
}
function saveConfig(cfg) {
  localStorage.setItem(PAGBANK_KEY, JSON.stringify(cfg));
}

const ABA_ITEMS = [
  { id: 'credenciais', label: '🔑 Credenciais' },
  { id: 'webhook', label: '🔔 Webhook' },
  { id: 'pagamentos', label: '💳 Pagamentos' },
];

export default function ModalIntegracaoPagBank({ onClose }) {
  const [config, setConfig] = useState(loadConfig);
  const [aba, setAba] = useState('credenciais');
  const [form, setForm] = useState({
    email: config.email || '',
    token: config.token || '',
    ambiente: config.ambiente || 'producao',
    notificarPagamento: config.notificarPagamento ?? true,
    notificarCancelamento: config.notificarCancelamento ?? true,
    metodos: config.metodos || ['pix', 'cartao', 'boleto'],
    parcelasMax: config.parcelasMax || '12',
  });
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopiado, setTokenCopiado] = useState(false);

  const isConectado = !!(config.email && config.token);

  const handleSave = async () => {
    saveConfig(form);
    setConfig(form);

    const existentes = await base44.entities.ConfiguracaoPagBank.list();
    if (existentes.length > 0) {
      await base44.entities.ConfiguracaoPagBank.update(existentes[0].id, form);
    } else {
      await base44.entities.ConfiguracaoPagBank.create(form);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const desconectar = async () => {
    if (!confirm('Desconectar a integração com PagBank?')) return;
    localStorage.removeItem(PAGBANK_KEY);
    const existentes = await base44.entities.ConfiguracaoPagBank.list();
    for (const e of existentes) await base44.entities.ConfiguracaoPagBank.delete(e.id);
    setConfig({});
    setForm({ email: '', token: '', ambiente: 'producao', notificarPagamento: true, notificarCancelamento: true, metodos: ['pix', 'cartao', 'boleto'], parcelasMax: '12' });
  };

  const toggleMetodo = (m) => {
    setForm(f => ({
      ...f,
      metodos: f.metodos.includes(m) ? f.metodos.filter(x => x !== m) : [...f.metodos, m],
    }));
  };

  const copiarWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #00b94a20, #0066cc20)', border: '1px solid rgba(0,185,74,0.3)' }}>
              🏦
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Integração PagBank
                {isConectado && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39930' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">PagSeguro · API REST Oficial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-5 pt-4 flex-shrink-0">
          {ABA_ITEMS.map(({ id, label }) => (
            <button key={id} onClick={() => setAba(id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: aba === id ? '#00b94a15' : 'rgba(255,255,255,0.03)',
                color: aba === id ? '#00b94a' : '#64748b',
                border: aba === id ? '1px solid #00b94a30' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* ABA: CREDENCIAIS */}
          {aba === 'credenciais' && (
            <>
              {/* Guia passo a passo */}
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: '#0a1628', border: '1px solid rgba(96,165,250,0.2)' }}>
                <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5"><Info size={13} />Como obter suas credenciais reais:</p>
                <ol className="space-y-2 text-xs text-slate-400 list-none">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                    Acesse <a href="https://minhaconta.pagseguro.uol.com.br" target="_blank" rel="noreferrer"
                      className="underline text-blue-400 hover:text-blue-300">minhaconta.pagseguro.uol.com.br</a>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                    Vá em <strong className="text-slate-300">Minha Conta → Preferências → Integrações</strong>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
                    Copie o <strong className="text-slate-300">Token de Integração</strong> da seção <em>Produção</em>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
                    Cole o token abaixo junto com o e-mail da conta e salve
                  </li>
                </ol>
                <a href="https://minhaconta.pagseguro.uol.com.br/minha-conta/preferencias/integracoes"
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ color: '#00b94a' }}>
                  <ExternalLink size={12} />Acessar painel PagSeguro →
                </a>
              </div>

              {/* Ambiente */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Ambiente</label>
                <div className="flex gap-2">
                  {[
                    { id: 'producao', label: '🚀 Produção', desc: 'Cobranças reais', color: '#00b94a' },
                    { id: 'sandbox', label: '🧪 Sandbox', desc: 'Apenas testes', color: '#60a5fa' },
                  ].map(env => (
                    <button key={env.id} onClick={() => setForm(f => ({ ...f, ambiente: env.id }))}
                      className="flex-1 py-3 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.ambiente === env.id ? `${env.color}15` : 'rgba(255,255,255,0.03)',
                        color: form.ambiente === env.id ? env.color : '#64748b',
                        border: `1px solid ${form.ambiente === env.id ? `${env.color}40` : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <div>{env.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{env.desc}</div>
                    </button>
                  ))}
                </div>
                {form.ambiente === 'sandbox' && (
                  <div className="mt-2 px-3 py-2 rounded-lg text-xs text-amber-400 flex items-center gap-1.5"
                    style={{ background: '#fbbf2410', border: '1px solid #fbbf2425' }}>
                    <AlertCircle size={12} />Sandbox só aceita cartões de teste PagSeguro, não processa cobranças reais.
                  </div>
                )}
              </div>

              {/* E-mail */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  E-mail da conta PagBank <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="seuemail@pagseguro.com"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              {/* Token */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Token de Integração <span className="text-red-400">*</span>
                  <span className="ml-2 text-slate-600">(Produção — 100 caracteres)</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={form.token}
                    onChange={e => setForm(f => ({ ...f, token: e.target.value.trim() }))}
                    placeholder="Cole o token de produção aqui..."
                    className="w-full px-3 pr-20 py-2.5 rounded-xl text-sm text-white outline-none font-mono"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => setShowToken(v => !v)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                      {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {form.token && (
                      <button onClick={() => { navigator.clipboard.writeText(form.token); setTokenCopiado(true); setTimeout(() => setTokenCopiado(false), 2000); }}
                        className="p-1.5 rounded-lg hover:bg-white/10"
                        style={{ color: tokenCopiado ? '#34d399' : '#64748b' }}>
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {form.token && form.token.length !== 100 && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />Token inválido — deve ter 100 caracteres (atual: {form.token.length})
                  </p>
                )}
                {form.token && form.token.length === 100 && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} />Token com formato válido ✓
                  </p>
                )}
              </div>

              {/* Status conectado */}
              {isConectado && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: '#34d39908', border: '1px solid #34d39920' }}>
                  <CheckCircle2 size={14} color="#34d399" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">Integração ativa</p>
                    <p className="text-xs text-slate-500">{config.email} · {config.ambiente === 'producao' ? '🚀 Produção' : '🧪 Sandbox'}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ABA: WEBHOOK */}
          {aba === 'webhook' && (
            <>
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: '#0a1628', border: '1px solid rgba(96,165,250,0.2)' }}>
                <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5"><Info size={13} />Como configurar o Webhook no PagSeguro:</p>
                <ol className="space-y-2 text-xs text-slate-400">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                    Acesse <strong className="text-slate-300">Minha Conta → Preferências → Notificações</strong>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                    Em <strong className="text-slate-300">URL de Notificação</strong>, cole a URL abaixo
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
                    Clique em <strong className="text-slate-300">Salvar</strong> — o PagSeguro fará um GET para validar (retorna 200 OK automaticamente)
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
                    Selecione os eventos: <strong className="text-slate-300">Transação</strong> e/ou <strong className="text-slate-300">Cobrança</strong>
                  </li>
                </ol>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">URL do Webhook (copie e cole no PagSeguro)</label>
                <div className="relative">
                  <input
                    readOnly
                    value={WEBHOOK_URL}
                    className="w-full px-3 pr-12 py-3 rounded-xl text-xs outline-none font-mono cursor-text select-all"
                    style={{ background: '#0a1a12', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
                    onClick={e => e.target.select()}
                  />
                  <button
                    onClick={copiarWebhook}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: copied ? '#34d39920' : '#1e2a3a', color: copied ? '#34d399' : '#94a3b8' }}>
                    <Copy size={12} />{copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-slate-400">O webhook atualiza automaticamente:</p>
                {[
                  { emoji: '✅', label: 'Pagamento aprovado', desc: 'Status → Pago' },
                  { emoji: '❌', label: 'Pagamento cancelado/estornado', desc: 'Status → Cancelado' },
                  { emoji: '🔄', label: 'Em análise', desc: 'Status → Pendente' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span>{item.emoji}</span>
                    <span className="text-slate-300 flex-1">{item.label}</span>
                    <span className="text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>

              <a href="https://minhaconta.pagseguro.uol.com.br/minha-conta/preferencias/notificacoes"
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#00b94a10', color: '#00b94a', border: '1px solid #00b94a25' }}>
                <ExternalLink size={12} />Abrir Notificações no PagSeguro →
              </a>
            </>
          )}

          {/* ABA: PAGAMENTOS */}
          {aba === 'pagamentos' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Métodos de Pagamento Aceitos</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pix', label: 'PIX', emoji: '🔳' },
                    { id: 'cartao', label: 'Cartão', emoji: '💳' },
                    { id: 'boleto', label: 'Boleto', emoji: '📄' },
                  ].map(({ id, label, emoji }) => {
                    const ativo = form.metodos.includes(id);
                    return (
                      <button key={id} onClick={() => toggleMetodo(id)}
                        className="flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all"
                        style={{
                          background: ativo ? '#00b94a12' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${ativo ? '#00b94a35' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: ativo ? '#00b94a' : '#64748b' }}>{label}</span>
                        {ativo && <CheckCircle2 size={12} color="#00b94a" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Parcelas máximas no cartão</label>
                <select
                  value={form.parcelasMax}
                  onChange={e => setForm(f => ({ ...f, parcelasMax: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {['1','2','3','4','6','9','12'].map(n => (
                    <option key={n} value={n}>{n === '1' ? 'À vista' : `Até ${n}x`}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-slate-400">Taxas PagBank (referência — consulte seu contrato)</p>
                {[
                  { label: 'PIX', taxa: '0,99%' },
                  { label: 'Débito', taxa: '1,99%' },
                  { label: 'Crédito à vista', taxa: '2,99%' },
                  { label: 'Crédito 12x', taxa: '5,49%' },
                  { label: 'Boleto', taxa: 'R$ 1,49/un.' },
                ].map(({ label, taxa }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-white">{taxa}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 flex gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {isConectado && (
            <button onClick={desconectar}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
              <RefreshCw size={12} />Desconectar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!form.email || form.token.length !== 100}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: saved ? 'linear-gradient(135deg, #34d399, #059669)' : 'linear-gradient(135deg, #00b94a, #008f38)' }}>
            {saved ? <><CheckCircle2 size={15} />Configuração Salva!</> : <><Shield size={15} />Salvar e Conectar</>}
          </button>
        </div>
      </div>
    </div>
  );
}