import { Head, Link } from '@inertiajs/react';

import {
    AdminStaffForm,
    type StaffFormRole,
} from '@/components/admin-staff-form';
import AdminLayout from '@/layouts/admin-layout';
import { index, update } from '@/routes/admin/staff';

type StaffPayload = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    status: string;
    avatar_url?: string | null;
    roles: string[];
    is_last_super_admin?: boolean;
};

type Props = {
    admin: StaffPayload;
    roles: StaffFormRole[];
    statuses: string[];
    actorIsSuperAdmin?: boolean;
};

export default function StaffEdit({
    admin,
    roles,
    statuses,
    actorIsSuperAdmin = false,
}: Props) {
    return (
        <AdminLayout>
            <Head title={`Edit ${admin.name}`} />

            <div className="p-6">
                <div className="mb-[22.5px]">
                    <Link
                        href={index.url()}
                        className="text-[13.125px] font-medium text-[#0260bd]"
                    >
                        ← Back to staff
                    </Link>
                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Edit Staff Member
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Update account details and assigned roles
                    </p>
                </div>

                <AdminStaffForm
                    {...update.form(admin.id)}
                    roles={roles}
                    statuses={statuses}
                    selected={admin.roles}
                    isEdit
                    isLastSuperAdmin={admin.is_last_super_admin ?? false}
                    actorIsSuperAdmin={actorIsSuperAdmin}
                    admin={{
                        name: admin.name,
                        email: admin.email,
                        phone: admin.phone,
                        location: admin.location,
                        status: admin.status,
                        avatar_url: admin.avatar_url,
                    }}
                />
            </div>
        </AdminLayout>
    );
}
