import { Head, Link, router, useForm } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';
import { request as passwordRequest } from '@/routes/password';

type Mode = 'login' | 'register';

type Props = {
    status?: string;
    canResetPassword?: boolean;
    canRegister?: boolean;
    mode?: Mode;
    roles?: string[];
};

const fieldCardClass =
    'animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm duration-300 fade-in slide-in-from-bottom-2 sm:rounded-3xl sm:p-5';

const fieldLabelClass =
    'text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]';

const fieldInputClass =
    'mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm dark:bg-white text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base';

const submitButtonClass =
    'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:rounded-3xl sm:py-5 sm:text-base';

// Compact styles used by the (longer) register form.
const compactLabelClass = 'text-xs font-semibold text-primary-600';

const compactInputClass =
    'h-10 rounded-xl border border-muted/60 bg-white px-3 text-sm dark:bg-white text-primary-500 placeholder:text-primary-500/50 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200';

const modeCopy: Record<Mode, { title: string; description: string }> = {
    login: {
        title: 'Sign in',
        description:
            'Use your admin or stakeholder account to access the platform',
    },
    register: {
        title: 'Create your account',
        description: 'Register your practice or lab to start submitting cases.',
    },
};

function FieldCard({
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
        <div className={fieldCardClass}>
            <Label htmlFor={id} className={fieldLabelClass}>
                {label}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function CompactField({
    id,
    label,
    error,
    className,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('min-w-0 space-y-1', className)}>
            <Label htmlFor={id} className={compactLabelClass}>
                {label}
            </Label>
            {children}
            <InputError message={error} className="text-xs" />
        </div>
    );
}

export default function Login({
    status,
    canResetPassword = true,
    canRegister = false,
    mode: initialMode = 'login',
    roles = ['Dentist', 'Denturist', 'Lab'],
}: Props) {
    // Registration lives on this page. Switching panes never reloads the page;
    // we only keep the address bar in sync so /register can be bookmarked or
    // reloaded, and failed registrations redirect back to the open form.
    const [mode, setMode] = useState<Mode>(canRegister ? initialMode : 'login');
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');

    const switchMode = (next: Mode) => {
        if (next === mode) {
            return;
        }

        setDirection(next === 'register' ? 'forward' : 'back');
        setMode(next);
        window.history.replaceState(
            window.history.state,
            '',
            next === 'register' ? '/register' : '/login',
        );
    };

    const slideClass =
        direction === 'forward'
            ? 'slide-in-from-right-6'
            : 'slide-in-from-left-6';

    return (
        <AuthLayout
            title={modeCopy[mode].title}
            description={modeCopy[mode].description}
            context={mode}
        >
            <Head title={mode === 'login' ? 'Log in' : 'Register'} />

            <div
                className={cn(
                    'w-full',
                    mode === 'login'
                        ? 'space-y-4 sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8'
                        : 'space-y-3',
                )}
            >
                {status ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:rounded-3xl">
                        {status}
                    </div>
                ) : null}

                <div
                    key={mode}
                    className={cn(
                        'animate-in duration-300 fade-in',
                        slideClass,
                        mode === 'login'
                            ? 'space-y-4 sm:space-y-6 lg:space-y-8'
                            : 'space-y-3',
                    )}
                >
                    {mode === 'login' ? (
                        <LoginPane
                            canResetPassword={canResetPassword}
                            canRegister={canRegister}
                            onShowRegister={() => switchMode('register')}
                        />
                    ) : (
                        <RegisterPane
                            roles={roles}
                            onShowLogin={() => switchMode('login')}
                        />
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}

function LoginPane({
    canResetPassword,
    canRegister,
    onShowRegister,
}: {
    canResetPassword: boolean;
    canRegister: boolean;
    onShowRegister: () => void;
}) {
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
        <>
            <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 px-4 py-3 text-sm text-primary-600 duration-300 fade-in slide-in-from-top-2 sm:rounded-3xl sm:px-5 sm:py-4">
                <p className="text-[0.65rem] tracking-[0.2em] text-primary-600 uppercase sm:text-xs sm:tracking-[0.35em]">
                    Role-based access
                </p>
                <p className="mt-1 text-sm font-medium text-primary-600 sm:text-base">
                    Your role permissions determine which dashboards and tools
                    you can use.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                    <FieldCard
                        id="email"
                        label="Email address"
                        error={errors.email}
                    >
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoFocus
                            autoComplete="username"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@company.com"
                            className={fieldInputClass}
                        />
                    </FieldCard>

                    <FieldCard
                        id="password"
                        label="Password"
                        error={errors.password}
                    >
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
                            className={fieldInputClass}
                        />
                        {canResetPassword ? (
                            <div className="mt-3 flex justify-end">
                                <Link
                                    href={passwordRequest.url()}
                                    className={fieldLabelClass}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        ) : null}
                    </FieldCard>
                </div>

                <Button
                    type="submit"
                    className={submitButtonClass}
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

            {canRegister ? (
                <p className="text-center text-sm text-primary-600">
                    New to the platform?{' '}
                    <button
                        type="button"
                        onClick={onShowRegister}
                        className="font-semibold text-primary-500 underline-offset-4 hover:underline"
                    >
                        Create an account
                    </button>
                </p>
            ) : null}
        </>
    );
}

function RegisterPane({
    roles,
    onShowLogin,
}: {
    roles: string[];
    onShowLogin: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        role: '',
        name: '',
        business_name: '',
        address: '',
        cell_number: '',
        office_number: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1">
                    <p className={compactLabelClass}>I am registering as</p>
                    <div
                        role="radiogroup"
                        aria-label="Account type"
                        className="grid grid-cols-3 gap-1 rounded-xl border border-muted/60 bg-primary-50/30 p-1"
                    >
                        {roles.map((role) => {
                            const selected = data.role === role;

                            return (
                                <label
                                    key={role}
                                    className={cn(
                                        'flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition has-focus-visible:ring-2 has-focus-visible:ring-primary-300',
                                        selected
                                            ? 'bg-primary-500 text-white shadow-sm'
                                            : 'text-primary-500 hover:bg-white',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role}
                                        checked={selected}
                                        onChange={() => setData('role', role)}
                                        className="sr-only"
                                    />
                                    {role}
                                </label>
                            );
                        })}
                    </div>
                    <InputError message={errors.role} className="text-xs" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <CompactField
                        id="name"
                        label="Your name"
                        error={errors.name}
                    >
                        <Input
                            id="name"
                            name="name"
                            required
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Dr. Jane Smith"
                            className={compactInputClass}
                        />
                    </CompactField>

                    <CompactField
                        id="business_name"
                        label="Business name"
                        error={errors.business_name}
                    >
                        <Input
                            id="business_name"
                            name="business_name"
                            required
                            autoComplete="organization"
                            value={data.business_name}
                            onChange={(e) =>
                                setData('business_name', e.target.value)
                            }
                            placeholder="Smile Dental Clinic"
                            className={compactInputClass}
                        />
                    </CompactField>
                </div>

                <CompactField
                    id="address"
                    label="Address"
                    error={errors.address}
                >
                    <Input
                        id="address"
                        name="address"
                        required
                        autoComplete="street-address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        placeholder="Street, city, province / state, postal code"
                        className={compactInputClass}
                    />
                </CompactField>

                <div className="grid grid-cols-2 gap-3">
                    <CompactField
                        id="cell_number"
                        label="Cell number"
                        error={errors.cell_number}
                    >
                        <Input
                            id="cell_number"
                            name="cell_number"
                            type="tel"
                            required
                            autoComplete="tel"
                            value={data.cell_number}
                            onChange={(e) =>
                                setData('cell_number', e.target.value)
                            }
                            placeholder="(555) 123-4567"
                            className={compactInputClass}
                        />
                    </CompactField>

                    <CompactField
                        id="office_number"
                        label="Office number"
                        error={errors.office_number}
                    >
                        <Input
                            id="office_number"
                            name="office_number"
                            type="tel"
                            required
                            autoComplete="work tel"
                            value={data.office_number}
                            onChange={(e) =>
                                setData('office_number', e.target.value)
                            }
                            placeholder="(555) 765-4321"
                            className={compactInputClass}
                        />
                    </CompactField>
                </div>

                <CompactField
                    id="register-email"
                    label="Email address"
                    error={errors.email}
                >
                    <Input
                        id="register-email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="name@company.com"
                        className={compactInputClass}
                    />
                </CompactField>

                <div className="grid gap-3 sm:grid-cols-2">
                    <CompactField
                        id="register-password"
                        label="Password"
                        error={errors.password}
                    >
                        <PasswordInput
                            id="register-password"
                            name="password"
                            required
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder="Min. 8 characters"
                            className={compactInputClass}
                        />
                    </CompactField>

                    <CompactField
                        id="password_confirmation"
                        label="Confirm password"
                        error={errors.password_confirmation}
                    >
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            required
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Repeat password"
                            className={compactInputClass}
                        />
                    </CompactField>
                </div>

                <p className="text-[0.7rem] leading-snug text-primary-600/75">
                    Password must be at least 8 characters and include uppercase
                    and lowercase letters, a number, and a symbol. Avoid
                    passwords found in known data breaches.
                </p>

                <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 text-sm font-semibold tracking-wide text-white shadow-md transition hover:brightness-110"
                    disabled={processing}
                >
                    <span className="relative flex items-center justify-center gap-2">
                        {processing ? (
                            <Spinner className="h-4 w-4" />
                        ) : (
                            <span>Create account</span>
                        )}
                    </span>
                </Button>
            </form>

            <p className="text-center text-sm text-primary-600">
                Already registered?{' '}
                <button
                    type="button"
                    onClick={onShowLogin}
                    className="font-semibold text-primary-500 underline-offset-4 hover:underline"
                >
                    Sign in
                </button>
            </p>
        </>
    );
}
