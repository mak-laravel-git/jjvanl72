import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import AdminLayout from '@/layouts/admin-layout';
import {
    destroy,
    edit,
    index as staffIndex,
} from '@/routes/admin/staff';
import type { SharedData } from '@/types';

type StaffMember = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    status: string;
    status_label: string;
    avatar_url?: string | null;
    initials: string;
    roles: string[];
    is_super_admin: boolean;
    is_last_super_admin: boolean;
    email_verified_at?: string | null;
    joined: string;
    updated_at?: string | null;
};

type Props = {
    admin: StaffMember;
    canUpdateAdmins?: boolean;
    canDeleteAdmins?: boolean;
};

export default function StaffShow({
    admin,
    canUpdateAdmins = false,
    canDeleteAdmins = false,
}: Props) {
    const { flash } = usePage<
        SharedData & { flash?: { success?: string; error?: string } }
    >().props;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const confirmDeleteStaff = () => {
        if (!canDeleteAdmins || deleting) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url(admin.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AdminLayout>
            <Head title={admin.name} />

            <div className="p-6">
                <div className="mb-[22.5px] flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={staffIndex.url()}
                            className="text-[13.125px] font-medium text-[#0260bd]"
                        >
                            ← Back to staff
                        </Link>
                        <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Staff details
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Admin account overview and assigned roles
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {canUpdateAdmins ? (
                            <Link
                                href={edit.url(admin.id)}
                                className="rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white"
                            >
                                Edit staff
                            </Link>
                        ) : null}
                        {canDeleteAdmins ? (
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

                {flash?.error ? (
                    <div className="mb-4 rounded-[9.375px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13.125px] text-[#c10007]">
                        {flash.error}
                    </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <section className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                        <div className="flex flex-col items-center text-center">
                            {admin.avatar_url ? (
                                <img
                                    src={admin.avatar_url}
                                    alt=""
                                    className="size-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5]">
                                    <span className="text-2xl font-semibold text-white">
                                        {admin.initials}
                                    </span>
                                </div>
                            )}
                            <h2 className="mt-4 text-[16.875px] font-bold text-[#050315]">
                                {admin.name}
                            </h2>
                            <p className="mt-1 text-[13.125px] text-[#475569]">
                                {admin.email}
                            </p>
                            <span
                                className={`mt-3 rounded-full px-2.5 py-1 text-[11.25px] font-semibold ${
                                    admin.status_label === 'Active'
                                        ? 'bg-[#f0fdf4] text-[#008236]'
                                        : 'bg-[#f1f5f9] text-[#475569]'
                                }`}
                            >
                                {admin.status_label}
                            </span>
                        </div>
                    </section>

                    <div className="space-y-5">
                        <section className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                            <h3 className="text-[13.125px] font-semibold text-[#050315]">
                                Profile
                            </h3>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                        Phone
                                    </dt>
                                    <dd className="mt-1 text-[13.125px] text-[#050315]">
                                        {admin.phone || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                        Location
                                    </dt>
                                    <dd className="mt-1 text-[13.125px] text-[#050315]">
                                        {admin.location || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                        Joined
                                    </dt>
                                    <dd className="mt-1 text-[13.125px] text-[#050315]">
                                        {admin.joined || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                                        Email verified
                                    </dt>
                                    <dd className="mt-1 text-[13.125px] text-[#050315]">
                                        {admin.email_verified_at
                                            ? 'Verified'
                                            : 'Not verified'}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                            <h3 className="text-[13.125px] font-semibold text-[#050315]">
                                Assigned roles
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {admin.roles.length === 0 ? (
                                    <p className="text-[13.125px] text-[#475569]">
                                        No roles assigned.
                                    </p>
                                ) : (
                                    admin.roles.map((roleName) => (
                                        <span
                                            key={roleName}
                                            className="rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[13.125px] font-semibold text-[#475569]"
                                        >
                                            {roleName}
                                        </span>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <AdminModal
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete staff member?"
                description={`Delete "${admin.name}"? This cannot be undone.`}
                className="max-w-[480px]"
            >
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-[15px] py-[9px] text-[13.125px] font-semibold text-[#475569]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={confirmDeleteStaff}
                        className="rounded-[9.375px] bg-[#dc2626] px-[15px] py-[9px] text-[13.125px] font-semibold text-white disabled:opacity-60"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </AdminModal>
        </AdminLayout>
    );
}
