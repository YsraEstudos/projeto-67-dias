import { useState, useEffect, useCallback } from 'react';
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
        'auth/user-not-found': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'E-mail ou senha incorretos.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/operation-not-allowed': 'Operação não permitida.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        'auth/popup-closed-by-user': 'Login cancelado.',
        'auth/cancelled-popup-request': 'Login cancelado.',
        'auth/popup-blocked': 'Pop-up bloqueado. Permita pop-ups para fazer login com Google.',
    };
    
    return errorMessages[errorCode] || 'Ocorreu um erro. Tente novamente.';
};

export function useAuth(): AuthState & AuthActions {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true, // Start loading until we check auth state
        error: null
    });

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
            if (firebaseUser) {
                setState({
                    user: firebaseUserToAppUser(firebaseUser),
                    loading: false,
                    error: null
                });
            } else {
                setState({
                    user: null,
                    loading: false,
                    error: null
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await loginWithEmail(email, password);
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

    const register = useCallback(async (name: string, email: string, password: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await registerWithEmail(email, password, name);
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

    const loginGoogle = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await loginWithGoogle();
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

    const loginGuest = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            await loginAsGuest();
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

    const logout = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
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
