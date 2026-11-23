import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

type MobileSidebarContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(
    null,
);

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const value = useMemo(() => ({ open, setOpen }), [open]);

    return (
        <MobileSidebarContext.Provider value={value}>
            {children}
        </MobileSidebarContext.Provider>
    );
}

export function useMobileSidebar(): MobileSidebarContextValue {
    const context = useContext(MobileSidebarContext);

    if (!context) {
        throw new Error(
            'useMobileSidebar must be used within MobileSidebarProvider',
        );
    }

    return context;
}
