import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, Stethoscope, BookOpen,
  X, Zap, LogOut, Shield, Settings, BarChart2, DollarSign,
  ShoppingBag, ClipboardList, Activity, Dumbbell, Calendar,
  TrendingUp, Heart, ChevronRight, Footprints, CalendarDays, FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/FitProContext';

export const adminNav = [
  { icon: LayoutDashboard, label: 'Dashboard', color: '#00AAFF', view: 'dashboard' },
  { icon: Users, label: 'Alunos', color: '#a78bfa', view: 'alunos' },
  { icon: UserCheck, label: 'Professores', color: '#00E87A', view: 'professores' },
  { icon: Stethoscope, label: 'Especialistas', color: '#00AAFF', view: 'especialistas' },
  { icon: BookOpen, label: 'Biblioteca', color: '#f472b6', view: 'biblioteca' },
  { icon: ShoppingBag, label: 'Produtos', color: '#fb923c', view: 'shop' },
  { icon: ClipboardList, label: 'Pedidos', color: '#f472b6', view: 'pedidos' },
  { icon: BarChart2, label: 'Relatórios', color: '#fbbf24', view: 'relatorios' },
  { icon: DollarSign, label: 'Financeiro', color: '#00E87A', view: 'financeiro' },
  { icon: Settings, label: 'Usuários', color: '#e879f9', view: 'usuarios' },
];

export const professorNav = [
  { icon: LayoutDashboard, label: 'Dashboard', color: '#00AAFF', view: 'dashboard' },
  { icon: Users, label: 'Meus Alunos', color: '#a78bfa', view: 'alunos' },
  { icon: Activity, label: 'Avaliações', color: '#fb923c', view: 'avaliacao' },
  { icon: Dumbbell, label: 'Meus Treinos', color: '#f472b6', view: 'treinos' },
  { icon: Calendar, label: 'Periodização', color: '#fbbf24', view: 'periodizacao' },
  { icon: CalendarDays, label: 'Agenda', color: '#a78bfa', view: 'agenda' },
  { icon: Footprints, label: 'Consultoria de Corrida', color: '#00E87A', view: 'consultoria-corrida' },
  { icon: FolderOpen, label: 'Treinos Personalizados', color: '#a78bfa', view: 'biblioteca-treinos' },
  { icon: Stethoscope, label: 'Parceiros', color: '#00E87A', view: 'parceiros' },
  { icon: ClipboardList, label: 'Meus Pedidos', color: '#00AAFF', view: 'meus-pedidos' },
  { icon: DollarSign, label: 'Financeiro', color: '#00AAFF', view: 'financeiro' },
  { icon: ShoppingBag, label: 'Loja', color: '#fb923c', view: 'loja' },
];

export const alunoNav = [
  { icon: LayoutDashboard, label: 'Dashboard', color: '#00AAFF', view: 'dashboard' },
  { icon: Activity, label: 'Minhas Avaliações', color: '#fb923c', view: 'avaliacoes' },
  { icon: Dumbbell, label: 'Meus Treinos', color: '#f472b6', view: 'treinos' },
  { icon: Footprints, label: 'Treino de Corrida', color: '#00E87A', view: 'treino-corrida' },
  { icon: Calendar, label: 'Periodização', color: '#fbbf24', view: 'periodizacao-aluno' },
  { icon: TrendingUp, label: 'Minha Evolução', color: '#a78bfa', view: 'evolucao' },
  { icon: Stethoscope, label: 'Serviços Parceiros', color: '#00AAFF', view: 'servicos' },
  { icon: ClipboardList, label: 'Meus Pedidos', color: '#00AAFF', view: 'meus-pedidos' },
  { icon: ShoppingBag, label: 'Loja', color: '#fb923c', view: 'loja' },
];

function SidebarContent({ navItems, activeView, onNav, isMobile, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const roleColor = role === 'admin' ? '#00AAFF' : role === 'professor' ? '#00E87A' : '#a78bfa';
  const roleLabel = role === 'admin' ? 'Administrador' : role === 'professor' ? 'Professor' : 'Aluno';
  const RoleIcon = role === 'admin' ? Shield : role === 'professor' ? UserCheck : Users;

  return (
    <div className="flex flex-col h-full" style={{ background: '#080d1a', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Personal Fit Up" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <span className="font-bold text-white text-sm">Personal Fit Up</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}25` }}>{roleLabel}</span>
        </div>
        {isMobile && <button onClick={onClose}><X size={18} color="#6b7280" /></button>}
      </div>

      <div className="p-4 mx-3 mt-3 rounded-xl" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: `${roleColor}25` }}>
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-sm font-semibold text-white truncate max-w-[140px]">{user?.nome}</div>
            <div className="text-xs flex items-center gap-1" style={{ color: roleColor }}><RoleIcon size={10} />{roleLabel}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeView === item.view;
          return (
            <button key={item.view} onClick={() => { onNav(item.view); if (isMobile) onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{ background: active ? `${item.color}15` : 'transparent', color: active ? item.color : '#6b7280', border: `1px solid ${active ? item.color + '25' : 'transparent'}` }}>
              <Icon size={16} />{item.label}{active && <ChevronRight size={12} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 transition-all">
          <LogOut size={16} />Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ navItems, activeView, onNav, sideOpen, setSideOpen }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <SidebarContent navItems={navItems} activeView={activeView} onNav={onNav} isMobile={false} onClose={() => {}} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSideOpen(false)} />
            <motion.div initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden">
              <SidebarContent navItems={navItems} activeView={activeView} onNav={onNav} isMobile={true} onClose={() => setSideOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}