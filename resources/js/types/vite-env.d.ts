/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME?: string;
    readonly VITE_ERROR_BOUNDARY_DEBUG?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
