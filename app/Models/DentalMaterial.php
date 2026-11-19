<?php

namespace App\Models;

use Database\Factories\DentalMaterialFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DentalMaterial extends Model
{
    /** @use HasFactory<DentalMaterialFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'icon',
        'sort_order',
        'is_active',
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
        ];
    }

    /**
     * @return BelongsToMany<DentalProduct, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(DentalProduct::class)
            ->withPivot(['sort_order', 'is_default'])
            ->withTimestamps();
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
