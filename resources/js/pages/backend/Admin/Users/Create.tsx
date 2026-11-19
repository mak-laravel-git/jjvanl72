import { Head, Link } from '@inertiajs/react';

import { PortalUserForm } from '@/components/portal-user-form';
import AdminLayout from '@/layouts/admin-layout';
import { index, store } from '@/routes/admin/users';

type Tab = {
    id: string;
    label: string;
    role: string | null;
};

type ClientOption = {
    id: number;
    code: string;
    name: string;
};

type Props = {
    activeTab: string;
    role: string | null;
    roles: string[];
    statuses: string[];
    tabs: Tab[];
    clients?: ClientOption[];
    submitterRoles?: string[];
};

export default function CreatePortalUser({
    activeTab,
    role,
    roles,
    statuses,
    clients = [],
    submitterRoles = [],
}: Props) {
    const lockedRole = activeTab !== 'all' ? role : null;
    const heading = lockedRole ? `Create ${lockedRole}` : 'Create user';

    return (
        <AdminLayout>
            <Head title={heading} />

            <div className="p-6">
                <div className="mb-[22.5px]">
                    <Link
                        href={index.url({ query: { tab: activeTab } })}
                        className="text-[13.125px] font-medium text-[#0260bd]"
                    >
                        ← Back to user management
                    </Link>
                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        {heading}
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Add a stakeholder account with profile details and
                        access type
                    </p>
                </div>

                <PortalUserForm
                    {...store.form()}
                    roles={roles}
                    statuses={statuses}
                    activeTab={activeTab}
                    lockedRole={lockedRole}
                    canAssignRoles
                    clients={clients}
                    submitterRoles={submitterRoles}
                    submitLabel={lockedRole ? `Create ${lockedRole}` : 'Create user'}
                />
            </div>
        </AdminLayout>
    );
}
