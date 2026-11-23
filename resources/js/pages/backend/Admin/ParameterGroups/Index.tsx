import { Form, Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { AdminModal } from '@/components/admin-modal';
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
    destroy,
    index as groupsIndex,
    store,
    update,
} from '@/routes/admin/parameter-groups';
import type { SharedData } from '@/types';
import type { PaginationData } from '@/types/data-table.types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

type GroupRow = {
    id: number;
    title: string;
    updated_at: string;
};

type Props = {
    groups: GroupRow[];
    pagination: PaginationData;
    offset: number;
    search: string;
    filters: Record<string, unknown>;
    sort_by: string;
    sort_order: 'asc' | 'desc' | string;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
};

type SortableColumn = 'name' | 'updated_at';

export default function ParameterGroupsIndex({
    groups,
    pagination,
    offset,
    search: searchProp,
    sort_by,
    sort_order,
    canCreate = false,
    canUpdate = false,
    canDelete = false,
}: Props) {
    const { flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;

    const [search, setSearch] = useState(searchProp ?? '');
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<GroupRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GroupRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                sort_by: sort_by || undefined,
                sort_order: sort_by ? sort_order || 'asc' : undefined,
                per_page: pagination.per_page,
                page: pagination.current_page,
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            router.get(groupsIndex.url(), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [
            search,
            sort_by,
            sort_order,
            pagination.per_page,
            pagination.current_page,
        ],
    );

    useEffect(() => {
        setSearch(searchProp ?? '');
    }, [searchProp]);

    useEffect(() => {
        const current = searchProp ?? '';

        if (search === current) {
            return;
        }

        const timeout = window.setTimeout(() => {
            navigate({
                search: search || undefined,
                page: 1,
            });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, searchProp, navigate]);

    const toggleSort = (column: SortableColumn) => {
        const nextOrder =
            sort_by === column && sort_order === 'asc' ? 'desc' : 'asc';

        navigate({
            sort_by: column,
            sort_order: nextOrder,
        });
    };

    const closeCreate = () => setCreateOpen(false);
    const closeEdit = () => setEditTarget(null);
    const closeDelete = () => {
        setDeleteTarget(null);
        setDeleting(false);
    };

    const confirmDelete = () => {
        if (!deleteTarget || !canDelete || deleting) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => closeDelete(),
            onError: () => setDeleting(false),
            onFinish: () => setDeleting(false),
        });
    };

    const pageNumbers = buildPageNumbers(
        pagination.current_page,
        pagination.last_page,
    );

    return (
        <AdminLayout>
            <Head title="Parameter Groups" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Parameter Groups
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Organize parameter groups used across products and
                            workflows
                        </p>
                    </div>

                    {canCreate ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditTarget(null);
                                setDeleteTarget(null);
                                setCreateOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-plus-white.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Add Group
                        </button>
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
                            placeholder="Search by title..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    <Select
                        value={String(pagination.per_page)}
                        onValueChange={(value) =>
                            navigate({
                                per_page: Number(value),
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Rows per page"
                            className="h-10 w-[120px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 15, 30, 50].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                    {value} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="responsive-cards w-full min-w-[560px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">#</th>
                                    <SortHeader
                                        column="name"
                                        label="Title"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <SortHeader
                                        column="updated_at"
                                        label="Updated"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <th className="px-[19px] py-[11px] text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No parameter groups match the
                                            current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    groups.map((group, index) => (
                                        <tr
                                            key={group.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < groups.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td
                                                data-label="#"
                                                className="px-[19px] py-[14px] text-[11.25px] text-[#475569]"
                                            >
                                                {offset + index + 1}
                                            </td>
                                            <td
                                                data-label="Title"
                                                className="px-[19px] py-[14px] text-[13.125px] font-semibold text-[#050315]"
                                            >
                                                {group.title}
                                            </td>
                                            <td
                                                data-label="Updated"
                                                className="px-[19px] py-[14px] text-[11.25px] text-[#475569]"
                                            >
                                                {group.updated_at}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="px-[19px] py-[14px]"
                                            >
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    {canUpdate ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreateOpen(
                                                                    false,
                                                                );
                                                                setDeleteTarget(
                                                                    null,
                                                                );
                                                                setEditTarget(
                                                                    group,
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#dbeafe]"
                                                            aria-label={`Edit ${group.title}`}
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
                                                        </button>
                                                    ) : null}
                                                    {canDelete ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreateOpen(
                                                                    false,
                                                                );
                                                                setEditTarget(
                                                                    null,
                                                                );
                                                                setDeleteTarget(
                                                                    group,
                                                                );
                                                            }}
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            aria-label={`Delete ${group.title}`}
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

                    {pagination.total > 0 ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-[#f9fafb] px-[19px] py-3">
                            <p className="text-[11.25px] text-[#475569]">
                                {pagination.from && pagination.to
                                    ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total}`
                                    : `${pagination.total} total`}
                            </p>
                            <div className="flex flex-wrap items-center gap-[3.75px]">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        navigate({
                                            page: pagination.current_page - 1,
                                        })
                                    }
                                    className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-[9px] py-[5px] text-[11.25px] font-semibold text-[#475569] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                {pageNumbers.map((page, index) =>
                                    page === '…' ? (
                                        <span
                                            key={`dots-${index}`}
                                            className="px-1 text-[11.25px] text-[#94a3b8]"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => navigate({ page })}
                                            className={cn(
                                                'rounded-[9.375px] border px-[9px] py-[5px] text-[11.25px] font-semibold',
                                                page === pagination.current_page
                                                    ? 'border-[#0260bd] bg-[#0260bd] text-white'
                                                    : 'border-[#e2e8f0] bg-white text-[#475569]',
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ),
                                )}
                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        navigate({
                                            page: pagination.current_page + 1,
                                        })
                                    }
                                    className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-[9px] py-[5px] text-[11.25px] font-semibold text-[#475569] disabled:pointer-events-none disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <AdminModal
                open={createOpen && canCreate}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreate();
                    }
                }}
                title="Add Group"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Add Group
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            Create a parameter group for catalog organization
                        </p>
                    </div>
                }
            >
                <Form
                    {...store.form()}
                    className="px-[22.5px] py-5"
                    onSuccess={closeCreate}
                    resetOnSuccess
                >
                    {({ processing, errors }) => (
                        <GroupFormFields
                            errors={errors}
                            footer={
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeCreate}
                                        disabled={processing}
                                        className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Group'}
                                    </button>
                                </div>
                            }
                        />
                    )}
                </Form>
            </AdminModal>

            <AdminModal
                open={editTarget !== null && canUpdate}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEdit();
                    }
                }}
                title="Edit group"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Edit group
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {editTarget
                                ? `Update details for ${editTarget.title}`
                                : 'Update parameter group'}
                        </p>
                    </div>
                }
            >
                {editTarget ? (
                    <Form
                        key={editTarget.id}
                        {...update.form(editTarget.id)}
                        className="px-[22.5px] py-5"
                        onSuccess={closeEdit}
                    >
                        {({ processing, errors }) => (
                            <GroupFormFields
                                errors={errors}
                                defaults={editTarget}
                                footer={
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeEdit}
                                            disabled={processing}
                                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </button>
                                    </div>
                                }
                            />
                        )}
                    </Form>
                ) : null}
            </AdminModal>

            <AdminModal
                open={deleteTarget !== null && canDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDelete();
                    }
                }}
                title="Delete group"
                className="max-w-[480px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Delete group
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
                            className="rounded-[9.375px] bg-[#dc2626] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                        >
                            {deleting ? 'Deleting...' : 'Delete Group'}
                        </button>
                    </div>
                }
            >
                <p className="px-[22.5px] py-5 text-[13.125px] text-[#475569]">
                    Delete{' '}
                    <span className="font-semibold text-[#050315]">
                        {deleteTarget?.title}
                    </span>{' '}
                    permanently?
                </p>
            </AdminModal>
        </AdminLayout>
    );
}

function SortHeader({
    column,
    label,
    activeColumn,
    activeOrder,
    onSort,
}: {
    column: SortableColumn;
    label: string;
    activeColumn: string;
    activeOrder: string;
    onSort: (column: SortableColumn) => void;
}) {
    const active = activeColumn === column;

    return (
        <th className="px-[19px] py-[11px]">
            <button
                type="button"
                onClick={() => onSort(column)}
                className="inline-flex items-center gap-1 uppercase hover:text-[#0260bd]"
            >
                {label}
                <span className="inline-flex flex-col">
                    <ChevronUp
                        className={cn(
                            'size-3',
                            active && activeOrder === 'asc'
                                ? 'text-[#0260bd]'
                                : 'text-[#cbd5e1]',
                        )}
                    />
                    <ChevronDown
                        className={cn(
                            '-mt-1 size-3',
                            active && activeOrder === 'desc'
                                ? 'text-[#0260bd]'
                                : 'text-[#cbd5e1]',
                        )}
                    />
                </span>
            </button>
        </th>
    );
}

function GroupFormFields({
    errors,
    defaults,
    footer,
}: {
    errors: Partial<Record<string, string>>;
    defaults?: Partial<GroupRow>;
    footer: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="title" className={labelClassName}>
                    Title
                </label>
                <input
                    id="title"
                    name="title"
                    defaultValue={defaults?.title ?? ''}
                    className={inputClassName}
                    placeholder="e.g. Shade"
                    required
                />
                {errors.title ? (
                    <p className="mt-1 text-[12px] text-[#c10007]">
                        {errors.title}
                    </p>
                ) : null}
            </div>

            {footer}
        </div>
    );
}

function buildPageNumbers(current: number, last: number): Array<number | '…'> {
    if (last <= 1) {
        return last === 1 ? [1] : [];
    }

    if (last <= 7) {
        return Array.from({ length: last }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, last, current - 1, current, current + 1]);
    const sorted = [...pages]
        .filter((page) => page >= 1 && page <= last)
        .sort((a, b) => a - b);

    const result: Array<number | '…'> = [];
    let previous = 0;

    for (const page of sorted) {
        if (previous && page - previous > 1) {
            result.push('…');
        }
        result.push(page);
        previous = page;
    }

    return result;
}
