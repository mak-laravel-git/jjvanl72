import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const controlClass = 'input';

type FloatingFieldProps = {
    label: ReactNode;
    className?: string;
    children?: ReactNode;
};

export function FloatingField({ label, className, children }: FloatingFieldProps) {
    return (
        <div className={cn('floating-field', className)}>
            <label>{label}</label>
            {children}
        </div>
    );
}

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: ReactNode;
    wrapperClassName?: string;
};

export function FloatingInput({
    label,
    wrapperClassName,
    className,
    ...props
}: FloatingInputProps) {
    return (
        <FloatingField label={label} className={wrapperClassName}>
            <input className={className} {...props} />
        </FloatingField>
    );
}

type FloatingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: ReactNode;
    wrapperClassName?: string;
};

export function FloatingTextarea({
    label,
    wrapperClassName,
    className,
    ...props
}: FloatingTextareaProps) {
    return (
        <FloatingField label={label} className={wrapperClassName}>
            <textarea className={className} {...props} />
        </FloatingField>
    );
}
