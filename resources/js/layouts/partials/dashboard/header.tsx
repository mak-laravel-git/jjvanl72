import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu, Shield, User as UserIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useMobileSidebar } from '@/layouts/partials/dashboard/mobile-sidebar-context';
import { logout } from '@/routes';
import { type SharedData } from '@/types';

const logoSrc = '/images/dds-logo.png';

type DashboardHeaderProps = {
    organization: string;
    bellIcon: string;
    notificationCount?: number;
    notificationHref?: string | null;
    notificationSlot?: ReactNode;
    profileHref?: string | null;
    twoFactorHref?: string | null;
};

export function DashboardHeader({
    organization,
    bellIcon,
    notificationCount = 0,
    notificationHref = null,
    notificationSlot = null,
    profileHref = null,
    twoFactorHref = null,
}: DashboardHeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const getInitials = useInitials();
    const { setOpen } = useMobileSidebar();

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        router.post(logout.url());
    };

    const avatarUrl = user.avatar_url || user.avatar || null;

    return (
        <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[#e5e7eb] bg-white px-3 sm:h-16 sm:gap-4 sm:px-6 md:left-(--dashboard-sidebar-width)">
            <div className="flex min-w-0 items-center gap-1.5 md:hidden">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-md p-1.5 text-[#050315] transition-colors hover:bg-slate-50"
                    aria-label="Open navigation menu"
                >
                    <Menu className="size-4" />
                </button>
                <img
                    src={logoSrc}
                    alt="Rad Dental"
                    className="h-5 w-auto max-w-[88px] object-contain"
                />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {notificationSlot ??
                    (notificationHref ? (
                        <Link
                            href={notificationHref}
                            className="relative rounded-lg p-1.5 transition-colors hover:bg-slate-50 sm:p-2"
                            aria-label="Notifications"
                        >
                            <span className="relative block size-5 overflow-hidden sm:size-6">
                                <img
                                    src={bellIcon}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            {notificationCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 flex rounded-full bg-[#f967a1] px-1 sm:top-1 sm:right-1">
                                    <span className="font-inter text-[10px] leading-[15px] text-white">
                                        {notificationCount}
                                    </span>
                                </span>
                            )}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            className="relative rounded-lg p-1.5 transition-colors hover:bg-slate-50 sm:p-2"
                            aria-label="Notifications"
                        >
                            <span className="relative block size-5 overflow-hidden sm:size-6">
                                <img
                                    src={bellIcon}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            {notificationCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 flex rounded-full bg-[#f967a1] px-1 sm:top-1 sm:right-1">
                                    <span className="font-inter text-[10px] leading-[15px] text-white">
                                        {notificationCount}
                                    </span>
                                </span>
                            )}
                        </button>
                    ))}

                <div className="mx-1 h-7 w-px bg-[#e5e7eb] sm:mx-2 sm:h-8" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex max-w-[46vw] items-center outline-none focus-visible:ring-2 focus-visible:ring-[#0260bd]/40 sm:max-w-none"
                        >
                            <div className="flex min-w-0 flex-col items-end">
                                <span className="font-inter max-w-[28vw] truncate text-xs font-medium tracking-[-0.16px] text-[#050315] sm:max-w-[220px] sm:text-sm">
                                    {organization}
                                </span>
                                <span className="font-inter max-w-[28vw] truncate text-[11px] tracking-[-0.12px] text-[#475569] sm:max-w-[220px] sm:text-xs">
                                    {user.name}
                                </span>
                            </div>
                            <div className="ml-2 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f967a1] sm:ml-3 sm:size-10">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="font-inter text-sm font-semibold text-white sm:text-base">
                                        {getInitials(user.name)}
                                    </span>
                                )}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56"
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">
                                    {user.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        {(profileHref || twoFactorHref) && (
                            <>
                                <DropdownMenuSeparator />
                                {profileHref ? (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={profileHref}
                                            className="cursor-pointer"
                                        >
                                            <UserIcon className="mr-2 size-4" />
                                            Profile settings
                                        </Link>
                                    </DropdownMenuItem>
                                ) : null}
                                {twoFactorHref ? (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={twoFactorHref}
                                            className="cursor-pointer"
                                        >
                                            <Shield className="mr-2 size-4" />
                                            Two-factor auth
                                        </Link>
                                    </DropdownMenuItem>
                                ) : null}
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer"
                        >
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
