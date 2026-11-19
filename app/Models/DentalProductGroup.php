<?php

namespace App\Models;

use Database\Factories\DentalProductGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DentalProductGroup extends Model
{
    /** @use HasFactory<DentalProductGroupFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'is_active',
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
     * @return HasMany<DentalProduct, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(DentalProduct::class);
    }
}
