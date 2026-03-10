import { NavLink, Outlet } from 'react-router-dom';
import { END_DATE, NAV_ITEMS, START_DATE } from '../app/constants';
import { useAppContext } from '../app/AppContext';
import { getChecklistProgressPercent } from '../app/progress';
import { ProgressBar } from './ProgressBar';
import { subjectLabel, workActivityLabel } from '../app/formatters';

export const AppShell = () => {
  const { state, dayPlansByDate, setSelectedDate } = useAppContext();
  const record = state.dailyRecords[state.selectedDate];
  const dayPlan = dayPlansByDate[state.selectedDate];
  const dayProgress = record ? getChecklistProgressPercent(record.checklist) : 0;
  const manualSummary = dayPlan?.manualBlocks
    ?.slice(0, 2)
    .map((block) => block.title)
    .join(' | ');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand-title">Plano TRT 4</h1>
          <p className="brand-subtitle">10/03/2026 a 02/11/2026</p>
        </div>

        <nav className="nav-list" aria-label="Navegacao principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.to === '/' ? 'dashboard' : item.to.replace('/', '')}`}
              className={({ isActive }) =>
                isActive ? 'nav-item nav-item-active' : 'nav-item'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footnote">
          <p>Domingo: descanso fixo</p>
          <p>Meta diária: 50 questões</p>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <p className="topbar-label">Dia selecionado</p>
            <input
              className="input"
              type="date"
              min={START_DATE}
              max={END_DATE}
              value={state.selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div className="topbar-plan">
            <p className="topbar-label">Plano do dia</p>
            <p className="topbar-value">
              {dayPlan?.isRestDay
                ? 'Domingo de descanso'
                : dayPlan?.planMode === 'manual'
                  ? `Semana ${dayPlan.weekNumber ?? '-'} | ${manualSummary ?? 'Roteiro manual'}`
                : `${subjectLabel(dayPlan?.subjects[0] ?? 'portugues')} + ${subjectLabel(
                    dayPlan?.subjects[1] ?? 'rlm',
                  )} | ${workActivityLabel(dayPlan?.workActivity ?? 'programacao')}`}
            </p>
          </div>

          <div className="topbar-progress">
            <ProgressBar value={dayProgress} label="Conclusão do dia" compact />
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

