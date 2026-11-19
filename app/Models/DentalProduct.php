<?php

namespace App\Models;

use Database\Factories\DentalProductFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DentalProduct extends Model
{
    /** @use HasFactory<DentalProductFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'icon',
        'is_active',
        'sort_order',
        'dental_product_group_id',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'icon_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'dental_product_group_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DentalProductGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(DentalProductGroup::class, 'dental_product_group_id');
    }

    /**
     * @return BelongsToMany<DentalMaterial, $this>
     */
    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(DentalMaterial::class)
            ->withPivot(['sort_order', 'is_default'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Parameter, $this>
     */
    public function parameters(): HasMany
    {
        return $this->hasMany(Parameter::class, 'product_id');
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function iconUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->icon) {
                return null;
            }

            return asset('storage/'.$this->icon);
        });
    }
}
