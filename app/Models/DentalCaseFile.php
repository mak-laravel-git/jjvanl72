<?php

namespace App\Models;

use Database\Factories\DentalCaseFileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalCaseFile extends Model
{
    /** @use HasFactory<DentalCaseFileFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_id',
        'case_item_id',
        'upload_requirement_id',
        'requirement_code_snapshot',
        'storage_disk',
        'storage_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sha256',
        'status',
        'rejection_reason',
        'uploaded_by_user_id',
        'scanned_at',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'uploaded',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'scanned_at' => 'datetime',
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
     * @return BelongsTo<DentalCaseItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(DentalCaseItem::class, 'case_item_id');
    }

    /**
     * @return BelongsTo<DentalUploadRequirement, $this>
     */
    public function uploadRequirement(): BelongsTo
    {
        return $this->belongsTo(DentalUploadRequirement::class, 'upload_requirement_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
