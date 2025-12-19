import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsGuest,
    logout as firebaseLogout,
    resetPassword,
    subscribeToAuthChanges,
    FirebaseUser
} from '../services/firebase';
import { flushPendingWrites } from '../stores/firestoreSync';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    loginGoogle: () => Promise<void>;
    loginGuest: () => Promise<void>;
    logout: () => Promise<void>;
    sendResetEmail: (email: string) => Promise<void>;
    clearError: () => void;
}

// Convert Firebase User to App User
const firebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
    return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || undefined,
        isGuest: firebaseUser.isAnonymous
    };
};

// Translate Firebase error codes to Portuguese
const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/user-disabled': 'Esta conta foi desativada.',
        'auth/user-not-found': 'E-mail ou senha incorretos. Caso não tenha uma conta, clique em "Cadastre-se".',
        'auth/wrong-password': 'E-mail ou senha incorretos. Caso não tenha uma conta, clique em "Cadastre-se".',
        'auth/invalid-credential': 'E-mail ou senha incorretos. Caso não tenha uma conta, clique em "Cadastre-se".',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/operation-not-allowed': 'Operação não permitida. Ative este método no console do Firebase.',
        'auth/admin-restricted-operation': 'Este método de login não está habilitado. Ative-o em Firebase Console > Authentication > Sign-in method.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        'auth/popup-closed-by-user': 'Login cancelado.',
        'auth/cancelled-popup-request': 'Login cancelado.',
        'auth/popup-blocked': 'Pop-up bloqueado. Permita pop-ups para fazer login com Google.',
        'auth/invalid-api-key': 'Chave da API inválida. Verifique VITE_FIREBASE_API_KEY.',
        'auth/app-not-authorized': 'Domínio não autorizado no Firebase. Inclua-o em Authentication > Configurações.',
        'auth/project-not-found': 'Projeto Firebase não encontrado. Confira VITE_FIREBASE_PROJECT_ID.',
        'auth/invalid-app-id': 'App ID inválido. Revise VITE_FIREBASE_APP_ID.',
        'auth/invalid-config': 'Configuração Firebase inválida.',
        'auth/argument-error': 'Solicitação inválida. Revise os campos e tente novamente.'
    };

    return errorMessages[errorCode] || 'Ocorreu um erro. Tente novamente.';
};

export function useAuth(): AuthState & AuthActions {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true, // Start loading until we check auth state
        error: null
    });

    // Track if a login operation is in progress to prevent premature state resets
    const loginInProgress = useRef(false);

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        console.log('[useAuth] Setting up auth listener');
        const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
            console.log('[useAuth] Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'null', 'loginInProgress:', loginInProgress.current);
            if (firebaseUser) {
                // CACHE USER ID FOR SYNCHRONOUS HYDRATION
                // This allows persistMiddleware to know the user ID immediately on next reload
                // before Firebase Auth initializes asynchronously.
                localStorage.setItem('p67_last_uid', firebaseUser.uid);

                loginInProgress.current = false;
                setState({
                    user: firebaseUserToAppUser(firebaseUser),
                    loading: false,
                    error: null
                });
            } else {
                // Clear cached ID on logout
                localStorage.removeItem('p67_last_uid');

                // Only set loading to false if we are NOT in the middle of a login
                // This prevents the "flash" of the login screen while waiting for the user object
                if (!loginInProgress.current) {
                    setState({
                        user: null,
                        loading: false,
                        error: null
                    });
                } else {
                    console.log('[useAuth] Ignoring null user because login is in progress');
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        console.log('[useAuth] Starting email login');
        loginInProgress.current = true;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const result = await loginWithEmail(email, password);
            console.log('[useAuth] Email login successful:', result.user?.uid);
            // Auth state listener will update the user
        } catch (error: any) {
            console.error('[useAuth] Email login failed:', error.code, error.message);
            loginInProgress.current = false;
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        loginInProgress.current = true;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await registerWithEmail(email, password, name);
            // Auth state listener will update the user
        } catch (error: any) {
            loginInProgress.current = false;
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const loginGoogle = useCallback(async () => {
        loginInProgress.current = true;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await loginWithGoogle();
            // Auth state listener will update the user
        } catch (error: any) {
            loginInProgress.current = false;
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const loginGuest = useCallback(async () => {
        console.log('[useAuth] Starting guest login');
        loginInProgress.current = true;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const result = await loginAsGuest();
            console.log('[useAuth] Guest login successful:', result.user?.uid);
            // Auth state listener will update the user
        } catch (error: any) {
            console.error('[useAuth] Guest login failed:', error.code, error.message);
            loginInProgress.current = false;
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            // Ensure any debounced Firestore writes are sent before signOut
            flushPendingWrites();
            await firebaseLogout();
            // Auth state listener will update the user
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const sendResetEmail = useCallback(async (email: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await resetPassword(email);
            setState(prev => ({ ...prev, loading: false }));
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: getErrorMessage(error.code)
            }));
            throw error;
        }
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        login,
        register,
        loginGoogle,
        loginGuest,
        logout,
        sendResetEmail,
        clearError
    };
}
