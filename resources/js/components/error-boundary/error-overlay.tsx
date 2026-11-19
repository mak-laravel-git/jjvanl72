import {
    AlertTriangle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Clipboard,
    ClipboardCheck,
    Home,
    RotateCcw,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useErrorObservability } from '@/lib/errors/error-context';
import type { CapturedError } from '@/lib/errors/types';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'trace' | 'component';

function formatTime(ts: number | string) {
    return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(ts));
}

function abbreviateUrl(url: string) {
    try {
        const u = new URL(url);

        return u.pathname + u.search;
    } catch {
        return url;
    }
}

function errorUrl(error: CapturedError): string {
    return error.metadata.url ?? error.inertiaDetails?.url ?? '';
}

function CopyButton({ text, className }: { text: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [text]);

    return (
        <button
            type="button"
            onClick={copy}
            className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                copied
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
                className,
            )}
            aria-label="Copy to clipboard"
        >
            {copied ? (
                <>
                    <ClipboardCheck className="size-3.5" />
                    Copied!
                </>
            ) : (
                <>
                    <Clipboard className="size-3.5" />
                    Copy
                </>
            )}
        </button>
    );
}

interface StackFrameView {
    fn: string;
    loc: string;
    isInternal: boolean;
}

function parseStack(stack: string): StackFrameView[] {
    return stack
        .split('\n')
        .filter((l) => l.trim().startsWith('at '))
        .map((line) => {
            const trimmed = line.trim().slice(3);
            const parenIdx = trimmed.indexOf('(');
            const fn =
                parenIdx > -1 ? trimmed.slice(0, parenIdx).trim() : 'anonymous';
            const loc =
                parenIdx > -1 ? trimmed.slice(parenIdx + 1, -1) : trimmed;

            const isInternal =
                loc.includes('node_modules') ||
                loc.includes('@inertiajs') ||
                loc.includes('react.development') ||
                loc.includes('react-dom');

            return { fn, loc, isInternal };
        });
}

const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'trace', label: 'Stack Trace' },
    { id: 'component', label: 'Component Stack' },
];

export interface ErrorOverlayProps {
    error?: unknown;
    resetErrorBoundary?: () => void;
    initialIndex?: number;
}

export function ErrorOverlay({
    error,
    resetErrorBoundary,
    initialIndex = 0,
}: ErrorOverlayProps) {
    const { errors, clearErrors, clearError } = useErrorObservability();
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const [tab, setTab] = useState<Tab>('overview');
    const [showAll, setShowAll] = useState(false);
    const scrollRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        setActiveIdx((idx) => Math.max(0, Math.min(idx, errors.length - 1)));
    }, [errors.length]);

    const active = errors[activeIdx] ?? errors[0];

    const frames = useMemo(
        () => (active?.stack ? parseStack(active.stack) : []),
        [active],
    );

    const visibleFrames = showAll
        ? frames
        : frames.filter((f) => !f.isInternal);

    const closeOrReset = useCallback(() => {
        resetErrorBoundary?.();
    }, [resetErrorBoundary]);

    const handleClearAll = useCallback(() => {
        clearErrors();
        closeOrReset();
    }, [clearErrors, closeOrReset]);

    const handleRemoveCurrent = useCallback(() => {
        if (!active) {
            return;
        }

        clearError(active.id);

        if (errors.length <= 1) {
            closeOrReset();
        }
    }, [active, clearError, closeOrReset, errors.length]);

    const goBack = useCallback(() => {
        window.history.back();
    }, []);

    const goHome = useCallback(() => {
        window.location.href = '/';
    }, []);

    if (!active) {
        return null;
    }

    const total = errors.length;
    const canPrev = activeIdx > 0;
    const canNext = activeIdx < total - 1;
    const stack = active.stack ?? '';
    const pageUrl = errorUrl(active);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
            style={{
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(6px)',
            }}
            role="alertdialog"
            aria-modal="true"
            aria-label="Error boundary"
        >
            <div
                className={cn(
                    'flex w-full flex-col overflow-hidden',
                    'max-h-[min(92vh,780px)] max-w-[780px]',
                    'rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)]',
                )}
                style={{
                    background:
                        'linear-gradient(160deg,#18181b 0%,#111113 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex size-8 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.15)' }}
                        >
                            <AlertTriangle
                                className="size-4 text-red-400"
                                aria-hidden
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold tracking-tight text-zinc-100">
                                    Unhandled Error
                                </span>
                                {active.count > 1 && (
                                    <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                                        ×{active.count}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                                Development overlay ·{' '}
                                {formatTime(active.lastOccurrence)}
                                {pageUrl ? (
                                    <>
                                        {' '}
                                        ·{' '}
                                        <span className="text-zinc-400">
                                            {abbreviateUrl(pageUrl)}
                                        </span>
                                    </>
                                ) : null}
                            </p>
                        </div>
                    </div>

                    {total > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveIdx((i) => i - 1)}
                                disabled={!canPrev}
                                className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Previous error"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <span className="min-w-[3rem] text-center text-xs text-zinc-500">
                                {activeIdx + 1} / {total}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveIdx((i) => i + 1)}
                                disabled={!canNext}
                                className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
                                aria-label="Next error"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRemoveCurrent}
                        className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                        aria-label="Dismiss this error"
                    >
                        <X className="size-4" />
                    </button>
                </header>

                <div
                    className="shrink-0 px-5 py-3"
                    style={{
                        background: 'rgba(239,68,68,0.06)',
                        borderBottom: '1px solid rgba(239,68,68,0.12)',
                    }}
                >
                    <p className="font-mono text-sm leading-snug font-medium text-red-300">
                        {active.message}
                    </p>
                </div>

                <div className="flex shrink-0 gap-1 border-b border-white/[0.06] px-5 pt-3">
                    {TABS.map((t) => {
                        const isDisabled =
                            t.id === 'component' && !active.componentStack;

                        return (
                            <button
                                key={t.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    'relative mb-[-1px] rounded-t-md px-3.5 pt-1.5 pb-2.5 text-xs font-medium transition-colors duration-150',
                                    tab === t.id
                                        ? 'text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300 disabled:pointer-events-none disabled:opacity-30',
                                )}
                            >
                                {t.label}
                                {tab === t.id && (
                                    <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-red-400" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                    {tab === 'overview' && (
                        <div className="space-y-4 p-5">
                            {errors.length > 1 && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                                            Error History ({total})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="flex items-center gap-1 text-[11px] text-zinc-500 transition hover:text-red-400"
                                        >
                                            <Trash2 className="size-3" />
                                            Clear all
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-zinc-900/60 p-2">
                                        {errors.map((item, i) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setActiveIdx(i);
                                                    setTab('overview');
                                                }}
                                                className={cn(
                                                    'flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition',
                                                    i === activeIdx
                                                        ? 'bg-red-500/10 ring-1 ring-red-500/20'
                                                        : 'hover:bg-zinc-800/60',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'mt-0.5 size-1.5 shrink-0 rounded-full',
                                                        i === activeIdx
                                                            ? 'bg-red-400'
                                                            : 'bg-zinc-600',
                                                    )}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium text-zinc-300">
                                                        {item.message}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-zinc-600">
                                                        {formatTime(
                                                            item.lastOccurrence,
                                                        )}{' '}
                                                        ·{' '}
                                                        {abbreviateUrl(
                                                            errorUrl(item),
                                                        )}
                                                        {item.count > 1 && (
                                                            <span className="ml-1.5 rounded-full bg-red-500/20 px-1 py-px text-[10px] text-red-400">
                                                                ×{item.count}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        clearError(item.id);
                                                    }}
                                                    onKeyDown={(ev) => {
                                                        if (
                                                            ev.key ===
                                                                'Enter' ||
                                                            ev.key === ' '
                                                        ) {
                                                            ev.preventDefault();
                                                            ev.stopPropagation();
                                                            clearError(item.id);
                                                        }
                                                    }}
                                                    className="shrink-0 rounded p-0.5 text-zinc-600 hover:text-zinc-400"
                                                    aria-label="Remove error"
                                                >
                                                    <X className="size-3" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    {
                                        label: 'Error Type',
                                        value:
                                            error instanceof Error
                                                ? error.constructor.name
                                                : active.name,
                                    },
                                    {
                                        label: 'Occurred',
                                        value: formatTime(
                                            active.lastOccurrence,
                                        ),
                                    },
                                    {
                                        label: 'Page',
                                        value: abbreviateUrl(pageUrl),
                                    },
                                    {
                                        label: 'Total Occurrences',
                                        value: String(active.count),
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-white/[0.06] bg-zinc-900/60 px-4 py-3"
                                    >
                                        <p className="mb-1 text-[11px] font-medium tracking-wider text-zinc-600 uppercase">
                                            {label}
                                        </p>
                                        <p className="truncate font-mono text-xs text-zinc-300">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'trace' && (
                        <div className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                                        {visibleFrames.length} frames
                                        {!showAll &&
                                            frames.length >
                                                visibleFrames.length && (
                                                <span className="ml-1 text-zinc-600">
                                                    (
                                                    {frames.length -
                                                        visibleFrames.length}{' '}
                                                    internal hidden)
                                                </span>
                                            )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowAll((v) => !v)}
                                        className="text-[11px] text-zinc-500 underline decoration-dotted underline-offset-2 hover:text-zinc-300"
                                    >
                                        {showAll ? 'Hide internal' : 'Show all'}
                                    </button>
                                </div>
                                <CopyButton text={stack} />
                            </div>

                            <div className="space-y-1">
                                {visibleFrames.map((frame, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'rounded-lg px-3 py-2.5 transition',
                                            frame.isInternal
                                                ? 'border border-transparent bg-zinc-900/40'
                                                : 'border border-white/[0.06] bg-zinc-900/80',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'font-mono text-xs font-medium',
                                                frame.isInternal
                                                    ? 'text-zinc-600'
                                                    : 'text-zinc-200',
                                            )}
                                        >
                                            {frame.fn}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-0.5 font-mono text-[11px] break-all',
                                                frame.isInternal
                                                    ? 'text-zinc-700'
                                                    : 'text-zinc-500',
                                            )}
                                        >
                                            {frame.loc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <details className="mt-4">
                                <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300">
                                    Raw stack trace
                                </summary>
                                <pre
                                    ref={scrollRef}
                                    className="mt-2 overflow-auto rounded-xl border border-white/[0.06] bg-zinc-900/80 p-4 font-mono text-[11px] leading-relaxed text-zinc-400"
                                >
                                    {stack}
                                </pre>
                            </details>
                        </div>
                    )}

                    {tab === 'component' && active.componentStack && (
                        <div className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                                    Component Tree
                                </span>
                                <CopyButton text={active.componentStack} />
                            </div>
                            <pre className="overflow-auto rounded-xl border border-white/[0.06] bg-zinc-900/80 p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
                                {active.componentStack}
                            </pre>
                        </div>
                    )}
                </div>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goBack}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
                        >
                            <ArrowLeft className="size-3.5" />
                            Go back
                        </button>
                        <button
                            type="button"
                            onClick={goHome}
                            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
                        >
                            <Home className="size-3.5" />
                            Home
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {total > 1 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                            >
                                <Trash2 className="size-3.5" />
                                Clear all ({total})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={closeOrReset}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400 active:scale-[0.98]"
                        >
                            <RotateCcw className="size-3.5" />
                            Try again
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
