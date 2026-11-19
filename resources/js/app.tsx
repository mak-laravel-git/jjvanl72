import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

import { ErrorBoundaryFallback } from './components/error-boundary/error-boundary-fallback';
import { ErrorObservatory } from './components/error-boundary/error-observatory';
import { getEcho, logEchoConfig } from './echo';
import { initializeTheme } from './hooks/use-appearance';
import {
    ErrorObservabilityProvider,
    useErrorObservability,
} from './lib/errors/error-context';
import { ErrorSource, ErrorType } from './lib/errors/types';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

getEcho();
logEchoConfig();

function AppErrorBoundary({ children }: { children: ReactNode }) {
    const { captureError } = useErrorObservability();

    return (
        <ErrorBoundary
            FallbackComponent={ErrorBoundaryFallback}
            onReset={() => {
                router.reload();
            }}
            onError={(error, info) => {
                const err =
                    error instanceof Error ? error : new Error(String(error));

                captureError(err, {
                    source: ErrorSource.ErrorBoundary,
                    type: ErrorType.React,
                    componentStack: info.componentStack ?? undefined,
                });
            }}
        >
            {children}
            <ErrorObservatory />
        </ErrorBoundary>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <ErrorObservabilityProvider>
                    <AppErrorBoundary>
                        <App {...props} />
                        <Toaster
                            position="top-right"
                            richColors
                            closeButton
                            expand={true}
                            duration={3000}
                            icons={{
                                success: <CheckCircle className="h-4 w-4" />,
                                error: <XCircle className="h-4 w-4" />,
                                warning: <AlertTriangle className="h-4 w-4" />,
                                info: <Info className="h-4 w-4" />,
                            }}
                        />
                    </AppErrorBoundary>
                </ErrorObservabilityProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
    defaults: {
        future: {
            useDialogForErrorModal: true,
        },
    },
});

initializeTheme();
