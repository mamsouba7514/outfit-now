// ─── Expo Push Notifications ──────────────────────────────────────────────────
// Uses Expo's push API — no APNs/FCM keys needed during development.
// In production, add EXPO_ACCESS_TOKEN to env for higher rate limits.

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

interface ExpoPushMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
  badge?: number | undefined;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to one or more Expo push tokens.
 * Silently ignores failures — notifications are best-effort.
 */
export async function sendPushNotification(
  tokens: string | string[],
  payload: PushPayload,
): Promise<void> {
  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const valid = tokenList.filter((t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));
  if (valid.length === 0) return;

  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    sound: payload.sound ?? 'default',
    title: payload.title,
    body: payload.body,
    ...(payload.data !== undefined && { data: payload.data }),
    ...(payload.badge !== undefined && { badge: payload.badge }),
  }));

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    // Optional: EXPO_ACCESS_TOKEN for production rate limit upgrade
    const token = process.env.EXPO_ACCESS_TOKEN;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    if (!res.ok) return;

    const result = await res.json() as { data: ExpoPushTicket[] };
    // Log errors but don't throw — notifications are non-critical
    for (const ticket of result.data ?? []) {
      if (ticket.status === 'error') {
        console.warn('[Push] ticket error:', ticket.message, ticket.details);
      }
    }
  } catch (err) {
    // Network failure or parse error — ignore silently
    console.warn('[Push] send failed:', err);
  }
}
