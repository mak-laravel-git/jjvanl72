<?php

namespace App\Models;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Enums\ManufactureMethod;
use App\Enums\ModelService;
use Database\Factories\DentalPackagePriceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalPackagePrice extends Model
{
    /** @use HasFactory<DentalPackagePriceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'dental_product_id',
        'dental_material_id',
        'service',
        'manufacture_method',
        'output',
        'model_service',
        'price_minor',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dental_product_id' => 'integer',
            'dental_material_id' => 'integer',
            'service' => CaseService::class,
            'manufacture_method' => ManufactureMethod::class,
            'output' => CaseOutput::class,
            'model_service' => ModelService::class,
            'price_minor' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DentalProduct, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(DentalProduct::class, 'dental_product_id');
    }

    /**
     * @return BelongsTo<DentalMaterial, $this>
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(DentalMaterial::class, 'dental_material_id');
    }

    public function priceDollars(): float
    {
        return round($this->price_minor / 100, 2);
    }
}
