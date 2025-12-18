import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';

import {
    getStorageKeyForUser,
    readNamespacedStorage,
    writeNamespacedStorage,
    removeNamespacedStorage,
    readLocalMeta,
    writeLocalMeta,
    parseTimestamp
} from '../utils/storageUtils';

export {
    getStorageKeyForUser,
    readNamespacedStorage,
    writeNamespacedStorage,
    removeNamespacedStorage
};

let warnedUseStorage = false;

/**
 * Hook híbrido que usa Firebase Firestore quando online e LocalStorage como fallback
 * Sincroniza automaticamente entre dispositivos quando possível
 * Mantém a mesma API do useLocalStorage para facilitar a migração
 * 
 * IMPORTANTE: Este hook agora aguarda a resolução do estado de autenticação
 * antes de inicializar o valor, evitando race conditions que causavam
 * sobrescrita de dados do usuário com dados de "guest".
 * 
 * @param key - Chave única para identificar o dado
 * @param initialValue - Valor inicial caso não exista em nenhum storage
 * @returns [valor, setValor, isLoading] - Tupla similar ao useState, com flag de loading
 */
export function useStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => Promise<void>, boolean] {
    // Detect whether Firebase services are actually usable (tests/SSR may not provide them)
    if (!warnedUseStorage && process.env.NODE_ENV !== 'test') {
        console.warn('[useStorage] Deprecated. Use Zustand stores + firestoreSync for persistence.');
        warnedUseStorage = true;
    }

    const firebaseSupported = Boolean(
        auth &&
        db &&
        typeof onAuthStateChanged === 'function' &&
        typeof doc === 'function' &&
        typeof setDoc === 'function' &&
        typeof onSnapshot === 'function'
    );

    // FIX INFINITE LOOP: Use Refs for unstable dependencies
    const initialValueRef = useRef(initialValue);

    // Update ref if initialValue changes (optional, but good practice)
    useEffect(() => {
        initialValueRef.current = initialValue;
    }, [initialValue]);

    // Estado para controlar se a autenticação já foi verificada
    const [authChecked, setAuthChecked] = useState(!firebaseSupported);
    const [userId, setUserId] = useState<string | null>(null);
    const [useFirebase, setUseFirebase] = useState(firebaseSupported);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingWriteRef = useRef<{ value: T; updatedAt: number } | null>(null);
    const localUpdatedAtRef = useRef<number>(0);

    // Flag para evitar writes durante a inicialização
    const isInitializingRef = useRef(true);

    // FIX INFINITE LOOP: getLocalStorageValue is now stable or not a dependency
    const getLocalStorageValue = useCallback((targetUserId: string | null): T => {
        try {
            const item = readNamespacedStorage(key, targetUserId);
            const value = item ? JSON.parse(item) : initialValueRef.current;
            localUpdatedAtRef.current = readLocalMeta(key, targetUserId);
            return value;
        } catch (error) {
            console.warn(`Erro ao ler localStorage "${key}":`, error);
            localUpdatedAtRef.current = 0;
            return initialValueRef.current;
        }
    }, [key]); // Removed initialValue from dependency

    // Inicia com initialValue do ref
    const [storedValue, setStoredValue] = useState<T>(initialValueRef.current);

    // Salvar no localStorage
    const saveToLocalStorage = useCallback((value: T, targetUserId: string | null, timestamp?: number) => {
        try {
            const effectiveTimestamp = typeof timestamp === 'number' ? timestamp : Date.now();
            writeNamespacedStorage(key, JSON.stringify(value), targetUserId);
            writeLocalMeta(key, effectiveTimestamp, targetUserId);
            localUpdatedAtRef.current = effectiveTimestamp;
        } catch (error) {
            console.warn(`Erro ao salvar no localStorage "${key}":`, error);
        }
    }, [key]);

    // Gerenciar autenticação - PRIMEIRO useEffect que roda
    useEffect(() => {
        if (!firebaseSupported) {
            setStoredValue(getLocalStorageValue(null));
            setAuthChecked(true);
            isInitializingRef.current = false;
            return () => { };
        }

        const unsubscribe = onAuthStateChanged(auth as Parameters<typeof onAuthStateChanged>[0], (user) => {
            const newUserId = user?.uid ?? null;

            // FIX INFINITE LOOP: Only update state if changed, and decouple logic
            setUserId(newUserId);
            setUseFirebase(!!user);

            // Only force load from local storage immediately if not yet checked
            if (isInitializingRef.current) {
                const localValue = getLocalStorageValue(newUserId);
                setStoredValue(localValue);
                setAuthChecked(true);

                setTimeout(() => {
                    isInitializingRef.current = false;
                }, 100);
            }
        });

        return () => unsubscribe();
    }, [firebaseSupported, key]); // REMOVED getLocalStorageValue and authChecked from dependencies!

    // Quando userId muda APÓS a inicialização, recarregar dados
    useEffect(() => {
        if (!authChecked || isInitializingRef.current) return;

        setStoredValue(getLocalStorageValue(userId));
    }, [userId, getLocalStorageValue, authChecked]);

    // Sincronizar com Firebase quando usuário está autenticado
    useEffect(() => {
        if (!userId || !useFirebase || !firebaseSupported || !authChecked) return;

        const docRef = doc(db, 'users', userId, 'data', key);

        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                try {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const firestoreValue = data.value as T;
                        const remoteUpdatedAt = parseTimestamp(data.updatedAt) || 0;
                        const localUpdatedAt = localUpdatedAtRef.current || 0;

                        if (remoteUpdatedAt <= localUpdatedAt) {
                            if (remoteUpdatedAt < localUpdatedAt && userId) {
                                const localValue = getLocalStorageValue(userId);
                                const localTimestamp = localUpdatedAtRef.current || Date.now();
                                setDoc(docRef, {
                                    value: localValue,
                                    updatedAt: localTimestamp
                                }).catch(err => {
                                    console.error('Erro ao sincronizar dado local mais recente:', err);
                                });
                            }
                            return;
                        }

                        setStoredValue(firestoreValue);
                        saveToLocalStorage(firestoreValue, userId, remoteUpdatedAt);
                    } else {
                        if (!isInitializingRef.current) {
                            const localValue = getLocalStorageValue(userId);
                            const localTimestamp = localUpdatedAtRef.current || Date.now();
                            setDoc(docRef, {
                                value: localValue,
                                updatedAt: localTimestamp
                            }).catch(err => {
                                console.error('Erro ao criar documento inicial:', err);
                            });
                        }
                    }
                } catch (err) {
                    console.error('Erro ao processar snapshot:', err);
                }
            },
            (err) => {
                console.error('Erro no listener do Firestore:', err);
                setUseFirebase(false);
            }
        );

        return () => unsubscribe();
    }, [userId, key, useFirebase, saveToLocalStorage, firebaseSupported, authChecked, getLocalStorageValue]);

    // Helper to flush pending writes immediately (e.g. on unmount)
    const flushWrite = useCallback(() => {
        if (!pendingWriteRef.current || !userId || !useFirebase || !firebaseSupported) return;

        const { value, updatedAt } = pendingWriteRef.current;

        // Clear pending state immediately
        pendingWriteRef.current = null;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const docRef = doc(db, 'users', userId, 'data', key);
        setDoc(docRef, {
            value,
            updatedAt
        }).catch(err => {
            console.error(`Erro ao salvar (flush) no Firestore (key: "${key}"):`, err);
        });
    }, [userId, key, useFirebase, firebaseSupported]);

    // Flush pending writes when the component unmounts or dependencies change
    useEffect(() => {
        return () => {
            flushWrite();
        };
    }, [flushWrite]);

    // Função para atualizar valor
    const setValue = useCallback(
        async (value: T | ((val: T) => T)) => {
            if (isInitializingRef.current) {
                console.warn(`useStorage: Ignorando escrita em "${key}" durante inicialização`);
                return;
            }

            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                const timestamp = Date.now();

                setStoredValue(valueToStore);
                saveToLocalStorage(valueToStore, userId, timestamp);

                if (userId && useFirebase && firebaseSupported) {
                    try {
                        const docRef = doc(db, 'users', userId, 'data', key);

                        if (key === 'p67_project_config') {
                            await setDoc(docRef, {
                                value: valueToStore,
                                updatedAt: timestamp
                            });
                        } else {
                            // Store potentially pending value
                            pendingWriteRef.current = { value: valueToStore, updatedAt: timestamp };

                            if (timeoutRef.current) {
                                clearTimeout(timeoutRef.current);
                            }

                            timeoutRef.current = setTimeout(() => {
                                flushWrite();
                            }, 2000);
                        }
                    } catch (err) {
                        console.error(`Erro ao preparar salvamento no Firestore (key: "${key}"):`, err);
                    }
                }
            } catch (err) {
                console.error(`Erro ao salvar (key: "${key}"):`, err);
            }
        },
        [userId, key, storedValue, useFirebase, saveToLocalStorage, firebaseSupported]
    );

    return [storedValue, setValue, !authChecked];
}
