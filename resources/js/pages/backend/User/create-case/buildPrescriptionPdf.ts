import { jsPDF } from 'jspdf';

import {
    calculateTotals,
    effectiveUnitPrice,
    formatPalmerTeeth,
    money,
    prescriptionItemDetail,
    prescriptionItemTitle,
    serviceLabel,
} from './helpers';
import type { CaseCreateCatalog, CaseDraft, PrescriptionItem } from './types';

const PRESCRIPTION_FILE_CODE = 'prescription';

const LAB_NAME = 'SmileBright Dental Lab';
const LAB_STUB = [
    'Unit 4, 12 Industrial Drive',
    'Sydney NSW 2000',
    'prescription@smilebright.lab',
];

const BRAND = {
    primary: '#073763',
    muted: '#64748b',
    line: '#cbd5e1',
    fill: '#f8fafc',
    text: '#0f172a',
};

export function prescriptionFileCode(): string {
    return PRESCRIPTION_FILE_CODE;
}

async function loadBrandLogoDataUrl(): Promise<string | null> {
    for (const path of ['/images/dds-logo.png']) {
        try {
            const response = await fetch(path);

            if (!response.ok) {
                continue;
            }

            const blob = await response.blob();

            if (!blob.type.startsWith('image/')) {
                continue;
            }

            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
        } catch {
            // try next logo path
        }
    }

    return null;
}

function outputLabel(draft: CaseDraft): string {
    if (draft.service !== 'manufacture') {
        return '—';
    }

    return draft.output === 'applianceModels'
        ? 'Appliance and Models'
        : 'Appliance Only';
}

function billedLineAmount(
    item: PrescriptionItem,
    bridgeTeeth: Set<number>,
    catalog: CaseCreateCatalog,
    draft: CaseDraft,
): number {
    if (
        item.kind !== 'bridge' &&
        item.teeth.length > 0 &&
        item.teeth.every((tooth) => bridgeTeeth.has(tooth))
    ) {
        return 0;
    }

    return effectiveUnitPrice(item, catalog, draft) * item.quantity;
}

export async function buildPrescriptionPdfBlob(
    draft: CaseDraft,
    catalog: CaseCreateCatalog,
    caseReference: string,
): Promise<Blob> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    const gutter = 16;
    const leftWidth = Math.round(contentWidth * 0.38);
    const rightWidth = contentWidth - leftWidth - gutter;
    const leftX = margin;
    const rightX = margin + leftWidth + gutter;
    const logoDataUrl = await loadBrandLogoDataUrl();

    let y = margin;

    const ensureSpace = (needed: number): void => {
        if (y + needed <= pageHeight - margin) {
            return;
        }

        doc.addPage();
        y = margin;
        drawPageChrome();
        y = margin + 52;
    };

    const drawPageChrome = (): void => {
        doc.setFillColor(BRAND.primary);
        doc.rect(0, 0, pageWidth, 6, 'F');
        doc.setDrawColor(BRAND.line);
        doc.setLineWidth(0.6);
        doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(BRAND.muted);
        doc.text(
            `${LAB_NAME} · ${draft.reference || caseReference}`,
            margin,
            pageHeight - 14,
        );
        doc.text(
            `Page ${doc.getCurrentPageInfo().pageNumber}`,
            pageWidth - margin,
            pageHeight - 14,
            { align: 'right' },
        );
    };

    const writeWrapped = (
        text: string,
        x: number,
        width: number,
        options?: { bold?: boolean; size?: number; color?: string; gap?: number },
    ): void => {
        const size = options?.size ?? 9;
        const gap = options?.gap ?? 3;
        doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(options?.color ?? BRAND.text);
        const lines = doc.splitTextToSize(text, width);
        ensureSpace(lines.length * (size + 3) + gap);
        doc.text(lines, x, y);
        y += lines.length * (size + 3) + gap;
    };

    const sectionTitle = (title: string, x: number, width: number): void => {
        ensureSpace(22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(BRAND.primary);
        doc.text(title.toUpperCase(), x, y);
        y += 4;
        doc.setDrawColor(BRAND.primary);
        doc.setLineWidth(1);
        doc.line(x, y, x + Math.min(width, 120), y);
        y += 12;
    };

    drawPageChrome();

    // —— Header: brand + stub ——
    // The logo is a wide wordmark: keep its aspect ratio instead of a square.
    const logoHeight = 40;
    let logoWidth = 0;

    if (logoDataUrl) {
        try {
            const { width, height } = doc.getImageProperties(logoDataUrl);
            const drawWidth = (logoHeight * width) / height;

            doc.addImage(logoDataUrl, 'PNG', leftX, y, drawWidth, logoHeight);
            logoWidth = drawWidth;
        } catch {
            // text brand fallback below
        }
    }

    const brandTextX = logoWidth > 0 ? leftX + logoWidth + 12 : leftX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(BRAND.primary);
    doc.text(LAB_NAME, brandTextX, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(BRAND.muted);
    LAB_STUB.forEach((line, index) => {
        doc.text(line, brandTextX, y + 28 + index * 10);
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(BRAND.primary);
    doc.text('PRESCRIPTION', pageWidth - margin, y + 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(BRAND.muted);
    doc.text(
        draft.reference || caseReference || '—',
        pageWidth - margin,
        y + 34,
        { align: 'right' },
    );

    y += 58;
    doc.setDrawColor(BRAND.line);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    const columnsTop = y;
    let leftY = columnsTop;
    let rightY = columnsTop;

    const writeLeft = (
        text: string,
        options?: { bold?: boolean; size?: number; color?: string; gap?: number },
    ): void => {
        const saved = y;
        y = leftY;
        writeWrapped(text, leftX, leftWidth, options);
        leftY = y;
        y = saved;
    };

    const writeRight = (
        text: string,
        options?: { bold?: boolean; size?: number; color?: string; gap?: number },
    ): void => {
        const saved = y;
        y = rightY;
        writeWrapped(text, rightX, rightWidth, options);
        rightY = y;
        y = saved;
    };

    const leftSection = (title: string): void => {
        const saved = y;
        y = leftY;
        sectionTitle(title, leftX, leftWidth);
        leftY = y;
        y = saved;
    };

    const rightSection = (title: string): void => {
        const saved = y;
        y = rightY;
        sectionTitle(title, rightX, rightWidth);
        rightY = y;
        y = saved;
    };

    // —— Left: patient + service ——
    leftSection('Case information');
    writeLeft(`Patient: ${draft.patientName || '—'}`, { bold: true, size: 10 });
    writeLeft(`Client: ${draft.client || '—'}`);
    writeLeft(`Case ID: ${draft.id || '—'}`);
    writeLeft(`Reference: ${draft.reference || caseReference || '—'}`);
    writeLeft(`Due date: ${draft.dueDate || '—'}`);
    writeLeft(`Impression: ${draft.impressionType || '—'}`);
    writeLeft(`Default shade: ${draft.shade || '—'}`);
    if (draft.description) {
        writeLeft(`Notes: ${draft.description}`, { gap: 8 });
    } else {
        leftY += 6;
    }

    leftSection('Service');
    writeLeft(`Service: ${serviceLabel(draft.service)}`, { bold: true });
    writeLeft(`Output: ${outputLabel(draft)}`, { gap: 8 });

    // —— Right: causes / prices ——
    rightSection('Causes & prices');

    const bridgeTeeth = new Set<number>();
    draft.items.forEach((item) => {
        if (item.kind === 'bridge') {
            item.teeth.forEach((tooth) => bridgeTeeth.add(tooth));
        }
    });

    if (draft.items.length === 0) {
        writeRight('No prescription items.', { color: BRAND.muted });
    } else {
        draft.items.forEach((item, index) => {
            const product = catalog.products[item.productKey];
            const unit = effectiveUnitPrice(item, catalog, draft);
            const lineTotal = billedLineAmount(
                item,
                bridgeTeeth,
                catalog,
                draft,
            );
            const included =
                item.kind !== 'bridge' &&
                item.teeth.length > 0 &&
                item.teeth.every((tooth) => bridgeTeeth.has(tooth));

            ensureSpace(56);
            // sync page break for both columns when right overflows mid-item
            if (rightY > pageHeight - margin - 56) {
                doc.addPage();
                drawPageChrome();
                leftY = margin + 52;
                rightY = margin + 52;
                y = rightY;
                rightSection('Causes & prices (continued)');
            }

            const title = `${index + 1}. ${prescriptionItemTitle(item, product?.label)}`;
            writeRight(title, { bold: true, size: 10, gap: 2 });
            writeRight(
                `Teeth: ${item.teeth.length > 0 ? formatPalmerTeeth(item.teeth) : item.arch || '—'}`,
                { size: 8, color: BRAND.muted, gap: 2 },
            );
            writeRight(
                `Cause: ${product?.label ?? item.productKey}`,
                { size: 8, gap: 2 },
            );
            writeRight(
                `Material: ${item.material || '—'} · Shade: ${item.shade || draft.shade || '—'}`,
                { size: 8, gap: 2 },
            );
            writeRight(prescriptionItemDetail(item, product?.label, draft.items), {
                size: 8,
                color: BRAND.muted,
                gap: 2,
            });

            if (included) {
                writeRight('Price: included in bridge', {
                    size: 9,
                    color: BRAND.muted,
                    gap: 8,
                });
            } else {
                writeRight(
                    `Qty ${item.quantity} × ${money(unit)}${item.priceOverridden ? ' (override)' : ''} = ${money(lineTotal)}`,
                    { bold: true, size: 9, gap: 8 },
                );
            }
        });
    }

    // —— Bottom total ——
    y = Math.max(leftY, rightY) + 10;
    ensureSpace(48);
    doc.setDrawColor(BRAND.line);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFillColor(BRAND.fill);
    doc.roundedRect(margin, y - 4, contentWidth, 36, 4, 4, 'F');

    const totals = calculateTotals(draft, catalog);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(BRAND.text);
    doc.text('Total', margin + 12, y + 18);
    doc.setFontSize(14);
    doc.setTextColor(BRAND.primary);
    doc.text(money(totals.total), pageWidth - margin - 12, y + 18, {
        align: 'right',
    });

    return doc.output('blob');
}

export async function buildPrescriptionPdfFile(
    draft: CaseDraft,
    catalog: CaseCreateCatalog,
    caseReference: string,
): Promise<File> {
    const blob = await buildPrescriptionPdfBlob(draft, catalog, caseReference);
    const name = `${draft.reference || caseReference || draft.id || 'case'}-prescription.pdf`;

    return new File([blob], name, { type: 'application/pdf' });
}
