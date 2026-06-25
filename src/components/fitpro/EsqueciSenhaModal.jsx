import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EsqueciSenhaModal({ onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'nova_senha' | 'sucesso'
  const [email, setEmail] = useState('');
  const [credencial, setCredencial] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleBuscarEmail = async (e) => {
    e.preventDefault();
    setErro('');
    if (!email.trim()) return;
    setLoading(true);
    const creds = await base44.entities.Credencial.filter({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (!creds || creds.length === 0) {
      setErro('Nenhuma conta encontrada com este email.');
      return;
    }
    setCredencial(creds[0]);
    setStep('nova_senha');
  };

  const handleRedefinir = async (e) => {
    e.preventDefault();
    setErro('');
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setLoading(true);
    await base44.entities.Credencial.update(credencial.id, { password: novaSenha });
    setLoading(false);
    setStep('sucesso');
  };

  const ROLE_LABEL = { admin: 'Administrador', professor: 'Professor', aluno: 'Aluno' };
  const ROLE_COLOR = { admin: '#00d4ff', professor: '#34d399', aluno: '#a78bfa' };
  const roleColor = credencial ? (ROLE_COLOR[credencial.role] || '#a78bfa') : '#a78bfa';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <KeyRound size={17} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Recuperar Senha</h3>
              <p className="text-xs text-slate-500">
                {step === 'email' && 'Informe seu email cadastrado'}
                {step === 'nova_senha' && 'Defina uma nova senha'}
                {step === 'sucesso' && 'Senha redefinida com sucesso!'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        <div className="p-6">
          {/* STEP 1 — Email */}
          {step === 'email' && (
            <form onSubmit={handleBuscarEmail} className="space-y-4">
              <div className="p-4 rounded-2xl text-center" style={{ background: '#a78bfa0a', border: '1px solid #a78bfa20' }}>
                <Mail size={32} color="#a78bfa" className="mx-auto mb-2 opacity-70" />
                <p className="text-sm text-slate-300">Digite o email associado à sua conta para redefinir a senha.</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErro(''); }}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
              {erro && (
                <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 rounded-xl"
                  style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                  <AlertCircle size={13} />{erro}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff' }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Mail size={15} />Verificar Email</>}
              </button>
            </form>
          )}

          {/* STEP 2 — Nova Senha */}
          {step === 'nova_senha' && credencial && (
            <form onSubmit={handleRedefinir} className="space-y-4">
              {/* Badge do usuário encontrado */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${roleColor}10`, border: `1px solid ${roleColor}30` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
                  style={{ background: `${roleColor}20`, color: roleColor }}>
                  {credencial.nome?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{credencial.nome}</p>
                  <p className="text-xs text-slate-400">{credencial.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${roleColor}20`, color: roleColor }}>
                  {ROLE_LABEL[credencial.role] || credencial.role}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNova ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => { setNovaSenha(e.target.value); setErro(''); }}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoFocus
                    className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button type="button" onClick={() => setShowNova(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showNova ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showConfirmar ? 'text' : 'password'}
                    value={confirmar}
                    onChange={e => { setConfirmar(e.target.value); setErro(''); }}
                    placeholder="Repita a senha"
                    required
                    className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button type="button" onClick={() => setShowConfirmar(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Indicador de força */}
              {novaSenha.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          background: novaSenha.length >= n * 2
                            ? (novaSenha.length >= 8 ? '#34d399' : novaSenha.length >= 6 ? '#fbbf24' : '#fb923c')
                            : 'rgba(255,255,255,0.08)'
                        }} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {novaSenha.length < 6 ? 'Senha muito curta' : novaSenha.length < 8 ? 'Senha fraca' : novaSenha.length < 10 ? 'Senha boa' : 'Senha forte'}
                  </p>
                </div>
              )}

              {erro && (
                <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 rounded-xl"
                  style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                  <AlertCircle size={13} />{erro}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => { setStep('email'); setErro(''); setNovaSenha(''); setConfirmar(''); }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ArrowLeft size={14} />Voltar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff' }}>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><KeyRound size={15} />Redefinir Senha</>}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — Sucesso */}
          {step === 'sucesso' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#34d39920' }}>
                <CheckCircle2 size={32} color="#34d399" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Senha Redefinida!</h4>
                <p className="text-sm text-slate-400">Sua senha foi atualizada com sucesso. Faça login com a nova senha.</p>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}>
                Ir para o Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}