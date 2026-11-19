import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    destroy,
    edit,
    index as usersIndex,
} from '@/routes/admin/users';
import type { SharedData } from '@/types';

type PortalUser = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    status: string;
    status_label: string;
    avatar_url?: string | null;
    initials: string;
    role?: string | null;
    email_verified_at?: string | null;
    two_factor_enabled: boolean;
    joined: string;
    updated_at?: string | null;
};

type Props = {
    user: PortalUser;
    activeTab: string;
    canManageUsers?: boolean;
    canUpdateUsers?: boolean;
};

export default function ShowPortalUser({
    user,
    activeTab,
    canManageUsers = false,
    canUpdateUsers = false,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const confirmDeleteUser = () => {
        if (!canManageUsers || deleting) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url(user.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={user.name} />

            <div className="p-6">
                <div className="mb-[22.5px] flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={usersIndex.url({ query: { tab: activeTab } })}
                            className="text-[13.125px] font-medium text-[#0260bd]"
                        >
                            ← Back to user management
                        </Link>
                        <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            User details
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Stakeholder account overview
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {canUpdateUsers ? (
                            <Link
                                href={edit.url(user.id)}
                                className="rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                            >
                                Edit user
                            </Link>
                        ) : null}
                        {canManageUsers ? (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="rounded-[9.375px] border border-[#fecaca] bg-white px-[15px] py-[9px] text-[13.125px] font-semibold text-[#dc2626]"
                            >
                                Delete
                            </button>
                        ) : null}
                    </div>
                </div>

                {flash?.success ? (
                    <div className="mb-4 rounded-[9.375px] border border-[#b9f8cf] bg-[#f0fdf4] px-4 py-3 text-[13.125px] text-[#008236]">
                        {flash.success}
                    </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <section className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                        <div className="flex flex-col items-center text-center">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="size-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5]">
                                    <span className="text-2xl font-semibold text-white">
                                        {user.initials}
                                    </span>
                                </div>
                            )}
                            <h2 className="mt-4 text-[18px] font-bold text-[#050315]">
                                {user.name}
                            </h2>
                            <p className="mt-1 text-[13.125px] text-[#475569]">
                                {user.email}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                {user.role ? (
                                    <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11.25px] font-semibold text-[#0260bd]">
                                        {user.role}
                                    </span>
                                ) : null}
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-[11.25px] font-semibold',
                                        user.status === 'active'
                                            ? 'bg-[#dcfce7] text-[#008236]'
                                            : 'bg-[#f1f5f9] text-[#64748b]',
                                    )}
                                >
                                    {user.status_label}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                            <h3 className="text-[14px] font-bold text-[#050315]">
                                Contact
                            </h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <DetailField label="Email" value={user.email} />
                                <DetailField
                                    label="Phone"
                                    value={user.phone || '—'}
                                />
                                <DetailField
                                    label="Location"
                                    value={user.location || '—'}
                                />
                                <DetailField
                                    label="User type"
                                    value={user.role || '—'}
                                />
                            </div>
                        </div>

                        <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                            <h3 className="text-[14px] font-bold text-[#050315]">
                                Account
                            </h3>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <DetailField
                                    label="Status"
                                    value={user.status_label}
                                />
                                <DetailField
                                    label="Email verified"
                                    value={
                                        user.email_verified_at
                                            ? 'Verified'
                                            : 'Not verified'
                                    }
                                />
                                <DetailField
                                    label="Two-factor auth"
                                    value={
                                        user.two_factor_enabled
                                            ? 'Enabled'
                                            : 'Disabled'
                                    }
                                />
                                <DetailField
                                    label="Joined"
                                    value={user.joined || '—'}
                                />
                                <DetailField
                                    label="Last updated"
                                    value={user.updated_at || '—'}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <AdminModal
                open={confirmDelete && canManageUsers}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmDelete(false);
                    }
                }}
                title="Delete user"
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
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleting}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteUser}
                            disabled={deleting}
                            className="rounded-[9.375px] bg-[#dc2626] px-4 py-2 text-[13.125px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-40"
                        >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-3 px-[22.5px] py-5">
                    <p className="text-[13.125px] leading-5 text-[#050315]">
                        Are you sure you want to permanently delete{' '}
                        <span className="font-semibold">{user.name}</span>?
                    </p>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
            <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                {label}
            </p>
            <p className="mt-1 text-[13.125px] break-all text-[#050315]">
                {value}
            </p>
        </div>
    );
}
