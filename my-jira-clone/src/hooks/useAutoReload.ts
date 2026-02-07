import { useEffect } from 'react';
export function useAutoReload(checkInterval: number = 30000) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }
    let checkVersionInterval: NodeJS.Timeout | null = null;
    const CACHE_VERSION_KEY = 'app_cache_version';
    let lastVersion: string | null = null;
    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const currentVersion = data.version || data.buildTime || 'unknown';
          const storedVersion = sessionStorage.getItem(CACHE_VERSION_KEY);
          if (lastVersion === null) {
            lastVersion = storedVersion || currentVersion;
            if (!storedVersion) {
              sessionStorage.setItem(CACHE_VERSION_KEY, currentVersion);
            }
          } else if (lastVersion !== currentVersion || storedVersion !== currentVersion) {
            console.log('New version detected, clearing cache and reloading...');
            sessionStorage.clear();
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            window.location.reload();
          }
        }
      } catch (error) {
        console.debug('Version check failed:', error);
      }
    };
    checkVersion();
    checkVersionInterval = setInterval(checkVersion, checkInterval);
    return () => {
      if (checkVersionInterval) {
        clearInterval(checkVersionInterval);
      }
    };
  }, [checkInterval]);
}