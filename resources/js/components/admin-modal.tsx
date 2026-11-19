import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/lib/utils';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

interface AdminModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    header: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export function AdminModal({
    open,
    onOpenChange,
    title,
    header,
    footer,
    className,
    children,
}: AdminModalProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className={cn(
                        'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-48px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[15px] border border-[#e5e7eb] bg-white p-px font-jakarta drop-shadow-[0px_25px_25px_rgba(0,0,0,0.25)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        className,
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">
                        {title}
                    </DialogPrimitive.Title>

                    <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-[22.5px] pt-[22.5px] pb-[23.5px]">
                        {header}
                        <DialogPrimitive.Close className="shrink-0 rounded-[9.375px] p-[7.5px] hover:bg-slate-50">
                            <span className="relative block size-[15px] overflow-hidden">
                                <img
                                    src={asset('modal-close.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {children}
                    </div>

                    {footer ? (
                        <div className="border-t border-[#e5e7eb] px-[15px] pt-4 pb-[15px]">
                            {footer}
                        </div>
                    ) : null}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
