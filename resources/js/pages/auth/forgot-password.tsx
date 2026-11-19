import { Form, Head, Link } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="We'll email you a link to reset your password."
            context="login"
        >
            <Head title="Forgot password" />

            <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8">
                {status ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:rounded-3xl">
                        {status}
                    </div>
                ) : null}

                <Form
                    {...email.form()}
                    className="space-y-4 sm:space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm duration-300 fade-in slide-in-from-bottom-2 sm:rounded-3xl sm:p-5">
                                <Label
                                    htmlFor="email"
                                    className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="name@company.com"
                                    className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:rounded-3xl sm:py-5 sm:text-base"
                                disabled={processing}
                            >
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        <span>Email reset link</span>
                                    )}
                                </span>
                            </Button>

                            <Link
                                href={login.url()}
                                className="flex items-center justify-center text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                            >
                                Back to log in
                            </Link>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
