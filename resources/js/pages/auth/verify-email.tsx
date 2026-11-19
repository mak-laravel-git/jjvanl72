import { Form, Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify your email"
            description="Almost there! Please check your inbox for a verification link."
        >
            <Head title="Email verification" />

            <div className="w-full space-y-4 text-center sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8">
                {status === 'verification-link-sent' ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 sm:rounded-3xl">
                        A fresh link has been sent to your email address.
                    </div>
                ) : null}

                <Form {...send.form()} className="space-y-4 sm:space-y-6">
                    {({ processing }) => (
                        <>
                            <Button
                                disabled={processing}
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:rounded-3xl sm:py-5 sm:text-base"
                            >
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : null}
                                    Resend Verification Email
                                </span>
                            </Button>

                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                            >
                                Log out
                            </Link>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
