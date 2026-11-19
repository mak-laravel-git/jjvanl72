<?php

namespace App\Models;

use Database\Factories\DentalCaseItemToothFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalCaseItemTooth extends Model
{
    /** @use HasFactory<DentalCaseItemToothFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_item_id',
        'tooth_number',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tooth_number' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DentalCaseItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(DentalCaseItem::class, 'case_item_id');
    }
}
