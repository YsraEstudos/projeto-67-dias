import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AnkiPage } from './pages/AnkiPage';
import { CorrectionsPage } from './pages/CorrectionsPage';
import { DailyPlanPage } from './pages/DailyPlanPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SimuladosPage } from './pages/SimuladosPage';
import { CutoffMarksPage } from './pages/CutoffMarksPage';

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/plano-diario" element={<DailyPlanPage />} />
      <Route path="/anki" element={<AnkiPage />} />
      <Route path="/correcoes" element={<CorrectionsPage />} />
      <Route path="/simulados-redacoes" element={<SimuladosPage />} />
      <Route path="/projetos" element={<ProjectsPage />} />
      <Route path="/notas-de-corte" element={<CutoffMarksPage />} />
      <Route path="/configuracoes" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;

