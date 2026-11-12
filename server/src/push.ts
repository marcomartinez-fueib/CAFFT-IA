import webpush from 'web-push';
import type { PushSender } from './reminders.ts';

/**
 * Web Push with VAPID keys (runtime/secrets/vapid.json in the deployment).
 * The push services are the browsers' own (Google, Mozilla, Apple); the
 * message carries only the reminder text, encrypted for the browser.
 */
export function webPushSender(vapid: { publicKey: string; privateKey: string; subject: string }, log: (msg: string, err?: unknown) => void): PushSender {
  return {
    async send(sub, message) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(message),
          { vapidDetails: vapid, TTL: 6 * 60 * 60, urgency: 'normal' },
        );
        return 'ok';
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) return 'gone';
        log('push notification failed', err);
        return 'error';
      }
    },
  };
}
