import { Form, Head, router, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { destroy, store, update } from '@/routes/admin/products';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type Product = {
    id: number;
    name: string;
    category: string;
    category_tone: string;
    material: string;
    design_price: string;
    mfg_price: string;
    rush_fee: string;
    design_price_amount: string;
    mfg_price_amount: string;
    rush_fee_amount: string;
    created_by: string;
    created_at: string;
};

type Props = {
    products: Product[];
    categories: string[];
    canCreateProducts?: boolean;
    canUpdateProducts?: boolean;
    canDeleteProducts?: boolean;
};

const categoryClasses: Record<string, string> = {
    fixed: 'bg-[#eff6ff] text-[#0260bd]',
    removable: 'bg-[#faf5ff] text-[#8200db]',
};

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

export default function ProductsServices({
    products,
    categories,
    canCreateProducts = false,
    canUpdateProducts = false,
    canDeleteProducts = false,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [viewTarget, setViewTarget] = useState<Product | null>(null);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    const closeCreate = () => setCreateOpen(false);
    const closeView = () => setViewTarget(null);
    const closeEdit = () => setEditTarget(null);

    const openView = (product: Product) => {
        setEditTarget(null);
        setDeleteTarget(null);
        setCreateOpen(false);
        setViewTarget(product);
    };

    const openEdit = (product: Product) => {
        if (!canUpdateProducts) {
            return;
        }

        setViewTarget(null);
        setDeleteTarget(null);
        setCreateOpen(false);
        setEditTarget(product);
    };

    const openDelete = (product: Product) => {
        if (!canDeleteProducts) {
            return;
        }

        setViewTarget(null);
        setEditTarget(null);
        setCreateOpen(false);
        setDeleteTarget(product);
    };

    const closeDelete = () => {
        setDeleteTarget(null);
        setDeleting(false);
    };

    const confirmDelete = () => {
        if (!deleteTarget || !canDeleteProducts || deleting) {
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

    return (
        <AdminLayout>
            <Head title="Products & Services" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Products & Services
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Dental product catalog and pricing
                        </p>
                    </div>

                    {canCreateProducts ? (
                        <button
                            type="button"
                            onClick={() => {
                                setViewTarget(null);
                                setEditTarget(null);
                                setDeleteTarget(null);
                                setCreateOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-4 py-2.5 text-[13.125px] font-semibold text-white"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-plus.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Add Product
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

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Product
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Category
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Material
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Design Price
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Mfg Price
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Rush Fee
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No products yet. Add your first
                                            catalog item to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product, index) => (
                                        <tr
                                            key={product.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < products.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                {product.name}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-[7.5px] py-[1.5px] text-[11.25px] leading-[15px] font-semibold',
                                                        categoryClasses[
                                                            product
                                                                .category_tone
                                                        ] ??
                                                            categoryClasses.fixed,
                                                    )}
                                                >
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {product.material}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-bold text-[#050315]">
                                                {product.design_price}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-bold text-[#050315]">
                                                {product.mfg_price}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-semibold text-[#ea580c]">
                                                {product.rush_fee}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center gap-[1.875px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openView(product)
                                                        }
                                                        className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                        title="View product"
                                                        aria-label={`View ${product.name}`}
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
                                                    </button>
                                                    {canUpdateProducts ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    product,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            title="Edit product"
                                                            aria-label={`Edit ${product.name}`}
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
                                                        </button>
                                                    ) : null}
                                                    {canDeleteProducts ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDelete(
                                                                    product,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] text-[#dc2626] hover:bg-red-50"
                                                            title="Delete product"
                                                            aria-label={`Delete ${product.name}`}
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
                </div>
            </div>

            <AdminModal
                open={createOpen && canCreateProducts}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreate();
                    }
                }}
                title="Add product"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Add product
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            Create a new catalog item with design and
                            manufacturing pricing
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
                        <ProductFormFields
                            categories={categories}
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
                                            : 'Save Product'}
                                    </button>
                                </div>
                            }
                        />
                    )}
                </Form>
            </AdminModal>

            <AdminModal
                open={viewTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeView();
                    }
                }}
                title="View product"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Product details
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {viewTarget?.name ?? 'Catalog item'}
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
                        {viewTarget && canUpdateProducts ? (
                            <button
                                type="button"
                                onClick={() => openEdit(viewTarget)}
                                className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white"
                            >
                                Edit Product
                            </button>
                        ) : null}
                    </div>
                }
            >
                {viewTarget ? (
                    <div className="grid gap-3 px-[22.5px] py-5 sm:grid-cols-2">
                        <DetailField label="Product" value={viewTarget.name} />
                        <DetailField
                            label="Category"
                            value={viewTarget.category}
                        />
                        <DetailField
                            label="Material"
                            value={viewTarget.material}
                        />
                        <DetailField
                            label="Design Price"
                            value={viewTarget.design_price}
                        />
                        <DetailField
                            label="Manufacturing Price"
                            value={viewTarget.mfg_price}
                        />
                        <DetailField
                            label="Rush Fee"
                            value={viewTarget.rush_fee}
                        />
                        <DetailField
                            label="Created By"
                            value={viewTarget.created_by}
                        />
                        <DetailField
                            label="Created At"
                            value={viewTarget.created_at}
                        />
                    </div>
                ) : null}
            </AdminModal>

            <AdminModal
                open={editTarget !== null && canUpdateProducts}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEdit();
                    }
                }}
                title="Edit product"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Edit product
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {editTarget
                                ? `Update pricing and details for ${editTarget.name}`
                                : 'Update catalog item'}
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
                            <ProductFormFields
                                categories={categories}
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
                open={deleteTarget !== null && canDeleteProducts}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDelete();
                    }
                }}
                title="Delete product"
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
                            {deleteTarget.category} · {deleteTarget.material}
                            <br />
                            Design {deleteTarget.design_price} · Mfg{' '}
                            {deleteTarget.mfg_price} · Rush{' '}
                            {deleteTarget.rush_fee}
                        </div>
                    </div>
                ) : null}
            </AdminModal>
        </AdminLayout>
    );
}

function ProductFormFields({
    categories,
    errors,
    defaults,
    footer,
}: {
    categories: string[];
    errors: Record<string, string>;
    defaults?: Product;
    footer: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="name" className={labelClassName}>
                    Product name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={defaults?.name ?? ''}
                    placeholder="e.g. Porcelain Crown"
                    className={inputClassName}
                />
                {errors.name ? (
                    <p className="mt-2 text-[12px] text-[#c10007]">
                        {errors.name}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="category" className={labelClassName}>
                        Category
                    </label>
                    <select
                        id="category"
                        name="category"
                        required
                        defaultValue={defaults?.category ?? categories[0] ?? ''}
                        className={inputClassName}
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    {errors.category ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.category}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="material" className={labelClassName}>
                        Material
                    </label>
                    <input
                        id="material"
                        name="material"
                        type="text"
                        required
                        defaultValue={defaults?.material ?? ''}
                        placeholder="e.g. Zirconia"
                        className={inputClassName}
                    />
                    {errors.material ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.material}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label htmlFor="design_price" className={labelClassName}>
                        Design price
                    </label>
                    <input
                        id="design_price"
                        name="design_price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={defaults?.design_price_amount ?? ''}
                        placeholder="85.00"
                        className={inputClassName}
                    />
                    {errors.design_price ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.design_price}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="mfg_price" className={labelClassName}>
                        Mfg price
                    </label>
                    <input
                        id="mfg_price"
                        name="mfg_price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={defaults?.mfg_price_amount ?? ''}
                        placeholder="220.00"
                        className={inputClassName}
                    />
                    {errors.mfg_price ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.mfg_price}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="rush_fee" className={labelClassName}>
                        Rush fee
                    </label>
                    <input
                        id="rush_fee"
                        name="rush_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={defaults?.rush_fee_amount ?? ''}
                        placeholder="45.00"
                        className={inputClassName}
                    />
                    {errors.rush_fee ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.rush_fee}
                        </p>
                    ) : null}
                </div>
            </div>

            {footer}
        </div>
    );
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
