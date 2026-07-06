import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import NotificacoesSininho from '../components/fitpro/NotificacoesSininho';
import SuporteProfessor from '../components/fitpro/SuporteProfessor';
import { FitProAppProvider, FitProAuthProvider, useAuth } from '../context/FitProContext';
import Sidebar, { adminNav, professorNav, alunoNav } from './fitpro/Sidebar';
import LoginPage from './fitpro/LoginPage';
import CadastroPage from './fitpro/CadastroPage';
import DashboardAdmin from './fitpro/DashboardAdmin';
import DashboardProfessor from './fitpro/DashboardProfessor';
import DashboardAluno from './fitpro/DashboardAluno';
import AlunosView from './fitpro/AlunosView';
import AvaliacaoFisicaView from './fitpro/AvaliacaoFisicaView';
import TreinosView from './fitpro/TreinosView';
import EspecialistasView from './fitpro/EspecialistasView';
import GerenciarUsuariosView from './fitpro/GerenciarUsuariosView';
import MinhasAvaliacoesView from './fitpro/MinhasAvaliacoesView';
import EvolucaoAlunoView from './fitpro/EvolucaoAlunoView';
import PeriodizacaoView from './fitpro/PeriodizacaoView';
import ProfessoresView from './fitpro/ProfessoresView';
import FinanceiroView from './fitpro/FinanceiroView';
import BibliotecaView from './fitpro/BibliotecaView';
import BibliotecaTreinosView from './fitpro/BibliotecaTreinosView';
import ProdutosView from './fitpro/ProdutosView';
import PedidosView from './fitpro/PedidosView';
import RelatoriosView from './fitpro/RelatoriosView';
import LojaView from './fitpro/LojaView';
import MeusPedidosView from './fitpro/MeusPedidosView';
import ConsultoriaCorridaView from './fitpro/ConsultoriaCorridaView';
import FinanceiroAdminView from './fitpro/FinanceiroAdminView';
import AgendaView from './fitpro/AgendaView';
import TreinoCorridaAlunoView from './fitpro/TreinoCorridaAlunoView';
import PeriodizacaoAlunoView from './fitpro/PeriodizacaoAlunoView';
import ConsultoriaBloqueada from '../components/fitpro/ConsultoriaBloqueada';
import { useApp } from '../context/FitProContext';
import {
  alunoAtivoEfetivo,
  getAlunosDoProfessor,
  alunoPodeAcessarView,
  MSG_ALUNO_INATIVO_BLOQUEADO,
} from '../lib/aluno-status';
import { professorPodeAcessarView, MSG_PROFESSOR_PLANO_BLOQUEADO } from '../lib/planos-professor';

const BG = '#0a0e1a';
const BORDER = 'rgba(255,255,255,0.07)';

function PlaceholderView({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#64748b15' }}>
        <span className="text-3xl">🏗️</span>
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-slate-500 text-sm text-center max-w-xs">Módulo em desenvolvimento.</p>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isAdmin, isProfessor, isAluno } = useAuth();
  const { alunos, professores } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  if (!user) return null;

  const alunoRecord = isAluno ? alunos.find(a => a.id === user.linkedId) : null;
  const professorDoAluno = alunoRecord
    ? professores.find(p => p.id === alunoRecord.professorId)
    : null;
  const alunosDoProf = alunoRecord
    ? getAlunosDoProfessor(alunos, alunoRecord.professorId)
    : [];
  const alunoInativo = isAluno && alunoRecord
    ? !alunoAtivoEfetivo(alunoRecord, professorDoAluno, alunosDoProf)
    : false;

  const meuProfessor = isProfessor ? professores.find(p => p.id === user.linkedId) : null;

  const navItems = isAdmin ? adminNav : isProfessor ? professorNav : alunoNav;
  const roleColor = isAdmin ? '#00d4ff' : isProfessor ? '#34d399' : '#a78bfa';

  const renderView = () => {
    if (isAluno && alunoInativo && !alunoPodeAcessarView(activeView, true)) {
      return (
        <ConsultoriaBloqueada
          message={MSG_ALUNO_INATIVO_BLOQUEADO}
          showSolicitarProfessor
          professorVinculado={professorDoAluno}
          alunoRecord={alunoRecord}
        />
      );
    }
    if (isProfessor && meuProfessor && !professorPodeAcessarView(activeView, meuProfessor)) {
      return <ConsultoriaBloqueada message={MSG_PROFESSOR_PLANO_BLOQUEADO} />;
    }

    if (activeView === 'dashboard') {
      if (isAdmin) return <DashboardAdmin onNav={setActiveView} />;
      if (isProfessor) return <DashboardProfessor onNav={setActiveView} />;
      return <DashboardAluno onNav={setActiveView} />;
    }
    if (activeView === 'alunos') return <AlunosView roleOverride={user.role} />;
    if (activeView === 'avaliacao') return <AvaliacaoFisicaView />;
    if (activeView === 'treinos') return <TreinosView onNav={setActiveView} />;
    if (activeView === 'especialistas' || activeView === 'parceiros' || activeView === 'servicos') return <EspecialistasView />;
    if (activeView === 'usuarios') return <GerenciarUsuariosView />;
    if (activeView === 'avaliacoes') return <MinhasAvaliacoesView />;
    if (activeView === 'evolucao') return <EvolucaoAlunoView />;
    if (activeView === 'periodizacao') return <PeriodizacaoView />;
    if (activeView === 'professores') return <ProfessoresView />;
    if (activeView === 'financeiro') return isAdmin ? <FinanceiroAdminView /> : <FinanceiroView />;
    if (activeView === 'biblioteca') return <BibliotecaView />;
    if (activeView === 'biblioteca-treinos') return <BibliotecaTreinosView />;
    if (activeView === 'shop') return <ProdutosView />;
    if (activeView === 'pedidos') return <PedidosView />;
    if (activeView === 'relatorios') return <RelatoriosView />;
    if (activeView === 'loja') return <LojaView />;
    if (activeView === 'meus-pedidos') return <MeusPedidosView />;
    if (activeView === 'agenda') return <AgendaView />;
    if (activeView === 'consultoria-corrida') return <ConsultoriaCorridaView />;
    if (activeView === 'treino-corrida') return <TreinoCorridaAlunoView />;
    if (activeView === 'periodizacao-aluno') return <PeriodizacaoAlunoView />;
    return <PlaceholderView title={navItems.find(n => n.view === activeView)?.label || activeView} />;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar
        navItems={navItems}
        activeView={activeView}
        onNav={setActiveView}
        sideOpen={sideOpen}
        setSideOpen={setSideOpen}
        alunoInativo={alunoInativo}
        meuProfessor={meuProfessor}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden p-2 rounded-xl hover:bg-white/5">
              <Menu size={18} color="#6b7280" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">{navItems.find(n => n.view === activeView)?.label || 'FitPro'}</h2>

            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProfessor && <SuporteProfessor user={user} />}
            <NotificacoesSininho user={user} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: `${roleColor}25` }}>
              {user.nome?.charAt(0)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden flex items-center justify-around px-2 py-2 flex-shrink-0"
          style={{ background: '#080d1a', borderTop: `1px solid ${BORDER}` }}>
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const active = activeView === item.view;
            const disabled = (isAluno && alunoInativo && !alunoPodeAcessarView(item.view, true))
              || (isProfessor && meuProfessor && !professorPodeAcessarView(item.view, meuProfessor));
            const itemColor = disabled ? '#94a3b8' : active ? item.color : '#9ca3af';
            return (
              <button key={item.view} onClick={() => setActiveView(item.view)}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all"
                style={{
                  color: itemColor,
                  background: disabled ? 'rgba(255,255,255,0.05)' : active ? `${item.color}12` : 'transparent',
                }}>
                <Icon size={18} />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FitProShell() {
  const { user, authReady } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const cadastroParam = urlParams.get('cadastro');
  const profParam = urlParams.get('prof');

  const [showCadastro, setShowCadastro] = useState(!!cadastroParam);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060a14' }}>
        <div className="w-8 h-8 border-2 border-[#00AAFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showCadastro) return (
      <CadastroPage
        onBack={() => setShowCadastro(false)}
        tipoInicial={cadastroParam === 'aluno' ? 'aluno' : undefined}
        professorIdInicial={profParam || ''}
      />
    );
    return <LoginPage onCadastro={() => setShowCadastro(true)} />;
  }

  return <AuthenticatedApp />;
}

export default function FitPro() {
  return (
    <FitProAuthProvider>
      <FitProAppProvider>
        <FitProShell />
      </FitProAppProvider>
    </FitProAuthProvider>
  );
}