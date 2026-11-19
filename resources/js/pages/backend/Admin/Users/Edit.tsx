import { Head, Link } from '@inertiajs/react';

import { PortalUserForm } from '@/components/portal-user-form';
import AdminLayout from '@/layouts/admin-layout';
import { index, update } from '@/routes/admin/users';

type PortalUser = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    status: string;
    role?: string | null;
    avatar_url?: string | null;
    client_id?: number | null;
};

type ClientOption = {
    id: number;
    code: string;
    name: string;
};

type Props = {
    user: PortalUser;
    roles: string[];
    statuses: string[];
    activeTab: string;
    canAssignRoles?: boolean;
    clients?: ClientOption[];
    submitterRoles?: string[];
};

export default function EditPortalUser({
    user,
    roles,
    statuses,
    activeTab,
    canAssignRoles = false,
    clients = [],
    submitterRoles = [],
}: Props) {
    return (
        <AdminLayout>
            <Head title={`Edit ${user.name}`} />

            <div className="p-6">
                <div className="mb-[22.5px]">
                    <Link
                        href={index.url({ query: { tab: activeTab } })}
                        className="text-[13.125px] font-medium text-[#0260bd]"
                    >
                        ← Back to user management
                    </Link>
                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Edit user
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Update profile details, status, and access type
                    </p>
                </div>

                <PortalUserForm
                    {...update.form(user.id)}
                    roles={roles}
                    statuses={statuses}
                    activeTab={activeTab}
                    canAssignRoles={canAssignRoles}
                    user={user}
                    clients={clients}
                    submitterRoles={submitterRoles}
                    submitLabel="Save changes"
                />
            </div>
        </AdminLayout>
    );
}
