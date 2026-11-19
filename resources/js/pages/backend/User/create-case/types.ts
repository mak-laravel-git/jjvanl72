export type ProductFlow =
    | 'crown'
    | 'implant'
    | 'restorative'
    | 'denture'
    | 'biteplane'
    | 'partial'
    | 'marker';

export type ProductMode = 'teeth' | 'arch' | 'partial';

export type CatalogParameterOption = {
    label: string;
    value: string;
    color: string | null;
    imageUrl: string | null;
};

export type CatalogParameter = {
    id: number;
    name: string;
    fieldName: string;
    type: 'option' | 'multi_option' | 'input';
    materialId: number | null;
    groupId?: number | null;
    groupName?: string | null;
    groupSortOrder?: number | null;
    options: CatalogParameterOption[];
};

export type ProductDefinition = {
    key: string;
    label: string;
    color: string;
    flow: ProductFlow;
    mode: ProductMode;
    quantity: 'teeth' | 'one';
    protocol: string | null;
    price: number;
    parameters?: CatalogParameter[];
};

export type MaterialOption = {
    id?: number;
    name: string;
    colors: string[];
};

export type UploadField = {
    id: string;
    label: string;
    required: boolean;
    accept: string;
};

export type ProductGroup = {
    id: string;
    title: string;
    productKeys: string[];
};

export type CaseService = 'design' | 'approve' | 'manufacture';
export type CaseOutput = 'appliance' | 'applianceModels';

/**
 * One price per (product, material, service, output). The manufacturing method
 * is implied by the material and models by the output, so neither is a key.
 */
export type PackagePriceRow = {
    productKey: string;
    productId: number;
    materialId: number | null;
    service: CaseService;
    output: CaseOutput | null;
    price: number;
};

export type CaseCreateCatalog = {
    source?: 'database';
    productGroups: ProductGroup[];
    products: Record<string, ProductDefinition>;
    materialsByProduct?: Record<string, MaterialOption[]>;
    materialsByGroup: Record<string, MaterialOption[]>;
    protocols: Record<string, UploadField[]>;
    shades: string[];
    referencePrefixes: Record<string, string>;
    pricing: {
        approval: number;
        printPerUnit: number;
        millPerUnit: number;
        models: number;
        modelDesign: number;
        modelDesignPrint: number;
    };
    packagePrices?: PackagePriceRow[];
};
export type ImpressionType =
    | 'Traditional Impression'
    | 'Intra Oral Scan'
    | 'Bench top scan';

export type CaseScreen = 'project' | 'catalog' | 'material';

export type CaseConfig = Record<string, string>;

export type PrescriptionItemKind = 'tooth' | 'bridge';

export type PrescriptionItem = {
    id: string;
    kind?: PrescriptionItemKind;
    productKey: string;
    teeth: number[];
    arch: string;
    quantity: number;
    unitPrice: number;
    priceOverridden?: boolean;
    material: string;
    materialId?: number | null;
    shade: string;
    /** True when dentist set shade on this line; bridge sync skips these. */
    shadeOverridden?: boolean;
    config: CaseConfig;
    bridgeFrom?: number;
    bridgeTo?: number;
    brokenEdges?: string[];
};

export type UploadedFileMeta = {
    id?: number;
    name: string;
    size: number;
    type: string;
    file?: File;
};

export type CasePayment = {
    method: 'card' | 'paypal';
    name: string;
    card: string;
    expiry: string;
    cvv: string;
    paypalEmail: string;
    terms: boolean;
};

export type AssignedClient = {
    id: number;
    name: string;
    code: string;
};

export type CaseFileSlotDraft = {
    code: string;
    label: string;
};

export const DEFAULT_FILE_SLOTS: CaseFileSlotDraft[] = [
    { code: 'upperArch', label: 'Upper Arch' },
    { code: 'lowerArch', label: 'Lower Arch' },
    { code: 'biteScan', label: 'Bite Scan' },
];

export type CaseDraft = {
    id: string;
    databaseId?: number;
    client: string;
    clientId?: number | null;
    reference: string;
    patientName: string;
    dueDate: string;
    description: string;
    shade: string;
    impressionType: ImpressionType;
    service: CaseService;
    output: CaseOutput;
    items: PrescriptionItem[];
    uploads: Record<string, UploadedFileMeta[]>;
    fileSlots: CaseFileSlotDraft[];
    payment: CasePayment;
    status: string;
    lockVersion?: number;
    caseNumber?: string;
};

export type PriceTotals = {
    packageTotal: number;
    total: number;
};

export const UPPER_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
] as const;

export const LOWER_TEETH = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

/** Oval arch layout matching Tooth Chart.jpg (FDI coords; Palmer labels in UI). */
export const TOP_POSITIONS: [number, number, number, number][] = [
    [18, 72, 365, 1.18],
    [17, 78, 295, 1.14],
    [16, 92, 230, 1.12],
    [15, 112, 175, 1.04],
    [14, 140, 130, 0.96],
    // Palmer 1–3: slightly larger + tighter together so gaps match 4–8
    [13, 178, 98, 1.0],
    [12, 218, 74, 0.96],
    [11, 258, 60, 0.94],
    [21, 302, 60, 0.94],
    [22, 342, 74, 0.96],
    [23, 382, 98, 1.0],
    [24, 420, 130, 0.96],
    [25, 448, 175, 1.04],
    [26, 468, 230, 1.12],
    [27, 482, 295, 1.14],
    [28, 488, 365, 1.18],
];

export const BOTTOM_POSITIONS: [number, number, number, number][] = [
    [48, 72, 460, 1.18],
    [47, 78, 530, 1.14],
    [46, 92, 595, 1.12],
    [45, 112, 650, 1.04],
    [44, 140, 695, 0.96],
    [43, 178, 728, 1.0],
    [42, 218, 751, 0.96],
    [41, 258, 763, 0.94],
    [31, 302, 763, 0.94],
    [32, 342, 751, 0.96],
    [33, 382, 728, 1.0],
    [34, 420, 695, 0.96],
    [35, 448, 650, 1.04],
    [36, 468, 595, 1.12],
    [37, 482, 530, 1.14],
    [38, 488, 460, 1.18],
];
