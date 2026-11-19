import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const content = useMemo(
        () => ({
            title: showRecoveryInput ? 'Recovery code' : 'Authentication code',
            description: showRecoveryInput
                ? 'Enter an emergency recovery code to access your account.'
                : 'Enter the 6-digit code from your authenticator app.',
            toggle: showRecoveryInput
                ? 'Use authenticator code'
                : 'Use a recovery code',
        }),
        [showRecoveryInput],
    );

    return (
        <AuthLayout
            title={content.title}
            description={content.description}
            context="login"
        >
            <Head title="Two-Factor Authentication" />

            <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 lg:px-4 lg:py-8">
                <Form
                    {...store.form()}
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                    className="space-y-4 sm:space-y-6"
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm duration-300 fade-in slide-in-from-bottom-2 sm:rounded-3xl sm:p-5">
                                    <Label
                                        htmlFor="recovery_code"
                                        className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                    >
                                        Recovery code
                                    </Label>
                                    <Input
                                        id="recovery_code"
                                        name="recovery_code"
                                        placeholder="XXXXX-XXXXX"
                                        autoFocus
                                        className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-center font-mono text-sm tracking-widest text-primary-500 uppercase placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                                    />
                                    <InputError message={errors.recovery_code} />
                                </div>
                            ) : (
                                <div className="animate-in rounded-2xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm duration-300 fade-in slide-in-from-bottom-2 sm:rounded-3xl sm:p-5">
                                    <Label
                                        htmlFor="two-factor-otp"
                                        className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                    >
                                        Authenticator code
                                    </Label>
                                    <div className="mt-4 flex w-full min-w-0 flex-col items-center gap-4">
                                        <InputOTP
                                            id="two-factor-otp"
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={setCode}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            inputMode="numeric"
                                            autoFocus
                                            autoComplete="one-time-code"
                                            pushPasswordManagerStrategy="none"
                                            containerClassName="w-full justify-center"
                                        >
                                            <InputOTPGroup className="flex w-full max-w-xs justify-between gap-1.5 sm:max-w-sm sm:gap-2">
                                                {Array.from({
                                                    length: OTP_MAX_LENGTH,
                                                }).map((_, i) => (
                                                    <InputOTPSlot
                                                        key={i}
                                                        index={i}
                                                        className="h-11 w-9 shrink-0 rounded-lg border border-muted/60 bg-white text-base text-[#050315] first:rounded-lg last:rounded-lg sm:h-12 sm:w-10"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                        <InputError message={errors.code} />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:rounded-3xl sm:py-5 sm:text-base"
                                disabled={
                                    processing ||
                                    (!showRecoveryInput && code.length < 6)
                                }
                            >
                                <span className="relative flex items-center justify-center gap-2">
                                    {processing ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        <span>Verify identity</span>
                                    )}
                                </span>
                            </Button>

                            <button
                                type="button"
                                className="w-full text-center text-[0.65rem] font-semibold tracking-[0.2em] text-primary-500 uppercase sm:text-xs sm:tracking-[0.35em]"
                                onClick={() => {
                                    setShowRecoveryInput(!showRecoveryInput);
                                    clearErrors();
                                    setCode('');
                                }}
                            >
                                {content.toggle}
                            </button>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
