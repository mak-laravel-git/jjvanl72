import { Head, Link } from '@inertiajs/react';

import {
    AdminStaffForm,
    type StaffFormRole,
} from '@/components/admin-staff-form';
import AdminLayout from '@/layouts/admin-layout';
import { index, store } from '@/routes/admin/staff';

type Props = {
    roles: StaffFormRole[];
    statuses: string[];
    actorIsSuperAdmin?: boolean;
};

export default function StaffCreate({
    roles,
    statuses,
    actorIsSuperAdmin = false,
}: Props) {
    return (
        <AdminLayout>
            <Head title="Create Staff Member" />

            <div className="p-6">
                <div className="mb-[22.5px]">
                    <Link
                        href={index.url()}
                        className="text-[13.125px] font-medium text-[#0260bd]"
                    >
                        ← Back to staff
                    </Link>
                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Create Staff Member
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Add a new admin account and assign its roles
                    </p>
                </div>

                <AdminStaffForm
                    {...store.form()}
                    roles={roles}
                    statuses={statuses}
                    selected={[]}
                    isEdit={false}
                    isLastSuperAdmin={false}
                    actorIsSuperAdmin={actorIsSuperAdmin}
                />
            </div>
        </AdminLayout>
    );
}
