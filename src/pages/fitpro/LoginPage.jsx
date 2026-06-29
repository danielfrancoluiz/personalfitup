import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, LogIn, Shield, UserCheck, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/FitProContext';
import EsqueciSenhaModal from '../../components/fitpro/EsqueciSenhaModal';

const demoAccounts = [
  { role: 'Admin', email: 'admin@fitpro.com', password: 'admin123', icon: Shield, color: '#00d4ff', desc: 'Acesso total' },
  { role: 'Professor', email: 'professor@fitpro.com', password: 'prof123', icon: UserCheck, color: '#34d399', desc: 'Gestão de alunos' },
  { role: 'Aluno', email: 'aluno@fitpro.com', password: 'aluno123', icon: Users, color: '#a78bfa', desc: 'Minha área' },
];

export default function LoginPage({ onCadastro }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEsqueci, setShowEsqueci] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    if (!ok) setError('Email ou senha incorretos. Verifique suas credenciais.');
    setLoading(false);
  };

  const fillDemo = (acc) => { setEmail(acc.email); setPassword(acc.password); setError(''); };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0e1a' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1525 0%, #0a1628 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
          <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        </div>
        <div className="flex justify-center">
          <img src="/logo.jpeg" alt="Personal Fit Up" className="w-72 object-contain" />
        </div>
        <div>

          <p className="text-slate-400 mb-8">A plataforma definitiva para centralizar seus treinos, avaliações e periodizações — tudo em uma interface limpa, minimalista, desenvolvida de personal para personal.</p>
          <div className="space-y-3">
            {[
              { icon: '📊', text: 'Avaliação por dobras cutâneas (Jackson & Pollock)' },
              { icon: '💪', text: 'Planilhas de treino animadas e personalizadas' },
              { icon: '📅', text: 'Periodização com linha do tempo de evolução' },
              { icon: '🏥', text: 'Rede de especialistas de saúde parceiros' },
              { icon: '📈', text: 'Dashboard de performance e evolução corporal' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">Personal Fit Up © 2025</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.jpeg" alt="Personal Fit Up" className="w-56 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h2>
          <p className="text-slate-400 text-sm mb-6">Faça login para acessar sua área</p>

          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map(acc => (
                <button key={acc.role} onClick={() => fillDemo(acc)}
                  className="p-3 rounded-xl text-center transition-all hover:scale-105 cursor-pointer"
                  style={{ background: `${acc.color}10`, border: `1px solid ${acc.color}25` }}>
                  <acc.icon size={16} color={acc.color} className="mx-auto mb-1" />
                  <div className="text-xs font-semibold text-white">{acc.role}</div>
                  <div className="text-xs" style={{ color: acc.color }}>{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && <div className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{error}</div>}
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowEsqueci(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Esqueci minha senha
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0099cc)', color: '#fff' }}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={16} />Entrar na Plataforma</>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <button onClick={onCadastro}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa' }}>
              Criar nova conta
            </button>
            <p className="text-xs text-slate-500 mt-2">Aluno ou Professor? Cadastre-se gratuitamente.</p>
          </div>


        </div>
      </div>
      {showEsqueci && <EsqueciSenhaModal onClose={() => setShowEsqueci(false)} />}
    </div>
  );
}