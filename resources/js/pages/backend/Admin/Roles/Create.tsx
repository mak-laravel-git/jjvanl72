import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import {
    AdminPermissionChecklist,
    type PermissionGroup,
} from '@/components/admin-permission-checklist';
import AdminLayout from '@/layouts/admin-layout';
import { index, store } from '@/routes/admin/roles';

type Props = {
    permissionGroups: PermissionGroup[];
};

export default function RolesCreate({ permissionGroups }: Props) {
    const [permissions, setPermissions] = useState<string[]>([]);

    return (
        <AdminLayout>
            <Head title="Create Role" />

            <div className="p-6">
                <Form {...store.form()} className="w-full space-y-5">
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <Link
                                        href={index.url()}
                                        className="text-[13.125px] font-medium text-[#0260bd]"
                                    >
                                        ← Back to roles
                                    </Link>
                                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                                        Create Role
                                    </h1>
                                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                                        Define a new admin role and its
                                        permissions
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href={index.url()}
                                        className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-2 text-[13.125px] font-medium text-[#050315]"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Create Role'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Role Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="h-10 w-full max-w-md rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]"
                                    placeholder="e.g. Clinic Manager"
                                />
                                {errors.name ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.name}
                                    </p>
                                ) : null}
                            </div>

                            {permissions.map((permission) => (
                                <input
                                    key={permission}
                                    type="hidden"
                                    name="permissions[]"
                                    value={permission}
                                />
                            ))}

                            <AdminPermissionChecklist
                                permissionGroups={permissionGroups}
                                selected={permissions}
                                onChange={setPermissions}
                            />

                            {errors.permissions ? (
                                <p className="text-[12px] text-[#c10007]">
                                    {errors.permissions}
                                </p>
                            ) : null}

                            <div className="flex items-center justify-end gap-3">
                                <Link
                                    href={index.url()}
                                    className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-2 text-[13.125px] font-medium text-[#050315]"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                >
                                    {processing ? 'Saving...' : 'Create Role'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AdminLayout>
    );
}
