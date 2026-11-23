import {
    type CSSProperties,
    type MouseEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { cn } from '@/lib/utils';

import {
    buildConnectorSegments,
    CHART_CENTER,
    contrastingToothText,
    listConnectorEdges,
    palmerLabel,
    worldConnectorDot,
} from './helpers';
import {
    TOOTH_LABEL_FONT,
    toothBodyPath,
    toothGroovePath,
    toothNeedsVerticalFlip,
    toothShowsGrooves,
} from './toothChartGeometry';
import type {
    CaseCreateCatalog,
    CaseScreen,
    ImpressionType,
    PrescriptionItem,
} from './types';
import { BOTTOM_POSITIONS, LOWER_TEETH, TOP_POSITIONS, UPPER_TEETH } from './types';

/**
 * Keep create-case geometry faithful to Tooth Chart.jpg / TOP_POSITIONS.
 * Use only a minimal size lift for readability; avoid extra arch stretching.
 */
const TOOTH_SIZE_BOOST = 1.02;

function separateAdjacentTeeth(
    positions: Array<{
        tooth: number;
        x: number;
        y: number;
        scale: number;
    }>,
): Array<{ tooth: number; x: number; y: number; scale: number }> {
    const byTooth = new Map(
        positions.map((entry) => [entry.tooth, { ...entry }] as const),
    );

    for (let pass = 0; pass < 3; pass += 1) {
        for (const sequence of [
            UPPER_TEETH as readonly number[],
            LOWER_TEETH as readonly number[],
        ]) {
            for (let index = 0; index < sequence.length - 1; index += 1) {
                const left = byTooth.get(sequence[index]);
                const right = byTooth.get(sequence[index + 1]);

                if (!left || !right) {
                    continue;
                }

                const minDistance = 25 * ((left.scale + right.scale) / 2);
                const dx = right.x - left.x;
                const dy = right.y - left.y;
                const distance = Math.hypot(dx, dy) || 0.001;

                if (distance >= minDistance) {
                    continue;
                }

                const push = (minDistance - distance) / 2;
                const unitX = dx / distance;
                const unitY = dy / distance;

                left.x -= unitX * push;
                left.y -= unitY * push;
                right.x += unitX * push;
                right.y += unitY * push;
            }
        }
    }

    return positions.map((entry) => byTooth.get(entry.tooth) ?? entry);
}

type ToothChartProps = {
    catalog: CaseCreateCatalog;
    items: PrescriptionItem[];
    screen: CaseScreen;
    workingTeeth: number[];
    autoFilledTeeth?: number[];
    activeProductKey?: string | null;
    currentTooth?: number;
    multiSelect: boolean;
    onToothClick: (number: number, event: MouseEvent<SVGGElement>) => void;
    showSideOptions?: boolean;
    shade?: string;
    impressionType?: ImpressionType;
    shades?: string[];
    onShadeChange?: (shade: string) => void;
    onImpressionChange?: (type: ImpressionType) => void;
    onMultiSelectToggle?: () => void;
    selectionEnabled?: boolean;
    brokenEdges?: string[];
    onBrokenEdgesChange?: (edges: string[]) => void;
    forceConnectors?: boolean;
    bridgeFrom?: number | null;
    bridgeTo?: number | null;
    manualBridgeEdges?: Array<{
        key: string;
        left: number;
        right: number;
    }>;
    onManualBridgeJoin?: (left: number, right: number) => void;
    onJoinSelectionAsBridge?: () => void;
    canJoinSelectionAsBridge?: boolean;
    /** Shown while idle when Ctrl/Cmd/Shift + click can copy the last prescription. */
    copyHint?: string | null;
};

const WORKING_FILL = '#ff1717';
const WORKING_TEXT = '#ffffff';
const BRIDGE_SPAN_FILL = '#16a34a';

const LAB_ADDRESS = (
    <>
        SmileBright Dental Lab
        <br />
        Unit 4, 12 Industrial Drive
        <br />
        Sydney NSW 2000
    </>
);

/** Prefer a standalone tooth/product line over a bridge group for coloring. */
function abutmentItemForTooth(
    items: PrescriptionItem[],
    tooth: number,
): PrescriptionItem | undefined {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];

        if (item.kind !== 'bridge' && item.teeth.includes(tooth)) {
            return item;
        }
    }

    return undefined;
}

function bridgeItemForTooth(
    items: PrescriptionItem[],
    tooth: number,
): PrescriptionItem | undefined {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];

        if (item.kind === 'bridge' && item.teeth.includes(tooth)) {
            return item;
        }
    }

    return undefined;
}

function productAppearance(
    catalog: CaseCreateCatalog,
    item: PrescriptionItem,
): { fill: string; text: string } {
    const fill = catalog.products[item.productKey]?.color ?? '#d4d4d6';

    return {
        fill,
        text: contrastingToothText(fill),
    };
}

function bridgeSpanAppearance(): { fill: string; text: string } {
    return {
        fill: BRIDGE_SPAN_FILL,
        text: contrastingToothText(BRIDGE_SPAN_FILL),
    };
}

function toothAppearance(
    catalog: CaseCreateCatalog,
    items: PrescriptionItem[],
    tooth: number,
    workingTeeth: number[],
    autoFilledTeeth: number[],
    activeProductKey: string | null | undefined,
    screen: CaseScreen,
    forceConnectors = false,
    bridgeFrom: number | null = null,
    bridgeTo: number | null = null,
): { fill: string; text: string } {
    const isWorkingSelection = workingTeeth.includes(tooth);
    // Always show working picks (needed for arch-first multi-select on project).
    const highlightWorking = isWorkingSelection;

    if (highlightWorking) {
        if (forceConnectors) {
            if (tooth === bridgeFrom || tooth === bridgeTo) {
                const abutment = abutmentItemForTooth(items, tooth);

                if (abutment) {
                    return productAppearance(catalog, abutment);
                }
            }

            return bridgeSpanAppearance();
        }

        const activeProduct = activeProductKey
            ? catalog.products[activeProductKey]
            : null;

        if (activeProduct) {
            return {
                fill: activeProduct.color,
                text: contrastingToothText(activeProduct.color),
            };
        }

        if (autoFilledTeeth.includes(tooth)) {
            return { fill: '#86efac', text: '#0f5132' };
        }

        return { fill: WORKING_FILL, text: WORKING_TEXT };
    }

    const abutment = abutmentItemForTooth(items, tooth);

    if (abutment) {
        return productAppearance(catalog, abutment);
    }

    if (bridgeItemForTooth(items, tooth)) {
        return bridgeSpanAppearance();
    }

    // Idle: black & white until selection / prescription (client chart style).
    return { fill: '#ffffff', text: '#111111' };
}

export default function ToothChart({
    catalog,
    items,
    screen,
    workingTeeth,
    autoFilledTeeth = [],
    activeProductKey = null,
    multiSelect,
    onToothClick,
    showSideOptions = false,
    shade = 'A2',
    impressionType = 'Intra Oral Scan',
    shades = [],
    onShadeChange = undefined,
    onImpressionChange = undefined,
    onMultiSelectToggle = undefined,
    selectionEnabled = true,
    brokenEdges: brokenEdgesProp,
    onBrokenEdgesChange,
    forceConnectors = false,
    bridgeFrom = null,
    bridgeTo = null,
    manualBridgeEdges = [],
    onManualBridgeJoin = undefined,
    onJoinSelectionAsBridge = undefined,
    canJoinSelectionAsBridge = false,
    copyHint = null,
}: ToothChartProps) {
    const [internalBrokenEdges, setInternalBrokenEdges] = useState<Set<string>>(
        () => new Set(),
    );
    const [isPhoneViewport, setIsPhoneViewport] = useState(false);
    const isControlled = onBrokenEdgesChange !== undefined;

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        const media = window.matchMedia('(max-width: 767px)');
        const sync = () => setIsPhoneViewport(media.matches);
        sync();

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', sync);

            return () => media.removeEventListener('change', sync);
        }

        media.addListener(sync);

        return () => media.removeListener(sync);
    }, []);
    const brokenEdges = useMemo(
        () =>
            isControlled
                ? new Set(brokenEdgesProp ?? [])
                : internalBrokenEdges,
        [brokenEdgesProp, internalBrokenEdges, isControlled],
    );

    useEffect(() => {
        if (isControlled) {
            return;
        }

        const selected = new Set(workingTeeth);

        setInternalBrokenEdges((previous) => {
            const next = new Set<string>();

            previous.forEach((key) => {
                const [leftText, rightText] = key.split('-');
                const left = Number(leftText);
                const right = Number(rightText);

                if (selected.has(left) && selected.has(right)) {
                    next.add(key);
                }
            });

            return next;
        });
    }, [isControlled, workingTeeth]);

    const usedColors = useMemo(() => {
        const map = new Map<string, string>();
        let hasBridge = false;

        items.forEach((item) => {
            if (item.kind === 'bridge' && item.teeth.length > 1) {
                hasBridge = true;

                return;
            }

            const product = catalog.products[item.productKey];

            if (product && !map.has(product.key)) {
                map.set(product.key, product.color);
            }
        });

        const entries = Array.from(map.entries()).map(([key, color]) => ({
            key,
            color,
            label: catalog.products[key]?.label ?? key,
        }));

        if (hasBridge) {
            entries.push({
                key: 'bridge-span',
                color: BRIDGE_SPAN_FILL,
                label: 'Bridge',
            });
        }

        return entries;
    }, [catalog, items]);

    const chartPositions = useMemo(
        () =>
            separateAdjacentTeeth(
                [...TOP_POSITIONS, ...BOTTOM_POSITIONS].map(
                    ([tooth, x, y, scale]) => ({
                        tooth,
                        x,
                        y,
                        scale: scale * TOOTH_SIZE_BOOST,
                    }),
                ),
            ),
        [],
    );

    const chartViewBox = useMemo(() => {
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        chartPositions.forEach(({ x, y, scale }) => {
            const radius = 34 * scale;
            const dot = worldConnectorDot(x, y, scale);

            minX = Math.min(minX, x - radius, dot.x - 10);
            maxX = Math.max(maxX, x + radius, dot.x + 10);
            minY = Math.min(minY, y - radius, dot.y - 10);
            maxY = Math.max(maxY, y + radius, dot.y + 10);
        });

        const padX = 18;
        const padY = 16;

        return {
            minX: minX - padX,
            minY: minY - padY,
            width: maxX - minX + padX * 2,
            height: maxY - minY + padY * 2,
        };
    }, [chartPositions]);

    // Green connector lines/dots belong to bridge mode only. Drawing them for
    // any ordinary multi-selection implied a bridge for every product, even
    // without a pontic. Saved bridges and the "join" dots are drawn separately.
    const showConnectors = forceConnectors;

    const connectorEdges = useMemo(
        () =>
            showConnectors
                ? listConnectorEdges(
                      workingTeeth,
                      brokenEdges,
                      chartPositions,
                  )
                : [],
        [brokenEdges, chartPositions, showConnectors, workingTeeth],
    );

    const manualJoinEdges = useMemo(() => {
        if (forceConnectors || manualBridgeEdges.length === 0) {
            return [];
        }

        const allowed = new Set(manualBridgeEdges.map((edge) => edge.key));
        const teeth = [
            ...new Set(
                manualBridgeEdges.flatMap((edge) => [edge.left, edge.right]),
            ),
        ];

        return listConnectorEdges(teeth, new Set(), chartPositions).filter(
            (edge) => allowed.has(edge.key),
        );
    }, [chartPositions, forceConnectors, manualBridgeEdges]);

    const connectorSegments = useMemo(
        () =>
            showConnectors
                ? buildConnectorSegments(
                      workingTeeth,
                      brokenEdges,
                      chartPositions,
                  )
                : [],
        [brokenEdges, chartPositions, showConnectors, workingTeeth],
    );

    const savedBridgeEdges = useMemo(() => {
        if (forceConnectors) {
            return [];
        }

        return items
            .filter((item) => item.kind === 'bridge' && item.teeth.length > 1)
            .flatMap((item) =>
                listConnectorEdges(
                    item.teeth,
                    new Set(item.brokenEdges ?? []),
                    chartPositions,
                )
                    .filter((edge) => edge.connected)
                    .map((edge) => ({
                        ...edge,
                        key: `${item.id}:${edge.key}`,
                    })),
            );
    }, [chartPositions, forceConnectors, items]);

    const savedBridgeSegments = useMemo(
        () =>
            savedBridgeEdges.map((edge) => ({
                from: edge.from,
                to: edge.to,
                key: edge.key,
            })),
        [savedBridgeEdges],
    );

    const activeProduct = activeProductKey
        ? catalog.products[activeProductKey]
        : null;
    const configurationScreen = screen === 'catalog' || screen === 'material';

    const toggleConnectorEdge = (edgeKey: string, event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        if (!selectionEnabled && !forceConnectors) {
            return;
        }

        const next = new Set(brokenEdges);

        if (next.has(edgeKey)) {
            next.delete(edgeKey);
        } else {
            next.add(edgeKey);
        }

        if (isControlled) {
            onBrokenEdgesChange?.([...next]);
        } else {
            setInternalBrokenEdges(next);
        }
    };

    return (
        <section className="chart-area">
            <div className="chart-toolbar">
                {forceConnectors ? (
                    <span className="chart-toolbar-hint">
                        {isPhoneViewport
                            ? 'Tap green mid-dots to break or restore bridge links'
                            : 'Click green mid-dots to break or restore bridge links (cantilever OK with one retainer)'}
                    </span>
                ) : selectionEnabled ? (
                    <>
                        <div className="chart-toolbar-controls">
                            <span>Patient</span>
                            <button
                                type="button"
                                className={cn('toggle', multiSelect && 'on')}
                                title="Multi-select"
                                onClick={onMultiSelectToggle}
                            />
                            <span>Multi-select</span>
                        </div>
                        {workingTeeth.length > 0 ? (
                            <span className="chart-toolbar-hint">
                                Selected {workingTeeth.length}{' '}
                                {workingTeeth.length === 1 ? 'tooth' : 'teeth'}
                                {!configurationScreen
                                    ? isPhoneViewport
                                        ? ' — open Products to pick one'
                                        : ' — pick a product in the left panel'
                                    : ''}
                            </span>
                        ) : (
                            <span className="chart-toolbar-hint">
                                {configurationScreen
                                    ? isPhoneViewport
                                        ? 'Tap teeth to add or remove from the selection'
                                        : 'Ctrl / Cmd + click to add or remove a tooth · Shift + click to add a range'
                                    : copyHint && !isPhoneViewport
                                      ? copyHint
                                      : multiSelect
                                        ? isPhoneViewport
                                            ? 'Multi-select ON — tap teeth, then open Products'
                                            : 'Multi-select ON — click teeth to add (they turn red), then pick a product'
                                        : manualJoinEdges.length > 0
                                          ? isPhoneViewport
                                              ? 'Tap green dots to join crown/pontic, or tap a tooth / Multi-select'
                                              : 'Green dots join crown/pontic into a bridge; or click a tooth / Multi-select'
                                          : isPhoneViewport
                                            ? 'Turn Multi-select ON, then tap teeth'
                                            : 'Turn Multi-select ON (or Ctrl / Cmd / Shift + click), then click teeth'}
                            </span>
                        )}
                        {!configurationScreen && canJoinSelectionAsBridge ? (
                            <button
                                type="button"
                                className="chart-toolbar-action is-bridge"
                                onClick={onJoinSelectionAsBridge}
                            >
                                Join as bridge
                            </button>
                        ) : null}
                    </>
                ) : (
                    <span className="chart-toolbar-hint">
                        Enter patient name and due date before selecting teeth
                    </span>
                )}
            </div>
            <div
                className={cn(
                    'chart-with-options',
                    showSideOptions && 'has-bottom-options',
                )}
            >
                <div
                    className={cn(
                        'chart-svg-wrap',
                        !selectionEnabled &&
                            !forceConnectors &&
                            'chart-locked',
                    )}
                >
                    <svg
                        viewBox={`${chartViewBox.minX} ${chartViewBox.minY} ${chartViewBox.width} ${chartViewBox.height}`}
                        className="dental-chart"
                        role="img"
                        aria-label="Interactive dental chart"
                        aria-disabled={!selectionEnabled}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {savedBridgeSegments.length > 0 && (
                            <g
                                className="tooth-connector-lines is-saved"
                                aria-hidden="true"
                            >
                                {savedBridgeSegments.map((segment) => (
                                    <line
                                        key={segment.key}
                                        className="tooth-connector-line is-saved"
                                        x1={segment.from.x}
                                        y1={segment.from.y}
                                        x2={segment.to.x}
                                        y2={segment.to.y}
                                    />
                                ))}
                            </g>
                        )}

                        {connectorSegments.length > 0 && (
                            <g className="tooth-connector-lines" aria-hidden="true">
                                {connectorSegments.map((segment) => (
                                    <line
                                        key={segment.key}
                                        className="tooth-connector-line"
                                        x1={segment.from.x}
                                        y1={segment.from.y}
                                        x2={segment.to.x}
                                        y2={segment.to.y}
                                    />
                                ))}
                            </g>
                        )}

                        {chartPositions.map(({ tooth, x, y, scale }) => {
                            const appearance = toothAppearance(
                                catalog,
                                items,
                                tooth,
                                workingTeeth,
                                autoFilledTeeth,
                                activeProductKey,
                                screen,
                                forceConnectors,
                                bridgeFrom,
                                bridgeTo,
                            );
                            const isBridgeAbutment =
                                forceConnectors &&
                                (tooth === bridgeFrom || tooth === bridgeTo);

                            return (
                                <g
                                    key={tooth}
                                    role="button"
                                    tabIndex={selectionEnabled ? 0 : -1}
                                    aria-disabled={!selectionEnabled}
                                    className={cn(
                                        'tooth',
                                        !selectionEnabled &&
                                            !forceConnectors &&
                                            'tooth-locked',
                                        isBridgeAbutment &&
                                            'is-bridge-abutment',
                                    )}
                                    style={
                                        {
                                            '--tooth-fill': appearance.fill,
                                            '--tooth-text': appearance.text,
                                        } as CSSProperties
                                    }
                                    transform={`translate(${x},${y}) scale(${scale})`}
                                    onClick={(event) => {
                                        if (!selectionEnabled) {
                                            return;
                                        }

                                        onToothClick(tooth, event);
                                    }}
                                    onKeyDown={(event) => {
                                        if (!selectionEnabled) {
                                            return;
                                        }

                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            onToothClick(
                                                tooth,
                                                event as unknown as MouseEvent<SVGGElement>,
                                            );
                                        }
                                    }}
                                >
                                    <path
                                        className="tooth-body"
                                        d={toothBodyPath(tooth)}
                                        transform={
                                            toothNeedsVerticalFlip(tooth)
                                                ? 'scale(1 -1)'
                                                : undefined
                                        }
                                    />
                                    {toothShowsGrooves(tooth) ? (
                                        <path
                                            className="tooth-groove"
                                            d={toothGroovePath(tooth)}
                                        />
                                    ) : null}
                                    <text
                                        x={0}
                                        y={1}
                                        style={{ fontFamily: TOOTH_LABEL_FONT }}
                                    >
                                        {palmerLabel(tooth)}
                                    </text>
                                </g>
                            );
                        })}

                        {savedBridgeEdges.length > 0 && (
                            <g
                                className="tooth-connector-dots is-saved"
                                aria-hidden="true"
                            >
                                {savedBridgeEdges.map((edge) => (
                                    <circle
                                        key={`saved-connector-dot-${edge.key}`}
                                        className="tooth-selected-dot is-saved"
                                        cx={edge.mid.x}
                                        cy={edge.mid.y}
                                        r={6}
                                    />
                                ))}
                            </g>
                        )}

                        {showConnectors &&
                            forceConnectors &&
                            connectorEdges.map((edge) => (
                                <circle
                                    key={`connector-edge-${edge.key}`}
                                    className={cn(
                                        'tooth-selected-dot',
                                        'tooth-connector-toggle',
                                        edge.connected ? 'is-on' : 'is-off',
                                    )}
                                    cx={edge.mid.x}
                                    cy={edge.mid.y}
                                    r={7}
                                    role="button"
                                    tabIndex={
                                        selectionEnabled || forceConnectors
                                            ? 0
                                            : -1
                                    }
                                    aria-label={
                                        edge.connected
                                            ? `Remove brace link between tooth ${edge.left} and ${edge.right}`
                                            : `Add brace link between tooth ${edge.left} and ${edge.right}`
                                    }
                                    aria-pressed={edge.connected}
                                    onClick={(event) =>
                                        toggleConnectorEdge(edge.key, event)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            toggleConnectorEdge(
                                                edge.key,
                                                event as unknown as MouseEvent,
                                            );
                                        }
                                    }}
                                />
                            ))}

                        {!forceConnectors &&
                            selectionEnabled &&
                            manualJoinEdges.map((edge) => (
                                <circle
                                    key={`manual-bridge-edge-${edge.key}`}
                                    className="tooth-selected-dot tooth-connector-toggle is-off"
                                    cx={edge.mid.x}
                                    cy={edge.mid.y}
                                    r={7}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Join bridge link between tooth ${edge.left} and ${edge.right}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        event.preventDefault();
                                        onManualBridgeJoin?.(
                                            edge.left,
                                            edge.right,
                                        );
                                    }}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            onManualBridgeJoin?.(
                                                edge.left,
                                                edge.right,
                                            );
                                        }
                                    }}
                                />
                            ))}
                    </svg>

                    {(usedColors.length > 0 ||
                        workingTeeth.length > 0 ||
                        manualJoinEdges.length > 0) && (
                            <div className="chart-legend">
                                {usedColors.map(({ key, color, label }) => (
                                    <div key={key} className="legend-row">
                                        <span
                                            className="legend-color"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span>{label}</span>
                                    </div>
                                ))}
                                {(forceConnectors ||
                                    manualJoinEdges.length > 0) &&
                                    (forceConnectors
                                        ? workingTeeth.length > 0
                                        : true) && (
                                    <div className="legend-row">
                                        <span
                                            className="legend-color"
                                            style={{
                                                backgroundColor:
                                                    BRIDGE_SPAN_FILL,
                                            }}
                                        />
                                        <span>
                                            {forceConnectors
                                                ? 'Bridge'
                                                : 'Click green dot to join bridge'}
                                        </span>
                                    </div>
                                )}
                                {!forceConnectors &&
                                    workingTeeth.length > 0 &&
                                    (activeProduct ? (
                                        <div className="legend-row">
                                            <span
                                                className="legend-color"
                                                style={{
                                                    backgroundColor:
                                                        activeProduct.color,
                                                }}
                                            />
                                            <span>{activeProduct.label}</span>
                                        </div>
                                    ) : (
                                        <div className="legend-row">
                                            <span
                                                className="legend-color"
                                                style={{
                                                    backgroundColor:
                                                        autoFilledTeeth.length >
                                                        0
                                                            ? '#86efac'
                                                            : WORKING_FILL,
                                                }}
                                            />
                                            <span>
                                                {autoFilledTeeth.length > 0
                                                    ? 'Connecting teeth'
                                                    : `Selected (${workingTeeth.length})`}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                </div>

                {showSideOptions && (
                    <div className="chart-bottom-options">
                        <div className="chart-bottom-fields">
                            <div className="chart-bottom-field">
                                <label className="side-option-label">
                                    Default shade
                                </label>
                                <select
                                    className="side-option-select"
                                    value={shade}
                                    onChange={(event) =>
                                        onShadeChange?.(event.target.value)
                                    }
                                >
                                    {shades.map((entry) => (
                                        <option key={entry} value={entry}>
                                            {entry}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="chart-bottom-field">
                                <label className="side-option-label">
                                    Impression Type
                                </label>
                                <select
                                    className="side-option-select"
                                    value={impressionType}
                                    onChange={(event) =>
                                        onImpressionChange?.(
                                            event.target.value as ImpressionType,
                                        )
                                    }
                                >
                                    <option value="Traditional Impression">
                                        Traditional Impression
                                    </option>
                                    <option value="Intra Oral Scan">
                                        Intra Oral Scan
                                    </option>
                                    <option value="Bench top scan">
                                        Bench top scan
                                    </option>
                                </select>
                            </div>
                        </div>

                        {impressionType === 'Traditional Impression' && (
                            <div className="courier-notice">
                                <strong>Send via Courier</strong>
                                Please send your physical impressions to our lab by
                                courier service. No digital file upload is required.
                                <br />
                                <br />
                                <strong>Lab Address:</strong>
                                <br />
                                {LAB_ADDRESS}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
