import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
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
          icon={<Trophy size={24} />}
          label="Novo"
          isActive={activePath === '/'}
          onClick={() => navigate('/')}
          prefetchPath="/"
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
