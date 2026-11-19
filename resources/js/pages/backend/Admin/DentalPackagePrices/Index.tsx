import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import {
    create as packagePricesCreate,
    destroy,
    edit as packagePricesEdit,
    index as packagePricesIndex,
} from '@/routes/admin/dental-package-prices';
import type { PaginationData } from '@/types/data-table.types';
import type { SharedData } from '@/types';

import type { GroupOption, PackagePriceRow, ProductOption } from './FormFields';

const ALL_GROUPS_VALUE = '__all_groups__';
const ALL_PRODUCTS_VALUE = '__all_products__';

type Props = {
    packagePrices: PackagePriceRow[];
    pagination: PaginationData;
    offset: number;
    search: string;
    filters: Record<string, unknown>;
    productOptions: ProductOption[];
    groupOptions: GroupOption[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
};

function money(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
    }).format(Number(amount || 0));
}

export default function DentalPackagePricesIndex({
    packagePrices,
    pagination,
    offset,
    search: searchProp,
    filters,
    productOptions,
    groupOptions,
    canCreate = false,
    canUpdate = false,
    canDelete = false,
}: Props) {
    const { flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;

    const [search, setSearch] = useState(searchProp ?? '');
    const [deleteTarget, setDeleteTarget] = useState<PackagePriceRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const groupFilter = String(
        filters?.['product.dental_product_group_id'] ?? '',
    );
    const productFilter = String(filters?.dental_product_id ?? '');

    const productsForSelect = useMemo(() => {
        if (!groupFilter) {
            return productOptions;
        }

        const groupId = Number(groupFilter);

        return productOptions.filter(
            (product) => product.dental_product_group_id === groupId,
        );
    }, [groupFilter, productOptions]);

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                per_page: pagination.per_page,
                page: pagination.current_page,
                ...(groupFilter
                    ? {
                          'filters[product.dental_product_group_id]':
                              groupFilter,
                      }
                    : {}),
                ...(productFilter
                    ? { 'filters[dental_product_id]': productFilter }
                    : {}),
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            router.get(packagePricesIndex.url(), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [
            search,
            pagination.per_page,
            pagination.current_page,
            groupFilter,
            productFilter,
        ],
    );

    useEffect(() => {
        setSearch(searchProp ?? '');
    }, [searchProp]);

    const filterByGroup = (value: string) => {
        const nextGroup = value || undefined;
        let nextProduct: string | undefined = productFilter || undefined;

        if (nextGroup && nextProduct) {
            const groupId = Number(nextGroup);
            const productId = Number(nextProduct);
            const stillInGroup = productOptions.some(
                (product) =>
                    product.id === productId &&
                    product.dental_product_group_id === groupId,
            );

            if (!stillInGroup) {
                nextProduct = undefined;
            }
        }

        navigate({
            'filters[product.dental_product_group_id]': nextGroup,
            'filters[dental_product_id]': nextProduct,
            page: 1,
        });
    };

    const filterByProduct = (value: string) => {
        navigate({
            'filters[dental_product_id]': value || undefined,
            page: 1,
        });
    };

    return (
        <AdminLayout>
            <Head title="Package Prices" />

            <div className="space-y-5 p-6">
                {flash?.success ? (
                    <div className="rounded-[9.375px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
                        {flash.success}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Package prices
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] text-[#475569]">
                            Default prices per product, material, and service
                            package
                        </p>
                    </div>
                    {canCreate ? (
                        <Link
                            href={packagePricesCreate.url()}
                            className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white"
                        >
                            Add package price
                        </Link>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form
                        className="flex gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            navigate({ page: 1, search: search || undefined });
                        }}
                    >
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search product or service…"
                            className="h-10 w-full max-w-md rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]"
                        />
                        <button
                            type="submit"
                            className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-2 text-[13.125px] font-medium text-[#050315]"
                        >
                            Search
                        </button>
                    </form>

                    <Select
                        value={groupFilter || ALL_GROUPS_VALUE}
                        onValueChange={(value) =>
                            filterByGroup(
                                value === ALL_GROUPS_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by product group"
                            className="h-10 w-[220px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
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
                            aria-label="Filter by dental product"
                            className="h-10 w-[260px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All products" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PRODUCTS_VALUE}>
                                All products
                            </SelectItem>
                            {productsForSelect.map((product) => (
                                <SelectItem
                                    key={product.id}
                                    value={String(product.id)}
                                >
                                    {product.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#f8fafc] text-[11px] tracking-wide text-[#64748b] uppercase">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Material</th>
                                <th className="px-4 py-3">Package</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Updated</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packagePrices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-[#64748b]"
                                    >
                                        No package prices yet.
                                    </td>
                                </tr>
                            ) : (
                                packagePrices.map((row, index) => (
                                    <tr
                                        key={row.id}
                                        className="border-t border-[#e2e8f0]"
                                    >
                                        <td className="px-4 py-3 text-[#64748b]">
                                            {offset + index + 1}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-[#050315]">
                                            {row.product?.label ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-[#334155]">
                                            {row.material?.label ?? 'Any'}
                                        </td>
                                        <td className="px-4 py-3 text-[#334155]">
                                            <div>{row.service_label}</div>
                                            {row.output_label ? (
                                                <div className="text-[12px] text-[#64748b]">
                                                    {row.output_label}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-[#050315]">
                                            {money(row.price)}
                                        </td>
                                        <td className="px-4 py-3 text-[#64748b]">
                                            {row.updated_at}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                {canUpdate ? (
                                                    <Link
                                                        href={packagePricesEdit.url(
                                                            row.id,
                                                        )}
                                                        className="text-[#0260bd]"
                                                    >
                                                        Edit
                                                    </Link>
                                                ) : null}
                                                {canDelete ? (
                                                    <button
                                                        type="button"
                                                        className="text-red-600"
                                                        onClick={() =>
                                                            setDeleteTarget(row)
                                                        }
                                                    >
                                                        Delete
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

                {pagination.last_page > 1 ? (
                    <div className="flex items-center justify-between text-[13px] text-[#64748b]">
                        <span>
                            Page {pagination.current_page} of{' '}
                            {pagination.last_page}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={pagination.current_page <= 1}
                                className="rounded border px-3 py-1 disabled:opacity-40"
                                onClick={() =>
                                    navigate({
                                        page: pagination.current_page - 1,
                                    })
                                }
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={
                                    pagination.current_page >=
                                    pagination.last_page
                                }
                                className="rounded border px-3 py-1 disabled:opacity-40"
                                onClick={() =>
                                    navigate({
                                        page: pagination.current_page + 1,
                                    })
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            <AdminModal
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                title="Delete package price"
            >
                <p className="text-[13px] text-[#475569]">
                    Delete this package price permanently? Dentists will fall
                    back to $0 until a new default is set.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-[9.375px] border px-4 py-2 text-[13px]"
                        onClick={() => setDeleteTarget(null)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={deleting || !deleteTarget}
                        className="rounded-[9.375px] bg-red-600 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                        onClick={() => {
                            if (!deleteTarget) {
                                return;
                            }

                            setDeleting(true);
                            router.delete(destroy.url(deleteTarget.id), {
                                onFinish: () => {
                                    setDeleting(false);
                                    setDeleteTarget(null);
                                },
                            });
                        }}
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}
