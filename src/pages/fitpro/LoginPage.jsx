import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, LogIn, Shield, UserCheck, Users, AlertCircle,
  BarChart3, Dumbbell, CalendarRange, Stethoscope, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/FitProContext';
import EsqueciSenhaModal from '../../components/fitpro/EsqueciSenhaModal';
import BrandLogo from '../../components/fitpro/BrandLogo';

const demoAccounts = [
  { role: 'Admin', email: 'admin@fitpro.com', password: 'admin123', icon: Shield, color: '#00AAFF', desc: 'Acesso total' },
  { role: 'Professor', email: 'professor@fitpro.com', password: 'prof123', icon: UserCheck, color: '#00E87A', desc: 'Gestão de alunos' },
  { role: 'Aluno', email: 'aluno@fitpro.com', password: 'aluno123', icon: Users, color: '#a78bfa', desc: 'Minha área' },
];

const features = [
  { icon: BarChart3, color: '#00AAFF', text: 'Avaliação por dobras cutâneas (Jackson & Pollock)' },
  { icon: Dumbbell, color: '#00E87A', text: 'Planilhas de treino animadas e personalizadas' },
  { icon: CalendarRange, color: '#fbbf24', text: 'Periodização com linha do tempo de evolução' },
  { icon: Stethoscope, color: '#f472b6', text: 'Rede de especialistas de saúde parceiros' },
  { icon: TrendingUp, color: '#a78bfa', text: 'Dashboard de performance e evolução corporal' },
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
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#060a14' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[70%] h-[70%] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(0,170,255,0.12) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(0,232,122,0.1) 0%, transparent 60%)' }}
        />
      </div>

      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex w-[46%] xl:w-[48%] relative flex-col justify-center px-12 xl:px-16 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <BrandLogo size="hero" className="mb-10" />

          <p className="text-slate-300 text-lg leading-relaxed mb-10">
            A plataforma definitiva para centralizar treinos, avaliações e periodizações — interface limpa, feita de personal para personal.
          </p>

          <div className="space-y-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.text}
                  className="flex items-center gap-4 p-3.5 rounded-2xl transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
                  >
                    <Icon size={18} color={item.color} />
                  </div>
                  <span className="text-sm text-slate-300 leading-snug">{item.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <p className="absolute bottom-8 left-12 xl:left-16 text-xs text-slate-600">
          Personal Fit Up © 2025
        </p>
      </div>

      {/* Painel direito — login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md p-7 sm:p-8 rounded-3xl"
          style={{
            background: 'rgba(10,14,26,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="lg:hidden flex justify-center mb-8">
            <BrandLogo size="medium" />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-sm">Faça login para acessar sua área</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Acesso rápido</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="p-3 rounded-xl text-center transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ background: `${acc.color}10`, border: `1px solid ${acc.color}28` }}
                >
                  <acc.icon size={16} color={acc.color} className="mx-auto mb-1" />
                  <div className="text-xs font-semibold text-white">{acc.role}</div>
                  <div className="text-[10px] leading-tight mt-0.5" style={{ color: acc.color }}>{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-colors focus:border-[#00AAFF50]"
                  style={{ background: '#121a2b', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white outline-none transition-colors focus:border-[#00AAFF50]"
                  style={{ background: '#121a2b', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 flex items-center gap-1.5 p-3 rounded-xl" style={{ background: '#ef444412', border: '1px solid #ef444430' }}>
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowEsqueci(true)}
                className="text-xs text-slate-500 hover:text-[#00AAFF] transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #00AAFF, #0088cc)', color: '#fff', boxShadow: '0 8px 24px rgba(0,170,255,0.25)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar na Plataforma
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <button
              type="button"
              onClick={onCadastro}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm hover:bg-white/[0.03]"
              style={{ background: 'transparent', border: '1px solid rgba(0,232,122,0.35)', color: '#00E87A' }}
            >
              Criar nova conta
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Aluno ou Professor? Cadastre-se gratuitamente.
            </p>
          </div>
        </motion.div>
      </div>

      {showEsqueci && <EsqueciSenhaModal onClose={() => setShowEsqueci(false)} />}
    </div>
  );
}
