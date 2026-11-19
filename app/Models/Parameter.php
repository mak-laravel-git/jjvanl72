<?php

namespace App\Models;

use App\Enums\ParameterType;
use Database\Factories\ParameterFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parameter extends Model
{
    /** @use HasFactory<ParameterFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'field_name',
        'group_id',
        'product_id',
        'material_id',
        'type',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'group_id' => 'integer',
            'product_id' => 'integer',
            'material_id' => 'integer',
            'type' => ParameterType::class,
        ];
    }

    /**
     * @return BelongsTo<ParameterGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(ParameterGroup::class, 'group_id');
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
     * @return HasMany<ParameterOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(ParameterOption::class, 'parameter_id');
    }
}
