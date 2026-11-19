import { Head, Link, router, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { request as passwordRequest } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword?: boolean;
};

export default function Login({ status, canResetPassword = true }: Props) {
    const { data, setData, processing, errors, reset } = useForm({
        email: '',
        password: '',
        device_token: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        // Do not await Firebase here — push registration can hang or fail in
        // Chrome and was surfacing as "Inertia navigation failed". Device
        // tokens are refreshed after login via RegisterWebPush.
        router.post(
            '/login',
            {
                email: data.email,
                password: data.password,
                device_token: data.device_token,
            },
            {
                onFinish: () => {
                    reset('password');
                },
            },
        );
    };

    return (
        <AuthLayout
            title="Sign in"
            description="Use your admin or stakeholder account to access the platform"
            context="login"
        >
            <Head title="Log in" />

            <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8">
                <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 px-4 py-3 text-sm text-primary-600 duration-300 fade-in slide-in-from-top-2 sm:rounded-3xl sm:px-5 sm:py-4">
                    <p className="text-[0.65rem] tracking-[0.2em] text-primary-600 uppercase sm:text-xs sm:tracking-[0.35em]">
                        Role-based access
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary-600 sm:text-base">
                        Your role permissions determine which dashboards and
                        tools you can use.
                    </p>
                </div>

                {status ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:rounded-3xl">
                        {status}
                    </div>
                ) : null}

                <form onSubmit={submit} className="space-y-4 sm:space-y-6">
                    <div className="space-y-4 sm:space-y-6">
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
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="name@company.com"
                                className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                            />
                            <InputError message={errors.email} />
                        </div>

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
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="••••••••"
                                className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                            />
                            <InputError message={errors.password} />
                            {canResetPassword ? (
                                <div className="mt-3 flex justify-end">
                                    <Link
                                        href={passwordRequest.url()}
                                        className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            ) : null}
                        </div>
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
                                <span>Log in</span>
                            )}
                        </span>
                    </Button>
                </form>
            </div>
        </AuthLayout>
    );
}
