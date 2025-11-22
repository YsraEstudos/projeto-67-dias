import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';

/**
 * Hook híbrido que usa Firebase Firestore quando online e LocalStorage como fallback
 * Sincroniza automaticamente entre dispositivos quando possível
 * Mantém a mesma API do useLocalStorage para facilitar a migração
 * 
 * @param key - Chave única para identificar o dado
 * @param initialValue - Valor inicial caso não exista em nenhum storage
 * @returns [valor, setValor] - Tupla similar ao useState
 */
export function useStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    // Detect whether Firebase services are actually usable (tests/SSR may not provide them)
    const firebaseSupported = Boolean(
        auth &&
        db &&
        typeof onAuthStateChanged === 'function' &&
        typeof doc === 'function' &&
        typeof setDoc === 'function' &&
        typeof onSnapshot === 'function'
    );

    // Carregar valor inicial do localStorage
    const getLocalStorageValue = (): T => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Erro ao ler localStorage "${key}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(getLocalStorageValue);
    const [userId, setUserId] = useState<string | null>(null);
    const [useFirebase, setUseFirebase] = useState(firebaseSupported);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Salvar no localStorage
    const saveToLocalStorage = useCallback((value: T) => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.warn(`Erro ao salvar no localStorage "${key}":`, error);
        }
    }, [key]);

    // Gerenciar autenticação
    useEffect(() => {
        if (!firebaseSupported) {
            return () => { };
        }

        const unsubscribe = onAuthStateChanged(auth as Parameters<typeof onAuthStateChanged>[0], (user) => {
            if (user) {
                setUserId(user.uid);
                setUseFirebase(true);
            } else {
                setUserId(null);
                setUseFirebase(false);
            }
        });

        return () => unsubscribe();
    }, [firebaseSupported]);

    // Sincronizar com Firebase quando usuário está autenticado
    useEffect(() => {
        if (!userId || !useFirebase || !firebaseSupported) return;

        const docRef = doc(db, 'users', userId, 'data', key);

        // Listener em tempo real
        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                try {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const firestoreValue = data.value as T;

                        // Atualizar estado e localStorage
                        setStoredValue(firestoreValue);
                        saveToLocalStorage(firestoreValue);
                    } else {
                        // Se não existe no Firestore, sincronizar valor do localStorage
                        const localValue = getLocalStorageValue();
                        setDoc(docRef, {
                            value: localValue,
                            updatedAt: new Date().toISOString()
                        }).catch(err => {
                            console.error('Erro ao criar documento inicial:', err);
                        });
                    }
                } catch (err) {
                    console.error('Erro ao processar snapshot:', err);
                }
            },
            (err) => {
                console.error('Erro no listener do Firestore:', err);
                // Em caso de erro, continuar usando localStorage
                setUseFirebase(false);
            }
        );

        return () => unsubscribe();
    }, [userId, key, useFirebase, saveToLocalStorage, firebaseSupported]);

    // Função para atualizar valor
    const setValue = useCallback(
        async (value: T | ((val: T) => T)) => {
            try {
                // Permitir que o valor seja uma função (como no useState)
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Atualizar estado local imediatamente
                setStoredValue(valueToStore);

                // Sempre salvar no localStorage (funciona offline)
                saveToLocalStorage(valueToStore);

                // Se usuário está autenticado, também salvar no Firestore (com debounce)
                if (userId && useFirebase && firebaseSupported) {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }

                    timeoutRef.current = setTimeout(async () => {
                        try {
                            const docRef = doc(db, 'users', userId, 'data', key);
                            await setDoc(docRef, {
                                value: valueToStore,
                                updatedAt: new Date().toISOString()
                            });
                        } catch (err) {
                            console.error(`Erro ao salvar no Firestore (key: "${key}"):`, err);
                            // Não falha se Firebase não funcionar, continua com localStorage
                        }
                    }, 2000); // 2 segundos de debounce para evitar writes excessivos
                }
            } catch (err) {
                console.error(`Erro ao salvar (key: "${key}"):`, err);
            }
        },
        [userId, key, storedValue, useFirebase, saveToLocalStorage]
    );

    return [storedValue, setValue];
}
