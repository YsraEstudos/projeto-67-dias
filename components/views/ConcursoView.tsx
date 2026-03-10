import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useUIStore } from '../../stores';
import { ViewState } from '../../types';
import { AppProvider as ConcursoAppProvider } from '../../CONCURSO/src/app/AppContext';
import { DashboardPage } from '../../CONCURSO/src/pages/DashboardPage';
import { DailyPlanPage } from '../../CONCURSO/src/pages/DailyPlanPage';
import { AnkiPage } from '../../CONCURSO/src/pages/AnkiPage';
import { CorrectionsPage } from '../../CONCURSO/src/pages/CorrectionsPage';
import { SimuladosPage } from '../../CONCURSO/src/pages/SimuladosPage';
import { ProjectsPage } from '../../CONCURSO/src/pages/ProjectsPage';
import { CutoffMarksPage } from '../../CONCURSO/src/pages/CutoffMarksPage';
import { SettingsPage } from '../../CONCURSO/src/pages/SettingsPage';

type ConcursoSection =
  | 'dashboard'
  | 'plano-diario'
  | 'anki'
  | 'correcoes'
  | 'simulados-redacoes'
  | 'projetos'
  | 'notas-de-corte'
  | 'configuracoes'
  | 'conteudo';

const ConcursoView: React.FC = () => {
  const setActiveView = useUIStore((state) => state.setActiveView);
  const [activeSection, setActiveSection] = useState<ConcursoSection>('dashboard');

  const sections = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard' },
      { id: 'plano-diario' as const, label: 'Plano Diário' },
      { id: 'anki' as const, label: 'Anki' },
      { id: 'correcoes' as const, label: 'Correções' },
      { id: 'simulados-redacoes' as const, label: 'Simulados/Redações' },
      { id: 'projetos' as const, label: 'Projetos' },
      { id: 'notas-de-corte' as const, label: 'Notas de Corte' },
      { id: 'conteudo' as const, label: 'Conteúdo' },
      { id: 'configuracoes' as const, label: 'Configurações' },
    ],
    []
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardPage />;
      case 'plano-diario': return <DailyPlanPage />;
      case 'anki': return <AnkiPage />;
      case 'correcoes': return <CorrectionsPage />;
      case 'simulados-redacoes': return <SimuladosPage />;
      case 'projetos': return <ProjectsPage />;
      case 'notas-de-corte': return <CutoffMarksPage />;
      case 'conteudo':
        return (
          <section className="page">
            <header className="page-header">
              <h2>Conteúdo Pragmático</h2>
              <p>
                O módulo de conteúdo detalhado depende de rotas internas (`/conteudo/topico/:topicId`).
                Nesta versão embutida, as funcionalidades principais já estão acessíveis pelas demais abas.
              </p>
            </header>
          </section>
        );
      case 'configuracoes': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <ConcursoAppProvider>
      <div className="space-y-4 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView(ViewState.DASHBOARD)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <ArrowLeft size={16} />
            Voltar para o painel
          </button>

          <p className="text-xs text-slate-400">Sistema completo do Concurso disponível nesta tela.</p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-lg px-3 py-2 text-xs sm:text-sm transition ${activeSection === section.id
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200'
                : 'bg-slate-950/70 border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 min-h-[72vh] overflow-auto">
          {renderSection()}
        </div>
      </div>
    </ConcursoAppProvider>
  );
};

export default ConcursoView;
