import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail, Lock, User, ArrowRight, Chrome,
  Ghost, ChevronLeft, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface AuthViewProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onGuestLogin: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT';

export const AuthView: React.FC<AuthViewProps> = ({
  onRegister,
  onEmailLogin,
  onGoogleLogin,
  onGuestLogin,
  onResetPassword,
  isLoading,
  error,
  clearError
}) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const clearForm = () => {
    clearError();
    setSuccessMsg(null);
    setLocalError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearForm();
  };

  // Clear errors when changing mode
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [mode, clearError]);

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      await onEmailLogin(email, password);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      await onRegister(name, email, password);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      await onResetPassword(email);
      setSuccessMsg(`Um link de recuperação foi enviado para ${email}.`);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGuestLogin = async () => {
    try {
      await onGuestLogin();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await onGoogleLogin();
    } catch {
      // Error is handled by the hook
    }
  };

  const displayError = localError || error;

  const errorHint = useMemo(() => {
    if (!displayError) return null;
    const normalized = displayError.toLowerCase();
    if (normalized.includes('api')) {
      return 'Confirme se as variáveis VITE_FIREBASE_* estão preenchidas no .env ou nas variáveis do deploy.';
    }
    if (normalized.includes('domínio')) {
      return 'No console do Firebase, adicione o domínio atual na lista de domínios autorizados.';
    }
    if (normalized.includes('não permitida')) {
      return 'Ative o provedor (E-mail/Senha ou Anônimo) em Authentication > Sign-in method.';
    }
    return null;
  }, [displayError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">

        {/* Left Side: Brand / Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=2532&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg mb-6">
              <span className="text-2xl font-bold text-white">67</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Projeto 67 Dias</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Transforme sua rotina, rastreie seus hábitos e alcance seus objetivos com consistência e foco.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800"></div>
                ))}
              </div>
              <span>+1.2k usuários ativos</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
              <p className="text-slate-300 italic text-sm">"A disciplina é a ponte entre metas e realizações."</p>
              <p className="text-slate-500 text-xs mt-2 font-bold uppercase">— Jim Rohn</p>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* Mode Titles */}
          <div className="mb-8">
            {mode === 'LOGIN' && <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>}
            {mode === 'REGISTER' && <h2 className="text-2xl font-bold text-white">Crie sua conta</h2>}
            {mode === 'FORGOT' && <h2 className="text-2xl font-bold text-white">Recuperar senha</h2>}
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'LOGIN' && 'Insira seus dados para acessar.'}
              {mode === 'REGISTER' && 'Comece sua jornada de 67 dias hoje.'}
              {mode === 'FORGOT' && 'Enviaremos instruções para seu e-mail.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {displayError && (
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {displayError}
              </div>
              {errorHint && (
                <p className="text-xs text-red-300/80 leading-relaxed border border-dashed border-red-500/30 rounded-lg p-2">
                  {errorHint}
                </p>
              )}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm animate-in slide-in-from-top-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    id="login-email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                  <button type="button" onClick={() => switchMode('FORGOT')} className="text-xs text-cyan-500 hover:underline">Esqueceu?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    name="password"
                    id="login-password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    name="name"
                    id="register-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                    placeholder="Seu Nome"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    id="register-email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      id="register-password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Confirmar</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirm-password"
                      id="register-confirm-password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Criar Conta'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleForgot} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    id="forgot-email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-cyan-500 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Link de Recuperação'}
              </button>

              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className="w-full py-2 text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ChevronLeft size={16} /> Voltar para Login
              </button>
            </form>
          )}

          {/* SOCIAL / GUEST / SWITCHER */}
          {mode !== 'FORGOT' && (
            <div className="mt-6 animate-in fade-in delay-100">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-600 text-xs font-bold uppercase">Ou continue com</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Chrome size={18} /> Google
                </button>
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Ghost size={18} /> Convidado
                </button>
              </div>

              <div className="mt-8 text-center text-sm">
                {mode === 'LOGIN' ? (
                  <p className="text-slate-400">
                    Não tem uma conta?{' '}
                    <button onClick={() => switchMode('REGISTER')} className="text-cyan-500 hover:text-cyan-400 font-bold hover:underline">
                      Cadastre-se
                    </button>
                  </p>
                ) : (
                  <p className="text-slate-400">
                    Já tem uma conta?{' '}
                    <button onClick={() => switchMode('LOGIN')} className="text-cyan-500 hover:text-cyan-400 font-bold hover:underline">
                      Entrar
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};