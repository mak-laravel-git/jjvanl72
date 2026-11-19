import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Shield, User as UserIcon } from 'lucide-react';
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
import { logout } from '@/routes';
import { type SharedData } from '@/types';

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

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        router.post(logout.url());
    };

    const avatarUrl = user.avatar_url || user.avatar || null;

    return (
        <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-[#e5e7eb] bg-white px-6 md:left-(--dashboard-sidebar-width)">
            <div className="flex items-center gap-2">
                {notificationSlot ??
                    (notificationHref ? (
                        <Link
                            href={notificationHref}
                            className="relative rounded-lg p-2 transition-colors hover:bg-slate-50"
                            aria-label="Notifications"
                        >
                            <span className="relative block size-6 overflow-hidden">
                                <img
                                    src={bellIcon}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 flex rounded-full bg-[#f967a1] px-1">
                                    <span className="font-inter text-[10px] leading-[15px] text-white">
                                        {notificationCount}
                                    </span>
                                </span>
                            )}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            className="relative rounded-lg p-2 transition-colors hover:bg-slate-50"
                            aria-label="Notifications"
                        >
                            <span className="relative block size-6 overflow-hidden">
                                <img
                                    src={bellIcon}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 flex rounded-full bg-[#f967a1] px-1">
                                    <span className="font-inter text-[10px] leading-[15px] text-white">
                                        {notificationCount}
                                    </span>
                                </span>
                            )}
                        </button>
                    ))}

                <div className="mx-2 h-8 w-px bg-[#e5e7eb]" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#0260bd]/40"
                        >
                            <div className="flex flex-col items-end">
                                <span className="font-inter text-sm font-medium tracking-[-0.16px] text-[#050315]">
                                    {organization}
                                </span>
                                <span className="font-inter text-xs tracking-[-0.12px] text-[#475569]">
                                    {user.name}
                                </span>
                            </div>
                            <div className="ml-3 flex size-10 items-center justify-center overflow-hidden rounded-full bg-[#f967a1]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="font-inter text-base font-semibold text-white">
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
