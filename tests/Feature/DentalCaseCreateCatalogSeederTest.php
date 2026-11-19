<?php

use App\Enums\ParameterType;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\DentalProductUploadRequirement;
use App\Models\DentalUploadRequirement;
use App\Support\CaseCreateCatalog;
use Database\Seeders\DentalCaseCreateCatalogSeeder;
use Database\Seeders\DentalCaseCreateParameterSeeder;
use Database\Seeders\DentalUploadRequirementSeeder;

it('seeds case-create product groups, products, and materials from the static catalog', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);

    expect(DentalProductGroup::query()->count())->toBe(6)
        ->and(DentalProduct::query()->count())->toBe(18)
        ->and(DentalMaterial::query()->count())->toBe(20);

    $crown = DentalProduct::query()->where('code', 'crown')->first();
    $implantCrown = DentalProduct::query()->where('code', 'implantCrown')->firstOrFail();

    expect($crown)->not->toBeNull()
        ->and($crown->group?->code)->toBe('crown-bridge')
        ->and($crown->materials()->where('name', 'Zirconia')->exists())->toBeTrue()
        ->and($crown->materials()->wherePivot('is_default', true)->value('name'))->toBe('PFM')
        ->and($implantCrown->materials()->pluck('name')->sort()->values()->all())->toBe(['PMMA', 'Zirconia'])
        ->and($implantCrown->materials()->wherePivot('is_default', true)->value('name'))->toBe('Zirconia');
});

it('is idempotent when re-run', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalCaseCreateCatalogSeeder::class);

    expect(DentalProductGroup::query()->count())->toBe(6)
        ->and(DentalProduct::query()->count())->toBe(18)
        ->and(DentalMaterial::query()->count())->toBe(20);
});

it('attaches protocol-aware upload requirements after products exist', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalUploadRequirementSeeder::class);

    $crown = DentalProduct::query()->where('code', 'crown')->firstOrFail();
    $adjacent = DentalProduct::query()->where('code', 'adjacent')->firstOrFail();
    $fullDenture = DentalProduct::query()->where('code', 'fullDenture')->firstOrFail();

    expect(DentalUploadRequirement::query()->count())->toBeGreaterThan(0)
        ->and(DentalProductUploadRequirement::query()->where('product_id', $crown->id)->count())->toBeGreaterThan(0)
        ->and(DentalProductUploadRequirement::query()->where('product_id', $adjacent->id)->count())->toBe(0)
        ->and(DentalProductUploadRequirement::query()->where('product_id', $fullDenture->id)->count())->toBeGreaterThan(0);
});

it('seeds HTML flow parameters onto products', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalCaseCreateParameterSeeder::class);

    $crown = DentalProduct::query()->where('code', 'crown')->firstOrFail();
    $fullDenture = DentalProduct::query()->where('code', 'fullDenture')->firstOrFail();
    $adjacent = DentalProduct::query()->where('code', 'adjacent')->firstOrFail();
    $pontic = DentalProduct::query()->where('code', 'pontic')->firstOrFail();
    $allOnX = DentalProduct::query()->where('code', 'allOnX')->firstOrFail();

    $zirconia = $crown->materials()->where('name', 'Zirconia')->firstOrFail();
    $lithium = $crown->materials()->where('name', 'Lithium Disilicate')->firstOrFail();
    $pmma = $crown->materials()->where('name', 'PMMA')->firstOrFail();
    $pfm = $crown->materials()->where('name', 'PFM')->firstOrFail();

    $zirconiaContour = $crown->parameters()
        ->where('field_name', 'contour')
        ->where('material_id', $zirconia->id)
        ->firstOrFail();
    $lithiumContour = $crown->parameters()
        ->where('field_name', 'contour')
        ->where('material_id', $lithium->id)
        ->firstOrFail();
    $pmmaContour = $crown->parameters()
        ->where('field_name', 'contour')
        ->where('material_id', $pmma->id)
        ->firstOrFail();

    expect($crown->parameters()->where('field_name', 'restorationRole')->exists())->toBeFalse()
        ->and($crown->parameters()->where('material_id', $pfm->id)->exists())->toBeFalse()
        ->and($crown->parameters()->count())->toBe(3)
        ->and($zirconiaContour->options()->pluck('value')->all())->toBe([
            'Full Contour',
            'Buccal Cutback',
            'Full Cutback',
        ])
        ->and($lithiumContour->options()->pluck('value')->all())->toBe([
            'Full Contour',
            'Buccal Cutback',
            'Full Cutback',
        ])
        ->and($pmmaContour->options()->pluck('value')->all())->toBe([
            'Shell Temp',
            'Per Prep',
        ])
        ->and($pontic->parameters()->pluck('field_name')->all())->toBe(['ponticDesign'])
        ->and($pontic->parameters()->where('field_name', 'ponticDesign')->whereNull('material_id')->exists())->toBeTrue()
        ->and($pontic->parameters()->where('field_name', 'restorationRole')->exists())->toBeFalse()
        ->and($pontic->parameters()->where('field_name', 'contour')->exists())->toBeFalse()
        ->and($pontic->parameters()->where('field_name', 'cervical')->exists())->toBeFalse()
        ->and($pontic->parameters()->where('field_name', 'implantBrand')->exists())->toBeFalse()
        ->and(
            $pontic->parameters()
                ->where('field_name', 'ponticDesign')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Saddle',
            'Modified Ridge Lap',
            'Spheroidal',
            'Ridge Lap',
            'Conical',
            'Ovate',
        ])
        ->and(
            $pontic->parameters()
                ->where('field_name', 'ponticDesign')
                ->firstOrFail()
                ->options()
                ->firstOrFail()
                ->image
        )->toBe('images/pontic_images/pontic_image_1.PNG')
        ->and($allOnX->parameters()->count())->toBe(0)
        ->and($allOnX->materials()->count())->toBe(0)
        ->and($fullDenture->parameters()->where('field_name', 'finishing')->exists())->toBeFalse()
        ->and($fullDenture->parameters()->where('field_name', 'toothLibrary')->exists())->toBeFalse()
        ->and($fullDenture->parameters()->where('field_name', 'midline')->exists())->toBeFalse()
        ->and($fullDenture->parameters()->where('field_name', 'designMarkers')->exists())->toBeTrue()
        ->and(
            $fullDenture->parameters()
                ->where('field_name', 'toothShape')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Ovoid/Oval',
            'Square',
            'Triangular',
            'Face Appropriate',
            'Age Appropriate Wear',
        ])
        ->and(
            $fullDenture->parameters()
                ->where('field_name', 'toothShape')
                ->firstOrFail()
                ->options()
                ->where('value', 'Ovoid/Oval')
                ->value('image')
        )->toBe('images/full_denture/ovid-or-oval.png')
        ->and(
            $fullDenture->parameters()
                ->where('field_name', 'gingiva')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Soft Gingiva',
            'Medium Gingiva',
            'Heavy Gingiva',
        ])
        ->and(
            $fullDenture->parameters()
                ->where('field_name', 'gingiva')
                ->firstOrFail()
                ->options()
                ->where('value', 'Heavy Gingiva')
                ->value('image')
        )->toBe('images/full_denture/heavy-gum.png')
        ->and(
            $fullDenture->parameters()
                ->where('field_name', 'designMarkers')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Follow Natural Markers',
            'Follow Biteblock Markers',
            'Use Photographs or Face Scan',
        ])
        ->and($fullDenture->materials()->pluck('name')->sort()->values()->all())->toBe([
            'Acrylic over CrCo Frame',
            'High Impact Printed',
            'Milled Acrylic/PMMA',
        ])
        ->and($adjacent->parameters()->count())->toBe(0);

    $biteplane = DentalProduct::query()->where('code', 'biteplane')->firstOrFail();

    expect($biteplane->materials()->pluck('name')->sort()->values()->all())->toBe([
        'Milled Acrylic/PMMA',
        'Thermoplastic Printed',
    ])
        ->and(
            $biteplane->parameters()
                ->where('field_name', 'contactDepth')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            '0 mm',
            '0.1 mm',
            '0.2 mm',
            '0.3 mm',
        ]);

    $castPartial = DentalProduct::query()->where('code', 'castPartial')->firstOrFail();
    $acrylicPartial = DentalProduct::query()->where('code', 'acrylicPartial')->firstOrFail();

    expect($castPartial->materials()->pluck('name')->sort()->values()->all())->toBe([
        'CrCo Frame',
        'Titanium Frame',
    ])
        ->and($castPartial->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'clasp',
            'framework',
            'rests',
        ])
        ->and($castPartial->parameters()->where('field_name', 'support')->exists())->toBeFalse()
        ->and($castPartial->parameters()->where('field_name', 'claspMaterial')->exists())->toBeFalse()
        ->and(
            $castPartial->parameters()
                ->where('field_name', 'framework')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Horseshoe',
            'Open Palate',
            'Scandinavian',
            'Palatal Strap',
            'Lingual Bar',
            'Lingual Plate',
            'Custom Design',
        ])
        ->and(
            $castPartial->parameters()
                ->where('field_name', 'clasp')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Akers Clasp',
            'RPI Clasp',
            'Ring Clasp',
            'Embrasure Clasp',
            'Wrought Wire Clasp',
            'Covered Retention for Future Addition',
        ])
        ->and(
            $castPartial->parameters()
                ->where('field_name', 'rests')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Mesial Occlusal Rest',
            'Distal Occlusal Rest',
            'Lingual/Palatal Rest',
        ])
        ->and($acrylicPartial->materials()->pluck('name')->sort()->values()->all())->toBe([
            'Acrylic/PMMA',
        ])
        ->and($acrylicPartial->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'clasp',
        ])
        ->and($acrylicPartial->parameters()->where('field_name', 'partialType')->exists())->toBeFalse()
        ->and($acrylicPartial->parameters()->where('field_name', 'framework')->exists())->toBeFalse()
        ->and($acrylicPartial->parameters()->where('field_name', 'claspMaterial')->exists())->toBeFalse()
        ->and($acrylicPartial->parameters()->where('field_name', 'support')->exists())->toBeFalse()
        ->and(
            $acrylicPartial->parameters()
                ->where('field_name', 'clasp')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Wrought Wire Clasp',
            'Ball Clasp',
            'Roach (J/Y) Clasp',
        ]);

    $diagnosticWaxup = DentalProduct::query()->where('code', 'diagnosticWaxup')->firstOrFail();
    $simpleGuide = DentalProduct::query()->where('code', 'simpleGuide')->firstOrFail();

    expect($diagnosticWaxup->materials()->count())->toBe(0)
        ->and($diagnosticWaxup->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'designStyle',
            'marginDesign',
            'needed',
            'toothShape',
        ])
        ->and($diagnosticWaxup->parameters()->where('field_name', 'designStyle')->firstOrFail()->type)->toBe(ParameterType::Option)
        ->and($diagnosticWaxup->parameters()->where('field_name', 'needed')->firstOrFail()->type)->toBe(ParameterType::MultiOption)
        ->and(
            $diagnosticWaxup->parameters()
                ->where('field_name', 'designStyle')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Central Overlap',
            'Straight',
            'Shorter Laterals',
            'Twisted Laterals',
        ])
        ->and(
            $diagnosticWaxup->parameters()
                ->where('field_name', 'designStyle')
                ->firstOrFail()
                ->options()
                ->where('value', 'Central Overlap')
                ->value('image')
        )->toBe('images/full_denture/centerl-overlap.png')
        ->and(
            $diagnosticWaxup->parameters()
                ->where('field_name', 'toothShape')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Square',
            'Ovoid/Oval',
            'Triangular',
        ])
        ->and(
            $diagnosticWaxup->parameters()
                ->where('field_name', 'marginDesign')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Follow existing margin',
            'Idealize margin',
        ])
        ->and(
            $diagnosticWaxup->parameters()
                ->where('field_name', 'needed')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Pre-Opp Model',
            'Printed Diagnostic Model',
            'Rubber Stent',
            'Essix style stent',
            'Prep guide',
            'Margin Adaptation guide',
        ])
        ->and($simpleGuide->materials()->pluck('name')->sort()->values()->all())->toBe([
            'Clear Milled PMMA',
            'Printed Clear',
        ])
        ->and($simpleGuide->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'boneReductionIndication',
            'occlusalSlot',
        ])
        ->and(
            $simpleGuide->parameters()
                ->where('field_name', 'occlusalSlot')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe(['No', 'Yes'])
        ->and(
            $simpleGuide->parameters()
                ->where('field_name', 'boneReductionIndication')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe(['No', 'Yes']);

    $partialGuide = DentalProduct::query()->where('code', 'partialGuide')->firstOrFail();
    $fullGuide = DentalProduct::query()->where('code', 'fullGuide')->firstOrFail();

    expect($partialGuide->materials()->pluck('name')->sort()->values()->all())->toBe([
        'Clear Milled PMMA',
        'Printed Clear',
    ])
        ->and($partialGuide->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'applianceDesign',
            'planningApproval',
            'preferredBrand',
        ])
        ->and(
            $partialGuide->parameters()
                ->where('field_name', 'applianceDesign')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Guide only (Planning provided)',
            'Planning + Guide',
        ])
        ->and($partialGuide->parameters()->where('field_name', 'preferredBrand')->firstOrFail()->type)->toBe(ParameterType::Input)
        ->and(
            $partialGuide->parameters()
                ->where('field_name', 'planningApproval')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Send for approval',
            'Continue without approval',
        ])
        ->and($fullGuide->materials()->pluck('name')->sort()->values()->all())->toBe([
            'Clear Milled PMMA',
            'Printed Clear',
        ])
        ->and($fullGuide->parameters()->pluck('field_name')->sort()->values()->all())->toBe([
            'applianceDesign',
            'planningApproval',
            'preferredBrand',
        ])
        ->and(
            $fullGuide->parameters()
                ->where('field_name', 'applianceDesign')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Guide only (Planning provided)',
            'Planning + Guide',
        ]);

    $implantCrown = DentalProduct::query()->where('code', 'implantCrown')->firstOrFail();
    $implantFields = $implantCrown->parameters()->pluck('field_name')->sort()->values()->all();

    expect($implantFields)->toBe([
        'abutmentType',
        'contour',
        'customImplantBrand',
        'implantBrand',
        'platformSize',
        'scanAbutmentInfo',
        'tiBaseType',
    ])
        ->and($implantCrown->parameters()->where('field_name', 'restorationRole')->exists())->toBeFalse()
        ->and($implantCrown->parameters()->where('field_name', 'crownType')->exists())->toBeFalse()
        ->and($implantCrown->parameters()->where('field_name', 'retention')->exists())->toBeFalse()
        ->and($implantCrown->parameters()->where('field_name', 'cervical')->exists())->toBeFalse()
        ->and($implantCrown->parameters()->where('field_name', 'abutmentMaterial')->exists())->toBeFalse()
        ->and(
            $implantCrown->parameters()
                ->where('field_name', 'abutmentType')
                ->firstOrFail()
                ->options()
                ->pluck('value')
                ->all()
        )->toBe([
            'Ti-Base',
            'Custom Abutment – Cement Retained',
            'Custom Abutment – Screw Retained',
        ]);
});

it('keeps parameter seeding idempotent', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalCaseCreateParameterSeeder::class);

    $crownCount = DentalProduct::query()->where('code', 'crown')->firstOrFail()->parameters()->count();

    $this->seed(DentalCaseCreateParameterSeeder::class);

    expect(DentalProduct::query()->where('code', 'crown')->firstOrFail()->parameters()->count())
        ->toBe($crownCount)
        ->and($crownCount)->toBe(3);
});

it('exposes seeded parameters through the portal catalog with static flow metadata', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalCaseCreateParameterSeeder::class);

    $catalog = CaseCreateCatalog::forPortal();
    $crown = DentalProduct::query()->where('code', 'crown')->firstOrFail();
    $zirconiaId = $crown->materials()->where('name', 'Zirconia')->value('dental_materials.id');
    $pmmaId = $crown->materials()->where('name', 'PMMA')->value('dental_materials.id');

    $crownParameters = collect($catalog['products']['crown']['parameters']);

    expect($catalog['source'])->toBe('database')
        ->and($catalog['products']['crown']['flow'])->toBe('crown')
        ->and($catalog['products']['implantCrown']['flow'])->toBe('implant')
        ->and($catalog['products']['fullDenture']['flow'])->toBe('denture')
        ->and($catalog['products']['crown']['parameters'])->not->toBeEmpty()
        ->and($crownParameters->pluck('fieldName')->unique()->values()->all())->toBe(['contour'])
        ->and($crownParameters->pluck('materialId')->all())->not->toContain(null)
        ->and(
            $crownParameters
                ->firstWhere('materialId', $zirconiaId)['options']
        )->toHaveCount(3)
        ->and(
            collect($crownParameters->firstWhere('materialId', $pmmaId)['options'])
                ->pluck('value')
                ->all()
        )->toBe(['Shell Temp', 'Per Prep']);

    $implantParameters = collect($catalog['products']['implantCrown']['parameters']);
    $ponticParameters = collect($catalog['products']['pontic']['parameters']);

    expect($catalog['materialsByProduct']['implantCrown'] ?? null)->not->toBeNull()
        ->and(collect($catalog['materialsByProduct']['implantCrown'])->pluck('name')->sort()->values()->all())
        ->toBe(['PMMA', 'Zirconia'])
        ->and($implantParameters->pluck('fieldName')->sort()->values()->all())->toBe([
            'abutmentType',
            'contour',
            'customImplantBrand',
            'implantBrand',
            'platformSize',
            'scanAbutmentInfo',
            'tiBaseType',
        ])
        ->and($ponticParameters->pluck('fieldName')->all())->toBe(['ponticDesign'])
        ->and($ponticParameters->first()['materialId'])->toBeNull()
        ->and(collect($ponticParameters->first()['options'])->pluck('value')->all())->toBe([
            'Saddle',
            'Modified Ridge Lap',
            'Spheroidal',
            'Ridge Lap',
            'Conical',
            'Ovate',
        ])
        ->and($ponticParameters->first()['options'][0]['imageUrl'])->toContain('pontic_images')
        ->and($catalog['materialsByProduct']['allOnX'] ?? null)->toBe([])
        ->and($catalog['products']['allOnX']['parameters'])->toBe([])
        ->and(collect($catalog['materialsByProduct']['fullDenture'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Acrylic over CrCo Frame',
            'High Impact Printed',
            'Milled Acrylic/PMMA',
        ])
        ->and(collect($catalog['materialsByProduct']['biteplane'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Milled Acrylic/PMMA',
            'Thermoplastic Printed',
        ])
        ->and(collect($catalog['materialsByProduct']['fullDenture'] ?? [])->pluck('name')->all())
        ->not->toContain('Thermoplastic Printed')
        ->and(
            collect(
                collect($catalog['products']['biteplane']['parameters'])
                    ->firstWhere('fieldName', 'contactDepth')['options']
            )->pluck('value')->all()
        )->toBe([
            '0 mm',
            '0.1 mm',
            '0.2 mm',
            '0.3 mm',
        ])
        ->and(collect($catalog['materialsByProduct']['castPartial'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'CrCo Frame',
            'Titanium Frame',
        ])
        ->and(collect($catalog['products']['castPartial']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'clasp',
            'framework',
            'rests',
        ])
        ->and(
            collect(
                collect($catalog['products']['castPartial']['parameters'])
                    ->firstWhere('fieldName', 'framework')['options']
            )->pluck('value')->all()
        )->toContain('Horseshoe', 'Open Palate', 'Scandinavian')
        ->and(
            collect(
                collect($catalog['products']['castPartial']['parameters'])
                    ->firstWhere('fieldName', 'framework')['options']
            )->pluck('value')->all()
        )->not->toContain('Standard Framework')
        ->and(
            collect(
                collect($catalog['products']['castPartial']['parameters'])
                    ->firstWhere('fieldName', 'clasp')['options']
            )->pluck('value')->all()
        )->not->toContain('No Clasp')
        ->and(
            collect(
                collect($catalog['products']['castPartial']['parameters'])
                    ->firstWhere('fieldName', 'rests')['options']
            )->pluck('value')->all()
        )->toBe([
            'Mesial Occlusal Rest',
            'Distal Occlusal Rest',
            'Lingual/Palatal Rest',
        ])
        ->and(collect($catalog['materialsByProduct']['acrylicPartial'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Acrylic/PMMA',
        ])
        ->and(collect($catalog['products']['acrylicPartial']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'clasp',
        ])
        ->and(
            collect(
                collect($catalog['products']['acrylicPartial']['parameters'])
                    ->firstWhere('fieldName', 'clasp')['options']
            )->pluck('value')->all()
        )->toBe([
            'Wrought Wire Clasp',
            'Ball Clasp',
            'Roach (J/Y) Clasp',
        ])
        ->and(collect($catalog['products']['acrylicPartial']['parameters'])->pluck('fieldName')->all())
        ->not->toContain('partialType', 'framework', 'claspMaterial', 'support')
        ->and(collect($catalog['materialsByProduct']['diagnosticWaxup'] ?? [])->all())
        ->toBe([])
        ->and(collect($catalog['products']['diagnosticWaxup']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'designStyle',
            'marginDesign',
            'needed',
            'toothShape',
        ])
        ->and(
            collect($catalog['products']['diagnosticWaxup']['parameters'])
                ->firstWhere('fieldName', 'needed')['type']
        )->toBe('multi_option')
        ->and(
            collect(
                collect($catalog['products']['diagnosticWaxup']['parameters'])
                    ->firstWhere('fieldName', 'designStyle')['options']
            )->pluck('value')->all()
        )->toBe([
            'Central Overlap',
            'Straight',
            'Shorter Laterals',
            'Twisted Laterals',
        ])
        ->and(
            collect(
                collect($catalog['products']['diagnosticWaxup']['parameters'])
                    ->firstWhere('fieldName', 'designStyle')['options']
            )->firstWhere('value', 'Central Overlap')['imageUrl']
        )->toContain('centerl-overlap')
        ->and(
            collect(
                collect($catalog['products']['diagnosticWaxup']['parameters'])
                    ->firstWhere('fieldName', 'needed')['options']
            )->pluck('value')->all()
        )->toBe([
            'Pre-Opp Model',
            'Printed Diagnostic Model',
            'Rubber Stent',
            'Essix style stent',
            'Prep guide',
            'Margin Adaptation guide',
        ])
        ->and(collect($catalog['materialsByProduct']['simpleGuide'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Clear Milled PMMA',
            'Printed Clear',
        ])
        ->and(collect($catalog['products']['simpleGuide']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'boneReductionIndication',
            'occlusalSlot',
        ])
        ->and(
            collect(
                collect($catalog['products']['simpleGuide']['parameters'])
                    ->firstWhere('fieldName', 'occlusalSlot')['options']
            )->pluck('value')->all()
        )->toBe(['No', 'Yes'])
        ->and(
            collect(
                collect($catalog['products']['simpleGuide']['parameters'])
                    ->firstWhere('fieldName', 'boneReductionIndication')['options']
            )->pluck('value')->all()
        )->toBe(['No', 'Yes'])
        ->and(collect($catalog['materialsByProduct']['partialGuide'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Clear Milled PMMA',
            'Printed Clear',
        ])
        ->and(collect($catalog['products']['partialGuide']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'applianceDesign',
            'planningApproval',
            'preferredBrand',
        ])
        ->and(
            collect(
                collect($catalog['products']['partialGuide']['parameters'])
                    ->firstWhere('fieldName', 'applianceDesign')['options']
            )->pluck('value')->all()
        )->toBe([
            'Guide only (Planning provided)',
            'Planning + Guide',
        ])
        ->and(
            collect($catalog['products']['partialGuide']['parameters'])
                ->firstWhere('fieldName', 'preferredBrand')['type']
        )->toBe('input')
        ->and(
            collect(
                collect($catalog['products']['partialGuide']['parameters'])
                    ->firstWhere('fieldName', 'planningApproval')['options']
            )->pluck('value')->all()
        )->toBe([
            'Send for approval',
            'Continue without approval',
        ])
        ->and(collect($catalog['materialsByProduct']['fullGuide'] ?? [])->pluck('name')->sort()->values()->all())
        ->toBe([
            'Clear Milled PMMA',
            'Printed Clear',
        ])
        ->and(collect($catalog['products']['fullGuide']['parameters'])->pluck('fieldName')->sort()->values()->all())
        ->toBe([
            'applianceDesign',
            'planningApproval',
            'preferredBrand',
        ]);

    $dentureParameters = collect($catalog['products']['fullDenture']['parameters']);

    expect($dentureParameters->pluck('fieldName')->sort()->values()->all())->toBe([
        'anteriorSetup',
        'designMarkers',
        'gingiva',
        'periphery',
        'postDam',
        'posteriorSetup',
        'toothShape',
    ])
        ->and(
            collect($dentureParameters->firstWhere('fieldName', 'toothShape')['options'])
                ->pluck('value')
                ->all()
        )->toContain('Ovoid/Oval', 'Square', 'Triangular')
        ->and(
            collect($dentureParameters->firstWhere('fieldName', 'gingiva')['options'])
                ->pluck('value')
                ->all()
        )->not->toContain('Idealize Gingiva')
        ->and(
            collect($dentureParameters->firstWhere('fieldName', 'toothShape')['options'])
                ->firstWhere('value', 'Ovoid/Oval')['imageUrl']
        )->toContain('full_denture')
        ->and(
            collect($dentureParameters->firstWhere('fieldName', 'anteriorSetup')['options'])
                ->firstWhere('value', 'Naturally Rotated Centrals')['imageUrl']
        )->toContain('centerl-overlap');
});
