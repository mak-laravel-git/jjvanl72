import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
    getMessaging,
    getToken,
    isSupported,
    type Messaging,
} from 'firebase/messaging';

export type WebPushFailureReason =
    | 'unsupported'
    | 'not_configured'
    | 'permission_denied'
    | 'token_failed';

export type WebPushTokenResult =
    | { ok: true; token: string }
    | { ok: false; reason: WebPushFailureReason; message: string };

function firebaseWebConfig() {
    return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
            | string
            | undefined,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as
            | string
            | undefined,
        messagingSenderId: import.meta.env
            .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
        appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    };
}

export function missingFirebaseWebEnvKeys(): string[] {
    const config = firebaseWebConfig();
    const missing: string[] = [];

    if (!config.apiKey) {
        missing.push('VITE_FIREBASE_API_KEY');
    }

    if (!config.projectId) {
        missing.push('VITE_FIREBASE_PROJECT_ID');
    }

    if (!config.messagingSenderId) {
        missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
    }

    if (!config.appId) {
        missing.push('VITE_FIREBASE_APP_ID');
    }

    if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
        missing.push('VITE_FIREBASE_VAPID_KEY');
    }

    return missing;
}

export function isFirebaseWebConfigured(): boolean {
    return missingFirebaseWebEnvKeys().length === 0;
}

function getFirebaseApp(): FirebaseApp | null {
    if (!isFirebaseWebConfigured()) {
        return null;
    }

    const existing = getApps()[0];

    if (existing) {
        return existing;
    }

    return initializeApp(firebaseWebConfig());
}

async function getFirebaseMessaging(): Promise<Messaging | null> {
    if (!(await isSupported())) {
        return null;
    }

    const app = getFirebaseApp();

    if (!app) {
        return null;
    }

    return getMessaging(app);
}

/**
 * Request notification permission and return an FCM web push token result.
 */
export async function resolveWebPushToken(): Promise<WebPushTokenResult> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return {
            ok: false,
            reason: 'unsupported',
            message:
                'This browser does not support web push (service workers required).',
        };
    }

    const missing = missingFirebaseWebEnvKeys();

    if (missing.length > 0) {
        const message = `Firebase web config incomplete. Set ${missing.join(', ')} in .env and restart Vite (npm run dev).`;

        console.error('[firebase]', message);

        return {
            ok: false,
            reason: 'not_configured',
            message,
        };
    }

    try {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;
        const messaging = await getFirebaseMessaging();

        if (!messaging) {
            return {
                ok: false,
                reason: 'unsupported',
                message: 'Firebase messaging is not supported in this browser.',
            };
        }

        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return {
                ok: false,
                reason: 'permission_denied',
                message:
                    'Notification permission was blocked. Allow notifications to save a device token.',
            };
        }

        const registration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
        );

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            return {
                ok: false,
                reason: 'token_failed',
                message: 'Firebase did not return a web push token.',
            };
        }

        return { ok: true, token };
    } catch (error: unknown) {
        const detail =
            error instanceof Error ? error.message : 'Unknown Firebase error';

        console.error('[firebase] getToken failed', error);

        return {
            ok: false,
            reason: 'token_failed',
            message: `Failed to get FCM token: ${detail}`,
        };
    }
}

/**
 * @deprecated Prefer resolveWebPushToken() for error details.
 */
export async function getWebPushToken(): Promise<string | null> {
    const result = await resolveWebPushToken();

    return result.ok ? result.token : null;
}
