import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getEcho, getEchoGeneration, getReverbClientConfig } from '@/echo';
import { useEchoConnection } from '@/hooks/use-echo-connection';
import AdminLayout from '@/layouts/admin-layout';
import {
    CONNECTION_STATUS_LABELS,
    type NotificationCreatedPayload,
} from '@/realtime/types';
import {
    health as realtimeHealth,
    ping as realtimePing,
    testNotification as realtimeTestNotification,
} from '@/routes/admin/realtime';
import type { SharedData } from '@/types';

type LogLevel = 'info' | 'success' | 'warn' | 'error';
type LogEntry = { id: string; level: LogLevel; message: string; ts: string };
type ReceivedEvent = {
    id: string;
    channel: string;
    event: string;
    data: unknown;
    ts: string;
};

function now() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function uid() {
    return Math.random().toString(36).slice(2, 9);
}

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

const STATUS_DOT: Record<string, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    unavailable: 'bg-orange-500',
    disconnected: 'bg-orange-500',
    failed: 'bg-red-500',
    idle: 'bg-gray-400',
    disabled: 'bg-gray-400',
};

export default function RealtimeIndex() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const { status, socketId, enabled, config, lastError, reconnect } =
        useEchoConnection();
    const [events, setEvents] = useState<ReceivedEvent[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [echoGeneration, setEchoGeneration] = useState(() =>
        getEchoGeneration(),
    );
    const idRef = useRef(0);

    const addLog = useCallback((level: LogLevel, message: string) => {
        setLogs((prev) => [
            ...prev.slice(-99),
            { id: `${idRef.current++}`, level, message, ts: now() },
        ]);
    }, []);

    useEffect(() => {
        const onReconnected = () => {
            setEchoGeneration(getEchoGeneration());
            addLog('info', 'Echo client recreated — reconnecting WebSocket');
        };

        window.addEventListener('echo:reconnected', onReconnected);

        return () => {
            window.removeEventListener('echo:reconnected', onReconnected);
        };
    }, [addLog]);

    useEffect(() => {
        if (!lastError) {
            return;
        }

        addLog('error', lastError);
    }, [lastError, addLog]);

    useEffect(() => {
        const echo = getEcho();

        if (!echo || !enabled) {
            return;
        }

        const publicChannel = echo.channel('reverb-ping');
        const onPing = (data: {
            message?: string;
            triggered_at?: string;
            source?: string;
        }) => {
            setEvents((prev) =>
                [
                    {
                        id: uid(),
                        channel: 'reverb-ping',
                        event: 'ping',
                        data,
                        ts: now(),
                    },
                    ...prev,
                ].slice(0, 50),
            );
            addLog('success', `Public event received: ${data.message ?? ''}`);
        };

        publicChannel.listen('.ping', onPing);

        return () => {
            try {
                publicChannel.stopListening('.ping', onPing);
            } catch {
                // ignore
            }
            echo.leave('reverb-ping');
        };
    }, [enabled, addLog, echoGeneration]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        const echo = getEcho();

        if (!echo) {
            return;
        }

        const channelName = `App.Models.User.${user.id}`;
        const channel = echo.private(channelName);

        const onNotification = (data: NotificationCreatedPayload) => {
            setEvents((prev) =>
                [
                    {
                        id: uid(),
                        channel: channelName,
                        event: 'notification.created',
                        data,
                        ts: now(),
                    },
                    ...prev,
                ].slice(0, 50),
            );
            addLog(
                'success',
                `Private notification received: ${data.title ?? data.type}`,
            );
        };

        channel.listen('.notification.created', onNotification);

        return () => {
            try {
                channel.stopListening(
                    '.notification.created',
                    onNotification,
                );
            } catch {
                // ignore
            }
            echo.leave(channelName);
        };
    }, [user?.id, addLog, echoGeneration]);

    const firePublicPing = useCallback(async () => {
        setBusy(true);
        addLog('info', 'GET /admin/realtime/ping …');

        try {
            const response = await fetch(
                realtimePing.url({ query: { message: `Ping ${now()}` } }),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                },
            );
            const json = await response.json();
            setApiResponse(JSON.stringify(json, null, 2));

            if (!response.ok) {
                throw new Error(json.message ?? `HTTP ${response.status}`);
            }

            addLog(
                'success',
                'Backend dispatched public ping — awaiting WebSocket push',
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setApiResponse(`ERROR: ${msg}`);
            addLog('error', `Ping failed: ${msg}`);
        } finally {
            setBusy(false);
        }
    }, [addLog]);

    const checkConfig = useCallback(async () => {
        addLog('info', 'GET /admin/realtime/health …');

        try {
            const response = await fetch(realtimeHealth.url(), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const json = await response.json();
            setApiResponse(JSON.stringify(json, null, 2));

            if (!response.ok) {
                throw new Error(json.message ?? `HTTP ${response.status}`);
            }

            addLog('success', 'Fetched backend broadcasting config');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog('error', `Config fetch failed: ${msg}`);
        }
    }, [addLog]);

    const firePrivate = useCallback(async () => {
        setBusy(true);
        addLog('info', 'POST /admin/realtime/test-notification …');

        try {
            const response = await fetch(realtimeTestNotification.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                credentials: 'same-origin',
            });
            const json = await response.json();
            setApiResponse(JSON.stringify(json, null, 2));

            if (!response.ok) {
                throw new Error(json.message ?? `HTTP ${response.status}`);
            }

            addLog(
                'success',
                'Test notification dispatched — awaiting private push',
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog('error', `Test notification failed: ${msg}`);
        } finally {
            setBusy(false);
        }
    }, [addLog]);

    const connected = status === 'connected';
    const clientConfig = getReverbClientConfig();

    return (
        <AdminLayout>
            <Head title="Realtime Console" />

            <div className="mx-auto max-w-5xl space-y-4 p-6 font-mono text-sm">
                <header className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                    <h1 className="text-lg font-bold text-[#050315]">
                        Reverb WebSocket Console
                    </h1>
                    <p className="mt-1 text-xs text-[#64748b]">
                        End-to-end test: Inertia app ⇄ jjvan_reverb_server ⇄
                        browser Echo
                    </p>
                </header>

                <section className="space-y-3 rounded-lg border border-[#e2e8f0] bg-white p-4">
                    <div className="flex items-center gap-3">
                        <span
                            className={`h-3 w-3 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-400'}`}
                        />
                        <span className="font-semibold text-[#050315]">
                            {CONNECTION_STATUS_LABELS[status]}
                        </span>
                        {socketId ? (
                            <span className="text-xs text-[#64748b]">
                                socket_id:{' '}
                                <span className="text-green-600">
                                    {socketId}
                                </span>
                            </span>
                        ) : null}
                    </div>

                    {lastError ? (
                        <p className="text-xs text-red-600">{lastError}</p>
                    ) : null}

                    {(status === 'failed' ||
                        status === 'unavailable' ||
                        status === 'disconnected') && (
                        <p className="text-xs text-[#64748b]">
                            Pusher stops retrying after{' '}
                            <span className="font-semibold">Failed</span>. If
                            the Reverb container just came back, click Reconnect
                            (or hard-refresh).
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                addLog('info', 'Manual reconnect requested');
                                reconnect();
                            }}
                            disabled={!enabled}
                            className="rounded border border-[#0260bd] px-3 py-1.5 text-xs font-medium text-[#0260bd] hover:bg-blue-50 disabled:opacity-40"
                        >
                            Reconnect
                        </button>
                        <button
                            type="button"
                            onClick={firePublicPing}
                            disabled={busy || !connected}
                            className="rounded bg-[#0260bd] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#024a94] disabled:opacity-40"
                        >
                            Trigger public ping
                        </button>
                        <button
                            type="button"
                            onClick={firePrivate}
                            disabled={busy || !connected || !user}
                            className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-40"
                        >
                            Trigger private notification
                        </button>
                        <button
                            type="button"
                            onClick={checkConfig}
                            className="rounded border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                            Check backend config
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEvents([]);
                                setLogs([]);
                                setApiResponse(null);
                            }}
                            className="rounded border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-[#e2e8f0] pt-2 text-xs text-[#64748b] sm:grid-cols-2">
                        <div>
                            WS Host:{' '}
                            <span className="text-[#050315]">
                                {config.host || 'MISSING'}
                            </span>
                        </div>
                        <div>
                            WS Port:{' '}
                            <span className="text-[#050315]">
                                {config.port}
                            </span>
                        </div>
                        <div>
                            Scheme:{' '}
                            <span className="text-[#050315]">
                                {config.scheme}
                            </span>
                        </div>
                        <div>
                            forceTLS:{' '}
                            <span className="text-[#050315]">
                                {String(config.useTls)}
                            </span>
                        </div>
                        <div>
                            Transports:{' '}
                            <span className="text-[#050315]">
                                {clientConfig.enabledTransports.join(', ')}
                            </span>
                        </div>
                        <div>
                            App Key:{' '}
                            <span className="text-[#050315]">
                                {config.appKey
                                    ? `${config.appKey.slice(0, 8)}…`
                                    : 'MISSING'}
                            </span>
                        </div>
                        <div className="sm:col-span-2">
                            Auth endpoint:{' '}
                            <span className="text-[#050315]">
                                {config.authEndpoint}
                            </span>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="rounded-lg border border-[#e2e8f0] bg-white p-3">
                        <h2 className="mb-2 font-semibold text-[#050315]">
                            Received events ({events.length})
                        </h2>
                        <div className="h-64 space-y-2 overflow-y-auto rounded bg-slate-50 p-2">
                            {events.length === 0 ? (
                                <p className="mt-8 text-center text-[#64748b]">
                                    No events yet.
                                </p>
                            ) : (
                                events.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className="rounded border border-[#e2e8f0] bg-white p-2 text-xs"
                                    >
                                        <div className="mb-1 flex justify-between text-[#64748b]">
                                            <span className="text-green-600">
                                                {ev.channel} → {ev.event}
                                            </span>
                                            <span>{ev.ts}</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap break-all text-[#050315]">
                                            {JSON.stringify(ev.data, null, 2)}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-lg border border-[#e2e8f0] bg-white p-3">
                        <h2 className="mb-2 font-semibold text-[#050315]">
                            Debug log ({logs.length})
                        </h2>
                        <div className="h-64 space-y-0.5 overflow-y-auto rounded bg-slate-50 p-2">
                            {logs.length === 0 ? (
                                <p className="mt-8 text-center text-[#64748b]">
                                    No log entries.
                                </p>
                            ) : (
                                logs.map((l) => (
                                    <div
                                        key={l.id}
                                        className="flex gap-2 text-xs leading-5"
                                    >
                                        <span className="shrink-0 text-[#64748b]">
                                            {l.ts}
                                        </span>
                                        <span
                                            className={
                                                l.level === 'error'
                                                    ? 'text-red-500'
                                                    : l.level === 'warn'
                                                      ? 'text-yellow-600'
                                                      : l.level === 'success'
                                                        ? 'text-green-600'
                                                        : 'text-blue-500'
                                            }
                                        >
                                            [{l.level.toUpperCase()}]
                                        </span>
                                        <span className="break-all text-[#050315]">
                                            {l.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {apiResponse ? (
                    <section className="rounded-lg border border-[#e2e8f0] bg-white p-3">
                        <h2 className="mb-2 font-semibold text-[#050315]">
                            Last API response
                        </h2>
                        <pre
                            className={`whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-xs ${
                                apiResponse.startsWith('ERROR')
                                    ? 'text-red-500'
                                    : 'text-green-600'
                            }`}
                        >
                            {apiResponse}
                        </pre>
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}
