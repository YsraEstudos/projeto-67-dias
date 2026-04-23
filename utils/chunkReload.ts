export const installChunkReloadHandler = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleError = (event: ErrorEvent) => {
    const message = event.message ?? '';
    const isChunkLoadError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed');

    if (isChunkLoadError) {
      event.preventDefault();
      console.warn('Chunk load error detected, forcing reload...');
      window.location.reload();
    }
  };

  window.addEventListener('error', handleError);
  return () => window.removeEventListener('error', handleError);
};
