type MaterialSwatchProps = {
    colors: string[];
    index?: number;
    className?: string;
    /** Compact circle for lists; card uses the large SVG swatch. */
    variant?: 'compact' | 'card';
};

export default function MaterialSwatch({
    colors,
    index = 0,
    className = 'size-8 shrink-0',
    variant = 'compact',
}: MaterialSwatchProps) {
    const [primary, secondary] = colors;

    if (variant === 'compact') {
        return (
            <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill={primary ?? '#d4d4d6'} />
                {secondary && (
                    <path
                        d="M16 2 A14 14 0 0 1 30 16 L16 16 Z"
                        fill={secondary}
                    />
                )}
            </svg>
        );
    }

    const clipId = `mc-${index}`;

    return (
        <svg viewBox="0 0 130 100" aria-hidden="true">
            <defs>
                <clipPath id={clipId}>
                    <circle cx="65" cy="50" r="46" />
                </clipPath>
            </defs>
            <circle cx="65" cy="50" r="46" fill={primary ?? '#cccccc'} />
            <g clipPath={`url(#${clipId})`}>
                <path
                    d="M-5 84L-5 6 136 94 136 115Z"
                    fill={secondary ?? '#eeeeee'}
                    opacity={0.82}
                />
                <path
                    d="M-10 90Q50 69 140 96V115H-10Z"
                    fill="#fff"
                    opacity={0.34}
                />
            </g>
            <circle
                cx="65"
                cy="50"
                r="46"
                fill="none"
                stroke="#d1d1d1"
                strokeWidth={1.5}
            />
        </svg>
    );
}
