import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import {
  AnkiPage,
  ContentPage,
  ContentTopicPage,
  CorrectionsPage,
  CutoffMarksPage,
  DailyPlanPage,
  DashboardPage,
  ProjectsPage,
  SettingsPage,
  SimuladosPage,
} from './app/routeChunks';

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/plano-diario" element={<DailyPlanPage />} />
      <Route path="/conteudo" element={<ContentPage />} />
      <Route path="/conteudo/topico/:topicId" element={<ContentTopicPage />} />
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
