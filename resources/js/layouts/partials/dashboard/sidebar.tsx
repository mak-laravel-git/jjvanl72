import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useMobileSidebar } from '@/layouts/partials/dashboard/mobile-sidebar-context';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import type { SharedData } from '@/types';

export type DashboardNavItem = {
    title: string;
    icon: string;
    href?: string;
    /** Substrings that mark the item as active. */
    match?: string[];
    /** Urls that mark the item as active only on an exact match. */
    exact?: string[];
    permission?: string;
    openInNewTab?: boolean;
    children?: DashboardNavItem[];
};

export type DashboardSidebarDensity = 'compact' | 'comfortable';

type DashboardSidebarProps = {
    items: DashboardNavItem[];
    logoutIcon: string;
    density?: DashboardSidebarDensity;
};

const logoSrc = '/images/dds-logo.png';

const densityStyles = {
    compact: {
        icon: 'size-5',
        label: 'text-base leading-[22px] tracking-[-0.18px]',
        childLabel: 'px-3 py-2 text-base leading-[22px] tracking-[-0.18px]',
        logout: 'p-3',
        logoutIcon: 'size-5',
        logoutLabel: 'text-base leading-[22px] tracking-[-0.18px]',
        itemGap: 'gap-3',
        itemPadding: 'p-3',
    },
    comfortable: {
        icon: 'size-5',
        label: 'text-base leading-[22px] tracking-[-0.18px]',
        childLabel: 'px-3 py-2 text-base leading-[22px] tracking-[-0.18px]',
        logout: 'p-3',
        logoutIcon: 'size-5',
        logoutLabel: 'text-base leading-[22px] tracking-[-0.18px]',
        itemGap: 'gap-3',
        itemPadding: 'p-3',
    },
} as const;

const activeIconFilter =
    '[&_img]:[filter:brightness(0)_saturate(100%)_invert(23%)_sepia(89%)_saturate(2578%)_hue-rotate(194deg)_brightness(92%)_contrast(101%)]';

function isItemActive(item: DashboardNavItem, url: string): boolean {
    const normalized = url.replace(/\/$/, '') || '/';

    return (
        (item.match ?? []).some((fragment) => url.includes(fragment)) ||
        (item.exact ?? []).some((fragment) => normalized === fragment)
    );
}

function isBranchActive(item: DashboardNavItem, url: string): boolean {
    return (
        isItemActive(item, url) ||
        (item.children ?? []).some((child) => isItemActive(child, url))
    );
}

export function DashboardSidebar({
    items,
    logoutIcon,
    density = 'compact',
}: DashboardSidebarProps) {
    const page = usePage<SharedData>();
    const { url } = page;
    const permissions =
        page.props.auth.user?.permissions ?? page.props.auth.permissions ?? [];
    const styles = densityStyles[density];
    const { open, setOpen } = useMobileSidebar();

    const visibleItems = items
        .filter(
            (item) => !item.permission || permissions.includes(item.permission),
        )
        .map((item) => ({
            ...item,
            children: item.children?.filter(
                (child) =>
                    !child.permission || permissions.includes(child.permission),
            ),
        }))
        .filter((item) => !item.children || item.children.length > 0);

    const handleLogout = () => {
        setOpen(false);
        router.post(logout.url());
    };

    const closeMobile = () => setOpen(false);

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--dashboard-sidebar-width) flex-col border-r border-[#e5e7eb] bg-white md:flex">
                <SidebarBody
                    items={visibleItems}
                    logoutIcon={logoutIcon}
                    styles={styles}
                    url={url}
                    onLogout={handleLogout}
                />
            </aside>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="left"
                    showCloseButton
                    className="w-[min(100%,16.5rem)] gap-0 border-[#e5e7eb] p-0 sm:max-w-[16.5rem] md:hidden"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation</SheetTitle>
                        <SheetDescription>
                            Portal navigation menu
                        </SheetDescription>
                    </SheetHeader>
                    <SidebarBody
                        items={visibleItems}
                        logoutIcon={logoutIcon}
                        styles={styles}
                        url={url}
                        onLogout={handleLogout}
                        onNavigate={closeMobile}
                        compactLogo
                    />
                </SheetContent>
            </Sheet>
        </>
    );
}

type NavItemStyles = (typeof densityStyles)[DashboardSidebarDensity];

function SidebarBody({
    items,
    logoutIcon,
    styles,
    url,
    onLogout,
    onNavigate,
    compactLogo = false,
}: {
    items: DashboardNavItem[];
    logoutIcon: string;
    styles: NavItemStyles;
    url: string;
    onLogout: () => void;
    onNavigate?: () => void;
    compactLogo?: boolean;
}) {
    return (
        <div className="flex h-full flex-col bg-white">
            <div
                className={cn(
                    'flex items-center border-b border-[#e2e8f0]',
                    compactLogo ? 'px-4 py-3' : 'px-6 py-3',
                )}
            >
                <img
                    src={logoSrc}
                    alt="Rad Dental"
                    className={cn(
                        'w-auto max-w-full object-contain',
                        compactLogo ? 'h-7' : 'h-10',
                    )}
                />
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2">
                {items.map((item) => (
                    <Fragment key={item.title}>
                        {item.children ? (
                            <CollapsibleNavItem
                                item={item}
                                url={url}
                                styles={styles}
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <NavLink
                                item={item}
                                url={url}
                                styles={styles}
                                onNavigate={onNavigate}
                            />
                        )}
                    </Fragment>
                ))}
            </nav>

            <div className="border-t border-[#e2e8f0] px-4 pt-[17px] pb-4">
                <button
                    type="button"
                    onClick={onLogout}
                    className={cn(
                        'flex w-full items-center rounded-lg text-left transition-colors hover:bg-slate-50',
                        styles.itemGap,
                        styles.logout,
                    )}
                >
                    <span
                        className={cn(
                            'relative shrink-0 overflow-hidden',
                            styles.logoutIcon,
                        )}
                    >
                        <img src={logoutIcon} alt="" className="size-full" />
                    </span>
                    <span
                        className={cn(
                            'font-inter font-medium text-[#475569]',
                            styles.logoutLabel,
                        )}
                    >
                        Logout
                    </span>
                </button>
            </div>
        </div>
    );
}

function NavLink({
    item,
    url,
    styles,
    onNavigate,
}: {
    item: DashboardNavItem;
    url: string;
    styles: NavItemStyles;
    onNavigate?: () => void;
}) {
    const isActive = isItemActive(item, url);
    const content = (
        <>
            <span
                className={cn(
                    'relative shrink-0 overflow-hidden',
                    styles.icon,
                    isActive && activeIconFilter,
                )}
            >
                <img src={item.icon} alt="" className="size-full" />
            </span>
            <span
                className={cn(
                    'font-inter',
                    styles.label,
                    isActive
                        ? 'font-semibold text-[#0260bd]'
                        : 'font-medium text-[#475569]',
                )}
            >
                {item.title}
            </span>
        </>
    );

    if (!item.href) {
        return (
            <span
                title="Coming soon"
                aria-disabled
                className={cn(
                    'flex cursor-not-allowed items-center rounded-lg opacity-60',
                    styles.itemGap,
                    styles.itemPadding,
                )}
            >
                {content}
            </span>
        );
    }

    return (
        <Link
            href={item.href}
            {...(item.openInNewTab
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            onClick={onNavigate}
            className={cn(
                'flex items-center rounded-lg transition-colors',
                styles.itemGap,
                styles.itemPadding,
                isActive ? 'bg-[rgba(2,96,189,0.1)]' : 'hover:bg-slate-50',
            )}
        >
            {content}
        </Link>
    );
}

function CollapsibleNavItem({
    item,
    url,
    styles,
    onNavigate,
}: {
    item: DashboardNavItem;
    url: string;
    styles: NavItemStyles;
    onNavigate?: () => void;
}) {
    const isActive = isBranchActive(item, url);
    const [isOpen, setIsOpen] = useState(isActive);

    return (
        <div>
            <button
                type="button"
                onClick={() => setIsOpen((wasOpen) => !wasOpen)}
                aria-expanded={isOpen}
                className={cn(
                    'flex w-full items-center rounded-lg text-left transition-colors',
                    styles.itemGap,
                    styles.itemPadding,
                    isActive ? 'bg-[rgba(2,96,189,0.1)]' : 'hover:bg-slate-50',
                )}
            >
                <span
                    className={cn(
                        'relative shrink-0 overflow-hidden',
                        styles.icon,
                        isActive && activeIconFilter,
                    )}
                >
                    <img src={item.icon} alt="" className="size-full" />
                </span>
                <span
                    className={cn(
                        'flex-1 font-inter',
                        styles.label,
                        isActive
                            ? 'font-semibold text-[#0260bd]'
                            : 'font-medium text-[#475569]',
                    )}
                >
                    {item.title}
                </span>
                <ChevronDown
                    className={cn(
                        'size-3.5 text-[#64748b] transition-transform',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {isOpen && (
                <div className="ml-6 flex flex-col border-l border-[#dbeafe] pl-2">
                    {(item.children ?? []).map((child) => {
                        const isChildActive = isItemActive(child, url);

                        return (
                            <Link
                                key={child.title}
                                href={child.href ?? '#'}
                                onClick={onNavigate}
                                className={cn(
                                    'rounded-lg font-inter transition-colors',
                                    styles.childLabel,
                                    isChildActive
                                        ? 'bg-[#eff6ff] font-semibold text-[#0260bd]'
                                        : 'font-medium text-[#64748b] hover:bg-slate-50 hover:text-[#0260bd]',
                                )}
                            >
                                {child.title}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
