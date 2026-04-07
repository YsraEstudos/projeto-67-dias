import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, Brain, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
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
        />
        <NavButton
          icon={<Calendar size={24} />}
          label="Plano"
          isActive={activePath === '/plano-diario'}
          onClick={() => navigate('/plano-diario')}
        />

        {/* Central FAB - Quick Add / Action */}
        <div className="floating-bottom-nav-fab-wrapper">
          <button
            type="button"
            className="floating-bottom-nav-fab"
            onClick={() => navigate('/conteudo')}
            aria-label="Ação rápida"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <NavButton
          icon={<Brain size={24} />}
          label="Anki"
          isActive={activePath === '/anki'}
          onClick={() => navigate('/anki')}
        />
        <NavButton
          icon={<FileText size={24} />}
          label="Simulados"
          isActive={activePath === '/simulados-redacoes'}
          onClick={() => navigate('/simulados-redacoes')}
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
}

const NavButton = ({ icon, label, isActive, onClick }: NavButtonProps) => {     
  return (
    <button
      type="button"
      onClick={onClick}
      className={`floating-bottom-nav-btn ${isActive ? 'floating-bottom-nav-btn-active' : ''}`}
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
