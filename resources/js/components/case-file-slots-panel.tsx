import { router } from '@inertiajs/react';
import { type ChangeEvent, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
    destroy as destroySlot,
    store as storeSlot,
} from '@/routes/cases/file-slots';
import { store as storeSlotFiles } from '@/routes/cases/file-slots/files';

export type CaseFileSlotItem = {
    id: number;
    code: string;
    label: string;
    sort_order?: number;
    uploaded: boolean;
};

type CaseFileSlotsPanelProps = {
    caseDatabaseId: number;
    slots: CaseFileSlotItem[];
    canManage: boolean;
    className?: string;
};

export default function CaseFileSlotsPanel({
    caseDatabaseId,
    slots,
    canManage,
    className,
}: CaseFileSlotsPanelProps) {
    const [newLabel, setNewLabel] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

    const addField = () => {
        const label = newLabel.trim();

        if (label === '') {
            setError('Enter a field label before adding.');

            return;
        }

        setBusy(true);
        setError(null);
        router.post(
            storeSlot.url(caseDatabaseId),
            { label },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onError: (errors) => {
                    const first = Object.values(errors)[0];
                    setError(
                        Array.isArray(first) ? first[0] : String(first ?? ''),
                    );
                },
                onSuccess: () => setNewLabel(''),
            },
        );
    };

    const uploadFiles = (slot: CaseFileSlotItem, event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (files.length === 0) {
            return;
        }

        const form = new FormData();
        files.forEach((file) => form.append('files[]', file));

        setBusy(true);
        router.post(
            storeSlotFiles.url({ dentalCase: caseDatabaseId, slot: slot.id }),
            form,
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setBusy(false);
                    const input = fileInputs.current[slot.id];

                    if (input) {
                        input.value = '';
                    }
                },
            },
        );
    };

    const removeSlot = (slot: CaseFileSlotItem) => {
        if (slot.uploaded) {
            return;
        }

        setBusy(true);
        router.delete(
            destroySlot.url({ dentalCase: caseDatabaseId, slot: slot.id }),
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className={cn('space-y-3', className)}>
            {canManage ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                        type="text"
                        className="h-9 min-w-0 flex-1 rounded border border-[#e2e8f0] px-3 text-sm text-[#050315]"
                        placeholder="Field label / purpose"
                        value={newLabel}
                        disabled={busy}
                        onChange={(event) => setNewLabel(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                addField();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="h-9 rounded bg-[#0260bd] px-3 text-sm font-medium text-white hover:bg-[#0250a0] disabled:opacity-60"
                        disabled={busy}
                        onClick={addField}
                    >
                        Add Field
                    </button>
                </div>
            ) : null}

            {error ? (
                <p className="text-xs text-[#dc2626]">{error}</p>
            ) : null}

            <div className="flex flex-col divide-y divide-[#f1f5f9] rounded border border-[#e2e8f0]">
                {slots.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[#94a3b8]">
                        No upload fields yet.
                    </p>
                ) : (
                    slots.map((slot) => (
                        <div
                            key={slot.id}
                            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#334155]">
                                    {slot.label}
                                </p>
                                <p className="text-xs text-[#94a3b8]">
                                    {slot.uploaded
                                        ? 'Uploaded'
                                        : 'Requested — awaiting file'}
                                </p>
                            </div>
                            {canManage ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={(node) => {
                                            fileInputs.current[slot.id] = node;
                                        }}
                                        type="file"
                                        multiple
                                        className="sr-only"
                                        onChange={(event) =>
                                            uploadFiles(slot, event)
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="rounded border border-[#0260bd] px-2.5 py-1.5 text-xs font-medium text-[#0260bd] hover:bg-[#eff6ff] disabled:opacity-60"
                                        disabled={busy}
                                        onClick={() =>
                                            fileInputs.current[slot.id]?.click()
                                        }
                                    >
                                        Choose Files
                                    </button>
                                    {!slot.uploaded ? (
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-[#dc2626] hover:underline disabled:opacity-60"
                                            disabled={busy}
                                            onClick={() => removeSlot(slot)}
                                        >
                                            Remove
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
