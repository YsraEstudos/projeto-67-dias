import React from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { getPendingWriteCount, isFullySynced, subscribeToPendingWrites } from '../../stores/firestoreSync';

/**
 * SyncStatusIndicator - Shows sync status using the new firestoreSync layer
 * 
 * Uses Firestore's native offline persistence. The indicator shows:
 * - synced: All writes complete
 * - syncing: Pending writes in progress
 * - offline: Browser is offline (Firestore queues writes automatically)
 */
export const SyncStatusIndicator: React.FC = () => {
    const [status, setStatus] = React.useState<'synced' | 'syncing' | 'offline'>('synced');

    React.useEffect(() => {
        const checkStatus = () => {
            if (!navigator.onLine) {
                setStatus('offline');
            } else if (!isFullySynced()) {
                setStatus('syncing');
            } else {
                setStatus('synced');
            }
        };

        // Initial check
        checkStatus();

        // Subscribe to pending writes changes (from firestoreSync)
        const unsubscribePending = subscribeToPendingWrites(checkStatus);

        // Subscribe to browser online/offline events
        const handleOnline = () => checkStatus();
        const handleOffline = () => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            unsubscribePending();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const config = {
        synced: { icon: Cloud, color: 'text-emerald-400', label: 'Salvo' },
        syncing: { icon: Loader2, color: 'text-blue-400 animate-spin', label: 'Sincronizando...' },
        offline: { icon: CloudOff, color: 'text-slate-500', label: 'Offline' }
    };

    const { icon: Icon, color, label } = config[status];

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800/50 transition-all hover:bg-slate-800">
            <Icon size={14} className={color} />
            <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">{label}</span>
        </div>
    );
};
