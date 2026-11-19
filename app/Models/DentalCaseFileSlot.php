<?php

namespace App\Models;

use Database\Factories\DentalCaseFileSlotFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalCaseFileSlot extends Model
{
    /** @use HasFactory<DentalCaseFileSlotFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_id',
        'code',
        'label',
        'sort_order',
        'created_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
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
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function hasFiles(): bool
    {
        return DentalCaseFile::query()
            ->where('case_id', $this->case_id)
            ->where('requirement_code_snapshot', $this->code)
            ->exists();
    }
}
