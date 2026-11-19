import { CreditCard, Info, Lock } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type AddPaymentMethodModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs leading-4 font-medium tracking-[0.08em] text-[#94a3b8] uppercase">
            {children}
        </label>
    );
}

function FieldInput({ className, ...props }: ComponentProps<'input'>) {
    return (
        <input
            className={cn(
                'mt-2 w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm leading-5 tracking-[-0.16px] text-[#050315] placeholder:text-[#94a3b8] focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/20 focus:outline-none',
                className,
            )}
            {...props}
        />
    );
}

export function AddPaymentMethodModal({
    open,
    onOpenChange,
}: AddPaymentMethodModalProps) {
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [zipCode, setZipCode] = useState('');

    const handleSave = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-xl border-[#e2e8f0] p-0 font-inter sm:max-w-[520px]">
                <div className="border-b border-[#f3f4f6] px-6 py-6 pr-14">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0260bd]">
                            <CreditCard className="size-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg leading-7 font-semibold tracking-[-0.18px] text-[#050315]">
                                Credit or Debit Card
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm leading-5 tracking-[-0.16px] text-[#475569]">
                                All transactions are encrypted and secure.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <form
                    className="flex flex-col gap-5 px-6 py-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSave();
                    }}
                >
                    <div>
                        <FieldLabel>Cardholder Name</FieldLabel>
                        <FieldInput
                            value={cardholderName}
                            onChange={(event) =>
                                setCardholderName(event.target.value)
                            }
                            placeholder="e.g. Julian Vance"
                        />
                    </div>

                    <div>
                        <FieldLabel>Card Number</FieldLabel>
                        <div className="relative">
                            <FieldInput
                                value={cardNumber}
                                onChange={(event) =>
                                    setCardNumber(event.target.value)
                                }
                                placeholder="0000 0000 0000 0000"
                                className="pr-11"
                            />
                            <Lock className="pointer-events-none absolute top-[calc(50%+4px)] right-4 size-4 -translate-y-1/2 text-[#94a3b8]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div>
                            <FieldLabel>Expiration Date</FieldLabel>
                            <FieldInput
                                value={expirationDate}
                                onChange={(event) =>
                                    setExpirationDate(event.target.value)
                                }
                                placeholder="MM/YY"
                            />
                        </div>
                        <div>
                            <FieldLabel>CVC</FieldLabel>
                            <div className="relative">
                                <FieldInput
                                    value={cvc}
                                    onChange={(event) =>
                                        setCvc(event.target.value)
                                    }
                                    placeholder="..."
                                    className="pr-10"
                                />
                                <Info className="pointer-events-none absolute top-[calc(50%+4px)] right-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Zip Code</FieldLabel>
                            <FieldInput
                                value={zipCode}
                                onChange={(event) =>
                                    setZipCode(event.target.value)
                                }
                                placeholder="00000"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0260bd] px-6 text-sm leading-5 font-medium tracking-[-0.16px] text-white transition-colors hover:bg-[#024f9c]"
                        >
                            Save Payment Method
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-6 text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315] transition-colors hover:bg-[#f8fafc]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
