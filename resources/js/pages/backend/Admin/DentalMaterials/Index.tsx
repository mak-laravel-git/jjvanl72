import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
    create as materialsCreate,
    destroy,
    edit as materialsEdit,
    index as materialsIndex,
} from '@/routes/admin/dental-materials';
import type { PaginationData } from '@/types/data-table.types';
import type { SharedData } from '@/types';
import type { MaterialRow, ProductOption } from './FormFields';

const asset = (name: string) => `/images/admin-dashboard/${name}`;
const ALL_STATUS_VALUE = '__all__';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

type Props = {
    materials: MaterialRow[];
    pagination: PaginationData;
    offset: number;
    search: string;
    filters: Record<string, unknown>;
    sort_by: string;
    sort_order: 'asc' | 'desc' | string;
    productOptions: ProductOption[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
};

type SortableColumn = 'code' | 'name' | 'is_active' | 'updated_at';

export default function DentalMaterialsIndex({
    materials,
    pagination,
    offset,
    search: searchProp,
    filters,
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
    const statusFilter = String(filters?.is_active ?? '');
    const [viewTarget, setViewTarget] = useState<MaterialRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MaterialRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                sort_by: sort_by || undefined,
                sort_order: sort_by ? sort_order || 'asc' : undefined,
                per_page: pagination.per_page,
                page: pagination.current_page,
                ...(statusFilter
                    ? { 'filters[is_active]': statusFilter }
                    : {}),
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            router.get(materialsIndex.url(), params, {
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
            statusFilter,
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

    const filterByStatus = (value: string) => {
        navigate({
            'filters[is_active]': value || undefined,
            page: 1,
        });
    };

    const toggleSort = (column: SortableColumn) => {
        const nextOrder =
            sort_by === column && sort_order === 'asc' ? 'desc' : 'asc';

        navigate({
            sort_by: column,
            sort_order: nextOrder,
        });
    };

    const closeView = () => setViewTarget(null);
    const closeDelete = () => {
        setDeleteTarget(null);
        setDeleting(false);
    };

    const openView = (material: MaterialRow) => {
        setDeleteTarget(null);
        setViewTarget(material);
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
            <Head title="Dental Materials" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Dental Materials
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Manage materials linked to dental products
                        </p>
                    </div>

                    {canCreate ? (
                        <Link
                            href={materialsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-plus-white.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Add Material
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
                            placeholder="Search by color or name..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    <Select
                        value={statusFilter || ALL_STATUS_VALUE}
                        onValueChange={(value) =>
                            filterByStatus(
                                value === ALL_STATUS_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by status"
                            className="h-10 w-[180px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_STATUS_VALUE}>
                                All statuses
                            </SelectItem>
                            <SelectItem value="1">Active</SelectItem>
                            <SelectItem value="0">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

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
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">#</th>
                                    <SortHeader
                                        column="code"
                                        label="Color"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <SortHeader
                                        column="name"
                                        label="Name"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <th className="px-[19px] py-[11px]">
                                        Products
                                    </th>
                                    <SortHeader
                                        column="is_active"
                                        label="Status"
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
                                {materials.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No dental materials match the current
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    materials.map((material, index) => (
                                        <tr
                                            key={material.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < materials.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td className="px-[19px] py-[14px] text-[11.25px] text-[#475569]">
                                                {offset + index + 1}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span className="inline-flex items-center gap-2">
                                                    <span
                                                        className="size-5 shrink-0 rounded-[6px] border border-[#e2e8f0]"
                                                        style={{
                                                            backgroundColor:
                                                                material.code,
                                                        }}
                                                        title={material.code}
                                                    />
                                                    <span className="font-mono text-[12px] font-semibold text-[#475569]">
                                                        {material.code}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] font-semibold text-[#050315]">
                                                <div className="flex items-center gap-2.5">
                                                    {material.icon_url ? (
                                                        <img
                                                            src={
                                                                material.icon_url
                                                            }
                                                            alt=""
                                                            className="size-8 rounded-[7.5px] object-cover"
                                                        />
                                                    ) : (
                                                        <span className="flex size-8 items-center justify-center rounded-[7.5px] bg-[#f1f5f9] text-[10px] font-semibold text-[#94a3b8]">
                                                            —
                                                        </span>
                                                    )}
                                                    <span>{material.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openView(material)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#eff6ff]"
                                                    aria-label={`View products for ${material.name}`}
                                                >
                                                    {(material.products ?? [])
                                                        .length === 0
                                                        ? 'No products'
                                                        : `${material.products_count} product${material.products_count === 1 ? '' : 's'}`}
                                                </button>
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2.5 py-1 text-[11.25px] font-semibold',
                                                        material.is_active
                                                            ? 'bg-[#f0fdf4] text-[#008236]'
                                                            : 'bg-[#f1f5f9] text-[#475569]',
                                                    )}
                                                >
                                                    {material.status}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] text-[#475569]">
                                                {material.updated_at}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openView(material)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                                                        aria-label={`View ${material.name}`}
                                                    >
                                                        View
                                                    </button>
                                                    {canUpdate ? (
                                                        <Link
                                                            href={materialsEdit.url(
                                                                material.id,
                                                            )}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#dbeafe]"
                                                            aria-label={`Edit ${material.name}`}
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
                                                            onClick={() => {
                                                                setViewTarget(
                                                                    null,
                                                                );
                                                                setDeleteTarget(
                                                                    material,
                                                                );
                                                            }}
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            aria-label={`Delete ${material.name}`}
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
                                            onClick={() =>
                                                navigate({ page })
                                            }
                                            className={cn(
                                                'rounded-[9.375px] border px-[9px] py-[5px] text-[11.25px] font-semibold',
                                                page ===
                                                    pagination.current_page
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
                open={viewTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeView();
                    }
                }}
                title="Material details"
                className="max-w-[720px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Material details
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {viewTarget ? viewTarget.name : 'Material'}
                        </p>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeView}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569]"
                        >
                            Close
                        </button>
                        {viewTarget && canUpdate ? (
                            <Link
                                href={materialsEdit.url(viewTarget.id)}
                                className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white"
                            >
                                Edit Material
                            </Link>
                        ) : null}
                    </div>
                }
            >
                {viewTarget ? (
                    <div className="space-y-5 px-[22.5px] py-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
                                <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                    Color
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className="size-6 rounded-[6px] border border-[#e2e8f0]"
                                        style={{
                                            backgroundColor: viewTarget.code,
                                        }}
                                    />
                                    <span className="font-mono text-[13.125px] font-semibold text-[#050315]">
                                        {viewTarget.code}
                                    </span>
                                </div>
                            </div>
                            <DetailField
                                label="Name"
                                value={viewTarget.name}
                            />
                            <DetailField
                                label="Status"
                                value={viewTarget.status}
                            />
                            <DetailField
                                label="Updated"
                                value={viewTarget.updated_at}
                            />
                            <DetailField
                                label="Linked products"
                                value={String(viewTarget.products_count)}
                            />
                            {viewTarget.icon_url ? (
                                <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
                                    <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                        Icon
                                    </p>
                                    <img
                                        src={viewTarget.icon_url}
                                        alt=""
                                        className="mt-2 size-12 rounded-[7.5px] object-cover"
                                    />
                                </div>
                            ) : (
                                <DetailField label="Icon" value="None" />
                            )}
                        </div>

                        <div>
                            <p className={labelClassName}>Products</p>
                            {(viewTarget.products ?? []).length === 0 ? (
                                <p className="rounded-[9.375px] border border-dashed border-[#e2e8f0] bg-[#f9fafb] px-3 py-4 text-[13.125px] text-[#475569]">
                                    No products are linked to this material.
                                </p>
                            ) : (
                                <div className="overflow-hidden rounded-[9.375px] border border-[#e2e8f0]">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                                <th className="px-3 py-2">
                                                    Product
                                                </th>
                                                <th className="px-3 py-2">
                                                    Default
                                                </th>
                                                <th className="px-3 py-2">
                                                    Sort
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewTarget.products.map(
                                                (product) => (
                                                    <tr
                                                        key={product.id}
                                                        className="border-b border-[#e2e8f0] last:border-b-0"
                                                    >
                                                        <td className="px-3 py-2.5 text-[13.125px] text-[#050315]">
                                                            <span className="font-mono font-semibold text-[#0260bd]">
                                                                {product.code}
                                                            </span>
                                                            <span className="mt-0.5 block text-[12px] text-[#475569]">
                                                                {product.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            {product.is_default ? (
                                                                <span className="rounded-full bg-[#0260bd] px-2 py-0.5 text-[10px] font-semibold text-white">
                                                                    Default
                                                                </span>
                                                            ) : (
                                                                <span className="text-[12px] text-[#94a3b8]">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[13.125px] text-[#475569]">
                                                            {
                                                                product.sort_order
                                                            }
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </AdminModal>

            <AdminModal
                open={deleteTarget !== null && canDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDelete();
                    }
                }}
                title="Delete material"
                className="max-w-[480px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Delete material
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
                            {deleting ? 'Deleting...' : 'Delete Material'}
                        </button>
                    </div>
                }
            >
                <p className="px-[22.5px] py-5 text-[13.125px] text-[#475569]">
                    Delete{' '}
                    <span className="font-semibold text-[#050315]">
                        {deleteTarget?.name}
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

function buildPageNumbers(
    current: number,
    last: number,
): Array<number | '…'> {
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

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
            <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                {label}
            </p>
            <p className="mt-1 text-[13.125px] font-semibold text-[#050315]">
                {value}
            </p>
        </div>
    );
}
