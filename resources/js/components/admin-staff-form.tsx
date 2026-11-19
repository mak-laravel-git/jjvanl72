import { Form, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import FileUpload, {
    type ExistingFile,
} from '@/components/file-upload';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { index as staffIndex } from '@/routes/admin/staff';

export const SUPER_ADMIN_ROLE = 'Super Admin';

export type StaffFormRole = {
    id: number;
    name: string;
};

type StaffFormValues = {
    name?: string;
    email?: string;
    phone?: string | null;
    location?: string | null;
    status?: string;
    avatar_url?: string | null;
};

type Props = {
    action: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    roles: StaffFormRole[];
    statuses: string[];
    selected: string[];
    isEdit: boolean;
    isLastSuperAdmin: boolean;
    actorIsSuperAdmin: boolean;
    admin?: StaffFormValues;
};

export function AdminStaffForm({
    action,
    method,
    roles,
    statuses,
    selected,
    isEdit,
    isLastSuperAdmin,
    actorIsSuperAdmin,
    admin,
}: Props) {
    const [name, setName] = useState(admin?.name ?? '');
    const [email, setEmail] = useState(admin?.email ?? '');
    const [phone, setPhone] = useState(admin?.phone ?? '');
    const [location, setLocation] = useState(admin?.location ?? '');
    const [status, setStatus] = useState(admin?.status ?? 'active');
    const [selectedRoles, setSelectedRoles] = useState<string[]>(selected);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [existingAvatar, setExistingAvatar] = useState<ExistingFile[]>(
        admin?.avatar_url
            ? [
                  {
                      id: 'current-avatar',
                      path: 'avatar',
                      url: admin.avatar_url,
                      mime_type: 'image/jpeg',
                      name: 'Current avatar',
                  },
              ]
            : [],
    );
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const input = avatarInputRef.current;

        if (!input) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (avatarFile) {
            dataTransfer.items.add(avatarFile);
        }

        input.files = dataTransfer.files;
    }, [avatarFile]);

    const visibleRoles = roles.filter(
        (role) =>
            actorIsSuperAdmin ||
            role.name !== SUPER_ADMIN_ROLE ||
            selected.includes(SUPER_ADMIN_ROLE),
    );

    const isRoleLocked = (roleName: string) =>
        isLastSuperAdmin &&
        roleName === SUPER_ADMIN_ROLE &&
        selectedRoles.includes(SUPER_ADMIN_ROLE);

    const toggleRole = (roleName: string) => {
        if (isRoleLocked(roleName)) {
            return;
        }

        setSelectedRoles((current) =>
            current.includes(roleName)
                ? current.filter((item) => item !== roleName)
                : [...current, roleName],
        );
    };

    return (
        <Form
            action={action}
            method={method}
            encType="multipart/form-data"
            className="w-full space-y-5"
            validationTimeout={500}
        >
            {({
                errors,
                processing,
                validate,
                validating,
                invalid,
                valid,
            }) => (
                <>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        name={avatarFile ? 'avatar' : undefined}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        tabIndex={-1}
                        aria-hidden
                    />
                    {removeAvatar ? (
                        <input type="hidden" name="remove_avatar" value="1" />
                    ) : null}
                    <input type="hidden" name="status" value={status} />

                    <div className="space-y-5 rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                        <div>
                            <p className="mb-3 text-[13.125px] font-semibold text-[#050315]">
                                Profile photo
                            </p>
                            <FileUpload
                                variant="avatar"
                                avatarSize={112}
                                value={avatarFile}
                                onChange={(file) => {
                                    const next =
                                        file instanceof File ? file : null;
                                    setAvatarFile(next);

                                    if (next) {
                                        setRemoveAvatar(false);
                                    }
                                }}
                                existingFiles={existingAvatar}
                                onRemoveExisting={() => {
                                    setExistingAvatar([]);
                                    setRemoveAvatar(true);
                                    setAvatarFile(null);
                                }}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                maxSize={2}
                                maxFiles={1}
                                hint="JPEG, PNG, GIF, or WebP up to 2 MB"
                                placeholder="Upload avatar"
                                error={errors.avatar}
                            />
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="e.g. Jamie Rivera"
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.name ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.name}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        validate('email');
                                    }}
                                    onBlur={() => validate('email')}
                                    placeholder="name@example.com"
                                    aria-invalid={invalid('email')}
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd] aria-[invalid=true]:border-[#c10007]"
                                />
                                {validating ? (
                                    <p className="mt-2 text-[12px] text-[#64748b]">
                                        Checking email…
                                    </p>
                                ) : null}
                                {invalid('email') && errors.email ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.email}
                                    </p>
                                ) : null}
                                {!validating &&
                                valid('email') &&
                                email.trim() !== '' ? (
                                    <p className="mt-2 text-[12px] text-[#15803d]">
                                        Email is available
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Phone
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="e.g. +1 555 0100"
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.phone ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.phone}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label
                                    htmlFor="location"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Location
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={location}
                                    onChange={(event) =>
                                        setLocation(event.target.value)
                                    }
                                    placeholder="City or region"
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.location ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.location}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                            >
                                Status
                            </label>
                            <Select
                                value={status}
                                onValueChange={setStatus}
                            >
                                <SelectTrigger
                                    id="status"
                                    className="h-10 w-full max-w-sm rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((statusValue) => (
                                        <SelectItem
                                            key={statusValue}
                                            value={statusValue}
                                        >
                                            {statusValue === 'active'
                                                ? 'Active'
                                                : 'Inactive'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.status ? (
                                <p className="mt-2 text-[12px] text-[#c10007]">
                                    {errors.status}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required={!isEdit}
                                    placeholder={
                                        isEdit
                                            ? 'Leave blank to keep current password'
                                            : 'Minimum 8 characters'
                                    }
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.password ? (
                                    <p className="mt-2 text-[12px] text-[#c10007]">
                                        {errors.password}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Confirm Password
                                </label>
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    required={!isEdit}
                                    placeholder={
                                        isEdit
                                            ? 'Repeat new password if changing it'
                                            : 'Repeat password'
                                    }
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                            </div>
                        </div>
                    </div>

                    {selectedRoles.map((roleName) => (
                        <input
                            key={roleName}
                            type="hidden"
                            name="roles[]"
                            value={roleName}
                        />
                    ))}

                    <div className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f9fafb] px-4 py-3">
                            <div>
                                <p className="text-[13.125px] font-semibold text-[#050315]">
                                    Roles
                                </p>
                                <p className="text-[11.25px] text-[#6a7282]">
                                    {selectedRoles.length} selected
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 p-4">
                            {visibleRoles.length === 0 ? (
                                <p className="text-[13.125px] text-[#475569]">
                                    No roles are available to assign.
                                </p>
                            ) : (
                                visibleRoles.map((role) => {
                                    const checked = selectedRoles.includes(
                                        role.name,
                                    );
                                    const locked = isRoleLocked(role.name);

                                    return (
                                        <label
                                            key={role.id}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2',
                                                checked
                                                    ? 'border-[#0260bd] bg-[#eff6ff]'
                                                    : 'border-[#e5e7eb]',
                                                locked &&
                                                    'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="size-4 rounded border-[#d1d5dc] text-[#0260bd] focus:ring-[#0260bd]"
                                                checked={checked}
                                                disabled={locked}
                                                onChange={() =>
                                                    toggleRole(role.name)
                                                }
                                            />
                                            <span className="text-[13.125px] font-medium text-[#050315]">
                                                {role.name}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        {isLastSuperAdmin ? (
                            <p className="border-t border-[#e2e8f0] px-4 py-3 text-[12px] text-[#b45309]">
                                The system must keep at least one Super Admin.
                                Assign the Super Admin role to another admin
                                before removing it from this account or deleting
                                this user.
                            </p>
                        ) : null}

                        {!actorIsSuperAdmin ? (
                            <p className="border-t border-[#e2e8f0] px-4 py-3 text-[12px] text-[#6a7282]">
                                Only a Super Admin can assign the Super Admin
                                role.
                            </p>
                        ) : null}
                    </div>

                    {errors.roles ? (
                        <p className="text-[12px] text-[#c10007]">
                            {errors.roles}
                        </p>
                    ) : null}

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={staffIndex.url()}
                            className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-2 text-[13.125px] font-medium text-[#050315]"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || selectedRoles.length === 0}
                            className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                        >
                            {processing
                                ? 'Saving...'
                                : isEdit
                                  ? 'Update Staff Member'
                                  : 'Create Staff Member'}
                        </button>
                    </div>
                </>
            )}
        </Form>
    );
}
