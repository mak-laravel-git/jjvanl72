import { useMemo } from 'react';

import {
    contrastingToothText,
    listConnectorEdges,
    palmerLabel,
} from './helpers';
import {
    TOOTH_LABEL_FONT,
    toothBodyPath,
    toothGroovePath,
    toothNeedsVerticalFlip,
    toothShowsGrooves,
} from './toothChartGeometry';
import type { CaseCreateCatalog } from './types';
import { BOTTOM_POSITIONS, TOP_POSITIONS } from './types';

export type CaseToothChartItem = {
    id?: number | string;
    kind?: 'tooth' | 'bridge';
    productKey: string;
    teeth: number[];
    brokenEdges?: string[];
};

type CaseToothChartProps = {
    catalog: CaseCreateCatalog;
    items: CaseToothChartItem[];
    className?: string;
};

const BRIDGE_SPAN_FILL = '#16a34a';

const CHART_POSITIONS = [...TOP_POSITIONS, ...BOTTOM_POSITIONS].map(
    ([tooth, x, y, scale]) => ({
        tooth,
        x,
        y,
        scale,
    }),
);

function abutmentItemForTooth(
    items: CaseToothChartItem[],
    tooth: number,
): CaseToothChartItem | undefined {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];

        if (item.kind !== 'bridge' && item.teeth.includes(tooth)) {
            return item;
        }
    }

    return undefined;
}

function bridgeItemForTooth(
    items: CaseToothChartItem[],
    tooth: number,
): CaseToothChartItem | undefined {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];

        if (item.kind === 'bridge' && item.teeth.includes(tooth)) {
            return item;
        }
    }

    return undefined;
}

function toothAppearance(
    catalog: CaseCreateCatalog,
    items: CaseToothChartItem[],
    tooth: number,
): { fill: string; text: string } {
    const abutment = abutmentItemForTooth(items, tooth);

    if (abutment) {
        const fill = catalog.products[abutment.productKey]?.color ?? '#d4d4d6';

        return {
            fill,
            text: contrastingToothText(fill),
        };
    }

    if (bridgeItemForTooth(items, tooth)) {
        return {
            fill: BRIDGE_SPAN_FILL,
            text: contrastingToothText(BRIDGE_SPAN_FILL),
        };
    }

    return { fill: '#ffffff', text: '#111111' };
}

export default function CaseToothChart({
    catalog,
    items,
    className,
}: CaseToothChartProps) {
    const hasBridge = items.some(
        (item) => item.kind === 'bridge' && item.teeth.length > 1,
    );

    const usedColors = useMemo(() => {
        const map = new Map<string, string>();

        items.forEach((item) => {
            if (item.kind === 'bridge') {
                return;
            }

            const product = catalog.products[item.productKey];

            if (product && !map.has(product.key)) {
                map.set(product.key, product.color);
            }
        });

        return Array.from(map.entries()).map(([key, color]) => ({
            key,
            color,
            label: catalog.products[key]?.label ?? key,
        }));
    }, [catalog, items]);

    const savedBridgeEdges = useMemo(
        () =>
            items
                .filter((item) => item.kind === 'bridge' && item.teeth.length > 1)
                .flatMap((item) =>
                    listConnectorEdges(
                        item.teeth,
                        new Set(item.brokenEdges ?? []),
                        CHART_POSITIONS,
                    )
                        .filter((edge) => edge.connected)
                        .map((edge) => ({
                            ...edge,
                            key: `${item.id ?? item.productKey}:${edge.key}`,
                        })),
                ),
        [items],
    );

    return (
        <div className={className}>
            <div className="relative mx-auto w-full max-w-[380px]">
                <svg
                    viewBox="20 30 500 760"
                    className="mx-auto h-auto w-full"
                    role="img"
                    aria-label="Case dental chart"
                >
                    {savedBridgeEdges.length > 0 && (
                        <g aria-hidden="true">
                            {savedBridgeEdges.map((edge) => (
                                <line
                                    key={`bridge-line-${edge.key}`}
                                    x1={edge.from.x}
                                    y1={edge.from.y}
                                    x2={edge.to.x}
                                    y2={edge.to.y}
                                    stroke={BRIDGE_SPAN_FILL}
                                    strokeWidth={3.25}
                                    strokeLinecap="round"
                                    strokeDasharray="5 4"
                                    fill="none"
                                    opacity={0.92}
                                />
                            ))}
                        </g>
                    )}

                    {CHART_POSITIONS.map(({ tooth, x, y, scale }) => {
                        const { fill, text } = toothAppearance(
                            catalog,
                            items,
                            tooth,
                        );

                        return (
                            <g
                                key={tooth}
                                transform={`translate(${x},${y}) scale(${scale})`}
                            >
                                <path
                                    d={toothBodyPath(tooth)}
                                    fill={fill}
                                    stroke="#111111"
                                    strokeWidth={1.45}
                                    transform={
                                        toothNeedsVerticalFlip(tooth)
                                            ? 'scale(1 -1)'
                                            : undefined
                                    }
                                />
                                {toothShowsGrooves(tooth) ? (
                                    <path
                                        d={toothGroovePath(tooth)}
                                        fill="none"
                                        stroke="#1f2937"
                                        strokeWidth={1}
                                        strokeLinecap="round"
                                        opacity={0.55}
                                    />
                                ) : null}
                                <text
                                    x={0}
                                    y={1}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={text}
                                    className="pointer-events-none select-none"
                                    style={{
                                        fontFamily: TOOTH_LABEL_FONT,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {palmerLabel(tooth)}
                                </text>
                            </g>
                        );
                    })}

                    {savedBridgeEdges.length > 0 && (
                        <g aria-hidden="true">
                            {savedBridgeEdges.map((edge) => (
                                <circle
                                    key={`bridge-dot-${edge.key}`}
                                    cx={edge.mid.x}
                                    cy={edge.mid.y}
                                    r={6}
                                    fill={BRIDGE_SPAN_FILL}
                                    stroke="#ffffff"
                                    strokeWidth={2.5}
                                />
                            ))}
                        </g>
                    )}
                </svg>

                {(usedColors.length > 0 || hasBridge) && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 border-t border-[#f1f5f9] pt-3">
                        {usedColors.map(({ key, color, label }) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <span
                                    className="size-2.5 rounded-sm"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-[11px] text-[#64748b]">
                                    {label}
                                </span>
                            </div>
                        ))}
                        {hasBridge && (
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="size-2.5 rounded-sm"
                                    style={{ backgroundColor: BRIDGE_SPAN_FILL }}
                                />
                                <span className="text-[11px] text-[#64748b]">
                                    Bridge
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
