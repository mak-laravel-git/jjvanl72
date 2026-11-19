import { Form, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import FileUpload, {
    type ExistingFile,
} from '@/components/file-upload';
import { PasswordInput } from '@/components/ui/password-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index as usersIndex } from '@/routes/admin/users';

type ClientOption = {
    id: number;
    code: string;
    name: string;
};

type PortalUserFormValues = {
    name?: string;
    email?: string;
    phone?: string | null;
    location?: string | null;
    status?: string;
    role?: string | null;
    avatar_url?: string | null;
    client_id?: number | null;
};

type Props = {
    action: string;
    method: 'post' | 'put';
    roles: string[];
    statuses: string[];
    activeTab: string;
    canAssignRoles?: boolean;
    lockedRole?: string | null;
    user?: PortalUserFormValues;
    submitLabel: string;
    clients?: ClientOption[];
    submitterRoles?: string[];
};

export function PortalUserForm({
    action,
    method,
    roles,
    statuses,
    activeTab,
    canAssignRoles = true,
    lockedRole = null,
    user,
    submitLabel,
    clients = [],
    submitterRoles = ['Dentist', 'Denturist', 'Lab'],
}: Props) {
    const isEdit = Boolean(user);
    const roleLockedOnCreate = Boolean(lockedRole) && !isEdit;
    const canChangeRole = (canAssignRoles || !isEdit) && !roleLockedOnCreate;

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [location, setLocation] = useState(user?.location ?? '');
    const [status, setStatus] = useState(user?.status ?? 'active');
    const [role, setRole] = useState(user?.role ?? lockedRole ?? roles[0] ?? '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [existingAvatar, setExistingAvatar] = useState<ExistingFile[]>(
        user?.avatar_url
            ? [
                  {
                      id: 'current-avatar',
                      path: 'avatar',
                      url: user.avatar_url,
                      mime_type: 'image/jpeg',
                      name: 'Current avatar',
                  },
              ]
            : [],
    );
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const [clientId, setClientId] = useState(
        user?.client_id ? String(user.client_id) : '',
    );
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const isSubmitter = submitterRoles.includes(role);
    const NONE_CLIENT_VALUE = '__none__';

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

    return (
        <Form
            action={action}
            method={method}
            encType="multipart/form-data"
            className="w-full space-y-5"
            validationTimeout={500}
        >
            {({ errors, processing, validate, validating, invalid, valid }) => (
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
                    <input type="hidden" name="role" value={role} />
                    {isSubmitter && clientId ? (
                        <input type="hidden" name="client_id" value={clientId} />
                    ) : null}

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
                                    placeholder="Enter full name"
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.name ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.name}
                                    </p>
                                ) : null}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Email
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
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd] aria-[invalid=true]:border-[#c10007]"
                                />
                                {validating ? (
                                    <p className="mt-1 text-[12px] text-[#64748b]">
                                        Checking email…
                                    </p>
                                ) : null}
                                {invalid('email') && errors.email ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.email}
                                    </p>
                                ) : null}
                                {!validating &&
                                valid('email') &&
                                email.trim() !== '' ? (
                                    <p className="mt-1 text-[12px] text-[#15803d]">
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
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.phone ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
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
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.location ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.location}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="role"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    User type
                                </label>
                                {canChangeRole ? (
                                    <Select
                                        value={role}
                                        onValueChange={(value) => {
                                            setRole(value);

                                            if (!submitterRoles.includes(value)) {
                                                setClientId('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            id="role"
                                            className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                                        >
                                            <SelectValue placeholder="Select user type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((roleName) => (
                                                <SelectItem
                                                    key={roleName}
                                                    value={roleName}
                                                >
                                                    {roleName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex h-10 items-center rounded-[9.375px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13.125px] text-[#050315]">
                                        {role}
                                    </div>
                                )}
                                {errors.role ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.role}
                                    </p>
                                ) : null}
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
                                        className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
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
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.status}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {isSubmitter ? (
                            <div>
                                <label
                                    htmlFor="client_id"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    Dental client
                                </label>
                                <Select
                                    value={clientId || NONE_CLIENT_VALUE}
                                    onValueChange={(value) =>
                                        setClientId(
                                            value === NONE_CLIENT_VALUE
                                                ? ''
                                                : value,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="client_id"
                                        className="h-10 w-full rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                                    >
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_CLIENT_VALUE}>
                                            Select client
                                        </SelectItem>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={String(client.id)}
                                            >
                                                {client.name} ({client.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.client_id ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
                                        {errors.client_id}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-5 rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                        <div>
                            <p className="text-[13.125px] font-semibold text-[#050315]">
                                {isEdit ? 'Password (optional)' : 'Password'}
                            </p>
                            <p className="mt-1 text-[12px] text-[#475569]">
                                {isEdit
                                    ? 'Leave blank to keep the current password.'
                                    : 'Set an initial password for this account.'}
                            </p>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase"
                                >
                                    {isEdit ? 'New Password' : 'Password'}
                                </label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required={!isEdit}
                                    autoComplete="new-password"
                                    placeholder={
                                        isEdit
                                            ? 'Leave blank to keep current'
                                            : 'Enter password'
                                    }
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                                {errors.password ? (
                                    <p className="mt-1 text-[12px] text-[#c10007]">
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
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required={!isEdit}
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={usersIndex.url({
                                query: { tab: activeTab },
                            })}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-[15px] py-[9px] text-[13.125px] font-semibold text-[#475569]"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-[9.375px] bg-[#0260bd] px-[15px] py-[9px] text-[13.125px] font-semibold text-white disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : submitLabel}
                        </button>
                    </div>
                </>
            )}
        </Form>
    );
}
