import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    create,
    destroy,
    edit,
    show,
    index as staffIndex,
} from '@/routes/admin/staff';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;
const ALL_ROLES_VALUE = '__all__';

const decodePaginationLabel = (label: string) =>
    label.replace('&laquo;', '«').replace('&raquo;', '»').trim();

type StaffRow = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    location?: string;
    avatar_url?: string | null;
    initials?: string;
    status?: string;
    roles: string[];
    is_super_admin: boolean;
    is_last_super_admin: boolean;
    joined?: string;
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
    admins: Paginator<StaffRow>;
    roles: string[];
    filters: {
        search?: string | null;
        role?: string | null;
    };
    currentAdminId?: number;
};

export default function StaffIndex({
    admins,
    roles,
    filters,
    currentAdminId,
}: Props) {
    const { auth, flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;
    const permissions = auth.user?.permissions ?? auth.permissions ?? [];
    const canCreate = permissions.includes('admins.create');
    const canUpdate = permissions.includes('admins.update');
    const canDelete = permissions.includes('admins.delete');

    const [search, setSearch] = useState(filters.search ?? '');
    const role = filters.role ?? '';

    useEffect(() => {
        const current = filters.search ?? '';

        if (search === current) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                staffIndex.url(),
                { search: search || undefined, role: role || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, role, filters.search]);

    const filterByRole = (nextRole: string) => {
        router.get(
            staffIndex.url(),
            { search: search || undefined, role: nextRole || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const canDeleteAdmin = (admin: StaffRow) =>
        canDelete &&
        !admin.is_last_super_admin &&
        admin.id !== currentAdminId &&
        (!admin.is_super_admin || Boolean(auth.user?.is_super_admin));

    const destroyAdmin = (admin: StaffRow) => {
        if (!canDeleteAdmin(admin)) {
            return;
        }

        if (
            !window.confirm(
                `Delete staff member "${admin.name}"? This cannot be undone.`,
            )
        ) {
            return;
        }

        router.delete(destroy.url(admin.id), {
            preserveScroll: true,
        });
    };

    const deleteReason = (admin: StaffRow) => {
        if (admin.id === currentAdminId) {
            return 'You cannot delete your own account';
        }

        if (admin.is_super_admin && !auth.user?.is_super_admin) {
            return 'Only a Super Admin can delete Super Admin accounts';
        }

        if (admin.is_last_super_admin) {
            return 'Assign Super Admin to another admin before deleting the last Super Admin';
        }

        return `Delete ${admin.name}`;
    };

    const rows = admins.data;
    const paginationLinks = admins.meta?.links ?? admins.links ?? [];
    const from = admins.meta?.from ?? admins.from ?? null;
    const to = admins.meta?.to ?? admins.to ?? null;
    const total = admins.meta?.total ?? admins.total ?? rows.length;

    return (
        <AdminLayout>
            <Head title="Staff Management" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Staff Management
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Manage admin accounts and their assigned roles
                        </p>
                    </div>

                    {canCreate ? (
                        <Link
                            href={create.url()}
                            className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-plus-white.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Add Staff
                        </Link>
                    ) : null}
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

                <div className="mt-[22.5px] flex flex-wrap items-center gap-3">
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

                    <Select
                        value={role || ALL_ROLES_VALUE}
                        onValueChange={(value) =>
                            filterByRole(value === ALL_ROLES_VALUE ? '' : value)
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by role"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_ROLES_VALUE}>
                                All roles
                            </SelectItem>
                            {roles.map((roleName) => (
                                <SelectItem key={roleName} value={roleName}>
                                    {roleName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="responsive-cards w-full min-w-[980px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">
                                        Name
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Email
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Phone
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Location
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Status
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Joined
                                    </th>
                                    <th className="px-[19px] py-[11px] text-right">
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
                                            No staff members match the current
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((admin, index) => (
                                        <tr
                                            key={admin.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < rows.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td
                                                data-label="Name"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <div className="flex items-center gap-[11.25px]">
                                                    {admin.avatar_url ? (
                                                        <img
                                                            src={
                                                                admin.avatar_url
                                                            }
                                                            alt=""
                                                            className="size-9 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5] text-[11.25px] font-semibold text-white">
                                                            {admin.initials ??
                                                                'A'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Link
                                                                href={show.url(
                                                                    admin.id,
                                                                )}
                                                                className="text-[13.125px] font-semibold text-[#0260bd] hover:underline"
                                                            >
                                                                {admin.name}
                                                            </Link>
                                                            {admin.id ===
                                                            currentAdminId ? (
                                                                <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11.25px] font-semibold text-[#475569]">
                                                                    You
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {admin.roles.map(
                                                                (roleName) => (
                                                                    <span
                                                                        key={
                                                                            roleName
                                                                        }
                                                                        className="rounded-full bg-[#f1f5f9] px-[7.5px] py-[1.5px] text-[11.25px] font-semibold text-[#475569]"
                                                                    >
                                                                        {
                                                                            roleName
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                data-label="Email"
                                                className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]"
                                            >
                                                <Link
                                                    href={show.url(admin.id)}
                                                    className="hover:text-[#0260bd] hover:underline"
                                                >
                                                    {admin.email}
                                                </Link>
                                            </td>
                                            <td
                                                data-label="Phone"
                                                className="px-[19px] py-[14px] text-[11.25px] text-[#475569]"
                                            >
                                                {admin.phone || '—'}
                                            </td>
                                            <td
                                                data-label="Location"
                                                className="px-[19px] py-[14px] text-[11.25px] text-[#475569]"
                                            >
                                                {admin.location || '—'}
                                            </td>
                                            <td
                                                data-label="Status"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2.5 py-1 text-[11.25px] font-semibold',
                                                        admin.status ===
                                                            'Active'
                                                            ? 'bg-[#f0fdf4] text-[#008236]'
                                                            : 'bg-[#f1f5f9] text-[#475569]',
                                                    )}
                                                >
                                                    {admin.status ?? 'Active'}
                                                </span>
                                            </td>
                                            <td
                                                data-label="Joined"
                                                className="px-[19px] py-[14px] text-[11.25px] text-[#475569]"
                                            >
                                                {admin.joined || '—'}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    <Link
                                                        href={show.url(
                                                            admin.id,
                                                        )}
                                                        className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                                                        aria-label={`View ${admin.name}`}
                                                    >
                                                        View
                                                    </Link>
                                                    {canUpdate &&
                                                    (!admin.is_super_admin ||
                                                        auth.user
                                                            ?.is_super_admin) ? (
                                                        <Link
                                                            href={edit.url(
                                                                admin.id,
                                                            )}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#dbeafe]"
                                                            aria-label={`Edit ${admin.name}`}
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
                                                            Edit
                                                        </Link>
                                                    ) : null}
                                                    {canDelete ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                destroyAdmin(
                                                                    admin,
                                                                )
                                                            }
                                                            disabled={
                                                                !canDeleteAdmin(
                                                                    admin,
                                                                )
                                                            }
                                                            title={deleteReason(
                                                                admin,
                                                            )}
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                            aria-label={deleteReason(
                                                                admin,
                                                            )}
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
        </AdminLayout>
    );
}
