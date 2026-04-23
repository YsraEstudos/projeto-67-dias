import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

const AuthView = lazy(() =>
  import('./components/views/AuthView').then((module) => ({ default: module.AuthView })),
);
const WorkspaceApp = lazy(() => import('./WorkspaceApp'));

const APP_SCHEMA_VERSION = '2026.04.23.1'; // 2026-04-23: Performance warm-up and prefetch refinements
const SCHEMA_VERSION_KEY = 'p67_schema_version';

const ShellLoading = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
    Carregando...
  </div>
);

const App = () => {
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    register,
    loginGoogle,
    loginGuest,
    logout,
    sendResetEmail,
    clearError,
  } = useAuth();

  useEffect(() => {
    const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY);

    if (storedVersion !== APP_SCHEMA_VERSION) {
      console.log(`[App] Schema version mismatch: ${storedVersion} → ${APP_SCHEMA_VERSION}. Clearing Firestore cache...`);

      if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
        indexedDB.databases().then((databases) => {
          const firestoreDbs = databases.filter((db) => db.name?.startsWith('firestore/'));
          firestoreDbs.forEach((db) => {
            if (db.name) {
              console.log(`[App] Deleting IndexedDB: ${db.name}`);
              indexedDB.deleteDatabase(db.name);
            }
          });

          localStorage.setItem(SCHEMA_VERSION_KEY, APP_SCHEMA_VERSION);
          if (firestoreDbs.length > 0) {
            console.log('[App] Reloading to apply fresh data...');
            window.location.reload();
          }
        }).catch((error) => {
          console.warn('[App] Could not enumerate IndexedDB databases:', error);
          localStorage.setItem(SCHEMA_VERSION_KEY, APP_SCHEMA_VERSION);
        });
      } else {
        localStorage.setItem(SCHEMA_VERSION_KEY, APP_SCHEMA_VERSION);
      }
    }
  }, []);

  if (authLoading && !user) {
    return <ShellLoading />;
  }

  if (!user) {
    return (
      <Suspense fallback={<ShellLoading />}>
        <AuthView
          onEmailLogin={login}
          onRegister={register}
          onGoogleLogin={loginGoogle}
          onGuestLogin={loginGuest}
          onResetPassword={sendResetEmail}
          isLoading={authLoading}
          error={authError}
          clearError={clearError}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ShellLoading />}>
      <WorkspaceApp user={user} onLogout={logout} />
    </Suspense>
  );
};

export default App;
