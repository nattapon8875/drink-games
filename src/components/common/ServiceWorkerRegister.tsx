'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker, which is what makes the site installable:
 * Chrome will not offer "ติดตั้งแอป" without one.
 *
 * It deliberately does nothing in two cases:
 *
 *  - In development. Dev chunks under /_next/static change without their names
 *    changing, so a cache-first worker would happily serve yesterday's build.
 *  - Inside a Discord activity. That runs in an iframe on a proxied origin
 *    where nothing is installable anyway, and a worker there would only sit
 *    between the activity and Discord's proxy.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const inFrame = window.parent !== window;
    const isDiscord =
      inFrame ||
      window.location.hostname.endsWith('.discordsays.com') ||
      new URLSearchParams(window.location.search).has('frame_id');
    if (isDiscord) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] service worker registration failed', err);
      });
    };

    // After load, so fetching the worker never competes with the first paint.
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
