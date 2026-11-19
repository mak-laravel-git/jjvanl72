import { ChangeEvent, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import {
    calculateTotals,
    configTags,
    money,
    prescriptionItemDetail,
    prescriptionItemTitle,
    serviceLabel,
} from './helpers';
import {
    IconCheck,
    IconDownload,
    IconTruck,
    IconUpload,
} from './icons';
import type {
    CaseCreateCatalog,
    CaseDraft,
    CaseFileSlotDraft,
    UploadedFileMeta,
} from './types';

export type ReviewModalMode =
    | 'review'
    | 'files'
    | 'courier'
    | 'success'
    | 'load'
    | 'help'
    | 'none';

type ReviewCheckoutModalProps = {
    mode: ReviewModalMode;
    catalog: CaseCreateCatalog;
    draft: CaseDraft;
    caseReference: string;
    savedDrafts?: CaseDraft[];
    onClose: () => void;
    onSubmit: () => void;
    onUpdateUploads: (uploads: CaseDraft['uploads']) => void;
    onUpdateFileSlots?: (slots: CaseFileSlotDraft[]) => void;
    onUpdatePayment: (payment: CaseDraft['payment']) => void;
    onLoadDraft?: (draft: CaseDraft) => void;
    onDownloadPrescription?: () => void;
    onOpenFilesFromReview?: () => void;
};

type FreeformUploadField = {
    id: string;
    label: string;
};

const LAB_ADDRESS = (
    <>
        SmileBright Dental Lab
        <br />
        Unit 4, 12 Industrial Drive
        <br />
        Sydney NSW 2000
        <br />
        Australia
        <br />
        <br />
        Tel: (02) 9000 0000
        <br />
        lab@smilebright.com.au
    </>
);

function humanizeCode(code: string): string {
    return code
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugifyLabel(label: string): string {
    const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug !== '' ? slug : `file-${Date.now()}`;
}

const DEFAULT_UPLOAD_FIELDS: FreeformUploadField[] = [
    { id: 'upperArch', label: 'Upper Arch' },
    { id: 'lowerArch', label: 'Lower Arch' },
    { id: 'biteScan', label: 'Bite Scan' },
];

function buildInitialUploadFields(draft: CaseDraft): FreeformUploadField[] {
    const fromSlots = (draft.fileSlots ?? []).map((slot) => ({
        id: slot.code,
        label: slot.label,
    }));

    const base =
        fromSlots.length > 0 ? fromSlots : [...DEFAULT_UPLOAD_FIELDS];
    const seen = new Set(base.map((field) => field.id));
    const extras = Object.keys(draft.uploads)
        .filter((code) => !seen.has(code) && code !== 'prescription')
        .map((code) => ({
            id: code,
            label: humanizeCode(code),
        }));

    return [...base, ...extras];
}

export default function ReviewCheckoutModal({
    mode,
    catalog,
    draft,
    caseReference,
    savedDrafts = [],
    onClose,
    onSubmit,
    onUpdateUploads,
    onUpdateFileSlots,
    onUpdatePayment,
    onLoadDraft,
    onDownloadPrescription,
    onOpenFilesFromReview,
}: ReviewCheckoutModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [uploadFields, setUploadFields] = useState<FreeformUploadField[]>([]);
    const totals = calculateTotals(draft, catalog);

    const syncFileSlots = (fields: FreeformUploadField[]) => {
        onUpdateFileSlots?.(
            fields.map((field) => ({
                code: field.id,
                label: field.label,
            })),
        );
    };

    useEffect(() => {
        if (mode !== 'files') {
            return;
        }

        const fields = buildInitialUploadFields(draft);
        setUploadFields(fields);
        syncFileSlots(fields);
        setNewFieldLabel('');
        setError(null);
    }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only when modal opens

    if (mode === 'none') {
        return null;
    }

    const handleFileChange = (
        fieldId: string,
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(event.target.files ?? []);
        const meta: UploadedFileMeta[] = files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            file,
        }));

        onUpdateUploads({
            ...draft.uploads,
            [fieldId]: meta,
        });
    };

    const handleAddField = () => {
        const label = newFieldLabel.trim();

        if (label === '') {
            setError('Enter a field label / purpose before adding.');

            return;
        }

        let id = slugifyLabel(label);
        const existingIds = new Set(uploadFields.map((field) => field.id));

        if (existingIds.has(id)) {
            id = `${id}-${Date.now()}`;
        }

        const next = [...uploadFields, { id, label }];
        setUploadFields(next);
        syncFileSlots(next);
        onUpdateUploads({
            ...draft.uploads,
            [id]: [],
        });
        setNewFieldLabel('');
        setError(null);
    };

    const handleRemoveField = (fieldId: string) => {
        const next = uploadFields.filter((field) => field.id !== fieldId);
        setUploadFields(next);
        syncFileSlots(next);

        const nextUploads = { ...draft.uploads };
        delete nextUploads[fieldId];
        onUpdateUploads(nextUploads);
    };

    const handleRenameField = (fieldId: string, label: string) => {
        const next = uploadFields.map((field) =>
            field.id === fieldId ? { ...field, label } : field,
        );
        setUploadFields(next);
        syncFileSlots(next);
    };

    const handleSubmit = () => {
        if (mode === 'review' && !draft.payment.terms) {
            setError('Please confirm the prescription.');

            return;
        }

        setError(null);
        onSubmit();
    };

    const title =
        mode === 'review'
            ? 'Review Case'
            : mode === 'files'
                ? 'Digital Submission Protocol'
                : mode === 'courier'
                    ? 'Courier Service'
                    : mode === 'load'
                        ? 'Load Saved Case'
                        : mode === 'help'
                            ? 'Create Case Help'
                            : 'Case Submitted';

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <section
                className={cn(
                    'modal',
                    (mode === 'success' ||
                        mode === 'courier' ||
                        mode === 'help' ||
                        mode === 'load') &&
                    'small',
                )}
                onClick={(event) => event.stopPropagation()}
            >
                {mode !== 'success' && (
                    <div className="modal-header">
                        <h2>{title}</h2>
                        <button
                            type="button"
                            className="modal-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            {'\u00D7'}
                        </button>
                    </div>
                )}

                <div className={mode === 'success' ? undefined : 'modal-body'}>
                    {mode === 'success' && (
                        <div className="success-view">
                            <div className="success-icon">
                                <IconCheck />
                            </div>
                            <h2>Case submitted successfully</h2>
                            <p>
                                The case has been routed according to the selected
                                prescription and service.
                            </p>
                            <p>
                                Case Reference: <strong>{caseReference}</strong>
                                <br />
                                Case ID: <strong>{draft.id || '?'}</strong>
                                <br />
                                Service: <strong>{serviceLabel(draft.service)}</strong>
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={onSubmit}
                            >
                            {'\u00D7'}
                        </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                style={{ marginLeft: 10 }}
                                onClick={onDownloadPrescription}
                            >
                                <IconDownload /> Download Prescription
                            </button>
                        </div>
                    )}

                    {mode === 'courier' && (
                        <div className="courier-modal-notice">
                            <div style={{ fontSize: 48, marginBottom: 12 }}>??</div>
                            <h3>Traditional Impression Selected</h3>
                            <p>
                                No digital scan files are required. Please send your
                                physical impressions to our lab via courier service.
                            </p>
                            <div className="courier-address">{LAB_ADDRESS}</div>
                            <p style={{ fontSize: 12, marginTop: 8 }}>
                                Please include a printed copy of your prescription with
                                your impressions. You may proceed directly to Review.
                            </p>
                        </div>
                    )}

                    {mode === 'help' && (
                        <div>
                            <ol style={{ paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
                                <li>Enter patient name and due date.</li>
                                <li>
                                    Set tooth shade and impression type beside the chart.
                                </li>
                                <li>Click a tooth, then choose a product.</li>
                                <li>
                                    Select material and options, then Continue
                                    selections or Selection complete.
                                </li>
                                <li>
                                    For Intra Oral / Bench top scan: add upload
                                    fields and attach files as needed. For
                                    Traditional Impression: send via courier.
                                </li>
                                <li>Review and submit the case.</li>
                            </ol>
                        </div>
                    )}

                    {mode === 'load' && (
                        <div className="load-list">
                            {savedDrafts.length === 0 ? (
                                <p className="muted">No saved drafts found.</p>
                            ) : (
                                savedDrafts.map((entry) => (
                                    <div key={entry.id} className="load-item">
                                        <div>
                                            <strong>
                                                {entry.patientName || 'Unnamed patient'}
                                            </strong>
                                            <small>
                                                {entry.reference || entry.id}
                                                {' \u00B7 '}Due{' '}
                                                {entry.dueDate || 'Not set'}
                                                {' \u00B7 '}
                                                {entry.items.length} item
                                                {entry.items.length === 1 ? '' : 's'}
                                            </small>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-small"
                                            onClick={() => onLoadDraft?.(entry)}
                                        >
                                            Load
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {mode === 'files' && (
                        <>
                            <div className="modal-note">
                                Starts with Upper Arch, Lower Arch, and Bite
                                Scan. Add more fields as needed. Empty fields
                                stay as requests so Lab or Designer can upload
                                later. There is no file size limit in the app.
                            </div>

                            <div className="upload-add-row">
                                <input
                                    className="input"
                                    type="text"
                                    value={newFieldLabel}
                                    placeholder="Field label / purpose"
                                    onChange={(event) =>
                                        setNewFieldLabel(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            handleAddField();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddField}
                                >
                                    Add Field
                                </button>
                            </div>

                            {uploadFields.length === 0 ? (
                                <p className="muted">
                                    No upload fields yet. Add a field above to
                                    start uploading.
                                </p>
                            ) : (
                                <div className="upload-grid">
                                    {uploadFields.map((field) => {
                                        const uploaded =
                                            draft.uploads[field.id] ?? [];

                                        return (
                                            <div
                                                key={field.id}
                                                className={cn(
                                                    'upload-card',
                                                    uploaded.length > 0 &&
                                                        'complete',
                                                )}
                                            >
                                                <div>
                                                    <div className="upload-card-head">
                                                        <input
                                                            className="input upload-field-label"
                                                            type="text"
                                                            value={field.label}
                                                            aria-label="Field label"
                                                            onChange={(event) =>
                                                                handleRenameField(
                                                                    field.id,
                                                                    event.target.value,
                                                                )
                                                            }
                                                        />
                                                        <button
                                                            type="button"
                                                            className="upload-remove"
                                                            onClick={() =>
                                                                handleRemoveField(
                                                                    field.id,
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <p>Any file type - no size limit</p>
                                                    {uploaded.length > 0 && (
                                                        <div className="upload-file-list">
                                                            {uploaded.map((file) => (
                                                                <div key={file.name}>
                                                                    {file.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    className="file-input"
                                                    id={`upload-${field.id}`}
                                                    type="file"
                                                    multiple
                                                    onChange={(event) =>
                                                        handleFileChange(
                                                            field.id,
                                                            event,
                                                        )
                                                    }
                                                />
                                                <label
                                                    className="upload-label"
                                                    htmlFor={`upload-${field.id}`}
                                                >
                                                    <IconUpload />
                                                    {uploaded.length
                                                        ? 'Add / Replace Files'
                                                        : 'Choose Files'}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {mode === 'review' && (
                        <div className="review-grid">
                            <div>
                                <div className="review-section">
                                    <h3>Case Information</h3>
                                    <div className="review-item">
                                        <strong>
                                            {draft.patientName || 'Unnamed Patient'}
                                        </strong>
                                        <small>
                                            {draft.id || caseReference}
                                            {' \u00B7 '}
                                            {draft.client}
                                            {' \u00B7 '}Due:{' '}
                                            {draft.dueDate || 'Not set'}
                                        </small>
                                    </div>
                                    <div className="review-item">
                                        <strong>Impression Type</strong>
                                        <small>{draft.impressionType}</small>
                                    </div>
                                </div>
                                <div className="review-section">
                                    <h3>Prescription</h3>
                                    {draft.items.map((item) => {
                                        const product =
                                            catalog.products[item.productKey];
                                        const tags = configTags(item);

                                        return (
                                            <div key={item.id} className="review-item">
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
                                                {tags.length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: 7,
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 5,
                                                        }}
                                                    >
                                                        {tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                style={{
                                                                    padding: '5px 7px',
                                                                    background:
                                                                        '#f0f0f3',
                                                                    borderRadius: 3,
                                                                    fontSize: 10,
                                                                }}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="review-section">
                                    <h3>Confirmation</h3>
                                    <label
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'flex-start',
                                            fontSize: 12,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draft.payment.terms}
                                            onChange={(event) =>
                                                onUpdatePayment({
                                                    ...draft.payment,
                                                    terms: event.target.checked,
                                                })
                                            }
                                        />
                                        <span>
                                            I confirm that the prescription and
                                            submitted information are correct.
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <aside className="review-summary">
                                <h3
                                    style={{
                                        margin: '0 0 13px',
                                        color: 'var(--primary)',
                                    }}
                                >
                                    Order Summary
                                </h3>
                                <div className="review-item">
                                    <strong>{serviceLabel(draft.service)}</strong>
                                    <small>
                                        {draft.service === 'design'
                                            ? 'Delivered by customer download link'
                                            : draft.service === 'approve'
                                                ? 'Customer approval required'
                                                : 'Approval followed by manufacturing'}
                                    </small>
                                </div>
                                {draft.service === 'manufacture' && (
                                    <div className="review-item">
                                        <strong>
                                            {draft.output === 'applianceModels'
                                                ? 'Appliance and Models'
                                                : 'Appliance Only'}
                                        </strong>
                                    </div>
                                )}
                                <div className="price-lines">
                                    <div className="price-line">
                                        <span>Package total</span>
                                        <strong>
                                            {money(totals.packageTotal)}
                                        </strong>
                                    </div>
                                    <div className="price-line total">
                                        <span>Total</span>
                                        <span>{money(totals.total)}</span>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    {error && (
                        <p
                            style={{
                                marginTop: 15,
                                padding: '11px 13px',
                                color: '#c52e47',
                                background: '#fef2f2',
                                borderRadius: 4,
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                {mode !== 'success' && mode !== 'help' && mode !== 'load' && (
                    <div className="modal-footer">
                        {mode === 'review' ? (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setError(null);
                                        onOpenFilesFromReview?.();
                                    }}
                                >
                                    {draft.impressionType ===
                                        'Traditional Impression' ? (
                                        <>
                                            <IconTruck /> Courier Info
                                        </>
                                    ) : (
                                        <>
                                            <IconUpload /> Digital Files
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleSubmit}
                                >
                                    <IconCheck />{' '}
                                    {draft.databaseId
                                        ? 'Update Case'
                                        : 'Submit Case'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={onClose}
                                >
                                    {mode === 'courier' ? 'Close' : 'Close'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                >
                                    {mode === 'files'
                                        ? 'Review Case'
                                        : 'Proceed to Review'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {mode === 'load' && (
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                )}

                {mode === 'help' && (
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onClose}
                        >
                            Got it
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
