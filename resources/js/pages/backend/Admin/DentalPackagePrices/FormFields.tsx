import { useMemo, useState } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

const NONE_MATERIAL = '__none_material__';

export type Option = {
    value: string;
    label: string;
};

export type ProductOption = {
    id: number;
    code: string;
    name: string;
    label: string;
    dental_product_group_id?: number | null;
};

export type GroupOption = {
    id: number;
    name: string;
    label: string;
};

export type MaterialOption = {
    id: number;
    code: string;
    name: string;
    label: string;
    product_ids: number[];
};

export type PackagePriceRow = {
    id: number;
    dental_product_id: number;
    dental_material_id: number | null;
    service: string;
    output: string | null;
    price: number;
    service_label?: string | null;
    output_label?: string | null;
    product?: ProductOption | null;
    material?: Omit<MaterialOption, 'product_ids'> | null;
    updated_at?: string;
};

type Props = {
    errors?: Record<string, string>;
    defaults?: Partial<PackagePriceRow>;
    productOptions: ProductOption[];
    materialOptions: MaterialOption[];
    serviceOptions: Option[];
    outputOptions: Option[];
};

export function PackagePriceFormFields({
    errors = {},
    defaults,
    productOptions,
    materialOptions,
    serviceOptions,
    outputOptions,
}: Props) {
    const [productId, setProductId] = useState(
        String(defaults?.dental_product_id ?? ''),
    );
    const [materialId, setMaterialId] = useState(
        defaults?.dental_material_id != null
            ? String(defaults.dental_material_id)
            : NONE_MATERIAL,
    );
    const [service, setService] = useState(defaults?.service ?? 'design');
    const [output, setOutput] = useState(defaults?.output ?? 'appliance');

    const requiresManufacture = service === 'manufacture';

    const filteredMaterials = useMemo(() => {
        const id = Number(productId);

        if (!id) {
            return materialOptions;
        }

        return materialOptions.filter((material) =>
            material.product_ids.includes(id),
        );
    }, [materialOptions, productId]);

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <div>
                <label className={labelClassName}>Product</label>
                <input type="hidden" name="dental_product_id" value={productId} />
                <Select
                    value={productId || undefined}
                    onValueChange={(value) => {
                        setProductId(value);
                        setMaterialId(NONE_MATERIAL);
                    }}
                >
                    <SelectTrigger className={inputClassName}>
                        <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
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
                {errors.dental_product_id ? (
                    <p className="mt-1 text-[12px] text-red-600">
                        {errors.dental_product_id}
                    </p>
                ) : null}
            </div>

            <div>
                <label className={labelClassName}>Material (optional)</label>
                <input
                    type="hidden"
                    name="dental_material_id"
                    value={materialId === NONE_MATERIAL ? '' : materialId}
                />
                <Select value={materialId} onValueChange={setMaterialId}>
                    <SelectTrigger className={inputClassName}>
                        <SelectValue placeholder="Any / no material" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE_MATERIAL}>
                            Any / no material
                        </SelectItem>
                        {filteredMaterials.map((material) => (
                            <SelectItem
                                key={material.id}
                                value={String(material.id)}
                            >
                                {material.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.dental_material_id ? (
                    <p className="mt-1 text-[12px] text-red-600">
                        {errors.dental_material_id}
                    </p>
                ) : null}
            </div>

            <div>
                <label className={labelClassName}>Service</label>
                <input type="hidden" name="service" value={service} />
                <Select value={service} onValueChange={setService}>
                    <SelectTrigger className={inputClassName}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.service ? (
                    <p className="mt-1 text-[12px] text-red-600">
                        {errors.service}
                    </p>
                ) : null}
            </div>

            <div>
                <label className={labelClassName}>Price (AUD)</label>
                <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    defaultValue={defaults?.price ?? ''}
                    className={inputClassName}
                    required
                />
                {errors.price ? (
                    <p className="mt-1 text-[12px] text-red-600">
                        {errors.price}
                    </p>
                ) : null}
            </div>

            {requiresManufacture ? (
                <>
                    <div>
                        <label className={labelClassName}>Output</label>
                        <input type="hidden" name="output" value={output} />
                        <Select value={output} onValueChange={setOutput}>
                            <SelectTrigger className={inputClassName}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {outputOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.output ? (
                            <p className="mt-1 text-[12px] text-red-600">
                                {errors.output}
                            </p>
                        ) : null}
                    </div>
                    <p className="text-[13px] text-[#64748b]">
                        Manufacturing method follows the material, so it is not
                        priced separately.
                    </p>
                </>
            ) : (
                <p className="md:col-span-2 text-[13px] text-[#64748b]">
                    Design / approve packages do not vary by output.
                </p>
            )}
        </div>
    );
}
