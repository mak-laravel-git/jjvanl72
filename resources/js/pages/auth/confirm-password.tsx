import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Confirm your password"
            description="This is a secure area. Please confirm your password before continuing."
            context="login"
        >
            <Head title="Confirm password" />

            <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-4 sm:space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm duration-300 fade-in slide-in-from-bottom-2 sm:rounded-3xl sm:p-5">
                                <Label
                                    htmlFor="password"
                                    className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:rounded-3xl sm:py-5 sm:text-base"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        <span>Confirm password</span>
                                    )}
                                </span>
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
