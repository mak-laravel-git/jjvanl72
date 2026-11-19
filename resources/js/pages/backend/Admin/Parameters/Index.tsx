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
    create as parametersCreate,
    destroy,
    edit as parametersEdit,
    index as parametersIndex,
} from '@/routes/admin/parameters';
import type { PaginationData } from '@/types/data-table.types';
import type { SharedData } from '@/types';
import type {
    GroupOption,
    MaterialOption,
    ParameterRow,
    ProductOption,
    TypeOption,
} from './FormFields';

const asset = (name: string) => `/images/admin-dashboard/${name}`;
const ALL_GROUPS_VALUE = '__all_groups__';
const ALL_PRODUCTS_VALUE = '__all_products__';
const ALL_MATERIALS_VALUE = '__all_materials__';
const ALL_TYPES_VALUE = '__all_types__';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

type Props = {
    parameters: ParameterRow[];
    pagination: PaginationData;
    offset: number;
    search: string;
    filters: Record<string, unknown>;
    sort_by: string;
    sort_order: 'asc' | 'desc' | string;
    groupOptions: GroupOption[];
    productOptions: ProductOption[];
    materialOptions: MaterialOption[];
    typeOptions: TypeOption[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
};

type SortableColumn = 'name' | 'field_name' | 'type' | 'updated_at' | 'id';

function formatRelationLabel(
    code: string | null | undefined,
    name: string | null | undefined,
): string {
    if (code && name) {
        return `${code} — ${name}`;
    }

    if (name) {
        return name;
    }

    if (code) {
        return code;
    }

    return '—';
}

export default function ParametersIndex({
    parameters,
    pagination,
    offset,
    search: searchProp,
    filters,
    sort_by,
    sort_order,
    groupOptions,
    productOptions,
    materialOptions,
    typeOptions,
    canCreate = false,
    canUpdate = false,
    canDelete = false,
}: Props) {
    const { flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;

    const [search, setSearch] = useState(searchProp ?? '');
    const groupFilter = String(filters?.group_id ?? '');
    const productFilter = String(filters?.product_id ?? '');
    const materialFilter = String(filters?.material_id ?? '');
    const typeFilter = String(filters?.type ?? '');
    const [viewTarget, setViewTarget] = useState<ParameterRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ParameterRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                sort_by: sort_by || undefined,
                sort_order: sort_by ? sort_order || 'asc' : undefined,
                per_page: pagination.per_page,
                page: pagination.current_page,
                ...(groupFilter ? { 'filters[group_id]': groupFilter } : {}),
                ...(productFilter
                    ? { 'filters[product_id]': productFilter }
                    : {}),
                ...(materialFilter
                    ? { 'filters[material_id]': materialFilter }
                    : {}),
                ...(typeFilter ? { 'filters[type]': typeFilter } : {}),
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            router.get(parametersIndex.url(), params, {
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
            groupFilter,
            productFilter,
            materialFilter,
            typeFilter,
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

    const filterByGroup = (value: string) => {
        navigate({
            'filters[group_id]': value || undefined,
            page: 1,
        });
    };

    const filterByProduct = (value: string) => {
        navigate({
            'filters[product_id]': value || undefined,
            page: 1,
        });
    };

    const filterByMaterial = (value: string) => {
        navigate({
            'filters[material_id]': value || undefined,
            page: 1,
        });
    };

    const filterByType = (value: string) => {
        navigate({
            'filters[type]': value || undefined,
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

    const openView = (parameter: ParameterRow) => {
        setDeleteTarget(null);
        setViewTarget(parameter);
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

    const parameterSummary = (parameter: ParameterRow) =>
        `${parameter.type_label} · ${formatRelationLabel(parameter.product_code, parameter.product_name)}`;

    return (
        <AdminLayout>
            <Head title="Parameters" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Parameters
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Manage product parameters, inputs, and options
                        </p>
                    </div>

                    {canCreate ? (
                        <Link
                            href={parametersCreate.url()}
                            className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-plus-white.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Add Parameter
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
                            placeholder="Search by name, field, group, product, or material..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    <Select
                        value={groupFilter || ALL_GROUPS_VALUE}
                        onValueChange={(value) =>
                            filterByGroup(
                                value === ALL_GROUPS_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by group"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All groups" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_GROUPS_VALUE}>
                                All groups
                            </SelectItem>
                            {groupOptions.map((group) => (
                                <SelectItem
                                    key={group.id}
                                    value={String(group.id)}
                                >
                                    {group.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={productFilter || ALL_PRODUCTS_VALUE}
                        onValueChange={(value) =>
                            filterByProduct(
                                value === ALL_PRODUCTS_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by product"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All products" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PRODUCTS_VALUE}>
                                All products
                            </SelectItem>
                            {productOptions.map((product) => (
                                <SelectItem
                                    key={product.id}
                                    value={String(product.id)}
                                >
                                    {product.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={materialFilter || ALL_MATERIALS_VALUE}
                        onValueChange={(value) =>
                            filterByMaterial(
                                value === ALL_MATERIALS_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by material"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All materials" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_MATERIALS_VALUE}>
                                All materials
                            </SelectItem>
                            {materialOptions.map((material) => (
                                <SelectItem
                                    key={material.id}
                                    value={String(material.id)}
                                >
                                    {material.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={typeFilter || ALL_TYPES_VALUE}
                        onValueChange={(value) =>
                            filterByType(
                                value === ALL_TYPES_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by type"
                            className="h-10 w-[160px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_TYPES_VALUE}>
                                All types
                            </SelectItem>
                            {typeOptions.map((type) => (
                                <SelectItem
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </SelectItem>
                            ))}
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
                        <table className="w-full min-w-[1180px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">#</th>
                                    <SortHeader
                                        column="name"
                                        label="Name"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <SortHeader
                                        column="field_name"
                                        label="Field"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <SortHeader
                                        column="type"
                                        label="Type"
                                        activeColumn={sort_by}
                                        activeOrder={sort_order}
                                        onSort={toggleSort}
                                    />
                                    <th className="px-[19px] py-[11px]">
                                        Group
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Product
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Material
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Options
                                    </th>
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
                                {parameters.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No parameters match the current
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    parameters.map((parameter, index) => (
                                        <tr
                                            key={parameter.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < parameters.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td className="px-[19px] py-[14px] text-[11.25px] text-[#475569]">
                                                {offset + index + 1}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] font-semibold text-[#050315]">
                                                {parameter.name}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span className="font-mono text-[13.125px] font-semibold text-[#0260bd]">
                                                    {parameter.field_name}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11.25px] font-semibold text-[#0260bd]">
                                                    {parameter.type_label}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] text-[#475569]">
                                                {formatRelationLabel(
                                                    parameter.group_code,
                                                    parameter.group_name,
                                                )}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] text-[#475569]">
                                                {formatRelationLabel(
                                                    parameter.product_code,
                                                    parameter.product_name,
                                                )}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] text-[#475569]">
                                                {formatRelationLabel(
                                                    parameter.material_code,
                                                    parameter.material_name,
                                                )}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openView(parameter)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#eff6ff]"
                                                    aria-label={`View options for ${parameter.name}`}
                                                >
                                                    {parameter.options_count ===
                                                    0
                                                        ? 'No options'
                                                        : `${parameter.options_count} option${parameter.options_count === 1 ? '' : 's'}`}
                                                </button>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] text-[#475569]">
                                                {parameter.updated_at}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center justify-end gap-[1.875px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openView(parameter)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#475569] hover:bg-[#f8fafc]"
                                                        aria-label={`View ${parameter.name}`}
                                                    >
                                                        View
                                                    </button>
                                                    {canUpdate ? (
                                                        <Link
                                                            href={parametersEdit.url(
                                                                parameter.id,
                                                            )}
                                                            className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#dbeafe]"
                                                            aria-label={`Edit parameter ${parameter.id}`}
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
                                                                    parameter,
                                                                );
                                                            }}
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            aria-label={`Delete parameter ${parameter.id}`}
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
                title="Parameter details"
                className="max-w-[720px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Parameter details
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {viewTarget
                                ? parameterSummary(viewTarget)
                                : 'Parameter'}
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
                                href={parametersEdit.url(viewTarget.id)}
                                className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white"
                            >
                                Edit Parameter
                            </Link>
                        ) : null}
                    </div>
                }
            >
                {viewTarget ? (
                    <div className="space-y-5 px-[22.5px] py-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailField
                                label="Name"
                                value={viewTarget.name}
                            />
                            <DetailField
                                label="Field name"
                                value={viewTarget.field_name}
                            />
                            <DetailField
                                label="Type"
                                value={viewTarget.type_label}
                            />
                            <DetailField
                                label="Group"
                                value={formatRelationLabel(
                                    viewTarget.group_code,
                                    viewTarget.group_name,
                                )}
                            />
                            <DetailField
                                label="Product"
                                value={formatRelationLabel(
                                    viewTarget.product_code,
                                    viewTarget.product_name,
                                )}
                            />
                            <DetailField
                                label="Material"
                                value={formatRelationLabel(
                                    viewTarget.material_code,
                                    viewTarget.material_name,
                                )}
                            />
                            <DetailField
                                label="Updated"
                                value={viewTarget.updated_at}
                            />
                            <DetailField
                                label="Options"
                                value={String(viewTarget.options_count)}
                            />
                        </div>

                        <div>
                            <p className={labelClassName}>
                                {viewTarget.type === 'input'
                                    ? 'Input fields'
                                    : 'Options'}
                            </p>
                            {(viewTarget.options ?? []).length === 0 ? (
                                <p className="rounded-[9.375px] border border-dashed border-[#e2e8f0] bg-[#f9fafb] px-3 py-4 text-[13.125px] text-[#475569]">
                                    No options are linked to this parameter.
                                </p>
                            ) : (
                                <div className="overflow-hidden rounded-[9.375px] border border-[#e2e8f0]">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                                <th className="px-3 py-2">
                                                    Name
                                                </th>
                                                {viewTarget.type ===
                                                'input' ? (
                                                    <>
                                                        <th className="px-3 py-2">
                                                            Field name
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Placeholder
                                                        </th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-3 py-2">
                                                            Value
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Color
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Icon
                                                        </th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewTarget.options.map(
                                                (option) => (
                                                    <tr
                                                        key={option.id}
                                                        className="border-b border-[#e2e8f0] last:border-b-0"
                                                    >
                                                        <td className="px-3 py-2.5 text-[13.125px] font-semibold text-[#050315]">
                                                            {option.label}
                                                        </td>
                                                        {viewTarget.type ===
                                                        'input' ? (
                                                            <>
                                                                <td className="px-3 py-2.5 font-mono text-[13.125px] text-[#0260bd]">
                                                                    {option.field_name ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-[13.125px] text-[#475569]">
                                                                    {option.placeholder ??
                                                                        '—'}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-3 py-2.5 text-[13.125px] text-[#475569]">
                                                                    {option.value ??
                                                                        '—'}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    {option.color ? (
                                                                        <span className="inline-flex items-center gap-2 text-[13.125px] text-[#475569]">
                                                                            <span
                                                                                className="size-4 rounded-[4px] border border-[#e2e8f0]"
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        option.color,
                                                                                }}
                                                                                aria-hidden
                                                                            />
                                                                            <span className="font-mono">
                                                                                {
                                                                                    option.color
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[12px] text-[#94a3b8]">
                                                                            —
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    {option.image_url ? (
                                                                        <img
                                                                            src={
                                                                                option.image_url
                                                                            }
                                                                            alt=""
                                                                            className="size-10 rounded-[7.5px] object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-[12px] text-[#94a3b8]">
                                                                            —
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}
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
                title="Delete parameter"
                className="max-w-[480px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Delete parameter
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
                            {deleting ? 'Deleting...' : 'Delete Parameter'}
                        </button>
                    </div>
                }
            >
                <p className="px-[22.5px] py-5 text-[13.125px] text-[#475569]">
                    Delete{' '}
                    <span className="font-semibold text-[#050315]">
                        {deleteTarget?.type_label}
                    </span>{' '}
                    parameter for{' '}
                    <span className="font-semibold text-[#050315]">
                        {deleteTarget
                            ? formatRelationLabel(
                                  deleteTarget.product_code,
                                  deleteTarget.product_name,
                              )
                            : 'this product'}
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
