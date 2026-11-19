import { Head } from '@inertiajs/react';
import * as React from 'react';

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
}: AuthLayoutProps) {
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

            <div className="relative z-10 flex min-h-dvh items-stretch justify-center px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:px-10 lg:py-12">
                <main className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-2xl sm:rounded-[32px] lg:rounded-[48px]">
                    <Head title={title} />

                    <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:py-16">
                        <section className="hidden flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5 backdrop-blur-2xl lg:flex lg:gap-10 lg:rounded-4xl lg:p-8">
                            <header className="space-y-6">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.25em] text-white/70 uppercase sm:tracking-[0.35em]">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.65rem]">
                                        DDS Portal
                                    </span>
                                    Secure access
                                </div>
                                <div className="space-y-3 text-balance">
                                    <h1 className="text-3xl leading-tight font-semibold xl:text-4xl">
                                        {heroTitle}
                                    </h1>
                                    <p className="text-base text-white/80 xl:text-lg">
                                        {heroDescription}
                                    </p>
                                </div>
                            </header>

                            <div className="space-y-4">
                                {highlights.map((highlight) => (
                                    <div
                                        key={highlight.title}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                                    >
                                        <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase sm:tracking-[0.3em]">
                                            {highlight.title}
                                        </p>
                                        <p className="mt-2 text-sm text-white/85 sm:text-base">
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
                                <div className="p-4 sm:p-6 lg:p-2">
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
