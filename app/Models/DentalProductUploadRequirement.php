<?php

namespace App\Models;

use Database\Factories\DentalProductUploadRequirementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalProductUploadRequirement extends Model
{
    /** @use HasFactory<DentalProductUploadRequirementFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'upload_requirement_id',
        'is_required',
        'requirement_group',
        'group_min_files',
        'min_files',
        'max_files',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'group_min_files' => 'integer',
            'min_files' => 'integer',
            'max_files' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DentalProduct, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(DentalProduct::class, 'product_id');
    }

    /**
     * @return BelongsTo<DentalUploadRequirement, $this>
     */
    public function uploadRequirement(): BelongsTo
    {
        return $this->belongsTo(DentalUploadRequirement::class, 'upload_requirement_id');
    }
}
