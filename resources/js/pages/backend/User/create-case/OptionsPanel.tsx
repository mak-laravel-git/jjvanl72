import { useState, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import {
    ALL_ON_X_ASSISTANCE_EMAIL,
    formatPalmerTooth,
    materialsForProduct,
    parseMultiOptionValues,
    parseToothFeatures,
    PLANNING_PLUS_GUIDE,
    serializeMultiOptionValues,
    serializeToothFeatures,
    type ToothFeaturesMap,
} from './helpers';
import type {
    CaseConfig,
    CaseCreateCatalog,
    CatalogParameter,
    ProductFlow,
} from './types';

type OptionsPanelProps = {
    catalog: CaseCreateCatalog;
    activeProductKey: string | null;
    selectedMaterial: string;
    workingConfig: CaseConfig;
    selectedTeethText: string;
    workingTeeth?: number[];
    bridgeMode?: boolean;
    onSetOption: (key: string, value: string) => void;
    onClear: () => void;
    onContinue: () => void;
    onComplete: () => void;
};

const OPTION_COLORS = [
    '#bd1d49',
    '#0a8730',
    '#e45d00',
    '#579fcf',
    '#a9619e',
    '#777465',
];

function OptionButtons({
    title,
    value,
    options,
    labels,
    optionColors,
    optionImages,
    imageLayout = 'hover',
    note,
    buttonStyle,
    nested = false,
    onChange,
}: {
    title?: string;
    value: string;
    options: string[];
    labels?: Record<string, string>;
    optionColors?: Record<string, string>;
    optionImages?: Record<string, string>;
    imageLayout?: 'cards' | 'hover';
    note?: string;
    buttonStyle?: CSSProperties;
    nested?: boolean;
    onChange: (value: string) => void;
}) {
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);
    const hasImages =
        optionImages !== undefined &&
        options.some((option) => Boolean(optionImages[option]));
    const useImageCards = hasImages && imageLayout === 'cards';
    const useHoverOverlay = hasImages && imageLayout === 'hover';

    return (
        <div className={nested ? 'option-subsection' : 'option-section'}>
            {title ? <h3>{title}</h3> : null}
            {note ? <div className="option-note">{note}</div> : null}
            <div className={useImageCards ? 'shape-grid' : 'option-grid'}>
                {options.map((option, index) => {
                    const imageUrl = optionImages?.[option];

                    if (useImageCards && imageUrl) {
                        return (
                            <button
                                key={option}
                                type="button"
                                className={cn(
                                    'shape-card',
                                    value === option && 'selected',
                                )}
                                onClick={() => onChange(option)}
                            >
                                <img
                                    src={imageUrl}
                                    alt={labels?.[option] ?? option}
                                />
                                <span>{labels?.[option] ?? option}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={option}
                            type="button"
                            className={cn(
                                'option-button',
                                value === option && 'selected',
                            )}
                            style={
                                buttonStyle ??
                                ({
                                    '--option-color':
                                        optionColors?.[option] ??
                                        OPTION_COLORS[
                                            index % OPTION_COLORS.length
                                        ],
                                } as CSSProperties)
                            }
                            onClick={() => onChange(option)}
                            onMouseEnter={() => {
                                if (useHoverOverlay && imageUrl) {
                                    setHoveredOption(option);
                                }
                            }}
                            onMouseLeave={() => {
                                if (hoveredOption === option) {
                                    setHoveredOption(null);
                                }
                            }}
                        >
                            {labels?.[option] ?? option}
                            {useHoverOverlay &&
                            hoveredOption === option &&
                            imageUrl ? (
                                <span
                                    className="option-hover-preview"
                                    aria-hidden
                                >
                                    <img src={imageUrl} alt="" />
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function MultiOptionButtons({
    title,
    values,
    options,
    labels,
    optionColors,
    nested = false,
    onChange,
}: {
    title?: string;
    values: string[];
    options: string[];
    labels?: Record<string, string>;
    optionColors?: Record<string, string>;
    nested?: boolean;
    onChange: (values: string[]) => void;
}) {
    const toggle = (option: string) => {
        if (values.includes(option)) {
            onChange(values.filter((value) => value !== option));

            return;
        }

        onChange([...values, option]);
    };

    return (
        <div className={nested ? 'option-subsection' : 'option-section'}>
            {title ? <h3>{title}</h3> : null}
            <div className="option-note">Select one or more.</div>
            <div className="option-grid">
                {options.map((option, index) => (
                    <button
                        key={option}
                        type="button"
                        className={cn(
                            'option-button',
                            values.includes(option) && 'selected',
                        )}
                        style={
                            {
                                '--option-color':
                                    optionColors?.[option] ??
                                    OPTION_COLORS[
                                        index % OPTION_COLORS.length
                                    ],
                            } as CSSProperties
                        }
                        onClick={() => toggle(option)}
                    >
                        {labels?.[option] ?? option}
                    </button>
                ))}
            </div>
        </div>
    );
}

function additionalInfoPlaceholder(flow: ProductFlow): string {
    if (flow === 'crown' || flow === 'implant') {
        return 'Add crown-specific instructions...';
    }

    if (flow === 'denture') {
        return 'Add denture-specific instructions...';
    }

    if (flow === 'biteplane') {
        return 'Add biteplane instructions...';
    }

    if (flow === 'partial') {
        return 'Describe clasp locations or design instructions...';
    }

    return 'Add restorative instructions...';
}

function groupCatalogParameters(
    parameters: CatalogParameter[],
): Array<{
    key: string;
    title: string | null;
    sortOrder: number;
    parameters: CatalogParameter[];
}> {
    const groups = new Map<
        string,
        {
            key: string;
            title: string | null;
            sortOrder: number;
            parameters: CatalogParameter[];
        }
    >();

    parameters.forEach((parameter) => {
        const key =
            parameter.groupId != null
                ? `group-${parameter.groupId}`
                : `parameter-${parameter.id}`;
        const existing = groups.get(key);

        if (existing) {
            existing.parameters.push(parameter);

            return;
        }

        groups.set(key, {
            key,
            title: parameter.groupName ?? null,
            sortOrder:
                parameter.groupSortOrder ??
                (parameter.groupId == null ? Number.MAX_SAFE_INTEGER : 0),
            parameters: [parameter],
        });
    });

    return Array.from(groups.values()).sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
        }

        return (left.title ?? '').localeCompare(right.title ?? '');
    });
}

function CatalogParameterOptions({
    parameters,
    config,
    onSetOption,
}: {
    parameters: CatalogParameter[];
    config: CaseConfig;
    onSetOption: (key: string, value: string) => void;
}) {
    if (parameters.length === 0) {
        return (
            <div className="screen-help">
                No design parameters for this product/material.
            </div>
        );
    }

    const planningPlusGuideSelected =
        config.applianceDesign === PLANNING_PLUS_GUIDE;
    const visibleParameters = parameters.filter((parameter) => {
        if (
            parameter.fieldName === 'preferredBrand' ||
            parameter.fieldName === 'planningApproval'
        ) {
            return planningPlusGuideSelected;
        }

        return true;
    });

    if (visibleParameters.length === 0) {
        return (
            <div className="screen-help">
                No design parameters for this product/material.
            </div>
        );
    }

    const grouped = groupCatalogParameters(visibleParameters);

    return (
        <>
            {grouped.map((group) => (
                <div key={group.key} className="option-section">
                    {group.title ? <h3>{group.title}</h3> : null}
                    {group.parameters.map((parameter) => {
                        const showParameterTitle =
                            !group.title || parameter.name !== group.title;

                        if (parameter.type === 'input') {
                            if (parameter.fieldName === 'preferredBrand') {
                                return (
                                    <div
                                        key={parameter.id}
                                        className="option-subsection"
                                    >
                                        {showParameterTitle ? (
                                            <h4>{parameter.name}</h4>
                                        ) : null}
                                        <input
                                            type="text"
                                            className="textarea"
                                            value={
                                                config[parameter.fieldName] ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                onSetOption(
                                                    parameter.fieldName,
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Enter preferred brand"
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={parameter.id}
                                    className="option-subsection"
                                >
                                    {showParameterTitle ? (
                                        <h4>{parameter.name}</h4>
                                    ) : null}
                                    <textarea
                                        className="textarea"
                                        value={
                                            config[parameter.fieldName] ?? ''
                                        }
                                        onChange={(event) =>
                                            onSetOption(
                                                parameter.fieldName,
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            );
                        }

                        if (parameter.type === 'multi_option') {
                            const selected = parseMultiOptionValues(
                                config[parameter.fieldName],
                            );

                            return (
                                <MultiOptionButtons
                                    key={parameter.id}
                                    nested
                                    title={
                                        showParameterTitle
                                            ? parameter.name
                                            : undefined
                                    }
                                    values={selected}
                                    options={parameter.options.map(
                                        (option) => option.value,
                                    )}
                                    labels={Object.fromEntries(
                                        parameter.options.map((option) => [
                                            option.value,
                                            option.label,
                                        ]),
                                    )}
                                    optionColors={Object.fromEntries(
                                        parameter.options
                                            .filter((option) => option.color)
                                            .map((option) => [
                                                option.value,
                                                option.color!,
                                            ]),
                                    )}
                                    onChange={(values) =>
                                        onSetOption(
                                            parameter.fieldName,
                                            serializeMultiOptionValues(values),
                                        )
                                    }
                                />
                            );
                        }

                        return (
                            <OptionButtons
                                key={parameter.id}
                                nested
                                title={
                                    showParameterTitle
                                        ? parameter.name
                                        : undefined
                                }
                                value={config[parameter.fieldName] ?? ''}
                                options={parameter.options.map(
                                    (option) => option.value,
                                )}
                                labels={Object.fromEntries(
                                    parameter.options.map((option) => [
                                        option.value,
                                        option.label,
                                    ]),
                                )}
                                optionColors={Object.fromEntries(
                                    parameter.options
                                        .filter((option) => option.color)
                                        .map((option) => [
                                            option.value,
                                            option.color!,
                                        ]),
                                )}
                                optionImages={Object.fromEntries(
                                    parameter.options
                                        .filter((option) => option.imageUrl)
                                        .map((option) => [
                                            option.value,
                                            option.imageUrl!,
                                        ]),
                                )}
                                imageLayout={
                                    parameter.fieldName === 'ponticDesign'
                                        ? 'cards'
                                        : 'hover'
                                }
                                onChange={(value) => {
                                    onSetOption(parameter.fieldName, value);

                                    if (
                                        parameter.fieldName ===
                                            'applianceDesign' &&
                                        value !== PLANNING_PLUS_GUIDE
                                    ) {
                                        onSetOption('preferredBrand', '');
                                        onSetOption('planningApproval', '');
                                    }
                                }}
                            />
                        );
                    })}
                </div>
            ))}
        </>
    );
}

function parameterOptions(
    parameters: CatalogParameter[],
    fieldName: string,
): string[] {
    const parameter = parameters.find((entry) => entry.fieldName === fieldName);

    return parameter?.options.map((option) => option.value) ?? [];
}

function PartialToothFeatures({
    teeth,
    claspOptions,
    restsOptions,
    features,
    onChange,
}: {
    teeth: number[];
    claspOptions: string[];
    restsOptions: string[];
    features: ToothFeaturesMap;
    onChange: (next: ToothFeaturesMap) => void;
}) {
    if (teeth.length === 0) {
        return null;
    }

    return (
        <div className="option-section">
            <h3>Per-tooth clasp &amp; rests</h3>
            <p className="option-note">
                A tooth can have clasp and rests together. Assign features on
                each selected tooth.
            </p>
            {teeth.map((tooth) => {
                const key = String(tooth);
                const assignment = features[key] ?? {};
                const hasClasp = Boolean(assignment.clasp);
                const hasRests = Boolean(assignment.rests);

                return (
                    <div key={tooth} className="partial-tooth-feature">
                        <div className="partial-tooth-feature-title">
                            Tooth {formatPalmerTooth(tooth)}
                        </div>
                        <label className="partial-tooth-feature-toggle">
                            <input
                                type="checkbox"
                                checked={hasClasp}
                                onChange={(event) => {
                                    const next = { ...features };
                                    const current = { ...(next[key] ?? {}) };

                                    if (event.target.checked) {
                                        current.clasp =
                                            current.clasp ||
                                            claspOptions[0] ||
                                            '';
                                    } else {
                                        delete current.clasp;
                                    }

                                    if (current.clasp || current.rests) {
                                        next[key] = current;
                                    } else {
                                        delete next[key];
                                    }

                                    onChange(next);
                                }}
                            />
                            Clasp
                        </label>
                        {hasClasp && claspOptions.length > 0 ? (
                            <select
                                className="field-control"
                                value={assignment.clasp ?? ''}
                                onChange={(event) => {
                                    const next = { ...features };
                                    next[key] = {
                                        ...(next[key] ?? {}),
                                        clasp: event.target.value,
                                    };
                                    onChange(next);
                                }}
                            >
                                {claspOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                        <label className="partial-tooth-feature-toggle">
                            <input
                                type="checkbox"
                                checked={hasRests}
                                disabled={restsOptions.length === 0}
                                onChange={(event) => {
                                    const next = { ...features };
                                    const current = { ...(next[key] ?? {}) };

                                    if (event.target.checked) {
                                        current.rests =
                                            current.rests ||
                                            restsOptions[0] ||
                                            '';
                                    } else {
                                        delete current.rests;
                                    }

                                    if (current.clasp || current.rests) {
                                        next[key] = current;
                                    } else {
                                        delete next[key];
                                    }

                                    onChange(next);
                                }}
                            />
                            Rests
                        </label>
                        {hasRests && restsOptions.length > 0 ? (
                            <select
                                className="field-control"
                                value={assignment.rests ?? ''}
                                onChange={(event) => {
                                    const next = { ...features };
                                    next[key] = {
                                        ...(next[key] ?? {}),
                                        rests: event.target.value,
                                    };
                                    onChange(next);
                                }}
                            >
                                {restsOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

export default function OptionsPanel({
    catalog,
    activeProductKey,
    selectedMaterial,
    workingConfig,
    selectedTeethText,
    workingTeeth = [],
    bridgeMode = false,
    onSetOption,
    onClear,
    onContinue,
    onComplete,
}: OptionsPanelProps) {
    if (!activeProductKey) {
        return (
            <div className="options-content">
                <div className="screen-help">
                    Select a product from the left panel.
                </div>
            </div>
        );
    }

    const product = catalog.products[activeProductKey];

    if (!product) {
        return null;
    }

    if (activeProductKey === 'allOnX') {
        return (
            <div className="options-content">
                <div className="screen-help">
                    Product: <strong>{product.label}</strong>
                </div>
                <div className="option-section">
                    <h3>Assistance required</h3>
                    <p className="option-note">
                        All on X has no self-serve design options. Email Johan
                        for assistance:{' '}
                        <a href={`mailto:${ALL_ON_X_ASSISTANCE_EMAIL}`}>
                            {ALL_ON_X_ASSISTANCE_EMAIL}
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
    }

    const materials = materialsForProduct(catalog, activeProductKey);
    const materialRequired = materials.length > 0;
    const materialBlocked = materialRequired && !selectedMaterial;
    const selectedMaterialId =
        materials.find((entry) => entry.name === selectedMaterial)?.id ?? null;
    const catalogParameters = product.parameters ?? [];
    const visibleParameters = catalogParameters.filter(
        (parameter) =>
            parameter.materialId === null ||
            parameter.materialId === selectedMaterialId,
    );
    const isPartialProduct =
        activeProductKey === 'castPartial' ||
        activeProductKey === 'acrylicPartial';
    const parametersForCatalog = isPartialProduct
        ? visibleParameters.filter(
              (parameter) =>
                  parameter.fieldName !== 'clasp' &&
                  parameter.fieldName !== 'rests',
          )
        : visibleParameters;
    const claspOptions = parameterOptions(visibleParameters, 'clasp');
    const castRests = parameterOptions(
        catalog.products.castPartial?.parameters ?? [],
        'rests',
    );
    const restsOptions =
        parameterOptions(visibleParameters, 'rests').length > 0
            ? parameterOptions(visibleParameters, 'rests')
            : castRests;
    const toothFeatures = parseToothFeatures(workingConfig.toothFeatures);

    if (materialBlocked) {
        return (
            <div className="options-content">
                <div className="screen-help">
                    Select a material to open the product-specific design
                    options.
                </div>
            </div>
        );
    }

    return (
        <div className="options-content">
            <div className="screen-help">
                {bridgeMode ? (
                    <>
                        Bridge options (from first abutment) · Teeth:{' '}
                        <strong>{selectedTeethText}</strong>
                    </>
                ) : (
                    <>
                        Product: <strong>{product.label}</strong> · Teeth:{' '}
                        <strong>{selectedTeethText}</strong>
                    </>
                )}
                {selectedMaterial ? (
                    <>
                        {' '}
                        · Material: <strong>{selectedMaterial}</strong>
                    </>
                ) : null}
            </div>

            <CatalogParameterOptions
                parameters={parametersForCatalog}
                config={workingConfig}
                onSetOption={onSetOption}
            />

            {isPartialProduct ? (
                <PartialToothFeatures
                    teeth={workingTeeth}
                    claspOptions={claspOptions}
                    restsOptions={restsOptions}
                    features={toothFeatures}
                    onChange={(next) => {
                        const serialized = serializeToothFeatures(next);
                        onSetOption('toothFeatures', serialized);

                        const first = Object.values(next).find(
                            (entry) => entry.clasp || entry.rests,
                        );

                        onSetOption('clasp', first?.clasp ?? '');
                        onSetOption('rests', first?.rests ?? '');
                    }}
                />
            ) : null}

            <div className="option-section">
                <h3>Additional Information</h3>
                <textarea
                    className="textarea"
                    placeholder={additionalInfoPlaceholder(product.flow)}
                    value={workingConfig.information ?? ''}
                    onChange={(event) =>
                        onSetOption('information', event.target.value)
                    }
                />
            </div>

            <div className="config-actions">
                <button
                    type="button"
                    className="config-action config-clear"
                    onClick={onClear}
                >
                    Clear
                </button>
                <button
                    type="button"
                    className="config-action config-continue"
                    onClick={onContinue}
                >
                    Continue selections
                </button>
                <button
                    type="button"
                    className="config-action config-ok"
                    onClick={onComplete}
                >
                    Selection complete
                </button>
            </div>
        </div>
    );
}
