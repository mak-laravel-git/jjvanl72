import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import {
    calculateTotals,
    effectiveUnitPrice,
    money,
    prescriptionItemDetail,
    prescriptionItemTitle,
    resolvePackagePrice,
} from './helpers';
import {
    IconDesign,
    IconEdit,
    IconManufacture,
    IconReview,
    IconSave,
    IconTarget,
    IconTooth,
    IconTrash,
    IconTruck,
    IconUpload,
} from './icons';
import type {
    CaseCreateCatalog,
    CaseDraft,
    CaseOutput,
    CaseService,
} from './types';

type PrescriptionPanelProps = {
    catalog: CaseCreateCatalog;
    draft: CaseDraft;
    activeScreen: 'project' | 'catalog' | 'material';
    onEditItem: (id: string) => void;
    onDeleteItem: (id: string) => void;
    onServiceChange: (service: CaseService) => void;
    onOutputChange: (output: CaseOutput) => void;
    onOverridePrice: (itemId: string, price: number) => void;
    onResetPrice: (itemId: string) => void;
    onChangeShade: (itemId: string, shade: string) => void;
    onApplyDefaultShade: () => void;
    onReview: () => void;
    onSaveDraft?: () => void;
    saving?: boolean;
    onFiles: () => void;
};

function ActionRow({
    icon,
    iconClass,
    label,
    active = false,
    disabled = false,
    onClick,
}: {
    icon: ReactNode;
    iconClass: string;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'action-item',
                active && 'active',
                disabled && 'disabled',
            )}
            disabled={disabled}
            onClick={onClick}
        >
            <span className={cn('action-icon', iconClass)}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

function PriceLine({
    label,
    amount,
    total = false,
}: {
    label: string;
    amount: number;
    total?: boolean;
}) {
    return (
        <div className={cn('price-line', total && 'total')}>
            <span>{label}</span>
            {total ? <span>{money(amount)}</span> : <strong>{money(amount)}</strong>}
        </div>
    );
}

export default function PrescriptionPanel({
    catalog,
    draft,
    activeScreen,
    onEditItem,
    onDeleteItem,
    onServiceChange,
    onOutputChange,
    onOverridePrice,
    onResetPrice,
    onChangeShade,
    onApplyDefaultShade,
    onReview,
    onSaveDraft,
    saving = false,
    onFiles,
}: PrescriptionPanelProps) {
    const totals = calculateTotals(draft, catalog);
    const bridgeTeeth = new Set(
        draft.items
            .filter((item) => item.kind === 'bridge')
            .flatMap((item) => item.teeth),
    );
    const hasItems = draft.items.length > 0;
    const isEditing = Boolean(draft.databaseId);
    const isCourier = draft.impressionType === 'Traditional Impression';
    const setupComplete =
        draft.patientName.trim() !== '' && draft.dueDate.trim() !== '';
    const saveLabel = saving
        ? isEditing
            ? 'Updating...'
            : 'Saving...'
        : isEditing
          ? 'Update'
          : 'Save Draft';

    if (activeScreen !== 'project') {
        return (
            <div className="action-list">
                <ActionRow
                    icon={<IconTarget />}
                    iconClass="action-primary"
                    label="Choose Product"
                    active={activeScreen === 'catalog'}
                />
                <ActionRow
                    icon={<IconTooth />}
                    iconClass="action-yellow"
                    label="Material & Options"
                    active={activeScreen === 'material'}
                />
                <ActionRow
                    icon={<IconDesign />}
                    iconClass="action-lilac"
                    label="Review Prescription"
                    disabled
                />
            </div>
        );
    }

    return (
        <>
            <div className="action-list">
                <ActionRow
                    icon={<IconTarget />}
                    iconClass="action-primary"
                    label="Case Setup"
                    active
                />
                <ActionRow
                    icon={isCourier ? <IconTruck /> : <IconUpload />}
                    iconClass="action-lilac"
                    label={isCourier ? 'Courier Service' : 'Digital Files'}
                    disabled={!setupComplete || !hasItems}
                    onClick={onFiles}
                />
                <ActionRow
                    icon={<IconReview />}
                    iconClass="action-green"
                    label="Review Case"
                    disabled={!setupComplete || !hasItems || saving}
                    onClick={onReview}
                />
                <ActionRow
                    icon={<IconSave />}
                    iconClass="action-blue"
                    label={saveLabel}
                    disabled={!draft.patientName.trim() || saving}
                    onClick={onSaveDraft}
                />
                <ActionRow
                    icon={<IconManufacture />}
                    iconClass="action-blue"
                    label={draft.status === 'Submitted' ? 'Submitted' : 'Manufacture'}
                    disabled
                />
            </div>

            <div className="prescription-summary">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="m-0">Case Prescription</h3>
                    {hasItems && (
                        <button
                            type="button"
                            className="text-[11px] font-semibold text-[#0260bd]"
                            onClick={onApplyDefaultShade}
                        >
                            Apply default shade to all items
                        </button>
                    )}
                </div>
                {draft.items.length === 0 ? (
                    <div className="empty-prescription">
                        {setupComplete
                            ? (
                                <>
                                    No prescription items yet.
                                    <br />
                                    Click a tooth in the chart to add a product.
                                </>
                            )
                            : (
                                <>
                                    Enter patient name and due date first.
                                    <br />
                                    Then click a tooth to add a product.
                                </>
                            )}
                    </div>
                ) : (
                    draft.items.map((item) => {
                        const product = catalog.products[item.productKey];
                        const unit = effectiveUnitPrice(item, catalog, draft);
                        const defaultPrice = resolvePackagePrice(
                            catalog,
                            item.productKey,
                            item.materialId,
                            draft,
                        );
                        const includedInBridge =
                            item.kind !== 'bridge' &&
                            item.teeth.length > 0 &&
                            item.teeth.every((tooth) => bridgeTeeth.has(tooth));

                        return (
                            <div key={item.id} className="rx-item">
                                <div className="rx-head">
                                    <span
                                        className={cn(
                                            'rx-color',
                                            item.kind === 'bridge' &&
                                                'is-bridge',
                                        )}
                                        style={
                                            item.kind === 'bridge'
                                                ? undefined
                                                : {
                                                      background:
                                                          product?.color ??
                                                          '#d4d4d6',
                                                  }
                                        }
                                    />
                                    <div className="rx-copy">
                                        <strong>
                                            {prescriptionItemTitle(
                                                item,
                                                product?.label,
                                            )}
                                        </strong>
                                        <small>
                                            {prescriptionItemDetail(
                                                item,
                                                product?.label,
                                                draft.items,
                                            )}
                                        </small>
                                        <div className="rx-meta-row">
                                            <div className="rx-meta-inline">
                                                <label className="rx-meta-field">
                                                    <span className="rx-meta-label">
                                                        Shade
                                                    </span>
                                                    <select
                                                        className="rx-meta-control rx-meta-shade"
                                                        value={
                                                            item.shade ||
                                                            draft.shade
                                                        }
                                                        onChange={(event) =>
                                                            onChangeShade(
                                                                item.id,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        {catalog.shades.map(
                                                            (shade) => (
                                                                <option
                                                                    key={shade}
                                                                    value={
                                                                        shade
                                                                    }
                                                                >
                                                                    {shade}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>
                                                {includedInBridge ? (
                                                    <p className="rx-meta-note">
                                                        Included in bridge —
                                                        not billed separately
                                                    </p>
                                                ) : (
                                                    <label className="rx-meta-field">
                                                        <span className="rx-meta-label">
                                                            Unit price
                                                        </span>
                                                        <div className="rx-meta-price-group">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="rx-meta-control rx-meta-price"
                                                                value={unit}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    onOverridePrice(
                                                                        item.id,
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                            {item.priceOverridden ? (
                                                                <button
                                                                    type="button"
                                                                    className="rx-meta-link"
                                                                    onClick={() =>
                                                                        onResetPrice(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Reset (
                                                                    {money(
                                                                        defaultPrice,
                                                                    )}
                                                                    )
                                                                </button>
                                                            ) : (
                                                                <span className="rx-meta-hint">
                                                                    Default
                                                                    package
                                                                </span>
                                                            )}
                                                        </div>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rx-actions">
                                        {product?.flow !== 'marker' && (
                                            <button
                                                type="button"
                                                className="rx-action"
                                                title="Edit item"
                                                onClick={() => onEditItem(item.id)}
                                            >
                                                <IconEdit />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="rx-action delete"
                                            title="Delete item"
                                            onClick={() => onDeleteItem(item.id)}
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div className="service-box">
                    <label>Service</label>
                    <select
                        value={draft.service}
                        onChange={(event) =>
                            onServiceChange(event.target.value as CaseService)
                        }
                    >
                        <option value="design">Design Only</option>
                        <option value="approve">Design & Approve</option>
                        <option value="manufacture">
                            Design, Approve & Manufacture
                        </option>
                    </select>

                    {draft.service === 'manufacture' && (
                        <>
                            <label>Output</label>
                            <select
                                value={draft.output}
                                onChange={(event) =>
                                    onOutputChange(
                                        event.target.value as CaseOutput,
                                    )
                                }
                            >
                                <option value="appliance">Appliance Only</option>
                                <option value="applianceModels">
                                    Appliance and Models
                                </option>
                            </select>
                        </>
                    )}
                </div>

                <div className="price-lines">
                    <PriceLine
                        label="Package total"
                        amount={totals.packageTotal}
                    />
                    <PriceLine label="Total" amount={totals.total} total />
                </div>

                <button
                    type="button"
                    className="btn btn-primary prescription-complete"
                    disabled={!setupComplete || !hasItems || saving}
                    onClick={onFiles}
                >
                    Selection Complete
                </button>
            </div>
        </>
    );
}
