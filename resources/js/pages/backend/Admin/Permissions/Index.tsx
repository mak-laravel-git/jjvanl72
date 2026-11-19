import { Head, Link } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { index as rolesIndex } from '@/routes/admin/roles';

type PermissionRow = {
    id: number;
    name: string;
    label: string;
    roles: string[];
    roles_count: number;
};

type PermissionGroupRow = {
    group: string;
    permissions: PermissionRow[];
};

type Props = {
    groupedPermissions: PermissionGroupRow[];
    summary?: {
        permissions?: number;
        groups?: number;
        roles?: number;
    };
};

export default function PermissionsIndex({
    groupedPermissions,
    summary,
}: Props) {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const filteredGroups = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (term === '') {
            return groupedPermissions;
        }

        return groupedPermissions
            .map((group) => ({
                group: group.group,
                permissions: group.permissions.filter(
                    (permission) =>
                        permission.name.toLowerCase().includes(term) ||
                        permission.label.toLowerCase().includes(term) ||
                        group.group.toLowerCase().includes(term) ||
                        permission.roles.some((role) =>
                            role.toLowerCase().includes(term),
                        ),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [groupedPermissions, search]);

    const totalPermissions =
        summary?.permissions ??
        groupedPermissions.reduce(
            (total, group) => total + group.permissions.length,
            0,
        );
    const totalGroups = summary?.groups ?? groupedPermissions.length;
    const visiblePermissions = filteredGroups.reduce(
        (total, group) => total + group.permissions.length,
        0,
    );

    const stats: Array<{ label: string; value: number }> = [
        { label: 'Permissions', value: totalPermissions },
        { label: 'Groups', value: totalGroups },
    ];

    if (typeof summary?.roles === 'number') {
        stats.push({ label: 'Admin Roles', value: summary.roles });
    }

    return (
        <AdminLayout>
            <Head title="Permissions" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Permissions
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Read-only catalog of admin permissions and which
                            roles use them
                        </p>
                    </div>

                    <Link
                        href={rolesIndex.url()}
                        className="inline-flex items-center gap-2 rounded-[9.375px] border border-[#e2e8f0] bg-white px-[15px] py-[9px] text-[13.125px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                    >
                        Manage Roles
                    </Link>
                </div>

                <div className="mt-[22.5px] grid gap-[15px] sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5"
                        >
                            <p className="text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-[22.5px] flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#99a1af]" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by permission, group, or role..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>
                    <span className="rounded-full bg-[#eff6ff] px-3 py-1.5 text-[11.25px] font-semibold text-[#0260bd]">
                        {visiblePermissions} shown
                    </span>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="mt-[22.5px] rounded-[13.375px] border border-dashed border-[#cbd5e1] bg-white px-[19px] py-10 text-center text-[13.125px] text-[#475569]">
                        No permissions match “{search}”.
                    </div>
                ) : (
                    <div className="mt-[22.5px] space-y-4">
                        {filteredGroups.map((group) => {
                            const isCollapsed =
                                collapsed[group.group] ?? false;

                            return (
                                <div
                                    key={group.group}
                                    className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCollapsed((current) => ({
                                                ...current,
                                                [group.group]: !isCollapsed,
                                            }))
                                        }
                                        className="flex w-full items-center justify-between gap-3 bg-[#f9fafb] px-4 py-3 text-left"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ChevronDown
                                                className={cn(
                                                    'size-4 text-[#6a7282] transition-transform',
                                                    isCollapsed &&
                                                        '-rotate-90',
                                                )}
                                            />
                                            <span className="text-[13.125px] font-semibold text-[#050315]">
                                                {group.group}
                                            </span>
                                            <span className="rounded-full bg-white px-2 py-0.5 text-[11.25px] font-semibold text-[#475569]">
                                                {group.permissions.length}
                                            </span>
                                        </span>
                                    </button>

                                    {!isCollapsed ? (
                                        <div className="grid gap-2 border-t border-[#e2e8f0] p-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {group.permissions.map(
                                                (permission) => (
                                                    <div
                                                        key={permission.id}
                                                        className="rounded-[9.375px] border border-[#e5e7eb] bg-white px-3 py-2.5"
                                                    >
                                                        <p className="text-[13.125px] font-medium text-[#050315]">
                                                            {permission.label}
                                                        </p>
                                                        <p className="mt-0.5 truncate font-mono text-[10.5px] text-[#6a7282]">
                                                            {permission.name}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {permission.roles
                                                                .length ===
                                                            0 ? (
                                                                <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                                                                    Unassigned
                                                                </span>
                                                            ) : (
                                                                permission.roles.map(
                                                                    (
                                                                        roleName,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                roleName
                                                                            }
                                                                            className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10.5px] font-semibold text-[#0260bd]"
                                                                        >
                                                                            {
                                                                                roleName
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
