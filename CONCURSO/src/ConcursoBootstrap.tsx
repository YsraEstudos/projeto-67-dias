import { StrictMode } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './app/AppContext';
import { ThemeProvider } from './app/ThemeContext';
import App from './App';

const ConcursoBootstrap = () => (
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
);

export default ConcursoBootstrap;
