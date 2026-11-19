import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Lock, Shield } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import EmailChangeModal, {
    type EmailChangeState,
} from '@/components/email-change-modal';
import FileUpload, { type ExistingFile } from '@/components/file-upload';
import { PasswordInput } from '@/components/ui/password-input';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    edit as profileEdit,
    update as profileUpdate,
} from '@/routes/admin/profile';
import {
    cancel as cancelEmailChange,
    resend as resendEmailChange,
    verifyCurrent,
    verifyNew,
} from '@/routes/admin/profile/email-change';
import { show as twoFactorShow } from '@/routes/two-factor';
import type { SharedData } from '@/types';

type ProfileData = {
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    status: string;
    status_label: string;
    role_label: string;
    roles: string[];
    avatar_url: string | null;
    created_at: string | null;
};

type Props = {
    profile: ProfileData;
    emailChange: EmailChangeState;
    canUseTwoFactor: boolean;
};

export default function AdminProfileEdit({
    profile,
    emailChange,
    canUseTwoFactor,
}: Props) {
    const { flash } = usePage<SharedData>().props;

    const [name, setName] = useState(profile.name);
    const [email, setEmail] = useState(profile.email);
    const [phone, setPhone] = useState(profile.phone ?? '');
    const [location, setLocation] = useState(profile.location ?? '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [existingAvatar, setExistingAvatar] = useState<ExistingFile[]>(
        profile.avatar_url
            ? [
                  {
                      id: 'current-avatar',
                      path: 'avatar',
                      url: profile.avatar_url,
                      mime_type: 'image/jpeg',
                      name: 'Current avatar',
                  },
              ]
            : [],
    );
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const [emailChangeOpen, setEmailChangeOpen] = useState(
        Boolean(emailChange.pending || flash?.email_change_started),
    );
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEmail(profile.email);
    }, [profile.email]);

    useEffect(() => {
        if (emailChange.pending || flash?.email_change_started) {
            setEmailChangeOpen(true);

            return;
        }

        setEmailChangeOpen(false);
    }, [emailChange.pending, emailChange.step, flash?.email_change_started]);

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
        <AdminLayout>
            <Head title="Profile Settings" />

            <div className="space-y-6 p-6 font-inter">
                <div>
                    <h1 className="text-[22px] leading-7 font-bold tracking-[-0.2px] text-[#050315]">
                        Profile Settings
                    </h1>
                    <p className="pt-1 text-sm leading-5 text-[#475569]">
                        Manage your account details and security
                    </p>
                </div>

                {flash?.success ? (
                    <div className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {flash.success}
                    </div>
                ) : null}

                {emailChange.pending && emailChange.pending_email ? (
                    <div className="rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
                        Email change pending to{' '}
                        <span className="font-medium">
                            {emailChange.pending_email}
                        </span>
                        . Verify the codes to finish.
                        <button
                            type="button"
                            className="ml-2 font-medium underline"
                            onClick={() => setEmailChangeOpen(true)}
                        >
                            Continue verification
                        </button>
                    </div>
                ) : null}

                <Form
                    {...profileUpdate.form()}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
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
                                <input
                                    type="hidden"
                                    name="remove_avatar"
                                    value="1"
                                />
                            ) : null}

                            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                                <aside className="flex w-full shrink-0 flex-col items-center rounded-[10px] border border-[#e2e8f0] bg-white p-6 xl:sticky xl:top-20 xl:w-[320px]">
                                    <FileUpload
                                        variant="avatar"
                                        avatarSize={112}
                                        showAvatarCaption={false}
                                        classNames={{
                                            wrapper: 'flex justify-center',
                                        }}
                                        value={avatarFile}
                                        onChange={(file) => {
                                            const next =
                                                file instanceof File
                                                    ? file
                                                    : null;
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
                                        placeholder="Change photo"
                                        error={errors.avatar}
                                    />
                                    <p className="mt-4 text-center text-lg leading-7 font-medium text-[#050315]">
                                        {name || profile.name}
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-[#0260bd]">
                                        {profile.role_label}
                                    </p>
                                </aside>

                                <div className="flex min-w-0 flex-1 flex-col gap-6">
                                    <Section title="Personal information">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                id="name"
                                                label="Full name"
                                                error={errors.name}
                                            >
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={(event) =>
                                                        setName(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </Field>
                                            <Field
                                                id="email"
                                                label="Email"
                                                error={errors.email}
                                            >
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(event) =>
                                                        setEmail(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                                {emailChange.pending_email ? (
                                                    <span className="text-xs text-[#475569]">
                                                        Current login email
                                                        stays {profile.email}{' '}
                                                        until verification
                                                        finishes.
                                                    </span>
                                                ) : null}
                                            </Field>
                                        </div>
                                    </Section>

                                    <Section title="Contact">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field
                                                id="phone"
                                                label="Phone"
                                                error={errors.phone}
                                            >
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="text"
                                                    value={phone}
                                                    onChange={(event) =>
                                                        setPhone(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. +1 555 0100"
                                                    className={inputClass}
                                                />
                                            </Field>
                                            <Field
                                                id="location"
                                                label="Location"
                                                error={errors.location}
                                            >
                                                <input
                                                    id="location"
                                                    name="location"
                                                    type="text"
                                                    value={location}
                                                    onChange={(event) =>
                                                        setLocation(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="City, Region"
                                                    className={inputClass}
                                                />
                                            </Field>
                                        </div>
                                    </Section>

                                    <Section title="Account">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <ReadOnlyField
                                                label="Role"
                                                value={profile.role_label}
                                            />
                                            <ReadOnlyField
                                                label="Status"
                                                value={profile.status_label}
                                            />
                                        </div>
                                    </Section>

                                    <Section
                                        title="Password & security"
                                        icon={
                                            <Lock className="size-4 text-[#0260bd]" />
                                        }
                                    >
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <Field
                                                id="current_password"
                                                label="Current password"
                                                error={errors.current_password}
                                            >
                                                <PasswordInput
                                                    id="current_password"
                                                    name="current_password"
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className={inputClass}
                                                />
                                            </Field>
                                            <Field
                                                id="password"
                                                label="New password"
                                                error={errors.password}
                                            >
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    className={inputClass}
                                                />
                                            </Field>
                                            <Field
                                                id="password_confirmation"
                                                label="Confirm password"
                                                error={
                                                    errors.password_confirmation
                                                }
                                            >
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    className={inputClass}
                                                />
                                            </Field>
                                        </div>

                                        {canUseTwoFactor ? (
                                            <Link
                                                href={twoFactorShow.url()}
                                                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0260bd] hover:underline"
                                            >
                                                <Shield className="size-4" />
                                                Open two-factor settings
                                            </Link>
                                        ) : null}
                                    </Section>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Link
                                    href={profileEdit.url()}
                                    className="rounded-[10px] border border-[#e2e8f0] bg-white px-5 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={cn(
                                        'rounded-[10px] bg-[#0260bd] px-5 py-2 text-sm font-medium text-white hover:bg-[#024f9c]',
                                        processing && 'opacity-60',
                                    )}
                                >
                                    Save changes
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <EmailChangeModal
                open={emailChangeOpen}
                onOpenChange={setEmailChangeOpen}
                currentEmail={profile.email}
                emailChange={emailChange}
                actions={{
                    verifyCurrent: verifyCurrent.form(),
                    verifyNew: verifyNew.form(),
                    resend: resendEmailChange.form(),
                    cancel: cancelEmailChange.form(),
                }}
            />
        </AdminLayout>
    );
}

const inputClass =
    'h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-sm text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd] focus:ring-1 focus:ring-[#0260bd]/20';

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
                {icon}
                <h2 className="text-sm font-medium tracking-[-0.16px] text-[#475569]">
                    {title}
                </h2>
            </div>
            {children}
        </section>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label htmlFor={id} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[-0.12px] text-[#475569]">
                {label}
            </span>
            {children}
            {error ? (
                <span className="text-xs text-[#c10007]">{error}</span>
            ) : null}
        </label>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[-0.12px] text-[#475569]">
                {label}
            </span>
            <div className="flex h-10 items-center rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#050315]">
                {value}
            </div>
        </div>
    );
}
