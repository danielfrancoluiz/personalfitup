import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, ExternalLink, Shield, RefreshCw, Info, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STRIPE_KEY = 'fitpro_stripe_config';
const WEBHOOK_URL = `${import.meta.env.VITE_APP_URL || 'https://personalfitup.com.br'}/api/stripe-webhook`;

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STRIPE_KEY)) || {}; } catch { return {}; }
}
function saveConfig(cfg) {
  localStorage.setItem(STRIPE_KEY, JSON.stringify(cfg));
}

const ABA_ITEMS = [
  { id: 'credenciais', label: '🔑 Credenciais' },
  { id: 'webhook', label: '🔔 Webhook' },
  { id: 'pagamentos', label: '💳 Pagamentos' },
];

export default function ModalIntegracaoStripe({ onClose }) {
  const [config, setConfig] = useState(loadConfig);
  const [aba, setAba] = useState('credenciais');
  const [form, setForm] = useState({
    publishableKey: config.publishableKey || '',
    secretKey: config.secretKey || '',
    webhookSecret: config.webhookSecret || '',
    ambiente: config.ambiente || 'producao',
    moeda: config.moeda || 'brl',
    parcelasMax: config.parcelasMax || '3',
    metodos: config.metodos || ['card', 'pix', 'boleto'],
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConectado = !!(config.publishableKey && config.secretKey);

  const isPkValid = form.publishableKey.startsWith('pk_live_') || form.publishableKey.startsWith('pk_test_');
  const isSkValid = form.secretKey.startsWith('sk_live_') || form.secretKey.startsWith('sk_test_');
  const isWhSecretValid = !form.webhookSecret || form.webhookSecret.startsWith('whsec_');
  const canSave = isPkValid && isSkValid;

  const handleSave = async () => {
    saveConfig(form);
    setConfig(form);

    const existentes = await base44.entities.ConfiguracaoStripe.list();
    const payload = {
      publishableKey: form.publishableKey,
      secretKey: form.secretKey,
      webhookSecret: form.webhookSecret,
      email: form.publishableKey,
      token: form.secretKey,
      webhookUrl: form.webhookSecret,
      ambiente: form.ambiente,
      metodos: form.metodos,
      parcelasMax: form.parcelasMax,
    };
    if (existentes.length > 0) {
      await base44.entities.ConfiguracaoStripe.update(existentes[0].id, payload);
    } else {
      await base44.entities.ConfiguracaoStripe.create(payload);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const desconectar = async () => {
    if (!confirm('Desconectar a integração com Stripe?')) return;
    localStorage.removeItem(STRIPE_KEY);
    const existentes = await base44.entities.ConfiguracaoStripe.list();
    for (const e of existentes) await base44.entities.ConfiguracaoStripe.delete(e.id);
    setConfig({});
    setForm({ publishableKey: '', secretKey: '', webhookSecret: '', ambiente: 'producao', moeda: 'brl', parcelasMax: '3', metodos: ['card', 'pix', 'boleto'] });
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
              style={{ background: 'linear-gradient(135deg, #635bff20, #00AAFF20)', border: '1px solid rgba(99,91,255,0.4)' }}>
              💳
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Integração Stripe
                {isConectado && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: '#00E87A15', color: '#00E87A', border: '1px solid #00E87A30' }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E87A' }} />
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Stripe Checkout Sessions · API v1</p>
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
                background: aba === id ? '#635bff15' : 'rgba(255,255,255,0.03)',
                color: aba === id ? '#a5b4fc' : '#64748b',
                border: aba === id ? '1px solid #635bff30' : '1px solid rgba(255,255,255,0.06)',
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
              {/* Guia */}
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: '#0a1628', border: '1px solid rgba(99,91,255,0.25)' }}>
                <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5"><Info size={13} />Como obter suas chaves Stripe:</p>
                <p className="text-[11px] text-slate-500">Use <strong className="text-slate-400">Developers → API keys</strong> (não é necessário Stripe Connect).</p>
                <ol className="space-y-2 text-xs text-slate-400 list-none">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                    Acesse <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer"
                      className="underline text-indigo-400 hover:text-indigo-300">dashboard.stripe.com/test/apikeys</a> (modo teste)
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                    Copie a <strong className="text-slate-300">Chave publicável</strong> (<code className="text-indigo-300">pk_test_</code> ou <code className="text-indigo-300">pk_live_</code>)
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
                    Revelar e copiar a <strong className="text-slate-300">Chave secreta</strong> (<code className="text-indigo-300">sk_test_</code> ou <code className="text-indigo-300">sk_live_</code>)
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
                    Cole abaixo, salve e adicione <code className="text-indigo-300">sk_test_...</code> como <code className="text-indigo-300">STRIPE_SECRET_KEY</code> na Vercel
                  </li>
                </ol>
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ color: '#635bff' }}>
                  <ExternalLink size={12} />Acessar painel Stripe →
                </a>
              </div>

              {/* Ambiente */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Ambiente</label>
                <div className="flex gap-2">
                  {[
                    { id: 'producao', label: '🚀 Produção', desc: 'Cobranças reais (pk_live_ / sk_live_)', color: '#00E87A' },
                    { id: 'sandbox', label: '🧪 Teste', desc: 'Sem cobrança real (pk_test_ / sk_test_)', color: '#60a5fa' },
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
                    <AlertCircle size={12} />Modo Teste: use cartão <strong>4242 4242 4242 4242</strong>, qualquer validade futura e CVC.
                  </div>
                )}
              </div>

              {/* Chave Publicável */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Chave Publicável <span className="text-red-400">*</span>
                  <span className="ml-2 text-slate-600">(pk_live_... ou pk_test_...)</span>
                </label>
                <input
                  value={form.publishableKey}
                  onChange={e => setForm(f => ({ ...f, publishableKey: e.target.value.trim() }))}
                  placeholder="pk_live_..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none font-mono"
                  style={{ background: '#1e2a3a', border: `1px solid ${form.publishableKey && !isPkValid ? '#ef4444' : 'rgba(255,255,255,0.08)'}` }} />
                {form.publishableKey && !isPkValid && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />Deve começar com <code>pk_live_</code> ou <code>pk_test_</code>
                  </p>
                )}
                {form.publishableKey && isPkValid && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#00E87A' }}>
                    <CheckCircle2 size={11} />Chave publicável válida ✓
                  </p>
                )}
              </div>

              {/* Chave Secreta */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Chave Secreta <span className="text-red-400">*</span>
                  <span className="ml-2 text-slate-600">(sk_live_... ou sk_test_...)</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={form.secretKey}
                    onChange={e => setForm(f => ({ ...f, secretKey: e.target.value.trim() }))}
                    placeholder="sk_live_..."
                    className="w-full px-3 pr-10 py-2.5 rounded-xl text-sm text-white outline-none font-mono"
                    style={{ background: '#1e2a3a', border: `1px solid ${form.secretKey && !isSkValid ? '#ef4444' : 'rgba(255,255,255,0.08)'}` }} />
                  <button onClick={() => setShowSecret(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.secretKey && !isSkValid && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />Deve começar com <code>sk_live_</code> ou <code>sk_test_</code>
                  </p>
                )}
                {form.secretKey && isSkValid && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#00E87A' }}>
                    <CheckCircle2 size={11} />Chave secreta válida ✓
                  </p>
                )}
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Webhook Signing Secret <span className="text-slate-500">(opcional — para validar eventos)</span>
                  <span className="ml-2 text-slate-600">(whsec_...)</span>
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={form.webhookSecret}
                    onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value.trim() }))}
                    placeholder="whsec_..."
                    className="w-full px-3 pr-10 py-2.5 rounded-xl text-sm text-white outline-none font-mono"
                    style={{ background: '#1e2a3a', border: `1px solid ${form.webhookSecret && !isWhSecretValid ? '#ef4444' : 'rgba(255,255,255,0.08)'}` }} />
                  <button onClick={() => setShowWebhookSecret(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                    {showWebhookSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {form.webhookSecret && !isWhSecretValid && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />Deve começar com <code>whsec_</code>
                  </p>
                )}
              </div>

              {/* Status conectado */}
              {isConectado && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: '#00E87A08', border: '1px solid #00E87A20' }}>
                  <CheckCircle2 size={14} color="#00E87A" />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#00E87A' }}>Integração Stripe ativa</p>
                    <p className="text-xs text-slate-500">{config.ambiente === 'producao' ? '🚀 Produção' : '🧪 Teste'} · Checkout Sessions habilitado</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ABA: WEBHOOK */}
          {aba === 'webhook' && (
            <>
              {/* Passo a passo */}
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: '#0a1628', border: '1px solid rgba(99,91,255,0.25)' }}>
                <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5"><Info size={13} />Como configurar o Webhook no Stripe:</p>
                <ol className="space-y-2 text-xs text-slate-400">
                  {[
                    <>Acesse <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="underline text-indigo-400 hover:text-indigo-300">dashboard.stripe.com/webhooks</a></>,
                    <>Clique em <strong className="text-slate-300">+ Adicionar endpoint</strong> e cole a URL do endpoint abaixo</>,
                    <>Selecione os eventos: <code className="text-indigo-300">payment_intent.succeeded</code>, <code className="text-indigo-300">payment_method.attached</code>, <code className="text-indigo-300">checkout.session.completed</code>, <code className="text-indigo-300">charge.refunded</code></>,
                    <>Copie o <strong className="text-slate-300">Signing secret</strong> (<code className="text-indigo-300">whsec_...</code>) e cole na aba <strong className="text-slate-300">Credenciais</strong></>,
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">{i+1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* URL do endpoint */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">URL do Endpoint (cole no painel Stripe)</label>
                <div className="relative">
                  <input readOnly value={WEBHOOK_URL}
                    className="w-full px-3 pr-24 py-3 rounded-xl text-xs outline-none font-mono cursor-text select-all"
                    style={{ background: '#0a1a12', border: '1px solid rgba(0,232,122,0.3)', color: '#00E87A' }}
                    onClick={e => e.target.select()} />
                  <button onClick={copiarWebhook}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: copied ? '#00E87A20' : '#1e2a3a', color: copied ? '#00E87A' : '#94a3b8' }}>
                    <Copy size={12} />{copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Estrutura do handler — baseada no código oficial Stripe */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Zap size={11} color="#a5b4fc" />Estrutura do handler de webhook (lógica interna)
                </p>
                <div className="rounded-xl overflow-hidden" style={{ background: '#060c18', border: '1px solid rgba(99,91,255,0.2)' }}>
                  {/* verificação de assinatura */}
                  <div className="px-4 py-2 text-[10px] font-mono" style={{ background: '#0a1022', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}>
                    # 1 — Verificação de assinatura (Stripe::Webhook.construct_event)
                  </div>
                  <div className="px-4 py-3 space-y-1 text-[10px] font-mono leading-relaxed">
                    <div><span style={{ color: '#a5b4fc' }}>payload</span> <span className="text-slate-500">= request.body.read</span></div>
                    <div><span style={{ color: '#a5b4fc' }}>signature</span> <span className="text-slate-500">= request.env[</span><span style={{ color: '#00E87A' }}>'HTTP_STRIPE_SIGNATURE'</span><span className="text-slate-500">]</span></div>
                    <div className="mt-1"><span style={{ color: '#a5b4fc' }}>event</span> <span className="text-slate-500">= Stripe::Webhook.construct_event(</span></div>
                    <div className="pl-4 text-slate-500">payload, signature, <span style={{ color: '#00E87A' }}>endpoint_secret</span></div>
                    <div className="text-slate-500">)</div>
                  </div>

                  {/* eventos tratados */}
                  <div className="px-4 py-2 text-[10px] font-mono" style={{ background: '#0a1022', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}>
                    # 2 — Eventos tratados (case event.type)
                  </div>
                  <div className="px-4 py-3 space-y-2 text-[10px] font-mono">
                    {[
                      { event: 'payment_intent.succeeded', obj: 'payment_intent', action: 'Transação → pago', color: '#00E87A' },
                      { event: 'payment_method.attached', obj: 'payment_method', action: 'Método vinculado', color: '#00AAFF' },
                      { event: 'checkout.session.completed', obj: 'session', action: 'Checkout concluído → pago', color: '#00E87A' },
                      { event: 'charge.refunded', obj: 'charge', action: 'Estorno → cancelado', color: '#ef4444' },
                    ].map(({ event, obj, action, color }) => (
                      <div key={event} className="flex items-center gap-2">
                        <span style={{ color: '#a5b4fc' }}>when</span>
                        <span style={{ color: '#fbbf24' }}>'{event}'</span>
                        <span className="text-slate-600 flex-1 text-right">→</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: `${color}18`, color }}>{action}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#a5b4fc' }}>else</span>
                      <span className="text-slate-500 flex-1">puts "Unhandled event: " + event.type</span>
                    </div>
                  </div>

                  {/* resposta */}
                  <div className="px-4 py-2 text-[10px] font-mono" style={{ background: '#0a1022', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}>
                    # 3 — Retorna HTTP 200 para confirmar recebimento
                  </div>
                  <div className="px-4 py-3 text-[10px] font-mono">
                    <span style={{ color: '#a5b4fc' }}>status</span> <span style={{ color: '#fbbf24' }}>200</span>
                  </div>
                </div>
              </div>

              {/* Eventos necessários */}
              <div className="p-3 rounded-xl space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-slate-400">Eventos a selecionar no painel Stripe:</p>
                {[
                  { emoji: '💳', label: 'payment_intent.succeeded', desc: '→ Pago' },
                  { emoji: '🔗', label: 'payment_method.attached', desc: '→ Método vinculado' },
                  { emoji: '✅', label: 'checkout.session.completed', desc: '→ Pago' },
                  { emoji: '🔄', label: 'charge.refunded', desc: '→ Cancelado' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span>{item.emoji}</span>
                    <code className="text-indigo-300 flex-1">{item.label}</code>
                    <span className="text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>

              <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#635bff10', color: '#a5b4fc', border: '1px solid #635bff25' }}>
                <ExternalLink size={12} />Abrir Webhooks no Stripe →
              </a>
            </>
          )}

          {/* ABA: PAGAMENTOS */}
          {aba === 'pagamentos' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Métodos de Pagamento (Checkout Session)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Cartão', emoji: '💳' },
                    { id: 'pix', label: 'PIX', emoji: '🔳' },
                    { id: 'boleto', label: 'Boleto', emoji: '📄' },
                  ].map(({ id, label, emoji }) => {
                    const ativo = form.metodos.includes(id);
                    return (
                      <button key={id} onClick={() => toggleMetodo(id)}
                        className="flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all"
                        style={{
                          background: ativo ? '#635bff12' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${ativo ? '#635bff35' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: ativo ? '#a5b4fc' : '#64748b' }}>{label}</span>
                        {ativo && <CheckCircle2 size={12} color="#a5b4fc" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">PIX e Boleto requerem conta Stripe no Brasil com esses métodos habilitados.</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Moeda padrão</label>
                <select
                  value={form.moeda}
                  onChange={e => setForm(f => ({ ...f, moeda: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="brl">BRL — Real Brasileiro</option>
                  <option value="usd">USD — Dólar Americano</option>
                  <option value="eur">EUR — Euro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Parcelas máximas no cartão</label>
                <select
                  value={form.parcelasMax}
                  onChange={e => setForm(f => ({ ...f, parcelasMax: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {['1','2','3'].map(n => (
                    <option key={n} value={n}>{n === '1' ? 'À vista' : `Até ${n}x`}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-slate-400">Taxas Stripe Brasil (referência)</p>
                {[
                  { label: 'Cartão nacional', taxa: '3,4% + R$ 0,40' },
                  { label: 'Cartão internacional', taxa: '5,4% + R$ 0,40' },
                  { label: 'PIX', taxa: '1,0%' },
                  { label: 'Boleto', taxa: 'R$ 2,50/un.' },
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
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: saved ? 'linear-gradient(135deg, #00E87A, #059669)' : 'linear-gradient(135deg, #635bff, #00AAFF)' }}>
            {saved ? <><CheckCircle2 size={15} />Configuração Salva!</> : <><Shield size={15} />Salvar e Conectar</>}
          </button>
        </div>
      </div>
    </div>
  );
}