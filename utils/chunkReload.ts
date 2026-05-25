const RELOAD_FLAG_KEY = 'chunk_reload_attempted';

/**
 * Clears all Service Worker caches and unregisters all SWs, then reloads.
 * This breaks the infinite-reload loop that happens when a stale SW serves
 * old asset filenames that no longer exist on the server after a new deploy.
 */
async function clearCachesAndReload(): Promise<void> {
  try {
    // Unregister all service workers so the next load registers the new SW
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }

    // Delete all cache storage entries (Workbox precache + runtime caches)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch {
    // If clearing fails we still want to reload — worst case the loop
    // continues, which is better than leaving the user with a blank screen.
  }

  window.location.reload();
}

export const installChunkReloadHandler = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleError = (event: ErrorEvent) => {
    const message = event.message ?? '';
    const isChunkLoadError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('Failed to load module script');

    if (!isChunkLoadError) return;

    event.preventDefault();

    // Guard against an infinite reload loop: only attempt once per session.
    const alreadyAttempted = sessionStorage.getItem(RELOAD_FLAG_KEY);
    if (alreadyAttempted) {
      console.warn('Chunk load error persists after cache clear — not reloading again to avoid loop.');
      return;
    }

    sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
    console.warn('Chunk load error detected. Clearing SW caches and reloading...');
    void clearCachesAndReload();
  };

  // Clear the flag on a successful page load so a future fresh session can
  // still trigger one recovery reload if needed.
  window.addEventListener('load', () => {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
  }, { once: true });

  window.addEventListener('error', handleError);
  return () => window.removeEventListener('error', handleError);
};
