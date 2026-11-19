import { Form } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';

export type EmailChangeState = {
    pending: boolean;
    pending_email: string | null;
    step: 'current' | 'new' | null;
};

type FormMethodProps = {
    action: string;
    method: string;
};

type EmailChangeActions = {
    verifyCurrent: FormMethodProps;
    verifyNew: FormMethodProps;
    resend: FormMethodProps;
    cancel: FormMethodProps;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEmail: string;
    emailChange: EmailChangeState;
    actions: EmailChangeActions;
};

export default function EmailChangeModal({
    open,
    onOpenChange,
    currentEmail,
    emailChange,
    actions,
}: Props) {
    const [code, setCode] = useState('');
    const pinInputContainerRef = useRef<HTMLDivElement>(null);
    const step = emailChange.step === 'new' ? 'new' : 'current';
    const isNewStep = step === 'new';
    const destinationEmail = isNewStep
        ? (emailChange.pending_email ?? '')
        : currentEmail;

    useEffect(() => {
        if (!open) {
            setCode('');

            return;
        }

        const timeout = window.setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [open, step]);

    const verifyForm = isNewStep ? actions.verifyNew : actions.verifyCurrent;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onOpenChange(false);
                }
            }}
        >
            <DialogContent className="border border-[#e2e8f0] bg-white text-[#050315] sm:max-w-md dark:border-[#e2e8f0] dark:bg-white dark:text-[#050315] [&>button]:text-[#475569] [&>button]:hover:bg-[#f8fafc] [&>button]:hover:text-[#050315]">
                <DialogHeader className="flex items-center justify-center text-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc]">
                        <Mail className="size-5 text-[#0260bd]" />
                    </div>
                    <DialogTitle className="text-[#050315] dark:text-[#050315]">
                        {isNewStep
                            ? 'Verify your new email'
                            : 'Verify your current email'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#475569] dark:text-[#475569]">
                        {isNewStep
                            ? 'Enter the 6-digit code we sent to your new email address.'
                            : 'Enter the 6-digit code we sent to your current email address to continue this change.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-center">
                    <p className="text-xs font-medium tracking-[-0.12px] text-[#1e40af]">
                        Code sent to
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#050315]">
                        {destinationEmail}
                    </p>
                    {!isNewStep && emailChange.pending_email ? (
                        <p className="mt-2 text-xs text-[#475569]">
                            After this step, a code will be sent to{' '}
                            <span className="font-medium text-[#050315]">
                                {emailChange.pending_email}
                            </span>
                        </p>
                    ) : null}
                </div>

                <Form
                    {...verifyForm}
                    className="space-y-5"
                    resetOnError
                    resetOnSuccess
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        setCode('');

                        if (isNewStep) {
                            onOpenChange(false);
                        }
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <div
                                ref={pinInputContainerRef}
                                className="flex w-full flex-col items-center space-y-3 py-2"
                            >
                                <InputOTP
                                    id="email-change-otp"
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={setCode}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    inputMode="numeric"
                                    autoFocus
                                    autoComplete="one-time-code"
                                    pushPasswordManagerStrategy="none"
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="border-[#e2e8f0] bg-white text-[#050315] shadow-none ring-[#0260bd] first:border-l [&_.animate-caret-blink]:bg-[#050315]"
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError message={errors.code} />
                            </div>

                            <div className="flex w-full gap-3">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#0260bd] text-white hover:bg-[#024f9c]"
                                    disabled={
                                        processing ||
                                        code.length < OTP_MAX_LENGTH
                                    }
                                >
                                    {isNewStep
                                        ? 'Confirm new email'
                                        : 'Verify current email'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-4">
                    <Form
                        {...actions.resend}
                        options={{ preserveScroll: true }}
                    >
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="ghost"
                                className="px-0 text-[#0260bd] hover:bg-transparent hover:text-[#024f9c]"
                                disabled={processing}
                            >
                                Resend code
                            </Button>
                        )}
                    </Form>

                    <Form
                        {...actions.cancel}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="outline"
                                className="border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#050315]"
                                disabled={processing}
                            >
                                Cancel change
                            </Button>
                        )}
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
