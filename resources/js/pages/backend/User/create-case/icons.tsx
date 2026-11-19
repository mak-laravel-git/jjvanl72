import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function IconNew(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 3h12l6 6v16H5z" />
            <path d="M17 3v7h6M10 16h8M14 12v8" />
        </Svg>
    );
}

export function IconFolder(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 7h8l3 3h11v13H3z" />
            <path d="M3 7V4h8l3 3" />
        </Svg>
    );
}

export function IconSave(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M4 3h18l3 3v19H4z" />
            <path d="M8 3v8h11V3M8 25v-9h13v9" />
        </Svg>
    );
}

export function IconBack(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M22 5 10 14l12 9" />
            <path d="M10 14h17" />
        </Svg>
    );
}

export function IconSettings(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="14" cy="14" r="4" />
            <path d="M14 2v4M14 22v4M2 14h4M22 14h4M5.5 5.5l3 3M19.5 19.5l3 3M22.5 5.5l-3 3M8.5 19.5l-3 3" />
        </Svg>
    );
}

export function IconHelp(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="14" cy="14" r="11" />
            <path d="M11 10a3.3 3.3 0 1 1 4.7 3c-1.2.6-1.7 1.5-1.7 3M14 21v.2" />
        </Svg>
    );
}

export function IconBell(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M8 20h12l-2-3V11a4 4 0 0 0-8 0v6z" />
            <path d="M12 23h4" />
        </Svg>
    );
}

export function IconCalendar(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="4" y="6" width="20" height="18" rx="2" />
            <path d="M8 3v6M20 3v6M4 11h20" />
        </Svg>
    );
}

export function IconNote(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="5" y="3" width="18" height="22" rx="2" />
            <path d="M9 8h10M9 13h10M9 18h7" />
        </Svg>
    );
}

export function IconExpand(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 11V5h6M23 17v6h-6M5 5l7 7M23 23l-7-7" />
        </Svg>
    );
}

export function IconCube(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="m14 3 10 5.5v11L14 25 4 19.5v-11z" />
            <path d="m4 8.5 10 5.5 10-5.5M14 14v11" />
        </Svg>
    );
}

export function IconImage(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="4" y="5" width="20" height="18" rx="2" />
            <circle cx="10" cy="11" r="2" />
            <path d="m6 20 5-5 4 4 3-3 4 4" />
        </Svg>
    );
}

export function IconTooth(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M7 3c3 1.3 4 3 7 3s4-1.7 7-3c4-1.7 7 1.4 6.5 6.4-.4 4.2-2.7 6-3.7 10.8C23 24 22 27 19.5 27c-2.6 0-2-6-5.5-6s-3 6-5.5 6C6 27 5 24 4.2 20.2 3.2 15.4.9 13.6.5 9.4 0 4.4 3 1.3 7 3z" />
        </Svg>
    );
}

export function IconTarget(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="14" cy="14" r="10" />
            <circle cx="14" cy="14" r="5" />
            <path d="M14 1v5M14 22v5M1 14h5M22 14h5" />
        </Svg>
    );
}

export function IconUpload(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M14 19V3M8 9l6-6 6 6" />
            <path d="M4 18v7h20v-7" />
        </Svg>
    );
}

export function IconCheck(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="m4 14 6 6L24 7" />
        </Svg>
    );
}

export function IconEdit(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="m5 22 1-6L19 3l5 5-13 13z" />
            <path d="m17 5 5 5" />
        </Svg>
    );
}

export function IconTrash(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 7h18M10 7V4h8v3M8 7l1 18h10l1-18" />
        </Svg>
    );
}

export function IconInfo(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="14" cy="14" r="11" />
            <path d="M14 12v8M14 8v.2" />
        </Svg>
    );
}

export function IconReview(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="4" y="4" width="20" height="20" rx="2" />
            <path d="m8 14 4 4 8-9" />
        </Svg>
    );
}

export function IconManufacture(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M3 24h22V12l-7 4v-4l-7 4V8H3z" />
            <path d="M7 24v-5h5v5" />
        </Svg>
    );
}

export function IconDesign(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 23 8 6l6-3 6 3 3 17" />
            <path d="M9 13c4-2 7-2 11 0M10 18c3-2 6-2 9 0" />
        </Svg>
    );
}

export function IconDownload(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M14 3v15M8 12l6 6 6-6" />
            <path d="M4 23h20" />
        </Svg>
    );
}

export function IconTruck(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M1 3h16v13H1zM17 8h5l3 4v4h-8z" />
            <circle cx="6" cy="19" r="2" />
            <circle cx="21" cy="19" r="2" />
        </Svg>
    );
}

export function ProductIcon() {
    return (
        <svg
            viewBox="0 0 52 40"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M8 6c6 2 7-4 13-4 5 0 6 5 10 5 4 0 5-5 10-5 7 1 7 10 5 17-2 9-6 16-13 16-4 0-5-3-8-3s-4 3-8 3C9 35 6 28 5 19 4 12 3 7 8 6z" />
            <path d="M13 23c5-6 8 4 12-1 4 5 8-5 13 1" />
        </svg>
    );
}
