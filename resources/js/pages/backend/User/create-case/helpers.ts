import type {
    CaseConfig,
    CaseCreateCatalog,
    CaseDraft,
    CasePayment,
    MaterialOption,
    PriceTotals,
    ProductDefinition,
    PrescriptionItem,
} from './types';
import { LOWER_TEETH, UPPER_TEETH } from './types';

export type ToothChartPosition = {
    tooth: number;
    x: number;
    y: number;
    scale: number;
};

export type ConnectorSegment = {
    from: { x: number; y: number };
    to: { x: number; y: number };
    key: string;
};

export type ConnectorEdge = {
    key: string;
    left: number;
    right: number;
    from: { x: number; y: number };
    to: { x: number; y: number };
    mid: { x: number; y: number };
    connected: boolean;
};

/** Approximate center of the dental chart oval (SVG viewBox space). */
export const CHART_CENTER = { x: 269, y: 412.5 } as const;

/** Placeholder — replace with Johan's real address later. */
export const ALL_ON_X_ASSISTANCE_EMAIL = 'johan@example.com';

export const BRIDGE_RETAINER_PRODUCT_KEYS = new Set([
    'crown',
    'implantCrown',
]);

export const BRIDGE_MEMBER_PRODUCT_KEYS = new Set([
    'crown',
    'implantCrown',
    'pontic',
]);

export type ToothFeatureAssignment = {
    clasp?: string;
    rests?: string;
};

export type ToothFeaturesMap = Record<string, ToothFeatureAssignment>;

export function parseToothFeatures(raw: string | undefined): ToothFeaturesMap {
    if (!raw || !raw.trim()) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(raw);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }

        const result: ToothFeaturesMap = {};

        Object.entries(parsed as Record<string, unknown>).forEach(
            ([toothKey, value]) => {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    return;
                }

                const entry = value as Record<string, unknown>;
                const clasp =
                    typeof entry.clasp === 'string' && entry.clasp.trim()
                        ? entry.clasp
                        : undefined;
                const rests =
                    typeof entry.rests === 'string' && entry.rests.trim()
                        ? entry.rests
                        : undefined;

                if (clasp || rests) {
                    result[toothKey] = { clasp, rests };
                }
            },
        );

        return result;
    } catch {
        return {};
    }
}

export function serializeToothFeatures(map: ToothFeaturesMap): string {
    const cleaned: ToothFeaturesMap = {};

    Object.entries(map).forEach(([toothKey, assignment]) => {
        const clasp = assignment.clasp?.trim() || undefined;
        const rests = assignment.rests?.trim() || undefined;

        if (clasp || rests) {
            cleaned[toothKey] = { clasp, rests };
        }
    });

    return JSON.stringify(cleaned);
}

export function toothFeaturesHaveAny(map: ToothFeaturesMap): boolean {
    return Object.values(map).some(
        (assignment) =>
            Boolean(assignment.clasp?.trim()) ||
            Boolean(assignment.rests?.trim()),
    );
}

export function formatToothFeaturesSummary(map: ToothFeaturesMap): string[] {
    return Object.entries(map)
        .map(([toothKey, assignment]) => {
            const tooth = Number(toothKey);
            const parts: string[] = [];

            if (assignment.clasp) {
                parts.push(`Clasp ${assignment.clasp}`);
            }

            if (assignment.rests) {
                parts.push(`Rest ${assignment.rests}`);
            }

            if (parts.length === 0) {
                return null;
            }

            return `${formatPalmerTooth(tooth)}: ${parts.join(', ')}`;
        })
        .filter((entry): entry is string => entry !== null);
}

export type BridgeAutoJoin = {
    fromTooth: number;
    toTooth: number;
    sourceItem: PrescriptionItem;
};

export type ManualBridgeEdge = {
    key: string;
    left: number;
    right: number;
};

export const PONTIC_PRODUCT_KEY = 'pontic';

export function isBridgeMemberProduct(productKey: string): boolean {
    return BRIDGE_MEMBER_PRODUCT_KEYS.has(productKey);
}

export function isBridgeRetainerProduct(productKey: string): boolean {
    return BRIDGE_RETAINER_PRODUCT_KEYS.has(productKey);
}

/**
 * THE bridge rule — every bridge entry point must go through this.
 *
 * A bridge exists only when its members include at least one retainer
 * (crown / implant crown) AND at least one explicitly prescribed pontic.
 * Two crowns side by side, or a lone pontic, are not a bridge. Pontics that
 * are merely auto-filled in a gap do not count: the dentist must prescribe one.
 *
 * Keep in sync with ValidatesDentalCasePayload::validateBridgeItems().
 */
export function bridgeMembersQualify(
    members: ReadonlyArray<Pick<PrescriptionItem, 'productKey'>>,
): boolean {
    let hasRetainer = false;
    let hasPontic = false;

    for (const member of members) {
        if (BRIDGE_RETAINER_PRODUCT_KEYS.has(member.productKey)) {
            hasRetainer = true;
        } else if (member.productKey === PONTIC_PRODUCT_KEY) {
            hasPontic = true;
        }

        if (hasRetainer && hasPontic) {
            return true;
        }
    }

    return false;
}

/**
 * Does a connected bridge group (set by the green dots) satisfy the bridge
 * rule using the dentist's explicit single-tooth prescriptions?
 */
export function bridgeGroupQualifies(
    items: PrescriptionItem[],
    group: readonly number[],
): boolean {
    const members = items.filter(
        (item) =>
            (item.kind ?? 'tooth') === 'tooth' &&
            item.teeth.length === 1 &&
            group.includes(item.teeth[0]) &&
            BRIDGE_MEMBER_PRODUCT_KEYS.has(item.productKey),
    );

    return bridgeMembersQualify(members);
}

/** Teeth already included in a saved bridge line (skip for new auto-join). */
export function teethCoveredByExistingBridges(
    items: PrescriptionItem[],
): Set<number> {
    const covered = new Set<number>();

    items.forEach((item) => {
        if (item.kind === 'bridge') {
            item.teeth.forEach((tooth) => covered.add(tooth));
        }
    });

    return covered;
}

function bridgeMemberToothMap(
    items: PrescriptionItem[],
    covered: ReadonlySet<number>,
): Map<number, PrescriptionItem> {
    const byTooth = new Map<number, PrescriptionItem>();

    items.forEach((item) => {
        if ((item.kind ?? 'tooth') !== 'tooth' || item.teeth.length !== 1) {
            return;
        }

        if (!BRIDGE_MEMBER_PRODUCT_KEYS.has(item.productKey)) {
            return;
        }

        const tooth = item.teeth[0];

        if (covered.has(tooth)) {
            return;
        }

        byTooth.set(tooth, item);
    });

    return byTooth;
}

function bridgeJoinFromRun(
    runTeeth: number[],
    byTooth: Map<number, PrescriptionItem>,
): BridgeAutoJoin | null {
    if (runTeeth.length < 2) {
        return null;
    }

    const runItems = runTeeth.map(
        (tooth) => byTooth.get(tooth) as PrescriptionItem,
    );

    if (!bridgeMembersQualify(runItems)) {
        return null;
    }

    // The bridge line is billed/configured from a retainer, never a pontic.
    const sourceItem = runItems.find((item) =>
        BRIDGE_RETAINER_PRODUCT_KEYS.has(item.productKey),
    ) as PrescriptionItem;

    return {
        fromTooth: runTeeth[0],
        toTooth: runTeeth[runTeeth.length - 1],
        sourceItem,
    };
}

/**
 * Contiguous same-arch runs (length ≥ 2) of uncovered bridge-member teeth,
 * in anatomical order. Used by auto-join and the manual green dots.
 */
function contiguousMemberRuns(
    byTooth: ReadonlyMap<number, PrescriptionItem>,
): number[][] {
    const runs: number[][] = [];

    for (const sequence of [
        UPPER_TEETH as readonly number[],
        LOWER_TEETH as readonly number[],
    ]) {
        let current: number[] = [];

        for (const tooth of sequence) {
            if (byTooth.has(tooth)) {
                current.push(tooth);

                continue;
            }

            if (current.length >= 2) {
                runs.push(current);
            }

            current = [];
        }

        if (current.length >= 2) {
            runs.push(current);
        }
    }

    return runs;
}

/**
 * Find a contiguous same-arch run of crown/implantCrown/pontic tooth items
 * that should auto-enter bridge adjust — only when it satisfies the bridge
 * rule (≥1 retainer AND ≥1 pontic). Teeth already on a saved bridge line are
 * ignored.
 */
export function findBridgeAutoJoin(
    items: PrescriptionItem[],
): BridgeAutoJoin | null {
    const covered = teethCoveredByExistingBridges(items);
    const byTooth = bridgeMemberToothMap(items, covered);

    if (byTooth.size < 2) {
        return null;
    }

    for (const run of contiguousMemberRuns(byTooth)) {
        const join = bridgeJoinFromRun(run, byTooth);

        if (join) {
            return join;
        }
    }

    return null;
}

/**
 * Adjacent uncovered bridge-member pairs — green dots on the project chart
 * for manual join / cantilever start. A dot is offered only inside a run that
 * can actually become a bridge (≥1 retainer AND ≥1 pontic), so the chart never
 * invites a crown+crown "bridge".
 */
export function listManualBridgeJoinEdges(
    items: PrescriptionItem[],
): ManualBridgeEdge[] {
    const covered = teethCoveredByExistingBridges(items);
    const byTooth = bridgeMemberToothMap(items, covered);
    const edges: ManualBridgeEdge[] = [];

    for (const run of contiguousMemberRuns(byTooth)) {
        if (bridgeJoinFromRun(run, byTooth) === null) {
            continue;
        }

        for (let index = 0; index < run.length - 1; index += 1) {
            edges.push({
                key: connectorEdgeKey(run[index], run[index + 1]),
                left: run[index],
                right: run[index + 1],
            });
        }
    }

    return edges;
}

/**
 * Build a bridge adjust target from a clicked manual mid-dot (adjacent pair),
 * expanding to the full contiguous uncovered bridge-member run.
 */
export function findManualBridgeJoinFromEdge(
    items: PrescriptionItem[],
    left: number,
    right: number,
): BridgeAutoJoin | null {
    const covered = teethCoveredByExistingBridges(items);
    const byTooth = bridgeMemberToothMap(items, covered);

    if (!byTooth.has(left) || !byTooth.has(right)) {
        return null;
    }

    const sequence = (UPPER_TEETH as readonly number[]).includes(left)
        ? (UPPER_TEETH as readonly number[])
        : (LOWER_TEETH as readonly number[]).includes(left)
          ? (LOWER_TEETH as readonly number[])
          : null;

    if (!sequence) {
        return null;
    }

    const leftIndex = sequence.indexOf(left);
    const rightIndex = sequence.indexOf(right);

    if (
        leftIndex === -1 ||
        rightIndex === -1 ||
        Math.abs(leftIndex - rightIndex) !== 1
    ) {
        return null;
    }

    let start = Math.min(leftIndex, rightIndex);
    let end = Math.max(leftIndex, rightIndex);

    while (start > 0 && byTooth.has(sequence[start - 1])) {
        start -= 1;
    }

    while (end < sequence.length - 1 && byTooth.has(sequence[end + 1])) {
        end += 1;
    }

    const runTeeth = sequence.slice(start, end + 1);

    return bridgeJoinFromRun(runTeeth, byTooth);
}

/**
 * Start bridge adjust from an arch multi-selection (cantilever or span).
 * Uses prescribed bridge-member items on the selection when present.
 */
export function findManualBridgeJoinFromTeeth(
    items: PrescriptionItem[],
    teeth: number[],
): BridgeAutoJoin | null {
    if (teeth.length < 2) {
        return null;
    }

    const endpoints = bridgeEndpoints(teeth);

    if (!endpoints) {
        return null;
    }

    const covered = teethCoveredByExistingBridges(items);
    const byTooth = bridgeMemberToothMap(items, covered);
    const span = bridgeSpanTeeth(endpoints.from, endpoints.to);
    const membersInSpan = span.filter((tooth) => byTooth.has(tooth));

    if (membersInSpan.length < 2) {
        return null;
    }

    const runItems = membersInSpan.map(
        (tooth) => byTooth.get(tooth) as PrescriptionItem,
    );

    if (!bridgeMembersQualify(runItems)) {
        return null;
    }

    // Cantilever / span uses anatomical endpoints of the selection. The bridge
    // line is billed/configured from a retainer, never a pontic.
    return {
        fromTooth: endpoints.from,
        toTooth: endpoints.to,
        sourceItem: runItems.find((item) =>
            BRIDGE_RETAINER_PRODUCT_KEYS.has(item.productKey),
        ) as PrescriptionItem,
    };
}

/**
 * World-space point just outside the tooth along the outer arch perimeter.
 * Offset stays close to the tooth tip (not far into empty space).
 */
export function worldConnectorDot(
    x: number,
    y: number,
    scale: number,
): { x: number; y: number } {
    const dx = x - CHART_CENTER.x;
    const dy = y - CHART_CENTER.y;
    const length = Math.hypot(dx, dy) || 1;
    const outwardX = dx / length;
    const outwardY = dy / length;
    // Crown tip ≈ 30 local units; keep a small gap so the dot sits just outside.
    const distance = 30 * scale + 4;

    return {
        x: x + outwardX * distance,
        y: y + outwardY * distance,
    };
}

export function isUpperArchTooth(tooth: number): boolean {
    return (UPPER_TEETH as readonly number[]).includes(tooth);
}

/** FDI → Palmer quadrant label 1–8 (midline outward). */
export function palmerLabel(fdi: number): number {
    const digit = fdi % 10;

    return digit >= 1 && digit <= 8 ? digit : fdi;
}

/** Palmer display for a single FDI tooth number (e.g. "8 (18)"). */
export function formatPalmerTooth(fdi: number): string {
    return `${palmerLabel(fdi)} (${fdi})`;
}

/** Palmer display for a bridge span (e.g. "8 (18) → 5 (15)"). */
export function formatPalmerSpan(from: number, to: number): string {
    return `${formatPalmerTooth(from)} → ${formatPalmerTooth(to)}`;
}

/** Palmer list for tooth selections (e.g. "8 (18), 7 (17)"). */
export function formatPalmerTeeth(teeth: number[]): string {
    return teeth.map((tooth) => formatPalmerTooth(tooth)).join(', ');
}

export function connectorEdgeKey(left: number, right: number): string {
    return `${left}-${right}`;
}

/**
 * Adjacent selected tooth pairs on each arch.
 * A broken edge key removes only that segment so multiple braces can share
 * one selection (e.g. 1-2-3 and 4-5 with 3–4 disconnected).
 */
export function listConnectorEdges(
    workingTeeth: number[],
    brokenEdges: ReadonlySet<string>,
    positions: ToothChartPosition[],
): ConnectorEdge[] {
    if (workingTeeth.length < 2) {
        return [];
    }

    const selected = new Set(workingTeeth);
    const byTooth = new Map(
        positions.map((entry) => [entry.tooth, entry] as const),
    );
    const edges: ConnectorEdge[] = [];

    for (const sequence of [
        UPPER_TEETH as readonly number[],
        LOWER_TEETH as readonly number[],
    ]) {
        for (let index = 0; index < sequence.length - 1; index += 1) {
            const left = sequence[index];
            const right = sequence[index + 1];

            if (!selected.has(left) || !selected.has(right)) {
                continue;
            }

            const leftPos = byTooth.get(left);
            const rightPos = byTooth.get(right);

            if (!leftPos || !rightPos) {
                continue;
            }

            const from = worldConnectorDot(
                leftPos.x,
                leftPos.y,
                leftPos.scale,
            );
            const to = worldConnectorDot(
                rightPos.x,
                rightPos.y,
                rightPos.scale,
            );
            const key = connectorEdgeKey(left, right);

            edges.push({
                key,
                left,
                right,
                from,
                to,
                mid: {
                    x: (from.x + to.x) / 2,
                    y: (from.y + to.y) / 2,
                },
                connected: !brokenEdges.has(key),
            });
        }
    }

    return edges;
}

/** Green connection lines for unbroken adjacent edges. */
export function buildConnectorSegments(
    workingTeeth: number[],
    brokenEdges: ReadonlySet<string>,
    positions: ToothChartPosition[],
): ConnectorSegment[] {
    return listConnectorEdges(workingTeeth, brokenEdges, positions)
        .filter((edge) => edge.connected)
        .map((edge) => ({
            from: edge.from,
            to: edge.to,
            key: edge.key,
        }));
}

export function createEmptyPayment(): CasePayment {
    return {
        method: 'card',
        name: '',
        card: '',
        expiry: '',
        cvv: '',
        paypalEmail: '',
        terms: false,
    };
}

export function createEmptyDraft(
    client = '',
    shade = 'A2',
    clientId: number | null = null,
): CaseDraft {
    return {
        id: '',
        client,
        clientId,
        reference: '',
        patientName: '',
        dueDate: '',
        description: '',
        shade,
        impressionType: 'Intra Oral Scan',
        service: 'design',
        output: 'appliance',
        items: [],
        uploads: {},
        fileSlots: [
            { code: 'upperArch', label: 'Upper Arch' },
            { code: 'lowerArch', label: 'Lower Arch' },
            { code: 'biteScan', label: 'Bite Scan' },
        ],
        payment: createEmptyPayment(),
        status: 'New',
    };
}

export function defaultConfig(
    productKey: string,
    product: ProductDefinition,
    selectedMaterialName: string = '',
    selectedMaterialId: number | null = null,
): CaseConfig {
    if (product.parameters && product.parameters.length > 0) {
        const config: CaseConfig = { information: '' };

        product.parameters
            .filter(
                (parameter) =>
                    parameter.materialId === null ||
                    parameter.materialId === selectedMaterialId,
            )
            .forEach((parameter) => {
                if (parameter.type === 'multi_option') {
                    config[parameter.fieldName] = '[]';

                    return;
                }

                if (parameter.type === 'option') {
                    if (
                        (productKey === 'pontic' &&
                            parameter.fieldName === 'ponticDesign') ||
                        productKey === 'diagnosticWaxup' ||
                        ((productKey === 'partialGuide' ||
                            productKey === 'fullGuide') &&
                            parameter.fieldName === 'planningApproval')
                    ) {
                        config[parameter.fieldName] = '';

                        return;
                    }

                    const first = parameter.options[0];
                    config[parameter.fieldName] = first?.value ?? '';
                } else {
                    config[parameter.fieldName] = '';
                }
            });

        return config;
    }

    if (product.flow === 'crown') {
        if (productKey === 'crown') {
            return crownRetainerFallbackConfig(selectedMaterialName);
        }

        if (productKey === 'pontic') {
            return {
                ponticDesign: '',
                information: '',
            };
        }

        return {
            restorationRole: 'Crown',
            contour: 'Full Contour',
            crownType: 'Crown',
            cervical: 'Pull to Margin',
            scannedAnatomy: 'No',
            additionalScan: 'None',
            information: '',
        };
    }

    if (product.flow === 'implant') {
        if (productKey === 'implantCrown') {
            return {
                contour: 'Full Contour',
                implantBrand: 'Nobel Biocare',
                abutmentType: 'Ti-Base',
                customImplantBrand: '',
                platformSize: '',
                scanAbutmentInfo: '',
                tiBaseType: 'OEM',
                information: '',
            };
        }

        if (productKey === 'allOnX') {
            return {
                information: '',
            };
        }

        return {
            restorationRole: 'Crown',
            contour: 'Full Contour',
            crownType: 'Implant Crown',
            implantBrand: 'Nobel Biocare',
            customImplantBrand: '',
            retention: 'Cement Retained Custom Abutment',
            abutmentMaterial: 'Custom Zirconia on Ti-Base',
            tiBaseType: 'OEM',
            scanAbutmentInfo: '',
            platformSize: '',
            cervical: 'Pull to Margin',
            information: '',
        };
    }

    if (product.flow === 'denture') {
        return {
            toothShape: 'Ovoid/Oval',
            anteriorSetup: 'Naturally Straight',
            posteriorSetup: 'Lingualized Occlusion',
            postDam: 'Butterfly',
            periphery: 'In the depth of the sulcus',
            designMarkers: 'Follow Natural Markers',
            gingiva: 'Medium Gingiva',
            information: '',
        };
    }

    if (product.flow === 'biteplane') {
        return {
            splintType: 'Type A — Directional Splint',
            contactDepth: '0 mm',
            minimumThickness: '2 mm',
            guidance: 'Medium',
            information: '',
        };
    }

    if (product.flow === 'partial') {
        if (productKey === 'castPartial') {
            return {
                framework: 'Horseshoe',
                clasp: 'Akers Clasp',
                rests: 'Mesial Occlusal Rest',
                information: '',
            };
        }

        return {
            clasp: 'Wrought Wire Clasp',
            information: '',
        };
    }

    if (productKey === 'diagnosticWaxup') {
        return {
            designStyle: '',
            toothShape: '',
            marginDesign: '',
            needed: '[]',
            information: '',
        };
    }

    if (productKey === 'simpleGuide') {
        return {
            occlusalSlot: 'No',
            boneReductionIndication: 'No',
            information: '',
        };
    }

    if (productKey === 'partialGuide' || productKey === 'fullGuide') {
        return {
            applianceDesign: 'Guide only (Planning provided)',
            preferredBrand: '',
            planningApproval: '',
            information: '',
        };
    }

    return {
        contour: 'Full Contour',
        information: '',
    };
}

export function parseMultiOptionValues(raw: string | undefined): string[] {
    if (raw === undefined || raw.trim() === '') {
        return [];
    }

    try {
        const parsed: unknown = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter((value) => value !== '');
    } catch {
        return [];
    }
}

export function serializeMultiOptionValues(values: string[]): string {
    return JSON.stringify(values);
}

export function implantCrownRequiredFieldsComplete(config: CaseConfig): boolean {
    const platformSize = String(config.platformSize ?? '').trim();
    const scanAbutmentInfo = String(config.scanAbutmentInfo ?? '').trim();
    const implantBrand = String(config.implantBrand ?? '').trim();
    const customImplantBrand = String(config.customImplantBrand ?? '').trim();

    if (platformSize === '' || scanAbutmentInfo === '') {
        return false;
    }

    if (implantBrand === 'Custom' && customImplantBrand === '') {
        return false;
    }

    return true;
}

export function ponticRequiredFieldsComplete(config: CaseConfig): boolean {
    return String(config.ponticDesign ?? '').trim() !== '';
}

export function diagnosticWaxupRequiredFieldsComplete(
    config: CaseConfig,
): boolean {
    const designStyle = String(config.designStyle ?? '').trim();
    const toothShape = String(config.toothShape ?? '').trim();
    const marginDesign = String(config.marginDesign ?? '').trim();
    const information = String(config.information ?? '').trim();
    const needed = parseMultiOptionValues(config.needed);

    return (
        designStyle !== '' &&
        toothShape !== '' &&
        marginDesign !== '' &&
        needed.length > 0 &&
        information !== ''
    );
}

export const PLANNING_PLUS_GUIDE = 'Planning + Guide';

export function guidedSurgicalGuideRequiredFieldsComplete(
    config: CaseConfig,
): boolean {
    const applianceDesign = String(config.applianceDesign ?? '').trim();

    if (applianceDesign === '') {
        return false;
    }

    if (applianceDesign !== PLANNING_PLUS_GUIDE) {
        return true;
    }

    const preferredBrand = String(config.preferredBrand ?? '').trim();
    const planningApproval = String(config.planningApproval ?? '').trim();

    return preferredBrand !== '' && planningApproval !== '';
}

function crownRetainerFallbackConfig(materialName: string): CaseConfig {
    if (materialName === 'PFM' || materialName === '') {
        return { information: '' };
    }

    if (materialName === 'PMMA') {
        return {
            contour: 'Shell Temp',
            information: '',
        };
    }

    if (
        materialName === 'Zirconia' ||
        materialName === 'Lithium Disilicate'
    ) {
        return {
            contour: 'Full Contour',
            information: '',
        };
    }

    return { information: '' };
}

export function materialsForProduct(
    catalog: CaseCreateCatalog,
    productKey: string,
): MaterialOption[] {
    const byProduct = catalog.materialsByProduct?.[productKey];

    if (byProduct) {
        return byProduct;
    }

    const groupTitle = getProductGroupTitle(catalog, productKey);

    return groupTitle ? (catalog.materialsByGroup[groupTitle] ?? []) : [];
}

/**
 * Teeth included in a bridge span between two abutments.
 * Same arch → inclusive anatomical range; cross-arch → endpoints only.
 */
export function bridgeSpanTeeth(from: number, to: number): number[] {
    const range = teethRangeBetween(from, to);

    if (range && range.length > 0) {
        return range;
    }

    return from === to ? [from] : [from, to];
}

/**
 * Pick bridge abutments from a multi-tooth selection.
 * Prefers the outermost teeth on the same arch.
 */
export function bridgeEndpoints(
    teeth: number[],
): { from: number; to: number } | null {
    if (teeth.length < 2) {
        return null;
    }

    for (const sequence of [
        UPPER_TEETH as readonly number[],
        LOWER_TEETH as readonly number[],
    ]) {
        const onArch = teeth
            .filter((tooth) => sequence.includes(tooth))
            .sort(
                (left, right) =>
                    sequence.indexOf(left) - sequence.indexOf(right),
            );

        if (onArch.length >= 2) {
            return {
                from: onArch[0],
                to: onArch[onArch.length - 1],
            };
        }
    }

    return {
        from: teeth[0],
        to: teeth[1],
    };
}

/**
 * Split a bridge span into connected tooth groups using unbroken edges.
 * Broken mid-links (e.g. 4–5) produce separate groups (1–4 and 5–8).
 */
export function connectedBridgeGroups(
    spanTeeth: number[],
    brokenEdges: ReadonlySet<string>,
): number[][] {
    if (spanTeeth.length === 0) {
        return [];
    }

    if (spanTeeth.length === 1) {
        return [[spanTeeth[0]]];
    }

    const selected = new Set(spanTeeth);
    const ordered: number[] = [];

    for (const sequence of [
        UPPER_TEETH as readonly number[],
        LOWER_TEETH as readonly number[],
    ]) {
        for (const tooth of sequence) {
            if (selected.has(tooth)) {
                ordered.push(tooth);
            }
        }
    }

    // Cross-arch or unordered leftovers keep original order
    spanTeeth.forEach((tooth) => {
        if (!ordered.includes(tooth)) {
            ordered.push(tooth);
        }
    });

    const groups: number[][] = [];
    let current: number[] = [ordered[0]];

    for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index];
        const right = ordered[index + 1];
        const adjacentOnArch = [
            UPPER_TEETH as readonly number[],
            LOWER_TEETH as readonly number[],
        ].some((sequence) => {
            const leftIndex = sequence.indexOf(left);
            const rightIndex = sequence.indexOf(right);

            return (
                leftIndex !== -1 &&
                rightIndex !== -1 &&
                Math.abs(leftIndex - rightIndex) === 1
            );
        });

        const linked =
            adjacentOnArch &&
            !brokenEdges.has(connectorEdgeKey(left, right)) &&
            !brokenEdges.has(connectorEdgeKey(right, left));

        if (linked) {
            current.push(right);
        } else {
            groups.push(current);
            current = [right];
        }
    }

    groups.push(current);

    const multiToothGroups = groups.filter((group) => group.length >= 2);

    if (multiToothGroups.length > 0) {
        return multiToothGroups;
    }

    const hasArchAdjacentPair = ordered.some((tooth, index) => {
        if (index === ordered.length - 1) {
            return false;
        }

        const next = ordered[index + 1];

        return [
            UPPER_TEETH as readonly number[],
            LOWER_TEETH as readonly number[],
        ].some((sequence) => {
            const leftIndex = sequence.indexOf(tooth);
            const rightIndex = sequence.indexOf(next);

            return (
                leftIndex !== -1 &&
                rightIndex !== -1 &&
                Math.abs(leftIndex - rightIndex) === 1
            );
        });
    });

    // Cross-arch span (no anatomical adjacency): keep one group of the endpoints.
    if (!hasArchAdjacentPair && ordered.length >= 2) {
        return [ordered];
    }

    return [];
}

export function isCaseSetupComplete(draft: {
    patientName: string;
    dueDate: string;
}): boolean {
    return draft.patientName.trim() !== '' && draft.dueDate.trim() !== '';
}

export function getProductGroupTitle(
    catalog: CaseCreateCatalog,
    productKey: string,
): string | null {
    const group = catalog.productGroups.find((entry) =>
        entry.productKeys.includes(productKey),
    );

    return group?.title ?? null;
}

export function itemQuantity(
    product: ProductDefinition,
    teeth: number[],
): number {
    return product.quantity === 'one' ? 1 : Math.max(teeth.length, 1);
}

export function money(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
    }).format(Number(amount || 0));
}

/**
 * Resolve admin default package price. Shade and item.config never affect price.
 *
 * Key: product + material + service (+ output when service is Manufacture).
 * Mirrors PackagePriceResolver::resolveMinor() — keep the two in sync. The
 * server already de-duplicates `catalog.packagePrices` per key, so the first
 * match is the authoritative one.
 */
export function resolvePackagePrice(
    catalog: CaseCreateCatalog,
    productKey: string,
    materialId: number | null | undefined,
    draft: Pick<CaseDraft, 'service' | 'output'>,
): number {
    const rows = catalog.packagePrices ?? [];
    const service = draft.service;
    const output =
        service === 'manufacture' ? draft.output || 'appliance' : null;
    const material = materialId ?? null;

    const match = (
        row: (typeof rows)[number],
        materialFilter: number | null,
    ): boolean =>
        row.productKey === productKey &&
        (row.materialId ?? null) === materialFilter &&
        row.service === service &&
        (row.output ?? null) === output;

    const exact = rows.find((row) => match(row, material));

    if (exact) {
        return exact.price;
    }

    if (material !== null) {
        const fallback = rows.find((row) => match(row, null));

        if (fallback) {
            return fallback.price;
        }
    }

    return 0;
}

export function effectiveUnitPrice(
    item: PrescriptionItem,
    catalog: CaseCreateCatalog,
    draft: Pick<CaseDraft, 'service' | 'output'>,
): number {
    if (item.priceOverridden) {
        return item.unitPrice;
    }

    return resolvePackagePrice(
        catalog,
        item.productKey,
        item.materialId,
        draft,
    );
}

/**
 * Package totals only — not additive service fees.
 * Tooth-kind items covered by a bridge line are skipped to avoid double billing.
 */
export function calculateTotals(
    draft: CaseDraft,
    catalog: CaseCreateCatalog,
): PriceTotals {
    const bridgeTeeth = new Set<number>();

    draft.items.forEach((item) => {
        if (item.kind === 'bridge') {
            item.teeth.forEach((tooth) => bridgeTeeth.add(tooth));
        }
    });

    const packageTotal = draft.items.reduce((sum, item) => {
        if (
            item.kind !== 'bridge' &&
            item.teeth.length > 0 &&
            item.teeth.every((tooth) => bridgeTeeth.has(tooth))
        ) {
            return sum;
        }

        const unit = effectiveUnitPrice(item, catalog, draft);

        return sum + unit * item.quantity;
    }, 0);

    return {
        packageTotal,
        total: packageTotal,
    };
}

export function selectedTeethText(
    workingTeeth: number[],
    selectedArch: string,
): string {
    if (selectedArch) {
        return selectedArch;
    }

    if (!workingTeeth.length) {
        return 'None';
    }

    return formatPalmerTeeth(workingTeeth);
}

export function archForTooth(tooth: number): {
    teeth: number[];
    arch: string;
} {
    const upper = (UPPER_TEETH as readonly number[]).includes(tooth);

    return {
        teeth: [...(upper ? UPPER_TEETH : LOWER_TEETH)],
        arch: upper ? 'Upper Arch' : 'Lower Arch',
    };
}

/**
 * Returns every tooth between `from` and `to` (inclusive), walking the arch
 * in anatomical order, when both teeth sit on the same arch. Returns null
 * when the teeth are on different arches (no continuous range exists).
 */
export function teethRangeBetween(
    from: number,
    to: number,
): number[] | null {
    const sequence = (UPPER_TEETH as readonly number[]).includes(from)
        ? (UPPER_TEETH as readonly number[])
        : (LOWER_TEETH as readonly number[]);

    if (!sequence.includes(to)) {
        return null;
    }

    const fromIndex = sequence.indexOf(from);
    const toIndex = sequence.indexOf(to);
    const [start, end] =
        fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];

    return sequence.slice(start, end + 1);
}

export function makeItemId(): string {
    return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneItem(item: PrescriptionItem): PrescriptionItem {
    return {
        ...item,
        teeth: [...item.teeth],
        config: { ...item.config },
    };
}

function isChartTooth(tooth: number): boolean {
    return (
        (UPPER_TEETH as readonly number[]).includes(tooth) ||
        (LOWER_TEETH as readonly number[]).includes(tooth)
    );
}

/**
 * Shift+click range: every tooth from `anchor` to `target` (inclusive) along
 * one arch in anatomical order. Without a valid same-arch anchor the range is
 * just the clicked tooth — never a surprising cross-arch jump.
 */
export function shiftRangeTeeth(
    anchor: number | null | undefined,
    target: number,
): number[] {
    if (
        anchor === null ||
        anchor === undefined ||
        anchor === target ||
        !isChartTooth(anchor) ||
        !isChartTooth(target)
    ) {
        return [target];
    }

    return teethRangeBetween(anchor, target) ?? [target];
}

/**
 * Can this prescription be copied onto another single tooth with Ctrl/Cmd or
 * Shift + click? Only per-tooth products qualify: bridges, whole-arch and
 * partial-denture items are tied to a span / arch and make no sense as a
 * one-click copy.
 */
export function isReplicableItem(
    item: PrescriptionItem,
    product: ProductDefinition | undefined,
): boolean {
    return (
        product !== undefined &&
        product.mode === 'teeth' &&
        (item.kind ?? 'tooth') === 'tooth' &&
        !item.arch &&
        item.teeth.length > 0
    );
}

export type ReplicateOptions = {
    /** Current case default shade — used unless the template's shade was customised. */
    defaultShade: string;
    /** Package price resolver — used unless the template's price was overridden. */
    resolvePrice: (item: PrescriptionItem) => number;
    makeId?: () => string;
};

export type ReplicateResult = {
    created: PrescriptionItem[];
    /** Teeth left untouched: same product already prescribed, or part of a bridge. */
    skipped: number[];
};

/**
 * Copy `template` (product, material, options, shade, price override) onto each
 * of `teeth` as its own single-tooth prescription line.
 *
 * Pure and idempotent: the set of new teeth is
 *   unique(teeth) ∖ {teeth already carrying this product} ∖ {bridge-covered teeth}
 * so repeating the same gesture can never double-prescribe or double-bill.
 */
export function replicateItemOntoTeeth(
    template: PrescriptionItem,
    teeth: readonly number[],
    existingItems: PrescriptionItem[],
    options: ReplicateOptions,
): ReplicateResult {
    const makeId = options.makeId ?? makeItemId;
    const bridgeCovered = teethCoveredByExistingBridges(existingItems);
    const occupied = new Set<number>();

    existingItems.forEach((item) => {
        if (
            (item.kind ?? 'tooth') === 'tooth' &&
            item.productKey === template.productKey
        ) {
            item.teeth.forEach((tooth) => occupied.add(tooth));
        }
    });

    const priceOverridden = template.priceOverridden ?? false;
    const shadeOverridden = template.shadeOverridden ?? false;
    const created: PrescriptionItem[] = [];
    const skipped: number[] = [];

    for (const tooth of new Set(teeth)) {
        if (!isChartTooth(tooth)) {
            continue;
        }

        if (occupied.has(tooth) || bridgeCovered.has(tooth)) {
            skipped.push(tooth);

            continue;
        }

        occupied.add(tooth);
        created.push({
            id: makeId(),
            kind: 'tooth',
            productKey: template.productKey,
            teeth: [tooth],
            arch: '',
            quantity: 1,
            unitPrice: priceOverridden
                ? template.unitPrice
                : options.resolvePrice(template),
            priceOverridden,
            material: template.material,
            materialId: template.materialId ?? null,
            shade: shadeOverridden ? template.shade : options.defaultShade,
            shadeOverridden,
            config: { ...template.config },
        });
    }

    return { created, skipped };
}

export function currentDateText(): string {
    return new Date().toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function serviceLabel(service: CaseDraft['service']): string {
    if (service === 'design') {
        return 'Design Only';
    }

    if (service === 'approve') {
        return 'Design & Approve';
    }

    return 'Design, Approve & Manufacture';
}

export function configTags(item: PrescriptionItem): string[] {
    const values: string[] = [];

    if (item.kind === 'bridge') {
        const from = item.bridgeFrom ?? item.teeth[0];
        const to = item.bridgeTo ?? item.teeth[item.teeth.length - 1];
        values.push(`Bridge ${formatPalmerSpan(from, to)}`);
    }

    if (item.shade && item.kind !== 'bridge') {
        values.push(`Shade ${item.shade}`);
    }

    if (item.material && item.kind !== 'bridge') {
        values.push(item.material);
    }

    const toothFeatureTags = formatToothFeaturesSummary(
        parseToothFeatures(item.config.toothFeatures),
    );
    toothFeatureTags.forEach((tag) => {
        if (!values.includes(tag)) {
            values.push(tag);
        }
    });

    Object.entries(item.config).forEach(([key, value]) => {
        if (key === 'toothFeatures') {
            return;
        }

        if (
            typeof value === 'string' &&
            value.trim() &&
            !values.includes(value) &&
            value.length < 70
        ) {
            values.push(value);
        }
    });

    return values.slice(0, 8);
}

/**
 * Abutments of a bridge. Given the case's lines, they are the span teeth that
 * carry a crown / implant crown prescription — so a crown inside the span is
 * never mislabelled as a pontic. Without the lines (or for a legacy bridge that
 * has no retainer line) it falls back to the span ends.
 */
export function bridgeAbutmentTeeth(
    item: PrescriptionItem,
    allItems?: ReadonlyArray<PrescriptionItem>,
): number[] {
    if (item.kind !== 'bridge') {
        return [];
    }

    const from = item.bridgeFrom ?? item.teeth[0];
    const to = item.bridgeTo ?? item.teeth[item.teeth.length - 1];
    const ends = item.teeth.filter((tooth) => tooth === from || tooth === to);

    if (!allItems) {
        return ends;
    }

    const retainerTeeth = new Set<number>();

    allItems.forEach((entry) => {
        if (
            (entry.kind ?? 'tooth') === 'tooth' &&
            BRIDGE_RETAINER_PRODUCT_KEYS.has(entry.productKey)
        ) {
            entry.teeth.forEach((tooth) => retainerTeeth.add(tooth));
        }
    });

    const abutments = item.teeth.filter((tooth) => retainerTeeth.has(tooth));

    return abutments.length > 0 ? abutments : ends;
}

/**
 * Teeth inside a bridge span that are not abutments (pontics, plus any
 * auto-filled gap teeth). Pontics are connection-only — no individual
 * product/material Rx on the bridge line.
 */
export function bridgePonticTeeth(
    item: PrescriptionItem,
    allItems?: ReadonlyArray<PrescriptionItem>,
): number[] {
    const abutments = new Set(bridgeAbutmentTeeth(item, allItems));

    return item.teeth.filter(
        (tooth) => item.kind === 'bridge' && !abutments.has(tooth),
    );
}

export function prescriptionItemTitle(
    item: PrescriptionItem,
    productLabel?: string,
): string {
    if (item.kind === 'bridge') {
        const from = item.bridgeFrom ?? item.teeth[0];
        const to = item.bridgeTo ?? item.teeth[item.teeth.length - 1];

        return `Bridge ${formatPalmerSpan(from, to)}`;
    }

    return productLabel ?? item.productKey;
}

export function prescriptionItemDetail(
    item: PrescriptionItem,
    productLabel?: string,
    allItems?: ReadonlyArray<PrescriptionItem>,
): string {
    const parts: string[] = [];

    if (item.kind === 'bridge') {
        const abutments = bridgeAbutmentTeeth(item, allItems);
        const pontics = bridgePonticTeeth(item, allItems);

        parts.push(`Abutments ${formatPalmerTeeth(abutments)}`);

        if (pontics.length > 0) {
            parts.push(
                `Pontics ${formatPalmerTeeth(pontics)} (connection only)`,
            );
        }
    } else if (item.arch) {
        parts.push(item.arch);
    } else {
        parts.push(`Teeth: ${formatPalmerTeeth(item.teeth)}`);
    }

    parts.push(`Qty ${item.quantity}`);

    if (item.kind !== 'bridge' && item.material) {
        parts.push(item.material);
    }

    if (item.kind === 'bridge' && productLabel) {
        parts.push(productLabel);
    }

    const featureSummary = formatToothFeaturesSummary(
        parseToothFeatures(item.config.toothFeatures),
    );

    if (featureSummary.length > 0) {
        parts.push(featureSummary.join('; '));
    }

    return parts.join(' · ');
}

export function generateReference(
    draft: CaseDraft,
    catalog: CaseCreateCatalog,
): string {
    const firstItem = draft.items.find((item) => {
        const product = catalog.products[item.productKey];

        return product && product.flow !== 'marker';
    });
    const prefix = firstItem
        ? (catalog.referencePrefixes[firstItem.productKey] ?? 'SC')
        : 'SC';
    const key = `sbRefCounter_${prefix}`;
    let counter = Number.parseInt(localStorage.getItem(key) || '0', 10) + 1;

    if (counter > 300) {
        counter = 1;
    }

    localStorage.setItem(key, String(counter));

    return `${prefix}${counter}`;
}

/** Dark text on light product fills (e.g. adjacent yellow); white on saturated fills. */
export function contrastingToothText(fill: string): string {
    const hex = fill.replace('#', '');

    if (hex.length !== 6) {
        return '#111111';
    }

    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

    return luminance > 0.55 ? '#111111' : '#ffffff';
}
