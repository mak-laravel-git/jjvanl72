import { ChevronDown, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

export type PermissionGroup = {
    group: string;
    permissions: Array<{
        name: string;
        label: string;
    }>;
};

type Props = {
    permissionGroups: PermissionGroup[];
    selected: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
};

export function AdminPermissionChecklist({
    permissionGroups,
    selected,
    onChange,
    disabled = false,
}: Props) {
    const [query, setQuery] = useState('');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const allPermissions = useMemo(
        () =>
            permissionGroups.flatMap((group) =>
                group.permissions.map(({ name }) => name),
            ),
        [permissionGroups],
    );
    const filteredGroups = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (term === '') {
            return permissionGroups;
        }

        return permissionGroups
            .map((group) => ({
                ...group,
                permissions: group.permissions.filter(
                    (permission) =>
                        permission.name.toLowerCase().includes(term) ||
                        permission.label.toLowerCase().includes(term) ||
                        group.group.toLowerCase().includes(term),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [permissionGroups, query]);

    const toggle = (permission: string) => {
        if (disabled) {
            return;
        }

        if (selectedSet.has(permission)) {
            onChange(selected.filter((item) => item !== permission));

            return;
        }

        onChange([...selected, permission]);
    };

    const toggleGroup = (group: PermissionGroup) => {
        if (disabled) {
            return;
        }

        const names = group.permissions.map((permission) => permission.name);
        const allSelected = names.every((name) => selectedSet.has(name));

        if (allSelected) {
            onChange(selected.filter((item) => !names.includes(item)));

            return;
        }

        onChange([...new Set([...selected, ...names])]);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#99a1af]" />
                        <input
                            type="search"
                            value={query}
                            disabled={disabled}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search permissions..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd] disabled:bg-[#f8fafc]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-3 py-1.5 text-[11.25px] font-semibold text-[#0260bd]">
                            <ShieldCheck className="size-3.5" />
                            {selected.length}/{allPermissions.length} selected
                        </span>
                        <button
                            type="button"
                            disabled={
                                disabled ||
                                selected.length === allPermissions.length
                            }
                            onClick={() => onChange(allPermissions)}
                            className="rounded-[9.375px] border border-[#e2e8f0] px-3 py-1.5 text-[11.25px] font-semibold text-[#0260bd] disabled:opacity-40"
                        >
                            Select all
                        </button>
                        <button
                            type="button"
                            disabled={disabled || selected.length === 0}
                            onClick={() => onChange([])}
                            className="rounded-[9.375px] px-3 py-1.5 text-[11.25px] font-semibold text-[#475569] disabled:opacity-40"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {filteredGroups.map((group) => {
                const names = group.permissions.map(
                    (permission) => permission.name,
                );
                const selectedCount = names.filter((name) =>
                    selectedSet.has(name),
                ).length;
                const allSelected = selectedCount === names.length;
                const isCollapsed = collapsed[group.group] ?? false;

                return (
                    <div
                        key={group.group}
                        className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white"
                    >
                        <div className="flex items-center justify-between gap-3 bg-[#f9fafb] px-4 py-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setCollapsed((current) => ({
                                        ...current,
                                        [group.group]: !isCollapsed,
                                    }))
                                }
                                className="flex flex-1 items-center gap-2 text-left"
                            >
                                <ChevronDown
                                    className={cn(
                                        'size-4 text-[#6a7282] transition-transform',
                                        isCollapsed && '-rotate-90',
                                    )}
                                />
                                <span className="text-[13.125px] font-semibold text-[#050315]">
                                    {group.group}
                                </span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11.25px] font-semibold text-[#475569]">
                                    {selectedCount}/{names.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleGroup(group)}
                                className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11.25px] font-semibold text-[#0260bd] disabled:opacity-50"
                            >
                                {allSelected ? 'Clear group' : 'Select group'}
                            </button>
                        </div>
                        {!isCollapsed ? (
                            <div className="grid gap-2 border-t border-[#e2e8f0] p-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.permissions.map((permission) => {
                                    const checked = selectedSet.has(
                                        permission.name,
                                    );

                                    return (
                                        <label
                                            key={permission.name}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 rounded-[9.375px] border px-3 py-2.5 transition-colors',
                                                checked
                                                    ? 'border-[#0260bd] bg-[#eff6ff]'
                                                    : 'border-[#e5e7eb] hover:bg-[#f8fafc]',
                                                disabled &&
                                                    'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 size-4 rounded border-[#d1d5dc] text-[#0260bd] focus:ring-[#0260bd]"
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={() =>
                                                    toggle(permission.name)
                                                }
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-[13.125px] font-medium text-[#050315]">
                                                    {permission.label}
                                                </span>
                                                <span className="block truncate font-mono text-[10.5px] text-[#6a7282]">
                                                    {permission.name}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                );
            })}

            {filteredGroups.length === 0 ? (
                <div className="rounded-[13.375px] border border-dashed border-[#cbd5e1] bg-white py-10 text-center text-[13.125px] text-[#475569]">
                    No permissions match “{query}”.
                </div>
            ) : null}
        </div>
    );
}
