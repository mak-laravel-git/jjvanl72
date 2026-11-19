import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getEcho, getEchoGeneration } from '@/echo';
import type { NotificationCreatedPayload } from '@/realtime/types';

type Options = {
    userId?: number | null;
    enabled?: boolean;
    onNotification?: (payload: NotificationCreatedPayload) => void;
    showToast?: boolean;
};

/**
 * Subscribe to private App.Models.User.{id} for custom notification.created events.
 */
export function useNotificationsRealtime({
    userId,
    enabled = true,
    onNotification,
    showToast = true,
}: Options): void {
    const handlerRef = useRef(onNotification);
    const toastRef = useRef(showToast);
    const [generation, setGeneration] = useState(() => getEchoGeneration());

    useEffect(() => {
        handlerRef.current = onNotification;
        toastRef.current = showToast;
    });

    useEffect(() => {
        const onReconnected = () => setGeneration(getEchoGeneration());

        window.addEventListener('echo:reconnected', onReconnected);

        return () => {
            window.removeEventListener('echo:reconnected', onReconnected);
        };
    }, []);

    useEffect(() => {
        if (!enabled || !userId) {
            return;
        }

        const echo = getEcho();

        if (!echo) {
            return;
        }

        const channelName = `App.Models.User.${userId}`;
        const channel = echo.private(channelName);

        const listener = (payload: NotificationCreatedPayload) => {
            if (toastRef.current && payload.title) {
                toast.info(payload.title, {
                    description: payload.body ?? undefined,
                });
            }

            handlerRef.current?.(payload);
        };

        channel.listen('.notification.created', listener);

        return () => {
            try {
                channel.stopListening('.notification.created', listener);
            } catch {
                // Channel may already be gone.
            }

            echo.leave(channelName);
        };
    }, [userId, enabled, generation]);
}
