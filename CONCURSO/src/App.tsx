import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CleanConcursoPage } from './app/routeChunks';

const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<CleanConcursoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
