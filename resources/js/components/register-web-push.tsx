import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { resolveWebPushToken } from '@/lib/firebase-messaging';
import { update as updateDeviceToken } from '@/routes/device-token';

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * After login, refresh/store the browser FCM token if permission is granted.
 */
export function RegisterWebPush() {
    const started = useRef(false);

    useEffect(() => {
        if (started.current) {
            return;
        }

        started.current = true;

        void (async () => {
            try {
                const push = await resolveWebPushToken();

                if (!push.ok) {
                    if (import.meta.env.DEV) {
                        console.warn('[firebase]', push.message);
                    }

                    return;
                }

                const response = await fetch(updateDeviceToken.url(), {
                    method: 'PUT',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({ token: push.token }),
                });

                if (!response.ok && import.meta.env.DEV) {
                    toast.warning('Could not refresh device token on server.');
                }
            } catch (error: unknown) {
                if (import.meta.env.DEV) {
                    console.warn('[firebase] web push refresh skipped', error);
                }
            }
        })();
    }, []);

    return null;
}
