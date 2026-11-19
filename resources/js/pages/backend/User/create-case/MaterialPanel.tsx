import { cn } from '@/lib/utils';

import MaterialSwatch from './MaterialSwatch';
import type { MaterialOption } from './types';

type MaterialPanelProps = {
    materials: MaterialOption[];
    selectedMaterial: string;
    productLabel: string;
    onSelectMaterial: (name: string) => void;
};

export default function MaterialPanel({
    materials,
    selectedMaterial,
    productLabel,
    onSelectMaterial,
}: MaterialPanelProps) {
    return (
        <>
            <div className="screen-help">
                Choose a material for <strong>{productLabel}</strong>. Product options appear
                on the right.
            </div>
            <div className="material-grid">
                {materials.length === 0 ? (
                    <div style={{ padding: 20, color: '#999', fontSize: 13 }}>
                        No material selection required for this product type.
                    </div>
                ) : (
                    materials.map((material, index) => (
                        <button
                            key={material.name}
                            type="button"
                            className={cn(
                                'material-card',
                                selectedMaterial === material.name && 'selected',
                            )}
                            onClick={() => onSelectMaterial(material.name)}
                        >
                            <MaterialSwatch
                                colors={material.colors}
                                index={index}
                                variant="card"
                            />
                            <span className="material-name">{material.name}</span>
                        </button>
                    ))
                )}
            </div>
        </>
    );
}
