import { Plus } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import FileUpload, { type ExistingFile } from '@/components/file-upload';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EMPTY_PRODUCT_VALUE = '__select_product__';
const DEFAULT_COLOR = '#0260BD';

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

function iconMimeType(path: string | null | undefined): string {
    const lower = (path ?? '').toLowerCase();

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        return 'image/jpeg';
    }

    return 'image/png';
}

function normalizeHexColor(value: string | null | undefined): string {
    const trimmed = (value ?? '').trim().toUpperCase();

    if (/^#[0-9A-F]{6}$/.test(trimmed)) {
        return trimmed;
    }

    if (/^[0-9A-F]{6}$/.test(trimmed)) {
        return `#${trimmed}`;
    }

    return DEFAULT_COLOR;
}

export type PivotLink = {
    id: number;
    code: string;
    name: string;
    sort_order: number;
    is_default: boolean;
};

export type MaterialRow = {
    id: number;
    code: string;
    name: string;
    icon: string | null;
    icon_url: string | null;
    is_active: boolean;
    status: string;
    products_count: number;
    products: PivotLink[];
    updated_at: string;
};

export type ProductOption = {
    id: number;
    code: string;
    name: string;
    label: string;
};

type ProductFormRow = {
    productId: string;
    is_default: boolean;
};

function mapProductsToFormRows(
    products: PivotLink[] | undefined,
): ProductFormRow[] {
    if (!products?.length) {
        return [];
    }

    return products.map((product) => ({
        productId: String(product.id),
        is_default: product.is_default,
    }));
}

function productFieldError(
    errors: Partial<Record<string, string>>,
    index: number,
    field: 'id' | 'is_default',
): string | undefined {
    return errors[`products.${index}.${field}`];
}

export function MaterialFormFields({
    errors,
    defaults,
    productOptions,
    footer,
}: {
    errors: Partial<Record<string, string>>;
    defaults?: Partial<MaterialRow>;
    productOptions: ProductOption[];
    footer?: ReactNode;
}) {
    const [productRows, setProductRows] = useState<ProductFormRow[]>(() =>
        mapProductsToFormRows(defaults?.products),
    );
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [existingIcon, setExistingIcon] = useState<ExistingFile[]>(
        defaults?.icon_url
            ? [
                  {
                      id: 'current-icon',
                      path: defaults.icon ?? 'icon',
                      url: defaults.icon_url,
                      mime_type: iconMimeType(defaults.icon),
                      name: 'Current icon',
                  },
              ]
            : [],
    );
    const [removeIcon, setRemoveIcon] = useState(false);
    const [color, setColor] = useState(() =>
        normalizeHexColor(defaults?.code),
    );
    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setProductRows(mapProductsToFormRows(defaults?.products));
        setColor(normalizeHexColor(defaults?.code));
    }, [defaults]);

    useEffect(() => {
        const input = iconInputRef.current;

        if (!input) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (iconFile) {
            dataTransfer.items.add(iconFile);
        }

        input.files = dataTransfer.files;
    }, [iconFile]);

    const addProductRow = () => {
        setProductRows((rows) => [
            ...rows,
            {
                productId: '',
                is_default: false,
            },
        ]);
    };

    const removeProductRow = (index: number) => {
        setProductRows((rows) =>
            rows.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const updateProductRow = (
        index: number,
        updates: Partial<ProductFormRow>,
    ) => {
        setProductRows((rows) =>
            rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...updates } : row,
            ),
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="code" className={labelClassName}>
                    Color
                </label>
                <div className="flex items-center gap-3">
                    <input
                        id="code-picker"
                        type="color"
                        value={
                            /^#[0-9A-F]{6}$/i.test(color)
                                ? color
                                : DEFAULT_COLOR
                        }
                        onChange={(event) =>
                            setColor(event.target.value.toUpperCase())
                        }
                        className="h-10 w-14 cursor-pointer rounded-[9.375px] border border-[#e2e8f0] bg-white p-1"
                        aria-label="Pick material color"
                    />
                    <input
                        id="code"
                        name="code"
                        value={color}
                        onChange={(event) => {
                            let next = event.target.value.toUpperCase();

                            if (next && !next.startsWith('#')) {
                                next = `#${next.replaceAll('#', '')}`;
                            }

                            setColor(next.slice(0, 7));
                        }}
                        className={cn(inputClassName, 'font-mono uppercase')}
                        placeholder="#0260BD"
                        pattern="#[0-9A-Fa-f]{6}"
                        required
                    />
                </div>
                {errors.code ? (
                    <p className="mt-1 text-[12px] text-[#c10007]">
                        {errors.code}
                    </p>
                ) : null}
            </div>

            <div>
                <label htmlFor="name" className={labelClassName}>
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    defaultValue={defaults?.name ?? ''}
                    className={inputClassName}
                    placeholder="e.g. Zirconia"
                    required
                />
                {errors.name ? (
                    <p className="mt-1 text-[12px] text-[#c10007]">
                        {errors.name}
                    </p>
                ) : null}
            </div>

            <div>
                <p className={labelClassName}>Icon</p>
                <input
                    ref={iconInputRef}
                    type="file"
                    name={iconFile ? 'icon' : undefined}
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden
                />
                {removeIcon ? (
                    <input type="hidden" name="remove_icon" value="1" />
                ) : null}
                <FileUpload
                    value={iconFile}
                    onChange={(file) => {
                        const next = file instanceof File ? file : null;
                        setIconFile(next);

                        if (next) {
                            setRemoveIcon(false);
                        }
                    }}
                    existingFiles={existingIcon}
                    onRemoveExisting={() => {
                        setExistingIcon([]);
                        setRemoveIcon(true);
                        setIconFile(null);
                    }}
                    accept="image/jpeg,image/jpg,image/png"
                    maxSize={Number.POSITIVE_INFINITY}
                    maxFiles={1}
                    variant="avatar"
                    avatarSize={112}
                    showAvatarCaption={false}
                    hint="JPG or PNG"
                    placeholder="Upload icon"
                    error={errors.icon}
                    classNames={{
                        card: 'rounded-[9.375px] border border-[#e2e8f0] shadow-none',
                        dropzone:
                            'rounded-[9.375px] border-2 border-dashed border-[#e2e8f0] bg-[#f9fafb]',
                        cardMedia: 'rounded-[9.375px]',
                    }}
                />
                <p className="mt-1.5 text-[12px] text-[#475569]">
                    JPG or PNG image
                </p>
            </div>

            <input type="hidden" name="is_active" value="0" />
            <label className="flex items-center gap-2 text-[13.125px] text-[#050315]">
                <input
                    type="checkbox"
                    name="is_active"
                    value="1"
                    defaultChecked={defaults?.is_active ?? true}
                    className="size-4 rounded border-[#e2e8f0] text-[#0260bd] focus:ring-[#0260bd]"
                />
                Active
            </label>
            {errors.is_active ? (
                <p className="text-[12px] text-[#c10007]">{errors.is_active}</p>
            ) : null}

            <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className={cn(labelClassName, 'mb-0')}>Products</p>
                    <button
                        type="button"
                        onClick={addProductRow}
                        className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#eff6ff]"
                    >
                        <Plus className="size-3.5" aria-hidden />
                        Add product
                    </button>
                </div>

                {productRows.length === 0 ? (
                    <p className="text-[12px] text-[#475569]">
                        No products linked yet. Add a product to define
                        defaults.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {productRows.map((row, index) => {
                            const idError = productFieldError(
                                errors,
                                index,
                                'id',
                            );
                            const defaultError = productFieldError(
                                errors,
                                index,
                                'is_default',
                            );

                            return (
                                <div
                                    key={`product-row-${index}`}
                                    className="rounded-[9.375px] border border-[#e2e8f0] bg-white p-3"
                                >
                                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                        <div>
                                            <label
                                                className={labelClassName}
                                                htmlFor={`products-${index}-id`}
                                            >
                                                Product
                                            </label>
                                            <input
                                                type="hidden"
                                                name={`products[${index}][id]`}
                                                value={row.productId}
                                            />
                                            <Select
                                                value={
                                                    row.productId ||
                                                    EMPTY_PRODUCT_VALUE
                                                }
                                                onValueChange={(value) =>
                                                    updateProductRow(index, {
                                                        productId:
                                                            value ===
                                                            EMPTY_PRODUCT_VALUE
                                                                ? ''
                                                                : value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger
                                                    id={`products-${index}-id`}
                                                    aria-label={`Product row ${index + 1}`}
                                                    className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                                                >
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value={
                                                            EMPTY_PRODUCT_VALUE
                                                        }
                                                    >
                                                        Select product
                                                    </SelectItem>
                                                    {productOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={option.id}
                                                                value={String(
                                                                    option.id,
                                                                )}
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {idError ? (
                                                <p className="mt-1 text-[12px] text-[#c10007]">
                                                    {idError}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex items-end gap-3 pb-1">
                                            <div>
                                                <input
                                                    type="hidden"
                                                    name={`products[${index}][is_default]`}
                                                    value={
                                                        row.is_default
                                                            ? '1'
                                                            : '0'
                                                    }
                                                />
                                                <label className="flex items-center gap-2 text-[12px] text-[#050315]">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.is_default}
                                                        onChange={(event) =>
                                                            updateProductRow(
                                                                index,
                                                                {
                                                                    is_default:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                },
                                                            )
                                                        }
                                                        className="size-4 rounded border-[#e2e8f0] text-[#0260bd] focus:ring-[#0260bd]"
                                                    />
                                                    Default
                                                </label>
                                                {defaultError ? (
                                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                                        {defaultError}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeProductRow(index)
                                                }
                                                className="rounded-[7.5px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#c10007] hover:bg-[#fee2e2]"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {errors.products ? (
                    <p className="mt-2 text-[12px] text-[#c10007]">
                        {errors.products}
                    </p>
                ) : null}
            </div>

            {footer}
        </div>
    );
}
