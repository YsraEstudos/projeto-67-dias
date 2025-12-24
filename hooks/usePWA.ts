/**
 * usePWA Hook
 * 
 * Manages PWA installation state and provides install prompt functionality.
 * Handles browser compatibility and detects if app is already installed.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface UsePWAReturn {
    /** Whether the app can be installed (browser supports it and not installed) */
    isInstallable: boolean;
    /** Whether the app is running as installed PWA */
    isInstalled: boolean;
    /** Whether the device is currently online */
    isOnline: boolean;
    /** Whether PWA is supported by this browser */
    isSupported: boolean;
    /** Trigger the native install prompt */
    promptInstall: () => Promise<boolean>;
}

export const usePWA = (): UsePWAReturn => {
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    // Check if running in standalone mode (installed PWA)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkInstalled = () => {
            const isStandalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsInstalled(isStandalone);
        };

        checkInstalled();

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleChange = () => checkInstalled();
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Listen for beforeinstallprompt event
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Store the event for later use
            deferredPromptRef.current = e as BeforeInstallPromptEvent;
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            deferredPromptRef.current = null;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Track online/offline status
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        const deferredPrompt = deferredPromptRef.current;

        if (!deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return false;
        }

        try {
            // Show the install prompt
            await deferredPrompt.prompt();

            // Wait for user response
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
                setIsInstallable(false);
                deferredPromptRef.current = null;
                return true;
            } else {
                console.log('[PWA] User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('[PWA] Error during install prompt:', error);
            return false;
        }
    }, []);

    // Check if PWA is supported (Service Worker + beforeinstallprompt)
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

    return {
        isInstallable,
        isInstalled,
        isOnline,
        isSupported,
        promptInstall,
    };
};

export default usePWA;
