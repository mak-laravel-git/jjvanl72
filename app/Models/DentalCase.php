<?php

namespace App\Models;

use App\Enums\DentalCaseStatus;
use Database\Factories\DentalCaseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DentalCase extends Model
{
    /** @use HasFactory<DentalCaseFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_number',
        'client_id',
        'created_by',
        'patient_id',
        'reference',
        'patient_name_snapshot',
        'due_date',
        'notes',
        'status',
        'lock_version',
        'configuration_json',
        'submitted_at',
        'completed_at',
        'cancelled_at',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => DentalCaseStatus::Draft->value,
        'lock_version' => 1,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'status' => DentalCaseStatus::class,
            'lock_version' => 'integer',
            'configuration_json' => 'array',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<DentalClient, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(DentalClient::class, 'client_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<Patient, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * @return HasMany<DentalCaseItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(DentalCaseItem::class, 'case_id')->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return HasMany<DentalCaseFile, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(DentalCaseFile::class, 'case_id');
    }

    /**
     * @return HasMany<DentalCaseFileSlot, $this>
     */
    public function fileSlots(): HasMany
    {
        return $this->hasMany(DentalCaseFileSlot::class, 'case_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * @return HasMany<DentalCaseAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(DentalCaseAssignment::class, 'dental_case_id');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'dental_case_assignments', 'dental_case_id', 'user_id')
            ->withPivot(['id', 'role', 'status', 'assigned_by'])
            ->withTimestamps();
    }

    public function isDraft(): bool
    {
        return $this->status === DentalCaseStatus::Draft;
    }
}
