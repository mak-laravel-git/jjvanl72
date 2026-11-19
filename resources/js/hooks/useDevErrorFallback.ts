export function useDevErrorFallback(): boolean {
    const flag = import.meta.env.VITE_ERROR_BOUNDARY_DEBUG;

    if (flag) {
        if (/^(true|1)$/i.test(flag)) {
            return true;
        }

        if (/^(false|0)$/i.test(flag)) {
            return false;
        }
    }

    return import.meta.env.DEV;
}
