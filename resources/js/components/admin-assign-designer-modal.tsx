import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import { cn } from '@/lib/utils';
import { store } from '@/routes/admin/assignments';

export type AssignableUser = {
    id: number;
    name: string;
    initials: string;
    role: string | null;
    active: number;
};

export type AssignmentQueueTarget = {
    id: number;
    case_number: string;
    customer: string;
    product: string;
    needs_designer: boolean;
    needs_manufacturer: boolean;
};

type Props = {
    target: AssignmentQueueTarget | null;
    users: AssignableUser[];
    onClose: () => void;
};

function defaultRoleFor(target: AssignmentQueueTarget): 'Designer' | 'Manufacturer' {
    if (! target.needs_designer && target.needs_manufacturer) {
        return 'Manufacturer';
    }

    return 'Designer';
}

export function AdminAssignCaseModal({ target, users, onClose }: Props) {
    const [role, setRole] = useState<'Designer' | 'Manufacturer'>('Designer');
    const [selected, setSelected] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (target === null) {
            return;
        }

        setRole(defaultRoleFor(target));
        setSelected([]);
    }, [target]);

    const filteredUsers = useMemo(
        () => users.filter((user) => user.role === role),
        [role, users],
    );

    if (target === null) {
        return null;
    }

    const toggleUser = (id: number) => {
        setSelected((previous) =>
            previous.includes(id)
                ? previous.filter((value) => value !== id)
                : [...previous, id],
        );
    };

    const submit = () => {
        if (selected.length === 0) {
            return;
        }

        setProcessing(true);
        router.post(
            store.url(),
            {
                dental_case_id: target.id,
                role,
                user_ids: selected,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setSelected([]);
                    onClose();
                },
            },
        );
    };

    return (
        <AdminModal
            open
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
            title={`Assign ${role}`}
            className="sm:max-w-[480px]"
            header={
                <div>
                    <p className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                        Assign Case
                    </p>
                    <p className="pt-[1.875px] text-[11.25px] leading-[15px] text-[#6a7282]">
                        {target.case_number} — {target.customer}
                        {target.product ? ` · ${target.product}` : ''}
                    </p>
                </div>
            }
            footer={
                <div className="flex items-center justify-end gap-[7.5px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-[8.5px] text-[13.125px] leading-[18.75px] font-medium text-[#050315]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={selected.length === 0 || processing}
                        onClick={submit}
                        className="rounded-[9.375px] bg-[#0260bd] px-[15px] py-[7.5px] text-[13.125px] leading-[18.75px] font-medium text-white disabled:opacity-40"
                    >
                        {processing ? 'Assigning…' : 'Assign'}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-[11.25px] p-[15px]">
                <div className="flex gap-2">
                    {(
                        [
                            {
                                value: 'Designer' as const,
                                enabled: target.needs_designer,
                            },
                            {
                                value: 'Manufacturer' as const,
                                enabled: target.needs_manufacturer,
                            },
                        ] as const
                    ).map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            disabled={!option.enabled}
                            onClick={() => {
                                setRole(option.value);
                                setSelected([]);
                            }}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-semibold',
                                role === option.value
                                    ? 'border-[#0260bd] bg-[#eff6ff] text-[#0260bd]'
                                    : 'border-[#e5e7eb] text-[#475569]',
                                !option.enabled && 'opacity-40',
                            )}
                        >
                            {option.value}
                        </button>
                    ))}
                </div>

                {filteredUsers.length === 0 ? (
                    <p className="text-sm text-[#6a7282]">
                        No {role.toLowerCase()}s available.
                    </p>
                ) : (
                    filteredUsers.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUser(user.id)}
                            className={cn(
                                'flex items-center gap-[11.25px] rounded-[13.375px] border p-[14.125px] text-left',
                                selected.includes(user.id)
                                    ? 'border-[#0260bd] bg-[#eff6ff]'
                                    : 'border-[#e5e7eb]',
                            )}
                        >
                            <span className="flex size-[33.75px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5] text-[13.125px] leading-[18.75px] font-semibold text-white">
                                {user.initials}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                    <span className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                        {user.name}
                                    </span>
                                    <span className="text-[11.25px] leading-[15px] font-medium text-[#99a1af]">
                                        {user.active} active
                                    </span>
                                </span>
                            </span>
                        </button>
                    ))
                )}
            </div>
        </AdminModal>
    );
}
