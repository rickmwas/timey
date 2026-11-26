"use client";

// Utility to convert Base64 URL string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[PushClient] Error checking push subscription:', err);
    return null;
  }
}

export async function subscribeToWebPush(customVapidKey?: string): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Push notifications are not supported on this browser.' };
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied by the user.' };
    }

    // 2. Fetch or use VAPID Public Key
    const vapidKey = customVapidKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      return { success: false, error: 'VAPID public key is not configured.' };
    }

    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // 3. Subscribe with PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    // 4. Send subscription JSON to backend (both root & nested for maximum compatibility)
    const subJson = subscription.toJSON();
    const res = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
        subscription: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to persist push subscription to server.' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[PushClient] Subscription error:', err);
    const message = err instanceof Error ? err.message : 'Unknown push subscription failure.';
    return { success: false, error: message };
  }
}

export async function unsubscribeFromWebPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) return { success: false, error: 'Unsupported' };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch('/api/v1/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(err => console.warn('[PushClient] Server unsubscribe failed:', err));
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('[PushClient] Unsubscribe error:', err);
    const message = err instanceof Error ? err.message : 'Unsubscribe failed.';
    return { success: false, error: message };
  }
}
