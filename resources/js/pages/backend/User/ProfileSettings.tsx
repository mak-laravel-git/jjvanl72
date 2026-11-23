import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Bell, Building2, Lock, Mail, Shield } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import FileUpload, { type ExistingFile } from '@/components/file-upload';
import EmailChangeModal, {
    type EmailChangeState,
} from '@/components/email-change-modal';
import { PasswordInput } from '@/components/ui/password-input';
import PortalLayout from '@/layouts/portal-layout';
import { getPortalView } from '@/lib/portal-role';
import { cn } from '@/lib/utils';
import {
    edit as profileEdit,
    update as profileUpdate,
} from '@/routes/user-profile';
import {
    cancel as cancelEmailChange,
    resend as resendEmailChange,
    verifyCurrent,
    verifyNew,
} from '@/routes/user-profile/email-change';
import { show as twoFactorShow } from '@/routes/two-factor';
import type { SharedData } from '@/types';

type AvailabilityStatus = 'available' | 'busy' | 'away';

const availabilityOptions: Array<{
    value: AvailabilityStatus;
    label: string;
    dot: string;
}> = [
    { value: 'available', label: 'available', dot: 'bg-[#22c55e]' },
    { value: 'busy', label: 'busy', dot: 'bg-[#ef4444]' },
    { value: 'away', label: 'away', dot: 'bg-[#f59e0b]' },
];

const manufacturerSpecializations = [
    'Crown & Bridge',
    'Implants',
    'Dentures',
    'Nightguards',
] as const;

type ProfileData = {
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    business_name: string | null;
    can_manage_business_name: boolean;
    company_name: string | null;
    business_registration: string | null;
    production_capacity: number | null;
    status: string;
    status_label: string;
    role_label: string;
    avatar_url: string | null;
    availability: AvailabilityStatus;
    notification_preferences: Record<string, boolean>;
    notification_preference_labels: Record<string, string>;
};

type Props = {
    profile: ProfileData;
    emailChange: EmailChangeState;
    canUseTwoFactor: boolean;
};

const emailChangeActions = {
    verifyCurrent: verifyCurrent.form(),
    verifyNew: verifyNew.form(),
    resend: resendEmailChange.form(),
    cancel: cancelEmailChange.form(),
};

export default function PortalProfileSettings({
    profile,
    emailChange,
    canUseTwoFactor,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);

    if (view.layout === 'manufacturer') {
        return (
            <ManufacturerProfileSettings
                profile={profile}
                emailChange={emailChange}
                canUseTwoFactor={canUseTwoFactor}
            />
        );
    }

    return (
        <DynamicPortalProfileSettings
            profile={profile}
            emailChange={emailChange}
            canUseTwoFactor={canUseTwoFactor}
            organization={view.organization}
        />
    );
}

function DynamicPortalProfileSettings({
    profile,
    emailChange,
    canUseTwoFactor,
    organization,
}: Props & { organization: string }) {
    const { flash } = usePage<SharedData>().props;

    const [name, setName] = useState(profile.name);
    const [email, setEmail] = useState(profile.email);
    const [businessName, setBusinessName] = useState(
        profile.business_name ?? '',
    );
    const [phone, setPhone] = useState(profile.phone ?? '');
    const [location, setLocation] = useState(profile.location ?? '');
    const [availability, setAvailability] = useState<AvailabilityStatus>(
        profile.availability ?? 'available',
    );
    const [notifications, setNotifications] = useState<Record<string, boolean>>(
        profile.notification_preferences,
    );
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
        <PortalLayout>
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
                                    <p className="mt-1 text-center text-sm leading-5 text-[#0260bd]">
                                        {profile.role_label}
                                    </p>
                                    <p className="mt-1 text-center text-xs leading-4 text-[#64748b]">
                                        {profile.can_manage_business_name
                                            ? businessName || organization
                                            : organization}
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
                                            {profile.can_manage_business_name ? (
                                                <Field
                                                    id="business_name"
                                                    label="Business name"
                                                    error={errors.business_name}
                                                >
                                                    <input
                                                        id="business_name"
                                                        name="business_name"
                                                        type="text"
                                                        required
                                                        value={businessName}
                                                        onChange={(event) =>
                                                            setBusinessName(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Smile Dental Clinic"
                                                        className={inputClass}
                                                    />
                                                </Field>
                                            ) : null}
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

                                    <Section title="Availability Status">
                                        <input
                                            type="hidden"
                                            name="availability"
                                            value={availability}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {availabilityOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        setAvailability(
                                                            opt.value,
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs leading-4 font-medium',
                                                        availability ===
                                                            opt.value
                                                            ? 'border-[#0260bd] bg-[#0260bd] text-white'
                                                            : 'border-[#e2e8f0] bg-white text-[#475569]',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'size-2 rounded-full',
                                                            availability ===
                                                                opt.value
                                                                ? 'bg-white'
                                                                : opt.dot,
                                                        )}
                                                    />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.availability ? (
                                            <p className="mt-2 text-xs text-[#c10007]">
                                                {errors.availability}
                                            </p>
                                        ) : null}
                                    </Section>

                                    <Section title="Notification Preferences">
                                        <div className="flex flex-col">
                                            {Object.entries(
                                                profile.notification_preference_labels,
                                            ).map(([key, label]) => (
                                                <div
                                                    key={key}
                                                    className="flex items-center justify-between py-2"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name={`notification_preferences[${key}]`}
                                                        value={
                                                            notifications[key]
                                                                ? '1'
                                                                : '0'
                                                        }
                                                    />
                                                    <span className="text-xs leading-4 font-medium text-[#475569]">
                                                        {label}
                                                    </span>
                                                    <ToggleSwitch
                                                        checked={Boolean(
                                                            notifications[key],
                                                        )}
                                                        onToggle={() =>
                                                            setNotifications(
                                                                (current) => ({
                                                                    ...current,
                                                                    [key]: !current[
                                                                        key
                                                                    ],
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))}
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
                actions={emailChangeActions}
            />
        </PortalLayout>
    );
}

function ManufacturerProfileSettings({
    profile,
    emailChange,
    canUseTwoFactor,
}: Props) {
    const { flash } = usePage<SharedData>().props;

    const [companyName, setCompanyName] = useState(profile.company_name ?? '');
    const [businessRegistration, setBusinessRegistration] = useState(
        profile.business_registration ?? '',
    );
    const [address, setAddress] = useState(profile.location ?? '');
    const [email, setEmail] = useState(profile.email);
    const [phone, setPhone] = useState(profile.phone ?? '');
    const [contactPerson, setContactPerson] = useState(profile.name);
    const [productionCapacity, setProductionCapacity] = useState(
        profile.production_capacity !== null &&
            profile.production_capacity !== undefined
            ? String(profile.production_capacity)
            : '',
    );
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [notifications, setNotifications] = useState<Record<string, boolean>>(
        profile.notification_preferences,
    );
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

    const notificationItems = Object.entries(
        profile.notification_preference_labels,
    );

    return (
        <PortalLayout>
            <Head title="Profile Settings" />

            <div className="p-6 font-inter">
                <div>
                    <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                        Profile Settings
                    </h1>
                    <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                        Manage your account and preferences
                    </p>
                </div>

                {flash?.success ? (
                    <div className="mt-6 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {flash.success}
                    </div>
                ) : null}

                {emailChange.pending && emailChange.pending_email ? (
                    <div className="mt-6 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
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
                    className="mt-6"
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
                            <input
                                type="hidden"
                                name="availability"
                                value={profile.availability ?? 'available'}
                            />

                            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                                <div className="flex w-full shrink-0 flex-col items-center rounded-[10px] border border-[#e2e8f0] bg-white p-[25px] xl:sticky xl:top-20 xl:w-[400px]">
                                    <FileUpload
                                        variant="avatar"
                                        avatarSize={96}
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
                                        placeholder="Change Photo"
                                        error={errors.avatar}
                                    />
                                    <p className="mt-4 text-lg leading-[27px] font-medium text-[#050315]">
                                        {contactPerson || profile.name}
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-[#6ea2d5]">
                                        {profile.role_label}
                                    </p>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col gap-6">
                                    <SectionCard
                                        icon={
                                            <Building2 className="size-5 text-[#0260bd]" />
                                        }
                                        title="Company Information"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <ManufacturerInput
                                                label="Company Name"
                                                name="company_name"
                                                value={companyName}
                                                onChange={setCompanyName}
                                                error={errors.company_name}
                                            />
                                            <ManufacturerInput
                                                label="Business Registration"
                                                name="business_registration"
                                                value={businessRegistration}
                                                onChange={
                                                    setBusinessRegistration
                                                }
                                                error={
                                                    errors.business_registration
                                                }
                                            />
                                            <div className="md:col-span-2">
                                                <ManufacturerInput
                                                    label="Address"
                                                    name="location"
                                                    value={address}
                                                    onChange={setAddress}
                                                    error={errors.location}
                                                />
                                            </div>
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        icon={
                                            <Mail className="size-5 text-[#0260bd]" />
                                        }
                                        title="Contact Details"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <ManufacturerInput
                                                label="Email"
                                                name="email"
                                                value={email}
                                                onChange={setEmail}
                                                type="email"
                                                required
                                                error={errors.email}
                                            />
                                            {emailChange.pending_email ? (
                                                <p className="md:col-span-2 text-xs text-[#475569]">
                                                    Current login email stays{' '}
                                                    {profile.email} until
                                                    verification finishes.
                                                </p>
                                            ) : null}
                                            <ManufacturerInput
                                                label="Phone"
                                                name="phone"
                                                value={phone}
                                                onChange={setPhone}
                                                error={errors.phone}
                                            />
                                            <ManufacturerInput
                                                label="Contact Person"
                                                name="name"
                                                value={contactPerson}
                                                onChange={setContactPerson}
                                                required
                                                error={errors.name}
                                            />
                                            <ManufacturerInput
                                                label="Role"
                                                value={profile.role_label}
                                                onChange={() => undefined}
                                                readOnly
                                            />
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        icon={
                                            <Bell className="size-5 text-[#0260bd]" />
                                        }
                                        title="Notification Preferences"
                                    >
                                        <div className="flex flex-col">
                                            {notificationItems.map(
                                                ([key, label], index) => (
                                                    <div
                                                        key={key}
                                                        className={cn(
                                                            'flex items-center justify-between',
                                                            index > 0 &&
                                                                'pt-3',
                                                        )}
                                                    >
                                                        <span className="text-sm leading-5 text-[#050315]">
                                                            {label}
                                                        </span>
                                                        <input
                                                            type="hidden"
                                                            name={`notification_preferences[${key}]`}
                                                            value={
                                                                notifications[
                                                                    key
                                                                ]
                                                                    ? '1'
                                                                    : '0'
                                                            }
                                                        />
                                                        <ToggleSwitch
                                                            checked={Boolean(
                                                                notifications[
                                                                    key
                                                                ],
                                                            )}
                                                            onToggle={() =>
                                                                setNotifications(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [key]: !current[
                                                                            key
                                                                        ],
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        icon={
                                            <Lock className="size-5 text-[#0260bd]" />
                                        }
                                        title="Password & Security"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <ManufacturerInput
                                                label="Current Password"
                                                name="current_password"
                                                value={currentPassword}
                                                onChange={setCurrentPassword}
                                                type="password"
                                                placeholder="••••••••"
                                                error={errors.current_password}
                                            />
                                            <ManufacturerInput
                                                label="New Password"
                                                name="password"
                                                value={password}
                                                onChange={setPassword}
                                                type="password"
                                                placeholder="••••••••"
                                                error={errors.password}
                                            />
                                            <ManufacturerInput
                                                label="Confirm New Password"
                                                name="password_confirmation"
                                                value={passwordConfirmation}
                                                onChange={
                                                    setPasswordConfirmation
                                                }
                                                type="password"
                                                placeholder="••••••••"
                                            />
                                            {canUseTwoFactor ? (
                                                <Link
                                                    href={twoFactorShow.url()}
                                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#0260bd] hover:underline"
                                                >
                                                    <Shield className="size-4" />
                                                    Manage two-factor
                                                    authentication
                                                </Link>
                                            ) : null}
                                        </div>
                                    </SectionCard>

                                    <SectionCard title="Availability Settings">
                                        <div className="flex flex-col gap-4">
                                            <ManufacturerInput
                                                label="Production Capacity (jobs/week)"
                                                name="production_capacity"
                                                value={productionCapacity}
                                                onChange={
                                                    setProductionCapacity
                                                }
                                                type="number"
                                                error={
                                                    errors.production_capacity
                                                }
                                            />
                                            <div>
                                                <p className="pb-2 text-sm leading-5 font-medium text-[#050315]">
                                                    Specializations
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {manufacturerSpecializations.map(
                                                        (item) => (
                                                            <span
                                                                key={item}
                                                                className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs leading-4 text-[#0260bd]"
                                                            >
                                                                {item}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </SectionCard>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <Link
                                    href={profileEdit.url()}
                                    className="rounded-[10px] border border-[#e2e8f0] bg-white px-5 py-2 text-sm leading-5 font-medium text-[#475569] hover:bg-[#f8fafc]"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-[10px] bg-[#0260bd] px-5 py-2 text-sm leading-5 font-medium text-white hover:bg-[#024f9c] disabled:opacity-60"
                                >
                                    Save Changes
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
                actions={emailChangeActions}
            />
        </PortalLayout>
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

function SectionCard({
    icon,
    title,
    children,
}: {
    icon?: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-[25px]">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-xl leading-6 font-semibold text-[#050315]">
                    {title}
                </h2>
            </div>
            <div className="pt-4">{children}</div>
        </section>
    );
}

function ToggleSwitch({
    checked,
    onToggle,
}: {
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onToggle}
            className={cn(
                'relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors',
                checked ? 'bg-[#0260bd]' : 'bg-[#e2e8f0]',
            )}
        >
            <span
                className={cn(
                    'pointer-events-none absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]',
                    checked ? 'left-[26px]' : 'left-0.5',
                )}
            />
        </button>
    );
}

function ManufacturerInput({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    error,
    required = false,
    readOnly = false,
}: {
    label: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    readOnly?: boolean;
}) {
    return (
        <label className="flex flex-col">
            <span className="pb-2 text-sm leading-5 font-medium text-[#050315]">
                {label}
            </span>
            <input
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                required={required}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#fdfdfd] px-[17px] text-base leading-6 text-[#050315] outline-none placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10',
                    readOnly && 'cursor-default bg-[#f8fafc] text-[#475569]',
                )}
            />
            {error ? (
                <span className="pt-1 text-xs text-[#c10007]">{error}</span>
            ) : null}
        </label>
    );
}
