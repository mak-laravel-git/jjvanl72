import { useState } from 'react';

import { ErrorBadge } from '@/components/error-boundary/error-badge';
import { ErrorOverlay } from '@/components/error-boundary/error-overlay';
import { useDevErrorFallback } from '@/hooks/useDevErrorFallback';
import { useErrorObservability } from '@/lib/errors/error-context';

export function ErrorObservatory() {
    const isDev = useDevErrorFallback();
    const { errors, isOverlayOpen, setOverlayOpen } = useErrorObservability();
    const [openAtIdx, setOpenAtIdx] = useState(0);

    if (!isDev) {
        return null;
    }

    return (
        <>
            {isOverlayOpen && errors.length > 0 ? (
                <ErrorOverlay
                    initialIndex={openAtIdx}
                    resetErrorBoundary={() => setOverlayOpen(false)}
                />
            ) : null}
            {!isOverlayOpen && errors.length > 0 ? (
                <ErrorBadge
                    onOpen={(idx) => {
                        setOpenAtIdx(idx);
                        setOverlayOpen(true);
                    }}
                />
            ) : null}
        </>
    );
}
