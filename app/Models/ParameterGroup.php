<?php

namespace App\Models;

use Database\Factories\ParameterGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParameterGroup extends Model
{
    /** @use HasFactory<ParameterGroupFactory> */
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
     * @return HasMany<Parameter, $this>
     */
    public function parameters(): HasMany
    {
        return $this->hasMany(Parameter::class, 'group_id');
    }
}
