<?php

namespace App\Models;

use App\Enums\UserAvailability;
use App\Enums\UserStatus;
use App\Support\AppPermissions;
use App\Support\UserProfilePreferences;
use App\Traits\HasAppNotifications;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Scout\Searchable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'pending_email', 'phone', 'location', 'company_name', 'business_registration', 'production_capacity', 'status', 'availability', 'notification_preferences', 'avatar', 'password', 'device_token', 'client_id', 'created_at', 'updated_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
#[Appends(['avatar_url'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasAppNotifications, HasFactory, HasRoles, Notifiable, Searchable, TwoFactorAuthenticatable;

    /**
     * The default guard name for Spatie permissions.
     */
    protected string $guard_name = AppPermissions::GUARD;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => UserStatus::Active->value,
        'availability' => UserAvailability::Available->value,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'status' => UserStatus::class,
            'availability' => UserAvailability::class,
            'notification_preferences' => 'array',
            'client_id' => 'integer',
        ];
    }

    public function isActive(): bool
    {
        return ($this->status ?? UserStatus::Active)->isActive();
    }

    public function statusLabel(): string
    {
        return ($this->status ?? UserStatus::Active)->label();
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: function ($value, array $attributes) {
                $storedName = $attributes['name'] ?? $value;

                if (! empty($storedName)) {
                    return $storedName;
                }

                $composed = trim(($attributes['first_name'] ?? '').' '.($attributes['last_name'] ?? ''));

                return $composed !== '' ? $composed : ($attributes['email'] ?? '');
            },
        );
    }

    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(AppPermissions::SUPER_ADMIN_ROLE);
    }

    public function canAccessAdminPanel(): bool
    {
        return $this->isSuperAdmin()
            || $this->can('admins.view')
            || $this->can('admins.create')
            || $this->can('admins.update')
            || $this->can('roles.view')
            || $this->can('users.view')
            || $this->can('permissions.view')
            || $this->can('settings.view');
    }

    public function platformRole(): ?string
    {
        return $this->getRoleNames()
            ->first(fn (string $role): bool => in_array($role, AppPermissions::stakeholderRoles(), true));
    }

    public function getRoleLabelAttribute(): string
    {
        if ($this->isSuperAdmin()) {
            return AppPermissions::SUPER_ADMIN_ROLE;
        }

        return $this->platformRole() ?? 'Unassigned';
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_urls && isset($this->avatar_urls['url'])) {
            return str_replace('%s', 'medium', $this->avatar_urls['url']);
        }

        if ($this->avatar) {
            return asset('storage/'.$this->avatar);
        }

        return null;
    }

    /**
     * @return array<string, bool>
     */
    public function notificationChannels(): array
    {
        return UserProfilePreferences::mergeFor($this);
    }

    protected function wantsPushNotifications(): Attribute
    {
        return Attribute::get(
            fn (): bool => UserProfilePreferences::wants(
                $this,
                UserProfilePreferences::PUSH_NOTIFICATIONS,
            ),
        );
    }

    protected function wantsSystemNotifications(): Attribute
    {
        return Attribute::get(
            fn (): bool => UserProfilePreferences::wants(
                $this,
                UserProfilePreferences::SYSTEM_NOTIFICATIONS,
            ),
        );
    }

    protected function wantsEmailNotifications(): Attribute
    {
        return Attribute::get(
            fn (): bool => UserProfilePreferences::wants(
                $this,
                UserProfilePreferences::EMAIL_NOTIFICATIONS,
            ),
        );
    }

    /**
     * @return BelongsTo<DentalClient, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(DentalClient::class, 'client_id');
    }

    /**
     * @return HasMany<DentalCase, $this>
     */
    public function createdCases(): HasMany
    {
        return $this->hasMany(DentalCase::class, 'created_by');
    }

    /**
     * @return HasMany<DentalCaseAssignment, $this>
     */
    public function caseAssignments(): HasMany
    {
        return $this->hasMany(DentalCaseAssignment::class, 'user_id');
    }

    /**
     * @return BelongsToMany<DentalCase, $this>
     */
    public function assignedCases(): BelongsToMany
    {
        return $this->belongsToMany(DentalCase::class, 'dental_case_assignments', 'user_id', 'dental_case_id')
            ->withPivot(['id', 'role', 'status', 'assigned_by'])
            ->withTimestamps();
    }

    public function initials(): string
    {
        $parts = preg_split('/\s+/', trim($this->name)) ?: [];

        $initials = collect($parts)
            ->filter()
            ->take(2)
            ->map(fn (string $part): string => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');

        return $initials !== '' ? $initials : 'U';
    }

    public function searchableAs(): string
    {
        return 'users';
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone ?? '',
            'location' => $this->location ?? '',
            'status' => ($this->status ?? UserStatus::Active)->value,
            'role_names' => $this->getRoleNames()->values()->all(),
            'created_at' => $this->created_at?->getTimestamp(),
        ];
    }
}
