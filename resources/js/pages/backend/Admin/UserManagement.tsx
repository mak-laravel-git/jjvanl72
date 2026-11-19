import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminModal } from '@/components/admin-modal';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    create as createUser,
    destroy,
    edit as editUser,
    index as usersIndex,
    show as showUser,
} from '@/routes/admin/users';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

const decodePaginationLabel = (label: string) =>
    label.replace('&laquo;', '«').replace('&raquo;', '»').trim();

type Tab = {
    id: string;
    label: string;
    role: string | null;
};

type PlatformUser = {
    id: number;
    name: string;
    initials: string;
    email: string;
    phone?: string | null;
    location: string;
    avatar_url?: string | null;
    status: string;
    status_value: string;
    joined: string;
    role?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatorMeta = {
    current_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    last_page?: number;
    links?: PaginationLink[];
};

type Paginator<T> = PaginatorMeta & {
    data: T[];
    links?: PaginationLink[];
    meta?: PaginatorMeta;
};

type Props = {
    activeTab: string;
    tabs: Tab[];
    users: Paginator<PlatformUser>;
    roles: string[];
    filters: {
        search?: string | null;
    };
    canAssignRoles?: boolean;
    canManageUsers?: boolean;
    canCreateUsers?: boolean;
    canUpdateUsers?: boolean;
};

export default function UserManagement({
    activeTab,
    tabs,
    users,
    filters,
    canManageUsers = false,
    canCreateUsers = false,
    canUpdateUsers = false,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const current = filters.search ?? '';

        if (search === current) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                usersIndex.url(),
                {
                    tab: activeTab,
                    search: search || undefined,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, activeTab, filters.search]);

    const switchTab = (tabId: string) => {
        router.get(
            usersIndex.url(),
            { tab: tabId, search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const closeDelete = () => {
        setDeleteTarget(null);
        setDeleting(false);
    };

    const confirmDelete = () => {
        if (!deleteTarget || !canManageUsers || deleting) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url(deleteTarget.id), {
            onSuccess: () => {
                closeDelete();
            },
            onError: () => {
                setDeleting(false);
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    const rows = users.data;
    const paginationLinks = users.meta?.links ?? users.links ?? [];
    const from = users.meta?.from ?? users.from ?? null;
    const to = users.meta?.to ?? users.to ?? null;
    const total = users.meta?.total ?? users.total ?? rows.length;

    return (
        <AdminLayout>
            <Head title="User Management" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        User Management
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Manage all platform stakeholders
                    </p>
                </div>

                {flash?.success ? (
                    <div className="mt-4 rounded-[9.375px] border border-[#b9f8cf] bg-[#f0fdf4] px-4 py-3 text-[13.125px] text-[#008236]">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="mt-4 rounded-[9.375px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13.125px] text-[#c10007]">
                        {flash.error}
                    </div>
                ) : null}

                <div className="mt-[22.5px] inline-flex flex-wrap gap-[3.75px] rounded-[13.375px] border border-[#e2e8f0] bg-white p-[4.75px]">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => switchTab(tab.id)}
                                className={cn(
                                    'rounded-[9.375px] px-[15px] py-[7.5px] text-[13.125px] leading-[18.75px] font-semibold transition-colors',
                                    isActive
                                        ? 'bg-[#0260bd] text-white shadow-sm'
                                        : 'text-[#475569] hover:bg-slate-50',
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-[15px] flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <span className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 overflow-hidden">
                            <img
                                src={asset('icon-search.svg')}
                                alt=""
                                className="size-full"
                            />
                        </span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, email, phone, or location..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    {canCreateUsers ? (
                        <Link
                            href={createUser.url({
                                query: { tab: activeTab },
                            })}
                            className="inline-flex h-10 items-center rounded-[9.375px] bg-[#0260bd] px-[15px] text-[13.125px] font-semibold text-white"
                        >
                            Create user
                        </Link>
                    ) : null}
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Name
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Email
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Phone
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Location
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Status
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Joined
                                    </th>
                                    <th className="px-[19px] py-[11px] text-right font-bold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No users found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < rows.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center gap-[11.25px]">
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt=""
                                                            className="size-[26.25px] shrink-0 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-[26.25px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5]">
                                                            <span className="text-[11.25px] leading-[15px] font-semibold text-white">
                                                                {user.initials}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="block text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                            {user.name}
                                                        </span>
                                                        {user.role ? (
                                                            <span className="mt-0.5 inline-flex rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                                                                {user.role}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {user.email}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {user.phone || '—'}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {user.location}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-[7.5px] py-[1.5px] text-[11.25px] leading-[15px] font-semibold',
                                                        user.status_value ===
                                                            'active'
                                                            ? 'bg-[#dcfce7] text-[#008236]'
                                                            : 'bg-[#f1f5f9] text-[#64748b]',
                                                    )}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {user.joined}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    <Link
                                                        href={showUser.url(
                                                            user.id,
                                                        )}
                                                        className="rounded-[3.75px] p-[5.625px] text-[#475569] hover:bg-slate-50"
                                                        title="View details"
                                                        aria-label={`View details for ${user.name}`}
                                                    >
                                                        <span className="relative block size-[13px] overflow-hidden">
                                                            <img
                                                                src={asset(
                                                                    'action-view.svg',
                                                                )}
                                                                alt=""
                                                                className="size-full"
                                                            />
                                                        </span>
                                                    </Link>

                                                    {canUpdateUsers ? (
                                                        <Link
                                                            href={editUser.url(
                                                                user.id,
                                                            )}
                                                            className="rounded-[3.75px] p-[5.625px] text-[#475569] hover:bg-slate-50"
                                                            title="Edit user"
                                                            aria-label={`Edit ${user.name}`}
                                                        >
                                                            <span className="relative block size-[13px] overflow-hidden">
                                                                <img
                                                                    src={asset(
                                                                        'action-edit.svg',
                                                                    )}
                                                                    alt=""
                                                                    className="size-full"
                                                                />
                                                            </span>
                                                        </Link>
                                                    ) : null}

                                                    {canManageUsers ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    user,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] text-[#dc2626] hover:bg-red-50"
                                                            title="Delete user"
                                                            aria-label={`Delete ${user.name}`}
                                                        >
                                                            <span className="relative block size-[13px] overflow-hidden">
                                                                <img
                                                                    src={asset(
                                                                        'action-delete.svg',
                                                                    )}
                                                                    alt=""
                                                                    className="size-full"
                                                                />
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paginationLinks.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-[#f9fafb] px-[19px] py-3">
                            <p className="text-[11.25px] text-[#475569]">
                                {from && to
                                    ? `Showing ${from}-${to} of ${total}`
                                    : `${total} total`}
                            </p>
                            <div className="flex flex-wrap items-center gap-[3.75px]">
                                {paginationLinks.map((link) => (
                                    <Link
                                        key={`${link.label}-${link.url ?? 'disabled'}`}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        preserveState
                                        className={cn(
                                            'rounded-[9.375px] border px-[9px] py-[5px] text-[11.25px] font-semibold',
                                            link.active
                                                ? 'border-[#0260bd] bg-[#0260bd] text-white'
                                                : 'border-[#e2e8f0] bg-white text-[#475569]',
                                            !link.url &&
                                                'pointer-events-none opacity-40',
                                        )}
                                    >
                                        {decodePaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <AdminModal
                open={deleteTarget !== null && canManageUsers}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDelete();
                    }
                }}
                title="Delete user"
                className="max-w-[480px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Permanent delete
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            This action cannot be undone
                        </p>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeDelete}
                            disabled={deleting}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="rounded-[9.375px] bg-[#dc2626] px-4 py-2 text-[13.125px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-40"
                        >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                }
            >
                {deleteTarget ? (
                    <div className="space-y-3 px-[22.5px] py-5">
                        <p className="text-[13.125px] leading-5 text-[#050315]">
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold">
                                {deleteTarget.name}
                            </span>
                            ?
                        </p>
                        <div className="rounded-[9.375px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#7f1d1d]">
                            {deleteTarget.email} · {deleteTarget.role ?? '—'}
                            <br />
                            This will permanently remove the account and cannot
                            be recovered.
                        </div>
                    </div>
                ) : null}
            </AdminModal>
        </AdminLayout>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
            <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                {label}
            </p>
            <p className="mt-1 text-[13.125px] text-[#050315]">{value}</p>
        </div>
    );
}
