import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { installChunkReloadHandler } from '../../utils/chunkReload';
import './index.css';

const ConcursoBootstrap = lazy(() => import('./ConcursoBootstrap'));

installChunkReloadHandler();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
          Carregando...
        </div>
      }
    >
      <ConcursoBootstrap />
    </Suspense>
  </StrictMode>,
);
