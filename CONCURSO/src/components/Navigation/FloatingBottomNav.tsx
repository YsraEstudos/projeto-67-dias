import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, Brain, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { prefetchConcursoRoutePath } from '../../app/routeChunks';
import { resolveActiveNavPath } from '../../app/mobileNavigation';
import '../../styles/layout.css';

export const FloatingBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = resolveActiveNavPath(location.pathname);

  return (
    <nav className="floating-bottom-nav-container" aria-label="Navegação Principal Mobile">
      <div className="floating-bottom-nav-glass">
        <NavButton
          icon={<Home size={24} />}
          label="Home"
          isActive={activePath === '/'}
          onClick={() => navigate('/')}
          prefetchPath="/"
        />
        <NavButton
          icon={<Calendar size={24} />}
          label="Plano"
          isActive={activePath === '/plano-diario'}
          onClick={() => navigate('/plano-diario')}
          prefetchPath="/plano-diario"
        />

        {/* Central FAB - Quick Add / Action */}
        <div className="floating-bottom-nav-fab-wrapper">
          <button
            type="button"
            className="floating-bottom-nav-fab"
            onClick={() => navigate('/conteudo')}
            aria-label="Ação rápida"
            onMouseEnter={() => {
              void prefetchConcursoRoutePath('/conteudo');
            }}
            onFocus={() => {
              void prefetchConcursoRoutePath('/conteudo');
            }}
            onPointerDown={() => {
              void prefetchConcursoRoutePath('/conteudo');
            }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <NavButton
          icon={<Brain size={24} />}
          label="Anki"
          isActive={activePath === '/anki'}
          onClick={() => navigate('/anki')}
          prefetchPath="/anki"
        />
        <NavButton
          icon={<FileText size={24} />}
          label="Simulados"
          isActive={activePath === '/simulados-redacoes'}
          onClick={() => navigate('/simulados-redacoes')}
          prefetchPath="/simulados-redacoes"
        />
      </div>
    </nav>
  );
};

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  prefetchPath: string;
}

const NavButton = ({ icon, label, isActive, onClick, prefetchPath }: NavButtonProps) => {
  const warmRoute = () => {
    void prefetchConcursoRoutePath(prefetchPath);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`floating-bottom-nav-btn ${isActive ? 'floating-bottom-nav-btn-active' : ''}`}
      onMouseEnter={warmRoute}
      onFocus={warmRoute}
      onPointerDown={warmRoute}
    >
      <div className="floating-bottom-nav-btn-icon">
        {icon}
      </div>
      <span className="floating-bottom-nav-btn-label">
        {label}
      </span>
    </button>
  );
};
