import { Head } from '@inertiajs/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    context?: 'login' | 'register';
    showHeader?: boolean;
    showFooter?: boolean;
}

export default function AuthLayout({
    children,
    title,
    description,
    context = 'login',
}: AuthLayoutProps) {
    // The register form is long, so it gets a tighter frame (less padding,
    // wider form column) to fit a laptop screen without page scrolling.
    const compact = context === 'register';
    const heroTitle = title || 'Secure workforce access';
    const heroDescription =
        description ||
        'Manage shifts, authorize requests, and sync your people from anywhere in the world.';

    const highlights = [
        {
            title: 'Role-based access',
            description:
                'Admins and stakeholders only see the tools their assigned permissions allow.',
        },
        {
            title: 'Case operations',
            description:
                'Track dental cases from assignment through design review and manufacturing.',
        },
        {
            title: 'Single secure login',
            description:
                'One portal for Admin Staff and platform accounts — access follows your role.',
        },
    ];

    return (
        <div className="relative min-h-dvh overflow-x-hidden bg-[#030712] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="animate-float absolute -top-12 -left-32 h-64 w-64 rounded-full bg-(--accent-blue)/25 blur-[140px] sm:h-80 sm:w-80 sm:blur-[180px]" />
                <div className="animate-float absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-(--accent-purple)/25 blur-[160px] delay-200 sm:h-125 sm:w-125 sm:blur-[220px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary-700)/35,transparent_60%)]" />
            </div>

            <div
                className={cn(
                    'relative z-10 flex min-h-dvh items-stretch justify-center px-4 py-6 sm:px-6 lg:items-center lg:px-10',
                    compact ? 'sm:py-6 lg:py-6' : 'sm:py-10 lg:py-12',
                )}
            >
                <main
                    className={cn(
                        'relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-2xl transition-[max-width] duration-300 sm:rounded-[32px] lg:rounded-[40px]',
                        compact ? 'max-w-5xl' : 'max-w-6xl',
                    )}
                >
                    <Head title={title} />

                    <div
                        className={cn(
                            'grid gap-6 p-4 transition-[grid-template-columns] duration-300 sm:p-6 lg:gap-8',
                            compact
                                ? 'lg:grid-cols-[0.75fr_1.25fr] lg:p-6'
                                : 'sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:py-16',
                        )}
                    >
                        <section
                            className={cn(
                                'hidden flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5 backdrop-blur-2xl lg:flex lg:rounded-4xl',
                                compact
                                    ? 'gap-5 lg:gap-5 lg:p-6'
                                    : 'gap-8 lg:gap-10 lg:p-8',
                            )}
                        >
                            <header
                                className={compact ? 'space-y-4' : 'space-y-6'}
                            >
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.25em] text-white/70 uppercase sm:tracking-[0.35em]">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.65rem]">
                                        DDS Portal
                                    </span>
                                    Secure access
                                </div>
                                <div className="space-y-3 text-balance">
                                    <h1
                                        className={cn(
                                            'leading-tight font-semibold',
                                            compact
                                                ? 'text-3xl'
                                                : 'text-3xl xl:text-4xl',
                                        )}
                                    >
                                        {heroTitle}
                                    </h1>
                                    <p
                                        className={cn(
                                            'text-white/80',
                                            compact
                                                ? 'text-base'
                                                : 'text-base xl:text-lg',
                                        )}
                                    >
                                        {heroDescription}
                                    </p>
                                </div>
                            </header>

                            <div
                                className={compact ? 'space-y-3' : 'space-y-4'}
                            >
                                {highlights.map((highlight) => (
                                    <div
                                        key={highlight.title}
                                        className={cn(
                                            'rounded-2xl border border-white/10 bg-white/5',
                                            compact ? 'p-4' : 'p-5',
                                        )}
                                    >
                                        <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase sm:tracking-[0.3em]">
                                            {highlight.title}
                                        </p>
                                        <p
                                            className={cn(
                                                'text-white/85',
                                                compact
                                                    ? 'mt-1.5 text-sm'
                                                    : 'mt-2 text-sm sm:text-base',
                                            )}
                                        >
                                            {highlight.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="relative flex min-w-0 flex-col">
                            <div className="mb-5 space-y-3 lg:hidden">
                                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold tracking-[0.2em] text-white/70 uppercase sm:tracking-[0.3em]">
                                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
                                        DDS Portal
                                    </span>
                                    Secure access
                                </div>
                                <div className="space-y-2 text-balance">
                                    <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">
                                        {heroTitle}
                                    </h1>
                                    <p className="text-sm text-white/80 sm:text-base">
                                        {heroDescription}
                                    </p>
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 rounded-2xl bg-white text-foreground shadow-(--shadow-card) sm:rounded-3xl lg:rounded-4xl">
                                <div
                                    className={cn(
                                        'p-4 sm:p-6',
                                        compact ? 'lg:px-8 lg:py-5' : 'lg:p-2',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex justify-center',
                                            compact ? 'pb-3' : 'pt-2 lg:pt-8',
                                        )}
                                    >
                                        <img
                                            src="/images/dds-logo.png"
                                            alt="Rad Dental"
                                            className={cn(
                                                'w-auto object-contain',
                                                compact
                                                    ? 'h-10 sm:h-11'
                                                    : 'h-14 sm:h-16',
                                            )}
                                        />
                                    </div>
                                    {children}
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
