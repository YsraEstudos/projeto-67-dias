import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../services/firebase';

/**
 * Hook customizado que sincroniza dados com Firebase Firestore
 * Mantém a mesma API do useLocalStorage para facilitar a migração
 * 
 * @param key - Chave única para identificar o dado no Firestore
 * @param initialValue - Valor inicial caso não exista no Firestore
 * @returns [valor, setValor] - Tupla similar ao useState
 */
export function useFirebaseStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, { loading: boolean; error: string | null }] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Gerenciar autenticação
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (!user) {
                    // Se não houver usuário, fazer login anônimo
                    const result = await signInAnonymously(auth);
                    setUserId(result.user.uid);
                } else {
                    setUserId(user.uid);
                }
            } catch (err) {
                console.error('Erro na autenticação:', err);
                setError('Erro ao autenticar com Firebase');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Carregar dados iniciais e configurar listener em tempo real
    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        const docRef = doc(db, 'users', userId, 'data', key);

        // Listener em tempo real para sincronização entre dispositivos/abas
        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                try {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setStoredValue(data.value as T);
                    } else {
                        // Se não existe, criar com valor inicial
                        setDoc(docRef, {
                            value: initialValue,
                            updatedAt: new Date().toISOString()
                        }).catch(err => {
                            console.error('Erro ao criar documento inicial:', err);
                            setError('Erro ao criar documento');
                        });
                    }
                    setLoading(false);
                    setError(null);
                } catch (err) {
                    console.error('Erro ao processar snapshot:', err);
                    setError('Erro ao carregar dados');
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Erro no listener do Firestore:', err);
                setError('Erro ao sincronizar dados');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId, key, initialValue]);

    // Função para atualizar valor
    const setValue = useCallback(
        async (value: T | ((val: T) => T)) => {
            if (!userId) {
                console.warn('Tentando salvar sem usuário autenticado');
                return;
            }

            try {
                // Permitir que o valor seja uma função (como no useState)
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                // Atualizar estado local imediatamente para melhor UX
                setStoredValue(valueToStore);

                // Salvar no Firestore
                const docRef = doc(db, 'users', userId, 'data', key);
                await setDoc(docRef, {
                    value: valueToStore,
                    updatedAt: new Date().toISOString()
                });

                setError(null);
            } catch (err) {
                console.error(`Erro ao salvar no Firestore (key: "${key}"):`, err);
                setError('Erro ao salvar dados');

                // Reverter para o valor anterior em caso de erro
                // O listener irá restaurar o valor correto do servidor
            }
        },
        [userId, key, storedValue]
    );

    return [storedValue, setValue, { loading, error }];
}
