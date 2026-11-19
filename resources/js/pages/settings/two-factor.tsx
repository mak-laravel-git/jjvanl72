import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AdminLayout from '@/layouts/admin-layout';
import PortalLayout from '@/layouts/portal-layout';
import { edit as adminProfileEdit } from '@/routes/admin/profile';
import { disable, enable } from '@/routes/two-factor';
import { edit as userProfileEdit } from '@/routes/user-profile';
import { type SharedData } from '@/types';

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

const productButtonClass = 'bg-[#0260bd] text-white hover:bg-[#024f9c]';

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: TwoFactorProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = Boolean(auth.user?.can_access_admin_panel);
    const Layout = isAdmin ? AdminLayout : PortalLayout;
    const profileHref = isAdmin
        ? adminProfileEdit.url()
        : userProfileEdit.url();
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <Layout>
            <Head title="Two-Factor Authentication" />

            <div className="min-h-full bg-white p-6 text-[#050315] dark:bg-white dark:text-[#050315]">
                <div className="mb-4">
                    <Link
                        href={profileHref}
                        className="inline-flex items-center gap-2 rounded-md bg-[#0260bd] px-4 py-2 text-sm font-medium text-white hover:bg-[#024f9c]"
                    >
                        <ArrowLeftIcon className="size-4 shrink-0" />
                        Back to Profile
                    </Link>
                </div>
                <h1 className="sr-only">Two-Factor Authentication Settings</h1>

                <div className="max-w-2xl space-y-6 rounded-[10px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                    <header>
                        <h3 className="mb-0.5 text-base font-medium text-[#050315]">
                            Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-[#475569]">
                            Manage your two-factor authentication settings
                        </p>
                    </header>
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge className="border-transparent bg-[#0260bd] text-white hover:bg-[#024f9c]">
                                Enabled
                            </Badge>
                            <p className="text-sm text-[#475569]">
                                With two-factor authentication enabled, you will
                                be prompted for a secure, random pin during
                                login, which you can retrieve from the
                                TOTP-supported application on your phone.
                            </p>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />

                            <div className="relative inline">
                                <Form {...disable.form()}>
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                        >
                                            <ShieldBan /> Disable 2FA
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <Badge
                                variant="outline"
                                className="border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                            >
                                Disabled
                            </Badge>
                            <p className="text-sm text-[#475569]">
                                When you enable two-factor authentication, you
                                will be prompted for a secure pin during login.
                                This pin can be retrieved from a TOTP-supported
                                application on your phone.
                            </p>

                            <div>
                                {hasSetupData ? (
                                    <Button
                                        className={productButtonClass}
                                        onClick={() => setShowSetupModal(true)}
                                    >
                                        <ShieldCheck />
                                        Continue Setup
                                    </Button>
                                ) : (
                                    <Form
                                        {...enable.form()}
                                        onSuccess={() =>
                                            setShowSetupModal(true)
                                        }
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                className={productButtonClass}
                                                disabled={processing}
                                            >
                                                <ShieldCheck />
                                                Enable 2FA
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            </div>
        </Layout>
    );
}
