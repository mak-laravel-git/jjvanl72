<?php

namespace App\Models;

use Database\Factories\DentalUploadRequirementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DentalUploadRequirement extends Model
{
    /** @use HasFactory<DentalUploadRequirementFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'description',
        'accepted_extensions',
        'accepted_mime_types',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'accepted_extensions' => 'array',
            'accepted_mime_types' => 'array',
        ];
    }

    /**
     * @return BelongsToMany<DentalProduct, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            DentalProduct::class,
            'dental_product_upload_requirements',
            'upload_requirement_id',
            'product_id',
        )->withPivot(['is_required', 'requirement_group', 'group_min_files', 'min_files', 'max_files', 'sort_order'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<DentalCaseFile, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(DentalCaseFile::class, 'upload_requirement_id');
    }
}
