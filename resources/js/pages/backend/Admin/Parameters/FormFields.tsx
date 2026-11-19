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

const EMPTY_GROUP_VALUE = '__select_group__';
const EMPTY_PRODUCT_VALUE = '__select_product__';
const EMPTY_MATERIAL_VALUE = '__select_material__';
const EMPTY_TYPE_VALUE = '__select_type__';
const DEFAULT_OPTION_COLOR = '#0260BD';

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

function normalizeHexColor(value: string | null | undefined): string {
    if (!value) {
        return DEFAULT_OPTION_COLOR;
    }

    const trimmed = value.trim().toUpperCase();

    if (/^#[0-9A-F]{6}$/.test(trimmed)) {
        return trimmed;
    }

    if (/^[0-9A-F]{6}$/.test(trimmed)) {
        return `#${trimmed}`;
    }

    return DEFAULT_OPTION_COLOR;
}

function imageMimeType(path: string | null | undefined): string {
    const lower = (path ?? '').toLowerCase();

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        return 'image/jpeg';
    }

    return 'image/png';
}

export type GroupOption = {
    id: number;
    code: string;
    name: string;
    label: string;
};

export type ProductOption = {
    id: number;
    code: string;
    name: string;
    label: string;
};

export type MaterialOption = {
    id: number;
    code: string;
    name: string;
    label: string;
};

export type TypeOption = {
    value: string;
    label: string;
};

export type ParameterOptionRow = {
    id: number;
    label: string;
    field_name: string | null;
    placeholder: string | null;
    value: string | null;
    color: string | null;
    image: string | null;
    image_url: string | null;
};

export type ParameterRow = {
    id: number;
    name: string;
    field_name: string;
    group_id: number;
    product_id: number;
    material_id: number;
    type: string;
    type_label: string;
    group_code: string | null;
    group_name: string | null;
    product_code: string | null;
    product_name: string | null;
    material_code: string | null;
    material_name: string | null;
    options: ParameterOptionRow[];
    options_count: number;
    updated_at: string;
};

type OptionFormRow = {
    id?: number;
    label: string;
    field_name: string;
    placeholder: string;
    value: string;
    color: string;
    imageFile: File | null;
    existingImage: ExistingFile[];
    removeImage: boolean;
};

function mapOptionsToFormRows(
    options: ParameterOptionRow[] | undefined,
): OptionFormRow[] {
    if (!options?.length) {
        return [];
    }

    return options.map((option) => ({
        id: option.id,
        label: option.label,
        field_name: option.field_name ?? '',
        placeholder: option.placeholder ?? '',
        value: option.value ?? '',
        color: normalizeHexColor(option.color),
        imageFile: null,
        existingImage: option.image_url
            ? [
                  {
                      id: `option-${option.id}`,
                      path: option.image ?? 'image',
                      url: option.image_url,
                      mime_type: imageMimeType(option.image),
                      name: option.label,
                  },
              ]
            : [],
        removeImage: false,
    }));
}

function optionFieldError(
    errors: Partial<Record<string, string>>,
    index: number,
    field: 'label' | 'field_name' | 'placeholder' | 'value' | 'color' | 'image',
): string | undefined {
    return errors[`options.${index}.${field}`];
}

export function ParameterFormFields({
    errors,
    defaults,
    groupOptions,
    productOptions,
    materialOptions,
    typeOptions,
    footer,
}: {
    errors: Partial<Record<string, string>>;
    defaults?: Partial<ParameterRow>;
    groupOptions: GroupOption[];
    productOptions: ProductOption[];
    materialOptions: MaterialOption[];
    typeOptions: TypeOption[];
    footer?: ReactNode;
}) {
    const [groupId, setGroupId] = useState(
        defaults?.group_id ? String(defaults.group_id) : '',
    );
    const [productId, setProductId] = useState(
        defaults?.product_id ? String(defaults.product_id) : '',
    );
    const [materialId, setMaterialId] = useState(
        defaults?.material_id ? String(defaults.material_id) : '',
    );
    const [type, setType] = useState(defaults?.type ?? '');
    const [optionRows, setOptionRows] = useState<OptionFormRow[]>(() =>
        mapOptionsToFormRows(defaults?.options),
    );

    useEffect(() => {
        setGroupId(defaults?.group_id ? String(defaults.group_id) : '');
        setProductId(defaults?.product_id ? String(defaults.product_id) : '');
        setMaterialId(
            defaults?.material_id ? String(defaults.material_id) : '',
        );
        setType(defaults?.type ?? '');
        setOptionRows(mapOptionsToFormRows(defaults?.options));
    }, [defaults]);

    const addOptionRow = () => {
        setOptionRows((rows) => [
            ...rows,
            {
                label: '',
                field_name: '',
                placeholder: '',
                value: '',
                color: DEFAULT_OPTION_COLOR,
                imageFile: null,
                existingImage: [],
                removeImage: false,
            },
        ]);
    };

    const removeOptionRow = (index: number) => {
        setOptionRows((rows) =>
            rows.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const updateOptionRow = (
        index: number,
        updates: Partial<OptionFormRow>,
    ) => {
        setOptionRows((rows) =>
            rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...updates } : row,
            ),
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="parameter-name" className={labelClassName}>
                        Name
                    </label>
                    <input
                        id="parameter-name"
                        name="name"
                        defaultValue={defaults?.name ?? ''}
                        className={inputClassName}
                        placeholder="e.g. Shade"
                        required
                    />
                    {errors.name ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.name}
                        </p>
                    ) : null}
                </div>
                <div>
                    <label
                        htmlFor="parameter-field_name"
                        className={labelClassName}
                    >
                        Field name
                    </label>
                    <input
                        id="parameter-field_name"
                        name="field_name"
                        defaultValue={defaults?.field_name ?? ''}
                        className={inputClassName}
                        placeholder="e.g. shade"
                        required
                    />
                    {errors.field_name ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.field_name}
                        </p>
                    ) : null}
                    <p className="mt-1 text-[12px] text-[#475569]">
                        Unique. No spaces — letters, numbers, dashes, or
                        underscores only.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="parameter-group_id"
                        className={labelClassName}
                    >
                        Parameter group
                    </label>
                    <input type="hidden" name="group_id" value={groupId} />
                    <Select
                        value={groupId || EMPTY_GROUP_VALUE}
                        onValueChange={(value) =>
                            setGroupId(
                                value === EMPTY_GROUP_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            id="parameter-group_id"
                            aria-label="Parameter group"
                            className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EMPTY_GROUP_VALUE}>
                                Select a group
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
                    {errors.group_id ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.group_id}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label
                        htmlFor="parameter-product_id"
                        className={labelClassName}
                    >
                        Product
                    </label>
                    <input
                        type="hidden"
                        name="product_id"
                        value={productId}
                    />
                    <Select
                        value={productId || EMPTY_PRODUCT_VALUE}
                        onValueChange={(value) =>
                            setProductId(
                                value === EMPTY_PRODUCT_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            id="parameter-product_id"
                            aria-label="Product"
                            className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EMPTY_PRODUCT_VALUE}>
                                Select a product
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
                    {errors.product_id ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.product_id}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label
                        htmlFor="parameter-material_id"
                        className={labelClassName}
                    >
                        Material
                    </label>
                    <input
                        type="hidden"
                        name="material_id"
                        value={materialId}
                    />
                    <Select
                        value={materialId || EMPTY_MATERIAL_VALUE}
                        onValueChange={(value) =>
                            setMaterialId(
                                value === EMPTY_MATERIAL_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger
                            id="parameter-material_id"
                            aria-label="Material"
                            className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="Select a material" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EMPTY_MATERIAL_VALUE}>
                                Select a material
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
                    {errors.material_id ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.material_id}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="parameter-type" className={labelClassName}>
                        Type
                    </label>
                    <input type="hidden" name="type" value={type} />
                    <Select
                        value={type || EMPTY_TYPE_VALUE}
                        onValueChange={(value) =>
                            setType(value === EMPTY_TYPE_VALUE ? '' : value)
                        }
                    >
                        <SelectTrigger
                            id="parameter-type"
                            aria-label="Parameter type"
                            className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={EMPTY_TYPE_VALUE}>
                                Select a type
                            </SelectItem>
                            {typeOptions.map((typeOption) => (
                                <SelectItem
                                    key={typeOption.value}
                                    value={typeOption.value}
                                >
                                    {typeOption.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {errors.type}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className={cn(labelClassName, 'mb-0')}>
                        {type === 'input' ? 'Input fields' : 'Options'}
                    </p>
                    <button
                        type="button"
                        onClick={addOptionRow}
                        disabled={!type}
                        className="inline-flex items-center gap-1.5 rounded-[7.5px] border border-[#dbeafe] bg-white px-2.5 py-1.5 text-[11.25px] font-semibold text-[#0260bd] hover:bg-[#eff6ff] disabled:pointer-events-none disabled:opacity-40"
                    >
                        <Plus className="size-3.5" aria-hidden />
                        {type === 'input' ? 'Add input' : 'Add option'}
                    </button>
                </div>

                {!type ? (
                    <p className="text-[12px] text-[#475569]">
                        Select a parameter type to configure option or input
                        fields.
                    </p>
                ) : optionRows.length === 0 ? (
                    <p className="text-[12px] text-[#475569]">
                        {type === 'input'
                            ? 'No input fields yet. Add one to define name, field name, and placeholder.'
                            : 'No options yet. Add options with a name, value, and color.'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {optionRows.map((row, index) => {
                            const labelError = optionFieldError(
                                errors,
                                index,
                                'label',
                            );
                            const fieldNameError = optionFieldError(
                                errors,
                                index,
                                'field_name',
                            );
                            const placeholderError = optionFieldError(
                                errors,
                                index,
                                'placeholder',
                            );
                            const valueError = optionFieldError(
                                errors,
                                index,
                                'value',
                            );
                            const colorError = optionFieldError(
                                errors,
                                index,
                                'color',
                            );
                            const imageError = optionFieldError(
                                errors,
                                index,
                                'image',
                            );

                            return (
                                <OptionRowFields
                                    key={
                                        row.id
                                            ? `option-${row.id}`
                                            : `option-new-${index}`
                                    }
                                    index={index}
                                    row={row}
                                    parameterType={type}
                                    labelError={labelError}
                                    fieldNameError={fieldNameError}
                                    placeholderError={placeholderError}
                                    valueError={valueError}
                                    colorError={colorError}
                                    imageError={imageError}
                                    onUpdate={(updates) =>
                                        updateOptionRow(index, updates)
                                    }
                                    onRemove={() => removeOptionRow(index)}
                                />
                            );
                        })}
                    </div>
                )}

                {errors.options ? (
                    <p className="mt-2 text-[12px] text-[#c10007]">
                        {errors.options}
                    </p>
                ) : null}
            </div>

            {footer}
        </div>
    );
}

function OptionRowFields({
    index,
    row,
    parameterType,
    labelError,
    fieldNameError,
    placeholderError,
    valueError,
    colorError,
    imageError,
    onUpdate,
    onRemove,
}: {
    index: number;
    row: OptionFormRow;
    parameterType: string;
    labelError?: string;
    fieldNameError?: string;
    placeholderError?: string;
    valueError?: string;
    colorError?: string;
    imageError?: string;
    onUpdate: (updates: Partial<OptionFormRow>) => void;
    onRemove: () => void;
}) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const showOptionFields = parameterType === 'option';
    const showInputFields = parameterType === 'input';

    useEffect(() => {
        const input = imageInputRef.current;

        if (!input) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (row.imageFile) {
            dataTransfer.items.add(row.imageFile);
        }

        input.files = dataTransfer.files;
    }, [row.imageFile]);

    return (
        <div className="rounded-[9.375px] border border-[#e2e8f0] bg-white p-3">
            {row.id ? (
                <input
                    type="hidden"
                    name={`options[${index}][id]`}
                    value={row.id}
                />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label
                        className={labelClassName}
                        htmlFor={`options-${index}-label`}
                    >
                        {showOptionFields ? 'Name' : 'Label'}
                    </label>
                    <input
                        id={`options-${index}-label`}
                        name={`options[${index}][label]`}
                        value={row.label}
                        onChange={(event) =>
                            onUpdate({ label: event.target.value })
                        }
                        className={inputClassName}
                        placeholder={
                            showOptionFields
                                ? 'e.g. Shade A1'
                                : 'e.g. Notes'
                        }
                    />
                    {labelError ? (
                        <p className="mt-1 text-[12px] text-[#c10007]">
                            {labelError}
                        </p>
                    ) : null}
                </div>

                {showInputFields ? (
                    <div>
                        <label
                            className={labelClassName}
                            htmlFor={`options-${index}-field_name`}
                        >
                            Field name
                        </label>
                        <input
                            id={`options-${index}-field_name`}
                            name={`options[${index}][field_name]`}
                            value={row.field_name}
                            onChange={(event) =>
                                onUpdate({ field_name: event.target.value })
                            }
                            className={inputClassName}
                            placeholder="e.g. shade_a1"
                        />
                        {fieldNameError ? (
                            <p className="mt-1 text-[12px] text-[#c10007]">
                                {fieldNameError}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {showInputFields ? (
                    <div className="sm:col-span-2">
                        <label
                            className={labelClassName}
                            htmlFor={`options-${index}-placeholder`}
                        >
                            Placeholder
                        </label>
                        <input
                            id={`options-${index}-placeholder`}
                            name={`options[${index}][placeholder]`}
                            value={row.placeholder}
                            onChange={(event) =>
                                onUpdate({ placeholder: event.target.value })
                            }
                            className={inputClassName}
                            placeholder="Placeholder shown in the input field"
                        />
                        {placeholderError ? (
                            <p className="mt-1 text-[12px] text-[#c10007]">
                                {placeholderError}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {showOptionFields ? (
                    <div>
                        <label
                            className={labelClassName}
                            htmlFor={`options-${index}-value`}
                        >
                            Value
                        </label>
                        <input
                            id={`options-${index}-value`}
                            name={`options[${index}][value]`}
                            value={row.value}
                            onChange={(event) =>
                                onUpdate({ value: event.target.value })
                            }
                            className={inputClassName}
                            placeholder="Stored option value"
                        />
                        {valueError ? (
                            <p className="mt-1 text-[12px] text-[#c10007]">
                                {valueError}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {showOptionFields ? (
                    <div>
                        <label
                            className={labelClassName}
                            htmlFor={`options-${index}-color`}
                        >
                            Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                id={`options-${index}-color-picker`}
                                type="color"
                                value={
                                    /^#[0-9A-F]{6}$/i.test(row.color)
                                        ? row.color
                                        : DEFAULT_OPTION_COLOR
                                }
                                onChange={(event) =>
                                    onUpdate({
                                        color: event.target.value.toUpperCase(),
                                    })
                                }
                                className="h-10 w-14 cursor-pointer rounded-[9.375px] border border-[#e2e8f0] bg-white p-1"
                                aria-label={`Pick color for option ${index + 1}`}
                            />
                            <input
                                id={`options-${index}-color`}
                                name={`options[${index}][color]`}
                                value={row.color}
                                onChange={(event) => {
                                    let next = event.target.value.toUpperCase();

                                    if (next && !next.startsWith('#')) {
                                        next = `#${next.replaceAll('#', '')}`;
                                    }

                                    onUpdate({ color: next.slice(0, 7) });
                                }}
                                className={cn(
                                    inputClassName,
                                    'font-mono uppercase',
                                )}
                                placeholder="#0260BD"
                                pattern="#[0-9A-Fa-f]{6}"
                            />
                        </div>
                        {colorError ? (
                            <p className="mt-1 text-[12px] text-[#c10007]">
                                {colorError}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {showOptionFields ? (
                <div className="mt-3">
                    <p className={labelClassName}>Icon</p>
                    <input
                        ref={imageInputRef}
                        type="file"
                        name={
                            row.imageFile
                                ? `options[${index}][image]`
                                : undefined
                        }
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        tabIndex={-1}
                        aria-hidden
                    />
                    {row.removeImage ? (
                        <input
                            type="hidden"
                            name={`options[${index}][remove_image]`}
                            value="1"
                        />
                    ) : null}
                    <FileUpload
                        value={row.imageFile}
                        onChange={(file) => {
                            const next = file instanceof File ? file : null;
                            onUpdate({
                                imageFile: next,
                                removeImage: next ? false : row.removeImage,
                            });
                        }}
                        existingFiles={row.existingImage}
                        onRemoveExisting={() => {
                            onUpdate({
                                existingImage: [],
                                removeImage: true,
                                imageFile: null,
                            });
                        }}
                        accept="image/jpeg,image/jpg,image/png"
                        maxSize={Number.POSITIVE_INFINITY}
                        maxFiles={1}
                        variant="avatar"
                        avatarSize={112}
                        showAvatarCaption={false}
                        hint="JPG or PNG"
                        placeholder="Upload icon"
                        error={imageError}
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
            ) : null}

            <div className="mt-3 flex justify-end">
                <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-[7.5px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1.5 text-[11.25px] font-semibold text-[#c10007] hover:bg-[#fee2e2]"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}
