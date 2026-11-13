import { api, ApiError } from './api.ts';

/**
 * Push notifications on this device (Web Push). The reminders themselves are
 * decided and sent by the server (server/src/reminders.ts); this only
 * subscribes the browser. On an iPhone it works only once the app has been
 * added to the home screen.
 */

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

export type PushState = 'unsupported' | 'needs-install' | 'off' | 'on' | 'blocked' | 'server-off';

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Registers the service worker: it makes the app installable and receives the pushes. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL });
  } catch (err) {
    console.warn('[push] service worker not registered:', err);
    return null;
  }
}

async function subscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'blocked';
  return (await subscription()) ? 'on' : 'off';
}

function keyBytes(base64url: string): Uint8Array {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Asks for permission and subscribes this browser. Returns the resulting state. */
export async function enablePush(): Promise<PushState> {
  const state = await pushState();
  if (state === 'unsupported' || state === 'needs-install' || state === 'blocked') return state;
  let publicKey: string;
  try {
    ({ publicKey } = await api<{ publicKey: string }>('GET', '/push/key'));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return 'server-off';
    throw err;
  }
  if ((await Notification.requestPermission()) !== 'granted') return 'blocked';
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api('PUT', '/push/subscription', { endpoint: json.endpoint, keys: json.keys });
  return 'on';
}

export async function disablePush(): Promise<void> {
  const sub = await subscription();
  if (!sub) return;
  await api('DELETE', '/push/subscription', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  await api('POST', '/push/test');
}
