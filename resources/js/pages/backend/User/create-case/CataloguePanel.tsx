import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import { ProductIcon } from './icons';
import { selectedTeethText } from './helpers';
import type { CaseCreateCatalog } from './types';

type CataloguePanelProps = {
    catalog: CaseCreateCatalog;
    activeProductKey: string | null;
    workingTeeth: number[];
    selectedArch: string;
    onChooseProduct: (key: string) => void;
};

export default function CataloguePanel({
    catalog,
    activeProductKey,
    workingTeeth,
    selectedArch,
    onChooseProduct,
}: CataloguePanelProps) {
    return (
        <div className="catalog">
            <div className="screen-help">
                Selected: <strong>{selectedTeethText(workingTeeth, selectedArch)}</strong>.
                On the arches, turn on <strong>Multi-select</strong> (or hold{' '}
                <strong>Shift</strong> / <strong>Ctrl/Cmd</strong>) to pick several teeth,
                then choose a product below. Gaps are allowed.
            </div>
            <div className="catalog-selected">
                Each selected tooth registers as quantity one. Bite Splint and Full Denture
                register as one item per arch.
            </div>
            {catalog.productGroups.length === 0 ? (
                <div className="screen-help">
                    No products are available yet. Add product groups and products in
                    admin before creating a case.
                </div>
            ) : (
                catalog.productGroups.map((group) => (
                <div key={group.id} className="category">
                    <div className="category-title">{group.title}</div>
                    <div className="product-grid">
                        {group.productKeys.map((key) => {
                            const product = catalog.products[key];

                            if (!product) {
                                return null;
                            }

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={cn(
                                        'product-button',
                                        activeProductKey === key && 'selected',
                                    )}
                                    style={
                                        {
                                            '--product-color': product.color,
                                        } as CSSProperties
                                    }
                                    onClick={() => onChooseProduct(key)}
                                >
                                    <ProductIcon />
                                    <span>{product.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                ))
            )}
        </div>
    );
}
