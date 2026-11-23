import { Head, router, usePage } from '@inertiajs/react';
import {
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import AdminLayout from '@/layouts/admin-layout';
import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import {
    index as adminCasesIndex,
    update as adminUpdate,
} from '@/routes/admin/cases';
import { store, update } from '@/routes/cases';
import type { SharedData } from '@/types';

import {
    buildPrescriptionPdfBlob,
    buildPrescriptionPdfFile,
    prescriptionFileCode,
} from './buildPrescriptionPdf';
import CataloguePanel from './CataloguePanel';
import {
    bridgeSpanTeeth,
    connectedBridgeGroups,
    createEmptyDraft,
    defaultConfig,
    findBridgeAutoJoin,
    findManualBridgeJoinFromEdge,
    findManualBridgeJoinFromTeeth,
    formatPalmerSpan,
    formatPalmerTooth,
    generateReference,
    ALL_ON_X_ASSISTANCE_EMAIL,
    bridgeGroupQualifies,
    bridgeMembersQualify,
    diagnosticWaxupRequiredFieldsComplete,
    guidedSurgicalGuideRequiredFieldsComplete,
    implantCrownRequiredFieldsComplete,
    isBridgeMemberProduct,
    isBridgeRetainerProduct,
    isReplicableItem,
    listManualBridgeJoinEdges,
    parseToothFeatures,
    ponticRequiredFieldsComplete,
    isCaseSetupComplete,
    itemQuantity,
    makeItemId,
    materialsForProduct,
    replicateItemOntoTeeth,
    resolvePackagePrice,
    selectedTeethText as formatSelectedTeethText,
    shiftRangeTeeth,
    teethRangeBetween,
    toothFeaturesHaveAny,
} from './helpers';
import { IconBack } from './icons';
import MaterialPanel from './MaterialPanel';
import OptionsPanel from './OptionsPanel';
import PrescriptionPanel from './PrescriptionPanel';
import ProjectPanel from './ProjectPanel';
import ReviewCheckoutModal, { type ReviewModalMode } from './ReviewCheckoutModal';
import ToothChart from './ToothChart';
import type {
    AssignedClient,
    CaseConfig,
    CaseCreateCatalog,
    CaseDraft,
    CaseOutput,
    CaseScreen,
    CaseService,
    ImpressionType,
    PrescriptionItem,
} from './types';

type Props = {
    caseReference: string;
    catalog: CaseCreateCatalog;
    client?: AssignedClient | null;
    clients?: AssignedClient[];
    draftCase?: CaseDraft | null;
    adminMode?: boolean;
};

function firstError(errors: Record<string, string | string[]>): string {
    const value = Object.values(errors)[0];

    if (Array.isArray(value)) {
        return value[0] ?? 'Unable to save this case.';
    }

    return value ?? 'Unable to save this case.';
}

export default function CreateCasePage({
    caseReference,
    catalog,
    client,
    clients = [],
    draftCase,
    adminMode = false,
}: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const defaultClient = client ?? clients[0] ?? null;
    const clientName = defaultClient?.name ?? auth.user?.name ?? 'Client';

    const [draft, setDraft] = useState<CaseDraft>(() => {
        if (draftCase) {
            return {
                ...draftCase,
                clientId: draftCase.clientId ?? defaultClient?.id ?? null,
                client: draftCase.client || clientName,
                fileSlots:
                    draftCase.fileSlots && draftCase.fileSlots.length > 0
                        ? draftCase.fileSlots
                        : createEmptyDraft().fileSlots,
            };
        }

        return createEmptyDraft(clientName, 'A2', defaultClient?.id ?? null);
    });
    const [screen, setScreen] = useState<CaseScreen>('project');
    const [workingTeeth, setWorkingTeeth] = useState<number[]>([]);
    const [selectedArch, setSelectedArch] = useState('');
    const [multiSelect, setMultiSelect] = useState(false);
    const [activeProductKey, setActiveProductKey] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [workingConfig, setWorkingConfig] = useState<CaseConfig>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [currentTooth, setCurrentTooth] = useState<number | undefined>();
    const [autoFilledTeeth, setAutoFilledTeeth] = useState<number[]>([]);
    const [modal, setModal] = useState<ReviewModalMode>('none');
    const [toast, setToast] = useState<string | null>(null);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [lastAbutmentItem, setLastAbutmentItem] =
        useState<PrescriptionItem | null>(null);
    const [bridgeMode, setBridgeMode] = useState(false);
    const [bridgeFrom, setBridgeFrom] = useState<number | null>(null);
    const [bridgeTo, setBridgeTo] = useState<number | null>(null);
    const [brokenEdges, setBrokenEdges] = useState<string[]>([]);
    const [bridgeSourceItem, setBridgeSourceItem] =
        useState<PrescriptionItem | null>(null);
    const [saving, setSaving] = useState(false);
    // Last single-tooth prescription — Ctrl/Cmd/Shift + click copies it.
    const [replicaTemplate, setReplicaTemplate] =
        useState<PrescriptionItem | null>(null);
    // Last tooth the dentist clicked/prescribed — start of a Shift+click range.
    const rangeAnchorRef = useRef<number | null>(null);
    // What Ctrl/Cmd/Shift + click copies: the line saved this session, else the
    // case's last copyable line (so a loaded / reloaded case works immediately).
    const copySource = useMemo(
        () =>
            replicaTemplate ??
            [...draft.items]
                .reverse()
                .find((entry) =>
                    isReplicableItem(entry, catalog.products[entry.productKey]),
                ) ??
            null,
        [catalog.products, draft.items, replicaTemplate],
    );

    const repriceDraftItems = useCallback(
        (next: CaseDraft): CaseDraft => ({
            ...next,
            items: next.items.map((item) => {
                if (item.priceOverridden) {
                    return item;
                }

                return {
                    ...item,
                    unitPrice: resolvePackagePrice(
                        catalog,
                        item.productKey,
                        item.materialId,
                        next,
                    ),
                };
            }),
        }),
        [catalog],
    );

    const toggleLeftPanel = useCallback(() => {
        setLeftPanelOpen((previous) => !previous);
    }, []);

    const toggleRightPanel = useCallback(() => {
        setRightPanelOpen((previous) => !previous);
    }, []);

    const showProjectCatalogue =
        screen === 'project' &&
        (workingTeeth.length > 0 || Boolean(selectedArch));
    const leftPanelLabel =
        showProjectCatalogue || screen !== 'project'
            ? 'Products'
            : 'Case details';
    const rightPanelLabel = bridgeMode
        ? 'Bridge'
        : screen === 'material'
          ? 'Options'
          : 'Prescription';

    const materials = useMemo(() => {
        if (!activeProductKey) {
            return [];
        }

        return materialsForProduct(catalog, activeProductKey);
    }, [activeProductKey, catalog]);

    const resetWorking = useCallback(() => {
        setWorkingTeeth([]);
        setSelectedArch('');
        setActiveProductKey(null);
        setSelectedMaterial('');
        setWorkingConfig({});
        setEditingItemId(null);
        setCurrentTooth(undefined);
        setAutoFilledTeeth([]);
        setBridgeMode(false);
        setBridgeFrom(null);
        setBridgeTo(null);
        setBrokenEdges([]);
        setBridgeSourceItem(null);
    }, []);

    const cancelBridgeAdjust = useCallback(() => {
        setBridgeMode(false);
        setBridgeFrom(null);
        setBridgeTo(null);
        setBrokenEdges([]);
        setWorkingTeeth([]);
        setAutoFilledTeeth([]);
        setCurrentTooth(undefined);
        setBridgeSourceItem(null);
        setScreen('project');
    }, []);

    const showToast = useCallback((message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(null), 2800);
    }, []);

    useEffect(() => {
        if (draftCase) {
            setDraft({
                ...draftCase,
                fileSlots:
                    draftCase.fileSlots && draftCase.fileSlots.length > 0
                        ? draftCase.fileSlots
                        : createEmptyDraft().fileSlots,
            });
        }
    }, [draftCase]);

    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success);
        }
    }, [flash?.success, showToast]);

    const persistCase = useCallback(
        (intent: 'draft' | 'submit') => {
            void (async () => {
            if (!draft.clientId) {
                showToast('Select a dental client.');

                return;
            }

            if (!draft.patientName.trim()) {
                showToast('Patient name is required.');

                return;
            }

            const form = new FormData();
            const reference =
                draft.reference ||
                (intent === 'submit' ? generateReference(draft, catalog) : '');

            form.append('intent', intent);
            form.append('client_id', String(draft.clientId));
            form.append('patient_name', draft.patientName);
            form.append('due_date', draft.dueDate);
            form.append('notes', draft.description);
            form.append('reference', reference);
            form.append('shade', draft.shade);
            form.append('impression_type', draft.impressionType);
            form.append('service', draft.service);
            form.append('output', draft.output);
            form.append('lock_version', String(draft.lockVersion ?? 1));
            form.append(
                'items',
                JSON.stringify(
                    draft.items.map((item) => ({
                        id: item.id,
                        product_key: item.productKey,
                        teeth: item.teeth,
                        arch: item.arch,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        price_overridden: item.priceOverridden ?? false,
                        material: item.material,
                        material_id: item.materialId ?? null,
                        shade: item.shade,
                        shade_overridden: item.shadeOverridden ?? false,
                        config: item.config,
                        kind: item.kind ?? 'tooth',
                        bridge_from: item.bridgeFrom ?? null,
                        bridge_to: item.bridgeTo ?? null,
                        broken_edges: item.brokenEdges ?? [],
                    })),
                ),
            );

            const prescriptionCode = prescriptionFileCode();
            const keepIds = Object.values(draft.uploads)
                .flat()
                .map((file) => file.id)
                .filter((id): id is number => typeof id === 'number');

            // Drop previous prescription PDFs from keep list when regenerating.
            const keepWithoutPrescription = keepIds.filter((id) => {
                const entry = Object.entries(draft.uploads).find(([, files]) =>
                    files.some((file) => file.id === id),
                );

                return entry?.[0] !== prescriptionCode;
            });

            form.append(
                'keep_file_ids',
                JSON.stringify(keepWithoutPrescription),
            );

            form.append(
                'file_slots',
                JSON.stringify(
                    (draft.fileSlots ?? []).map((slot, index) => ({
                        code: slot.code,
                        label: slot.label,
                        sort_order: index,
                    })),
                ),
            );

            Object.entries(draft.uploads).forEach(([code, files]) => {
                if (code === prescriptionCode) {
                    return;
                }

                files.forEach((entry) => {
                    if (entry.file instanceof File) {
                        form.append(`files[${code}][]`, entry.file);
                    }
                });
            });

            if (draft.items.length > 0) {
                try {
                    const pdf = await buildPrescriptionPdfFile(
                        draft,
                        catalog,
                        reference || caseReference,
                    );
                    form.append(`files[${prescriptionCode}][]`, pdf);
                } catch {
                    showToast(
                        'Could not generate prescription PDF. Case was not saved.',
                    );

                    return;
                }
            }

            setSaving(true);

            const visit = {
                forceFormData: true,
                preserveScroll: true,
                onError: (errors: Record<string, string | string[]>) => {
                    showToast(firstError(errors));
                },
                onFinish: () => setSaving(false),
            };

            if (draft.databaseId) {
                form.append('_method', 'put');
                router.post(
                    adminMode
                        ? adminUpdate.url(draft.databaseId)
                        : update.url(draft.databaseId),
                    form,
                    visit,
                );
            } else {
                router.post(store.url(), form, visit);
            }
            })();
        },
        [adminMode, caseReference, catalog, draft, showToast],
    );

    const startBridgeAdjust = useCallback(
        (
            sourceItem: PrescriptionItem,
            fromTooth: number,
            toTooth: number,
        ) => {
            const span = bridgeSpanTeeth(fromTooth, toTooth);
            const between = span.filter(
                (tooth) => tooth !== fromTooth && tooth !== toTooth,
            );

            setBridgeMode(true);
            setBridgeFrom(fromTooth);
            setBridgeTo(toTooth);
            setWorkingTeeth(span);
            setAutoFilledTeeth(between);
            setCurrentTooth(toTooth);
            setBrokenEdges([]);
            setBridgeSourceItem(sourceItem);
            setActiveProductKey(null);
            setSelectedMaterial('');
            setWorkingConfig({});
            setEditingItemId(null);
            setSelectedArch('');
            setScreen('project');
            setRightPanelOpen(true);
            showToast(
                `Adjust bridge lines from ${formatPalmerTooth(fromTooth)} to ${formatPalmerTooth(toTooth)}. Click green dots to break or restore links (cantilever OK with one retainer), then Save bridge.`,
            );
        },
        [showToast],
    );

    /**
     * Ctrl/Cmd/Shift + click: copy the last single-tooth prescription onto
     * `targets` as separate lines (same product, material, options, shade).
     */
    const replicateOnto = useCallback(
        (targets: number[]) => {
            if (!copySource) {
                return;
            }

            const { created, skipped } = replicateItemOntoTeeth(
                copySource,
                targets,
                draft.items,
                {
                    defaultShade: draft.shade,
                    resolvePrice: (entry) =>
                        resolvePackagePrice(
                            catalog,
                            entry.productKey,
                            entry.materialId,
                            draft,
                        ),
                },
            );
            const label =
                catalog.products[copySource.productKey]?.label ??
                'Prescription';

            if (created.length === 0) {
                showToast(
                    skipped.length > 0
                        ? `${label} is already prescribed on ${
                              skipped.length === 1 ? 'that tooth' : 'those teeth'
                          }.`
                        : 'Nothing to copy.',
                );

                return;
            }

            const nextItems = [...draft.items, ...created];
            const lastCreated = created[created.length - 1];

            setDraft((previous) => ({
                ...previous,
                items: nextItems,
                status: previous.id ? previous.status : 'Unsaved Changes',
            }));
            setLastAbutmentItem(
                isBridgeMemberProduct(lastCreated.productKey)
                    ? lastCreated
                    : null,
            );

            const copied =
                created.length === 1
                    ? `tooth ${formatPalmerTooth(created[0].teeth[0])}`
                    : `${created.length} teeth`;

            showToast(
                `Copied ${label} to ${copied}${
                    skipped.length > 0
                        ? ` (${skipped.length} already prescribed, skipped)`
                        : ''
                }.`,
            );

            // Same bridge rule as a normal save: retainer + pontic only.
            const autoJoin = findBridgeAutoJoin(nextItems);

            if (autoJoin) {
                startBridgeAdjust(
                    autoJoin.sourceItem,
                    autoJoin.fromTooth,
                    autoJoin.toTooth,
                );
            }
        },
        [catalog, copySource, draft, showToast, startBridgeAdjust],
    );

    const handleToothClick = useCallback(
        (tooth: number, event: MouseEvent<SVGGElement>) => {
            if (!isCaseSetupComplete(draft)) {
                showToast('Enter patient name and due date first.');

                return;
            }

            if (bridgeMode) {
                return;
            }

            const additive = event.ctrlKey || event.metaKey;
            const range = event.shiftKey;
            const anchor = rangeAnchorRef.current;

            rangeAnchorRef.current = tooth;

            if (range) {
                // Shift-click must not start a browser text selection.
                window.getSelection()?.removeAllRanges();
            }

            // Copy-last gesture: only while idle on the chart, so Ctrl/Shift
            // still extends a selection the dentist is in the middle of.
            if (
                (additive || range) &&
                copySource &&
                screen === 'project' &&
                workingTeeth.length === 0 &&
                !selectedArch
            ) {
                replicateOnto(range ? shiftRangeTeeth(anchor, tooth) : [tooth]);

                return;
            }

            // Ctrl/Cmd toggles one tooth; Shift adds the whole range from the
            // last clicked tooth; Multi-select ON toggles like Ctrl.
            const accumulate = multiSelect || additive || range;
            const nextSelection = (previous: number[]): number[] => {
                if (range) {
                    return [
                        ...new Set([
                            ...previous,
                            ...shiftRangeTeeth(anchor, tooth),
                        ]),
                    ].sort((a, b) => a - b);
                }

                return previous.includes(tooth)
                    ? previous.filter((entry) => entry !== tooth)
                    : [...previous, tooth].sort((a, b) => a - b);
            };

            if (screen === 'project') {
                // Arch-first multi: stay on project while accumulating.
                if (accumulate) {
                    setWorkingTeeth(nextSelection);
                    setSelectedArch('');
                    setCurrentTooth(tooth);
                    setAutoFilledTeeth([]);
                    setLeftPanelOpen(true);
                    setRightPanelOpen(true);

                    return;
                }

                setWorkingTeeth([tooth]);
                setSelectedArch('');
                setCurrentTooth(tooth);
                setAutoFilledTeeth([]);
                setLeftPanelOpen(true);
                setRightPanelOpen(true);
                setScreen('catalog');

                return;
            }

            if (accumulate) {
                setWorkingTeeth(nextSelection);
                setSelectedArch('');
                setCurrentTooth(tooth);
                setAutoFilledTeeth([]);

                return;
            }

            setWorkingTeeth([tooth]);
            setSelectedArch('');
            setCurrentTooth(tooth);
            setAutoFilledTeeth([]);
        },
        [
            bridgeMode,
            draft,
            copySource,
            multiSelect,
            replicateOnto,
            screen,
            selectedArch,
            showToast,
            workingTeeth.length,
        ],
    );

    const handleManualBridgeEdgeClick = useCallback(
        (left: number, right: number) => {
            const join = findManualBridgeJoinFromEdge(draft.items, left, right);

            if (!join) {
                showToast(
                    'Cannot join these teeth. Prescribe crown/retainer and pontic first, or Cancel.',
                );

                return;
            }

            startBridgeAdjust(join.sourceItem, join.fromTooth, join.toTooth);
        },
        [draft.items, showToast, startBridgeAdjust],
    );

    const handleJoinSelectionAsBridge = useCallback(() => {
        const join = findManualBridgeJoinFromTeeth(draft.items, workingTeeth);

        if (!join) {
            showToast(
                'Select at least two adjacent crown/retainer/pontic teeth that are not already in a bridge.',
            );

            return;
        }

        startBridgeAdjust(join.sourceItem, join.fromTooth, join.toTooth);
    }, [draft.items, showToast, startBridgeAdjust, workingTeeth]);

    const manualBridgeEdges = useMemo(
        () =>
            !bridgeMode && screen === 'project'
                ? listManualBridgeJoinEdges(draft.items)
                : [],
        [bridgeMode, draft.items, screen],
    );

    const canJoinSelectionAsBridge = useMemo(() => {
        if (bridgeMode || workingTeeth.length < 2) {
            return false;
        }

        return findManualBridgeJoinFromTeeth(draft.items, workingTeeth) !== null;
    }, [bridgeMode, draft.items, workingTeeth]);

    const confirmBridgeGroups = useCallback(() => {
        if (
            !bridgeMode ||
            bridgeFrom === null ||
            bridgeTo === null ||
            !bridgeSourceItem
        ) {
            return;
        }

        const source = bridgeSourceItem;
        const connectedGroups = connectedBridgeGroups(
            workingTeeth,
            new Set(brokenEdges),
        );

        if (connectedGroups.length === 0) {
            showToast(
                'No connected bridge groups. Link teeth with green dots, or Cancel.',
            );

            return;
        }

        // Bridge rule: a group is only a bridge if it contains a retainer AND
        // an explicitly prescribed pontic. Others stay as separate teeth.
        const groups = connectedGroups.filter((group) =>
            bridgeGroupQualifies(draft.items, group),
        );

        if (groups.length === 0) {
            showToast(
                'A bridge needs at least one crown/retainer and one pontic. Link them with green dots, or Cancel.',
            );

            return;
        }

        const groupShade = source.shade || draft.shade;
        const spanTeeth = new Set(groups.flat());
        const newItems: PrescriptionItem[] = groups.map((group) => {
            const materialId = source.materialId ?? null;
            const unitPrice = resolvePackagePrice(
                catalog,
                source.productKey,
                materialId,
                draft,
            );

            return {
                id: makeItemId(),
                kind: 'bridge' as const,
                productKey: source.productKey,
                teeth: [...group],
                arch: '',
                quantity: group.length,
                unitPrice: source.priceOverridden
                    ? source.unitPrice
                    : unitPrice || source.unitPrice,
                priceOverridden: source.priceOverridden ?? false,
                material: source.material,
                materialId,
                shade: groupShade,
                shadeOverridden: false,
                config: { ...source.config },
                bridgeFrom: group[0],
                bridgeTo: group[group.length - 1],
                brokenEdges: brokenEdges.filter((key) => {
                    const [leftText, rightText] = key.split('-');
                    const left = Number(leftText);
                    const right = Number(rightText);

                    return group.includes(left) && group.includes(right);
                }),
            };
        });

        setDraft((previous) => {
            const baseItems = editingItemId
                ? previous.items.filter((entry) => entry.id !== editingItemId)
                : previous.items;

            // Bridge group: first abutment shade applies to span teeth that
            // were not individually customized; per-item shade stays editable.
            const syncedItems = baseItems.map((item) => {
                if (item.kind === 'bridge' || item.shadeOverridden) {
                    return item;
                }

                if (
                    item.teeth.length > 0 &&
                    item.teeth.every((tooth) => spanTeeth.has(tooth))
                ) {
                    return {
                        ...item,
                        shade: groupShade,
                        shadeOverridden: false,
                    };
                }

                return item;
            });

            return {
                ...previous,
                items: [...syncedItems, ...newItems],
                status: previous.id ? previous.status : 'Unsaved Changes',
            };
        });

        setLastAbutmentItem(null);
        resetWorking();
        setScreen('project');
        showToast(
            groups.length === 1
                ? `Bridge ${formatPalmerSpan(groups[0][0], groups[0][groups[0].length - 1])} saved.`
                : `${groups.length} bridge groups saved to prescription.`,
        );
    }, [
        bridgeFrom,
        bridgeMode,
        bridgeSourceItem,
        bridgeTo,
        brokenEdges,
        catalog,
        draft,
        editingItemId,
        resetWorking,
        showToast,
        workingTeeth,
    ]);

    const openFilesModal = useCallback(
        (items: PrescriptionItem[]) => {
            if (!isCaseSetupComplete(draft)) {
                showToast('Enter patient name and due date first.');

                return;
            }

            if (items.length === 0) {
                showToast('Add prescription items first.');

                return;
            }

            if (draft.impressionType === 'Traditional Impression') {
                setModal('courier');

                return;
            }

            setModal('files');
        },
        [draft, showToast],
    );

    const commitPrescriptionItem = useCallback(
        (after: 'continue' | 'complete') => {
            if (!activeProductKey) {
                return;
            }

            const product = catalog.products[activeProductKey];

            if (!product) {
                return;
            }

            const productMaterials = materialsForProduct(
                catalog,
                activeProductKey,
            );

            if (activeProductKey === 'allOnX') {
                showToast(
                    `Email Johan for assistance: ${ALL_ON_X_ASSISTANCE_EMAIL}`,
                );

                return;
            }

            if (productMaterials.length > 0 && !selectedMaterial) {
                showToast('Select a material.');

                return;
            }

            if (workingTeeth.length === 0) {
                showToast('Select at least one tooth.');

                return;
            }

            if (
                activeProductKey === 'implantCrown' &&
                !implantCrownRequiredFieldsComplete(workingConfig)
            ) {
                showToast(
                    'Platform size and scan abutment information are required. Custom implant brand is required when Custom is selected.',
                );

                return;
            }

            if (
                activeProductKey === 'pontic' &&
                !ponticRequiredFieldsComplete(workingConfig)
            ) {
                showToast('Select a pontic design.');

                return;
            }

            if (
                activeProductKey === 'diagnosticWaxup' &&
                !diagnosticWaxupRequiredFieldsComplete(workingConfig)
            ) {
                showToast(
                    'Select design style, tooth shape, margin design, at least one Needed item, and additional information.',
                );

                return;
            }

            if (
                (activeProductKey === 'partialGuide' ||
                    activeProductKey === 'fullGuide') &&
                !guidedSurgicalGuideRequiredFieldsComplete(workingConfig)
            ) {
                showToast(
                    'Select appliance design. For Planning + Guide, enter preferred brand and choose an approval option.',
                );

                return;
            }

            if (
                (activeProductKey === 'castPartial' ||
                    activeProductKey === 'acrylicPartial') &&
                !toothFeaturesHaveAny(
                    parseToothFeatures(workingConfig.toothFeatures),
                )
            ) {
                showToast(
                    'Assign clasp and/or rests on at least one selected tooth.',
                );

                return;
            }

            const materialId =
                productMaterials.find(
                    (entry) => entry.name === selectedMaterial,
                )?.id ?? null;
            const existing = editingItemId
                ? draft.items.find((entry) => entry.id === editingItemId)
                : undefined;
            const packagePrice = resolvePackagePrice(
                catalog,
                activeProductKey,
                materialId,
                draft,
            );
            const item: PrescriptionItem = {
                id: editingItemId ?? makeItemId(),
                kind: 'tooth',
                productKey: activeProductKey,
                teeth: [...workingTeeth],
                arch: selectedArch,
                quantity: itemQuantity(product, workingTeeth),
                unitPrice: existing?.priceOverridden
                    ? existing.unitPrice
                    : packagePrice,
                priceOverridden: existing?.priceOverridden ?? false,
                material: selectedMaterial,
                materialId,
                shade: draft.shade,
                shadeOverridden: existing?.shadeOverridden ?? false,
                config: { ...workingConfig },
            };

            const nextItems = editingItemId
                ? draft.items.map((entry) =>
                      entry.id === editingItemId ? item : entry,
                  )
                : [...draft.items, item];

            setDraft((previous) => ({
                ...previous,
                items: nextItems,
                status: previous.id ? previous.status : 'Unsaved Changes',
            }));

            // The line just saved becomes what Ctrl/Cmd/Shift + click copies
            // (or nothing, when it is an arch / partial item that can't be).
            setReplicaTemplate(
                isReplicableItem(item, product) ? item : null,
            );
            rangeAnchorRef.current =
                workingTeeth[workingTeeth.length - 1] ?? null;

            const isSingleToothCommit =
                !editingItemId && workingTeeth.length === 1 && !selectedArch;

            if (after === 'complete') {
                if (
                    isSingleToothCommit &&
                    isBridgeMemberProduct(item.productKey)
                ) {
                    setLastAbutmentItem(item);
                } else if (isSingleToothCommit) {
                    setLastAbutmentItem(null);
                }

                resetWorking();
                setScreen('project');
                showToast('Prescription item saved.');
                openFilesModal(nextItems);

                return;
            }

            const autoJoin = findBridgeAutoJoin(nextItems);

            if (autoJoin && !editingItemId) {
                setLastAbutmentItem(item);
                resetWorking();
                startBridgeAdjust(
                    autoJoin.sourceItem,
                    autoJoin.fromTooth,
                    autoJoin.toTooth,
                );

                return;
            }

            if (isSingleToothCommit && isBridgeMemberProduct(item.productKey)) {
                const previous =
                    lastAbutmentItem &&
                    lastAbutmentItem.teeth.length === 1 &&
                    isBridgeMemberProduct(lastAbutmentItem.productKey) &&
                    lastAbutmentItem.teeth[0] !== item.teeth[0]
                        ? lastAbutmentItem
                        : null;

                // Bridge rule: the pair must be one retainer + one pontic.
                // Two crowns (or two pontics) are just separate prescriptions.
                if (previous && bridgeMembersQualify([previous, item])) {
                    const fromTooth = previous.teeth[0];
                    const toTooth = item.teeth[0];

                    if (teethRangeBetween(fromTooth, toTooth) !== null) {
                        // Bridge is configured/billed from the retainer.
                        const retainer = isBridgeRetainerProduct(
                            previous.productKey,
                        )
                            ? previous
                            : item;

                        setLastAbutmentItem(item);
                        resetWorking();
                        startBridgeAdjust(retainer, fromTooth, toTooth);

                        return;
                    }

                    setLastAbutmentItem(item);
                    resetWorking();
                    setScreen('project');
                    showToast(
                        'Bridge needs a retainer and a pontic on the same arch.',
                    );

                    return;
                }

                setLastAbutmentItem(item);
            } else if (isSingleToothCommit) {
                setLastAbutmentItem(null);
            }

            resetWorking();
            setScreen('project');
            showToast('Prescription item saved. Continue selecting on the arches.');
        },
        [
            activeProductKey,
            catalog,
            draft,
            editingItemId,
            lastAbutmentItem,
            openFilesModal,
            resetWorking,
            selectedArch,
            selectedMaterial,
            showToast,
            startBridgeAdjust,
            workingConfig,
            workingTeeth,
        ],
    );

    const chooseProduct = useCallback(
        (key: string) => {
            if (workingTeeth.length === 0 && !selectedArch) {
                showToast('Select at least one tooth first.');

                return;
            }

            const product = catalog.products[key];

            if (!product) {
                return;
            }

            setActiveProductKey(key);
            setWorkingConfig(defaultConfig(key, product, '', null));
            setSelectedMaterial('');
            setLeftPanelOpen(true);
            setRightPanelOpen(true);
            setScreen('material');
        },
        [catalog, selectedArch, showToast, workingTeeth],
    );

    const handleSelectMaterial = useCallback(
        (name: string) => {
            if (!activeProductKey) {
                setSelectedMaterial(name);

                return;
            }

            const product = catalog.products[activeProductKey];

            if (!product) {
                setSelectedMaterial(name);

                return;
            }

            const material = materialsForProduct(catalog, activeProductKey).find(
                (entry) => entry.name === name,
            );

            setSelectedMaterial(name);
            setWorkingConfig(
                defaultConfig(
                    activeProductKey,
                    product,
                    name,
                    material?.id ?? null,
                ),
            );
        },
        [activeProductKey, catalog],
    );

    const handleEditItem = useCallback(
        (id: string) => {
            const item = draft.items.find((entry) => entry.id === id);

            if (!item) {
                return;
            }

            if (item.kind === 'bridge') {
                setBridgeMode(true);
                setBridgeFrom(item.bridgeFrom ?? item.teeth[0]);
                setBridgeTo(
                    item.bridgeTo ?? item.teeth[item.teeth.length - 1],
                );
                setWorkingTeeth([...item.teeth]);
                setBrokenEdges(item.brokenEdges ?? []);
                setBridgeSourceItem(item);
                setAutoFilledTeeth(
                    item.teeth.filter(
                        (tooth) =>
                            tooth !== item.bridgeFrom &&
                            tooth !== item.bridgeTo,
                    ),
                );
                setCurrentTooth(item.teeth[0]);
                setEditingItemId(id);
                setActiveProductKey(null);
                setLeftPanelOpen(true);
                setRightPanelOpen(true);
                setScreen('project');

                return;
            }

            setEditingItemId(id);
            setActiveProductKey(item.productKey);
            setWorkingTeeth([...item.teeth]);
            setSelectedArch(item.arch);
            setSelectedMaterial(item.material);
            setWorkingConfig({ ...item.config });
            setCurrentTooth(item.teeth[0]);
            setBridgeMode(false);
            setBridgeFrom(null);
            setBridgeTo(null);
            setBrokenEdges([]);
            setAutoFilledTeeth([]);
            setDraft((previous) => ({
                ...previous,
                shade: item.shade || previous.shade,
            }));
            setLeftPanelOpen(true);
            setRightPanelOpen(true);
            setScreen('material');
        },
        [draft.items],
    );

    const handleDeleteItem = useCallback((id: string) => {
        setDraft((previous) => ({
            ...previous,
            items: previous.items.filter((entry) => entry.id !== id),
        }));
        // Never keep copying a line the dentist just removed.
        setReplicaTemplate((previous) =>
            previous?.id === id ? null : previous,
        );
    }, []);

    const leaveCreateCase = useCallback(() => {
        router.visit(adminMode ? adminCasesIndex.url() : dashboard.url());
    }, [adminMode]);

    const goBack = useCallback(() => {
        if (screen === 'material') {
            setScreen('catalog');

            return;
        }

        if (screen === 'catalog') {
            resetWorking();
            setScreen('project');

            return;
        }

        leaveCreateCase();
    }, [leaveCreateCase, resetWorking, screen]);

    const handleReview = useCallback(() => {
        if (!draft.patientName.trim()) {
            showToast('Patient name is required.');

            return;
        }

        if (!draft.dueDate) {
            showToast('Due date is required.');

            return;
        }

        if (draft.items.length === 0) {
            showToast('Add at least one prescription item.');

            return;
        }

        if (draft.impressionType === 'Traditional Impression') {
            setModal('courier');

            return;
        }

        setModal('review');
    }, [draft.dueDate, draft.impressionType, draft.items.length, draft.patientName, showToast]);

    const handleFiles = useCallback(() => {
        openFilesModal(draft.items);
    }, [draft.items, openFilesModal]);

    const handleLoadDraft = useCallback(
        (entry: CaseDraft) => {
            setDraft({
                ...entry,
                description:
                    entry.description ??
                    (entry as CaseDraft & { notes?: string }).notes ??
                    '',
            });
            resetWorking();
            setScreen('project');
            setModal('none');
            showToast(`Loaded ${entry.reference || entry.id}.`);
        },
        [resetWorking, showToast],
    );

    const handleDownloadPrescription = useCallback(() => {
        void (async () => {
            try {
                const blob = await buildPrescriptionPdfBlob(
                    draft,
                    catalog,
                    caseReference,
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${draft.reference || draft.id || 'case'}-prescription.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch {
                showToast('Could not download prescription PDF.');
            }
        })();
    }, [caseReference, catalog, draft, showToast]);

    const handleModalSubmit = useCallback(() => {
        if (modal === 'courier') {
            setModal('review');

            return;
        }

        if (modal === 'files') {
            setModal('review');

            return;
        }

        if (modal === 'review') {
            persistCase('submit');
        }
    }, [modal, persistCase]);

    const updateDraftField = useCallback(
        (field: 'patientName' | 'dueDate' | 'description', value: string) => {
            setDraft((previous) => ({ ...previous, [field]: value }));
        },
        [],
    );

    const teethLabel = formatSelectedTeethText(workingTeeth, selectedArch);
    const isConfig = screen === 'material';
    const isCatalogue = screen === 'catalog';
    const setupComplete = isCaseSetupComplete(draft);
    const productLabel = activeProductKey
        ? (catalog.products[activeProductKey]?.label ?? 'this product')
        : 'this product';
    const Layout = adminMode ? AdminLayout : PortalLayout;

    return (
        <Layout {...(adminMode ? {} : { chrome: false })}>
            <Head title={adminMode ? `Edit Case ${caseReference}` : 'New Case'} />

            <div className="create-case-app">
                    <div className="app">
                    {(isConfig || isCatalogue) && (
                        <header
                            className={cn(
                                'topbar',
                                'topbar-compact',
                                isConfig && 'config-header',
                            )}
                        >
                            <div className="header-left">
                                <button
                                    type="button"
                                    className="back-button"
                                    title="Back"
                                    onClick={goBack}
                                >
                                    <IconBack />
                                </button>
                                <div className="tooth-header">
                                    <div className="page-title">
                                        {selectedArch ||
                                            (currentTooth
                                                ? `Tooth ${currentTooth}`
                                                : 'Configuration')}
                                    </div>
                                    <div className="header-subtitle">
                                        {bridgeMode &&
                                        bridgeFrom !== null &&
                                        bridgeTo !== null
                                            ? `Bridge ${formatPalmerSpan(bridgeFrom, bridgeTo)}`
                                            : 'Configuration'}
                                    </div>
                                </div>
                            </div>
                        </header>
                    )}

                    <main
                        className={cn(
                            'workbench',
                            isConfig && 'config-layout',
                            leftPanelOpen && 'left-open',
                            rightPanelOpen && 'right-open',
                        )}
                    >
                        <aside
                            className={cn(
                                'left-panel',
                                leftPanelOpen && 'is-open',
                            )}
                        >
                            <button
                                type="button"
                                className="panel-drawer-close"
                                aria-label="Close left panel"
                                onClick={() => setLeftPanelOpen(false)}
                            >
                                ×
                            </button>
                            {screen === 'project' && !showProjectCatalogue && (
                                <ProjectPanel
                                    clients={clients}
                                    clientId={draft.clientId}
                                    patientName={draft.patientName}
                                    dueDate={draft.dueDate}
                                    description={draft.description}
                                    itemCount={draft.items.length}
                                    caseId={draft.id}
                                    onBack={leaveCreateCase}
                                    onClientChange={(selected) =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            clientId: selected?.id ?? null,
                                            client: selected?.name ?? '',
                                        }))
                                    }
                                    onChange={updateDraftField}
                                />
                            )}
                            {(showProjectCatalogue ||
                                screen === 'catalog' ||
                                screen === 'material') && (
                                <CataloguePanel
                                    catalog={catalog}
                                    activeProductKey={activeProductKey}
                                    workingTeeth={workingTeeth}
                                    selectedArch={selectedArch}
                                    onChooseProduct={chooseProduct}
                                />
                            )}
                        </aside>

                        <section className="center-panel">
                            {!leftPanelOpen && (
                                <button
                                    type="button"
                                    className="panel-edge-toggle panel-edge-toggle-left"
                                    aria-expanded={false}
                                    aria-label={`Open ${leftPanelLabel}`}
                                    onClick={toggleLeftPanel}
                                >
                                    {leftPanelLabel}
                                </button>
                            )}
                            {!rightPanelOpen && (
                                <button
                                    type="button"
                                    className="panel-edge-toggle panel-edge-toggle-right"
                                    aria-expanded={false}
                                    aria-label={`Open ${rightPanelLabel}`}
                                    onClick={toggleRightPanel}
                                >
                                    {rightPanelLabel}
                                </button>
                            )}
                            {screen === 'material' ? (
                                <MaterialPanel
                                    materials={materials}
                                    selectedMaterial={selectedMaterial}
                                    productLabel={productLabel}
                                    onSelectMaterial={handleSelectMaterial}
                                />
                            ) : (
                                <>
                                    <ToothChart
                                        catalog={catalog}
                                        items={draft.items}
                                        screen={screen}
                                        workingTeeth={workingTeeth}
                                        autoFilledTeeth={autoFilledTeeth}
                                        activeProductKey={activeProductKey}
                                        currentTooth={currentTooth}
                                        multiSelect={multiSelect}
                                        copyHint={
                                            copySource &&
                                            screen === 'project' &&
                                            !bridgeMode
                                                ? `Ctrl / Cmd + click copies "${
                                                      catalog.products[
                                                          copySource.productKey
                                                      ]?.label ??
                                                      'last prescription'
                                                  }" · Shift + click copies a range`
                                                : null
                                        }
                                        onToothClick={handleToothClick}
                                        selectionEnabled={
                                            setupComplete && !bridgeMode
                                        }
                                        showSideOptions={
                                            screen === 'project' && !bridgeMode
                                        }
                                        shade={draft.shade}
                                        impressionType={draft.impressionType}
                                        shades={catalog.shades}
                                        brokenEdges={brokenEdges}
                                        onBrokenEdgesChange={setBrokenEdges}
                                        forceConnectors={bridgeMode}
                                        bridgeFrom={bridgeFrom}
                                        bridgeTo={bridgeTo}
                                        manualBridgeEdges={manualBridgeEdges}
                                        onManualBridgeJoin={
                                            handleManualBridgeEdgeClick
                                        }
                                        onJoinSelectionAsBridge={
                                            handleJoinSelectionAsBridge
                                        }
                                        canJoinSelectionAsBridge={
                                            canJoinSelectionAsBridge
                                        }
                                        onShadeChange={(shade) =>
                                            setDraft((previous) => ({
                                                ...previous,
                                                shade,
                                            }))
                                        }
                                        onImpressionChange={(
                                            type: ImpressionType,
                                        ) =>
                                            setDraft((previous) => ({
                                                ...previous,
                                                impressionType: type,
                                            }))
                                        }
                                        onMultiSelectToggle={() =>
                                            setMultiSelect(
                                                (previous) => !previous,
                                            )
                                        }
                                    />
                                    {bridgeMode &&
                                        bridgeFrom !== null &&
                                        bridgeTo !== null && (
                                            <div className="bridge-adjust-banner">
                                                <div>
                                                    Bridge{' '}
                                                    <strong>
                                                        {formatPalmerSpan(
                                                            bridgeFrom,
                                                            bridgeTo,
                                                        )}
                                                    </strong>
                                                    . Click green mid-dots to
                                                    break or restore links
                                                    (cantilever OK with one
                                                    retainer).
                                                </div>
                                                <div className="bridge-offer-actions">
                                                    <button
                                                        type="button"
                                                        className="bridge-offer-accept"
                                                        onClick={
                                                            confirmBridgeGroups
                                                        }
                                                    >
                                                        Save bridge
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bridge-offer-dismiss"
                                                        onClick={
                                                            cancelBridgeAdjust
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </>
                            )}
                        </section>

                        <aside
                            className={cn(
                                'right-panel',
                                rightPanelOpen && 'is-open',
                            )}
                        >
                            <button
                                type="button"
                                className="panel-drawer-close"
                                aria-label="Close right panel"
                                onClick={() => setRightPanelOpen(false)}
                            >
                                ×
                            </button>
                            {bridgeMode ? (
                                <div className="bridge-side-panel">
                                    <h3>Bridge links</h3>
                                    <p>
                                        Teeth{' '}
                                        <strong>
                                            {bridgeFrom !== null &&
                                            bridgeTo !== null
                                                ? formatPalmerSpan(
                                                      bridgeFrom,
                                                      bridgeTo,
                                                  )
                                                : ''}
                                        </strong>
                                        . Use mid-dots on the chart to split
                                        groups. Save adds bridge lines without
                                        removing existing prescriptions.
                                    </p>
                                    {bridgeSourceItem && (
                                        <p className="bridge-source-copy">
                                            Options from tooth{' '}
                                            <strong>
                                                {formatPalmerTooth(
                                                    bridgeSourceItem.teeth[0],
                                                )}
                                            </strong>
                                            :{' '}
                                            {catalog.products[
                                                bridgeSourceItem.productKey
                                            ]?.label ??
                                                bridgeSourceItem.productKey}
                                            {bridgeSourceItem.material
                                                ? ` · ${bridgeSourceItem.material}`
                                                : ''}
                                        </p>
                                    )}
                                    <div className="config-actions">
                                        <button
                                            type="button"
                                            className="config-action config-clear"
                                            onClick={cancelBridgeAdjust}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="config-action config-ok"
                                            onClick={confirmBridgeGroups}
                                        >
                                            Save bridge
                                        </button>
                                    </div>
                                </div>
                            ) : screen === 'material' ? (
                                <OptionsPanel
                                    catalog={catalog}
                                    activeProductKey={activeProductKey}
                                    selectedMaterial={selectedMaterial}
                                    workingConfig={workingConfig}
                                    selectedTeethText={teethLabel}
                                    workingTeeth={workingTeeth}
                                    onSetOption={(key, value) =>
                                        setWorkingConfig((previous) => ({
                                            ...previous,
                                            [key]: value,
                                        }))
                                    }
                                    onClear={() => {
                                        if (activeProductKey) {
                                            const product =
                                                catalog.products[
                                                    activeProductKey
                                                ];

                                            if (product) {
                                                setWorkingConfig(
                                                    defaultConfig(
                                                        activeProductKey,
                                                        product,
                                                        '',
                                                        null,
                                                    ),
                                                );
                                            }
                                        }

                                        setSelectedMaterial('');
                                    }}
                                    onContinue={() =>
                                        commitPrescriptionItem('continue')
                                    }
                                    onComplete={() =>
                                        commitPrescriptionItem('complete')
                                    }
                                />
                            ) : (
                                <PrescriptionPanel
                                    catalog={catalog}
                                    draft={draft}
                                    activeScreen={screen}
                                    onEditItem={handleEditItem}
                                    onDeleteItem={handleDeleteItem}
                                    onServiceChange={(service: CaseService) =>
                                        setDraft((previous) =>
                                            repriceDraftItems({
                                                ...previous,
                                                service,
                                            }),
                                        )
                                    }
                                    onOutputChange={(output: CaseOutput) =>
                                        setDraft((previous) =>
                                            repriceDraftItems({
                                                ...previous,
                                                output,
                                            }),
                                        )
                                    }
                                    onOverridePrice={(itemId, price) =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            items: previous.items.map((item) =>
                                                item.id === itemId
                                                    ? {
                                                          ...item,
                                                          unitPrice: price,
                                                          priceOverridden: true,
                                                      }
                                                    : item,
                                            ),
                                        }))
                                    }
                                    onResetPrice={(itemId) =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            items: previous.items.map((item) => {
                                                if (item.id !== itemId) {
                                                    return item;
                                                }

                                                return {
                                                    ...item,
                                                    priceOverridden: false,
                                                    unitPrice:
                                                        resolvePackagePrice(
                                                            catalog,
                                                            item.productKey,
                                                            item.materialId,
                                                            previous,
                                                        ),
                                                };
                                            }),
                                        }))
                                    }
                                    onChangeShade={(itemId, shade) =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            items: previous.items.map((item) =>
                                                item.id === itemId
                                                    ? {
                                                          ...item,
                                                          shade,
                                                          shadeOverridden: true,
                                                      }
                                                    : item,
                                            ),
                                        }))
                                    }
                                    onApplyDefaultShade={() =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            items: previous.items.map(
                                                (item) => ({
                                                    ...item,
                                                    shade: previous.shade,
                                                    shadeOverridden: false,
                                                }),
                                            ),
                                        }))
                                    }
                                    onReview={handleReview}
                                    onSaveDraft={() => persistCase('draft')}
                                    saving={saving}
                                    onFiles={handleFiles}
                                />
                            )}
                        </aside>
                    </main>
                </div>

                {toast && <div className="create-case-toast">{toast}</div>}

                <ReviewCheckoutModal
                    mode={modal}
                    catalog={catalog}
                    draft={draft}
                    caseReference={draft.reference || caseReference}
                    savedDrafts={[]}
                    onClose={() => setModal('none')}
                    onSubmit={handleModalSubmit}
                    onUpdateUploads={(uploads) =>
                        setDraft((previous) => ({ ...previous, uploads }))
                    }
                    onUpdateFileSlots={(fileSlots) =>
                        setDraft((previous) => ({ ...previous, fileSlots }))
                    }
                    onUpdatePayment={(payment) =>
                        setDraft((previous) => ({ ...previous, payment }))
                    }
                    onLoadDraft={handleLoadDraft}
                    onDownloadPrescription={handleDownloadPrescription}
                    onOpenFilesFromReview={() =>
                        setModal(
                            draft.impressionType === 'Traditional Impression'
                                ? 'courier'
                                : 'files',
                        )
                    }
                />
            </div>
        </Layout>
    );
}
