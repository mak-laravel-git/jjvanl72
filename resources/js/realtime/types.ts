export type ConnectionStatus =
    | 'disabled'
    | 'idle'
    | 'connecting'
    | 'connected'
    | 'unavailable'
    | 'disconnected'
    | 'failed';

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
    disabled: 'Disabled',
    idle: 'Idle',
    connecting: 'Connecting…',
    connected: 'Connected',
    unavailable: 'Unavailable',
    disconnected: 'Disconnected',
    failed: 'Failed',
};

export type NotificationCreatedPayload = {
    id: number;
    title: string | null;
    body: string | null;
    reference: string | null;
    type: string | null;
    icon: string | null;
    icon_bg: string | null;
    read: boolean;
    created_at: string | null;
    unread_count: number;
};
