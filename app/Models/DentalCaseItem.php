<?php

namespace App\Models;

use Database\Factories\DentalCaseItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DentalCaseItem extends Model
{
    /** @use HasFactory<DentalCaseItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_id',
        'product_id',
        'material_id',
        'parameters',
        'product_code_snapshot',
        'product_name_snapshot',
        'arch',
        'quantity',
        'unit_price_minor',
        'material_name_snapshot',
        'shade',
        'configuration_json',
        'config_schema_version',
        'sort_order',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'unit_price_minor' => 0,
        'sort_order' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'quantity' => 'integer',
            'unit_price_minor' => 'integer',
            'configuration_json' => 'array',
            'config_schema_version' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DentalCase, $this>
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(DentalCase::class, 'case_id');
    }

    /**
     * @return BelongsTo<DentalProduct, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(DentalProduct::class, 'product_id');
    }

    /**
     * @return BelongsTo<DentalMaterial, $this>
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(DentalMaterial::class, 'material_id');
    }

    /**
     * @return HasMany<DentalCaseItemTooth, $this>
     */
    public function teeth(): HasMany
    {
        return $this->hasMany(DentalCaseItemTooth::class, 'case_item_id')->orderBy('id');
    }
}
