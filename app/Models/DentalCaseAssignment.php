<?php

namespace App\Models;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DesignerAssignmentStatus;
use App\Enums\ManufacturerAssignmentStatus;
use Database\Factories\DentalCaseAssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentalCaseAssignment extends Model
{
    /** @use HasFactory<DentalCaseAssignmentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'dental_case_id',
        'user_id',
        'role',
        'status',
        'assigned_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => DentalCaseAssignmentRole::class,
        ];
    }

    /**
     * @return BelongsTo<DentalCase, $this>
     */
    public function dentalCase(): BelongsTo
    {
        return $this->belongsTo(DentalCase::class, 'dental_case_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function statusLabel(): string
    {
        return match ($this->roleValue()) {
            DentalCaseAssignmentRole::Designer->value => DesignerAssignmentStatus::tryFrom((string) $this->status)?->label()
                ?? (string) $this->status,
            DentalCaseAssignmentRole::Manufacturer->value => ManufacturerAssignmentStatus::tryFrom((string) $this->status)?->label()
                ?? (string) $this->status,
            default => (string) $this->status,
        };
    }

    public function statusTone(): string
    {
        return match ($this->roleValue()) {
            DentalCaseAssignmentRole::Designer->value => DesignerAssignmentStatus::tryFrom((string) $this->status)?->tone()
                ?? 'assigned',
            DentalCaseAssignmentRole::Manufacturer->value => ManufacturerAssignmentStatus::tryFrom((string) $this->status)?->tone()
                ?? 'assigned',
            default => 'assigned',
        };
    }

    public function roleValue(): string
    {
        if ($this->role instanceof DentalCaseAssignmentRole) {
            return $this->role->value;
        }

        return (string) $this->role;
    }
}
