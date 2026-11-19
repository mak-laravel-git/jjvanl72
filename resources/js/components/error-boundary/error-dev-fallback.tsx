import { useState } from 'react';
import type { FallbackProps } from 'react-error-boundary';

import { ErrorBadge } from '@/components/error-boundary/error-badge';
import { ErrorOverlay } from '@/components/error-boundary/error-overlay';

export function ErrorDevFallback(props: FallbackProps) {
    const [overlayOpen, setOverlayOpen] = useState(true);
    const [openAtIdx, setOpenAtIdx] = useState(0);

    return (
        <>
            {overlayOpen ? (
                <ErrorOverlay
                    error={props.error}
                    initialIndex={openAtIdx}
                    resetErrorBoundary={() => {
                        setOverlayOpen(false);
                        props.resetErrorBoundary();
                    }}
                />
            ) : (
                <ErrorBadge
                    onOpen={(idx) => {
                        setOpenAtIdx(idx);
                        setOverlayOpen(true);
                    }}
                />
            )}
        </>
    );
}
