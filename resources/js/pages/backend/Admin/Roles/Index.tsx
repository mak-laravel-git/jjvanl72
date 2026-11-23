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
    index as rolesIndex,
} from '@/routes/admin/roles';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;
const ALL_TYPES_VALUE = '__all__';

const decodePaginationLabel = (label: string) =>
    label.replace('&laquo;', '«').replace('&raquo;', '»').trim();

type RoleRow = {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    permissions: string[];
    is_super_admin: boolean;
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
    roles: Paginator<RoleRow>;
    filters: {
        search?: string | null;
        type?: string | null;
    };
};

export default function RolesIndex({ roles, filters }: Props) {
    const { auth, flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;
    const permissions = auth.user?.permissions ?? auth.permissions ?? [];
    const canCreate = permissions.includes('roles.create');
    const canUpdate = permissions.includes('roles.update');
    const canDelete = permissions.includes('roles.delete');

    const [search, setSearch] = useState(filters.search ?? '');
    const type = filters.type ?? '';

    useEffect(() => {
        const current = filters.search ?? '';

        if (search === current) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                rolesIndex.url(),
                {
                    search: search || undefined,
                    type: type || undefined,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, type, filters.search]);

    const filterByType = (nextType: string) => {
        router.get(
            rolesIndex.url(),
            {
                search: search || undefined,
                type: nextType || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const destroyRole = (role: RoleRow) => {
        if (role.is_super_admin) {
            return;
        }

        if (!window.confirm(`Delete role "${role.name}"?`)) {
            return;
        }

        router.delete(destroy.url(role.id), {
            preserveScroll: true,
        });
    };

    const rows = roles.data;
    const paginationLinks = roles.meta?.links ?? roles.links ?? [];
    const from = roles.meta?.from ?? roles.from ?? null;
    const to = roles.meta?.to ?? roles.to ?? null;
    const total = roles.meta?.total ?? roles.total ?? rows.length;

    return (
        <AdminLayout>
            <Head title="Roles & Permissions" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Roles & Permissions
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Manage admin access levels and capabilities
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
                            Add Role
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
                            placeholder="Search by role name..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    <Select
                        value={type || ALL_TYPES_VALUE}
                        onValueChange={(value) =>
                            filterByType(value === ALL_TYPES_VALUE ? '' : value)
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by role type"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_TYPES_VALUE}>
                                All types
                            </SelectItem>
                            <SelectItem value="protected">Protected</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="responsive-cards w-full min-w-[800px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">
                                        Role
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Admins
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Permissions
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
                                            colSpan={4}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No roles match the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((role, index) => (
                                        <tr
                                            key={role.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < rows.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td
                                                data-label="Role"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13.125px] font-semibold text-[#050315]">
                                                        {role.name}
                                                    </span>
                                                    {role.is_super_admin ? (
                                                        <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11.25px] font-semibold text-[#0260bd]">
                                                            Protected
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td
                                                data-label="Admins"
                                                className="px-[19px] py-[14px] text-[13.125px] text-[#475569]"
                                            >
                                                {role.users_count}
                                            </td>
                                            <td
                                                data-label="Permissions"
                                                className="px-[19px] py-[14px] text-[13.125px] font-semibold text-[#050315]"
                                            >
                                                {role.permissions_count}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    {canUpdate &&
                                                    role.is_super_admin ? (
                                                        <Link
                                                            href={edit.url(
                                                                role.id,
                                                            )}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                                                            aria-label={`View access for ${role.name}`}
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
                                                            View
                                                        </Link>
                                                    ) : null}
                                                    {canUpdate &&
                                                    !role.is_super_admin ? (
                                                        <Link
                                                            href={edit.url(
                                                                role.id,
                                                            )}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#dbeafe]"
                                                            aria-label={`Edit ${role.name}`}
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
                                                    {canDelete &&
                                                    !role.is_super_admin ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                destroyRole(
                                                                    role,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            aria-label={`Delete ${role.name}`}
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
