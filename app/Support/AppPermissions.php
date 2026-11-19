<?php

namespace App\Support;

use Spatie\Permission\Models\Role;

class AppPermissions
{
    public const GUARD = 'web';

    public const SUPER_ADMIN_ROLE = 'Super Admin';

    public const DENTIST_ROLE = 'Dentist';

    public const DENTURIST_ROLE = 'Denturist';

    public const LAB_ROLE = 'Lab';

    public const DESIGNER_ROLE = 'Designer';

    public const MANUFACTURER_ROLE = 'Manufacturer';

    public const ALL_USERS_TAB = 'all';

    /**
     * @return array<string, string>
     */
    public static function tabRoleMap(): array
    {
        return [
            'dentists' => self::DENTIST_ROLE,
            'denturists' => self::DENTURIST_ROLE,
            'labs' => self::LAB_ROLE,
            'designers' => self::DESIGNER_ROLE,
            'manufacturers' => self::MANUFACTURER_ROLE,
        ];
    }

    /**
     * Tabs shown on User Management, including the default "All" tab.
     *
     * @return array<string, string|null>
     */
    public static function userManagementTabs(): array
    {
        return [
            self::ALL_USERS_TAB => null,
            ...self::tabRoleMap(),
        ];
    }

    public static function isUserManagementTab(string $tab): bool
    {
        return array_key_exists($tab, self::userManagementTabs());
    }

    /**
     * @return list<string>
     */
    public static function stakeholderRoles(): array
    {
        return array_values(self::tabRoleMap());
    }

    /**
     * @return list<string>
     */
    public static function submitterTypes(): array
    {
        return [
            self::DENTIST_ROLE,
            self::DENTURIST_ROLE,
            self::LAB_ROLE,
        ];
    }

    public static function isPortalType(string $role): bool
    {
        return in_array($role, self::stakeholderRoles(), true);
    }

    /**
     * Spatie role names that may be assigned on Admin Staff (excludes portal types).
     *
     * @return list<string>
     */
    public static function adminStaffRoleNames(): array
    {
        return Role::query()
            ->where('guard_name', self::GUARD)
            ->whereNotIn('name', self::stakeholderRoles())
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();
    }

    public static function isAdminStaffRole(string $role): bool
    {
        return ! self::isPortalType($role);
    }

    /**
     * @return list<string>
     */
    public static function roles(): array
    {
        return [
            self::SUPER_ADMIN_ROLE,
            ...self::stakeholderRoles(),
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function adminGrouped(): array
    {
        return [
            'Dashboard' => [
                'dashboard.view',
            ],
            'User Management' => [
                'users.view',
                'users.create',
                'users.update',
            ],
            'Dental Clients' => [
                'dental-clients.view',
                'dental-clients.create',
                'dental-clients.update',
                'dental-clients.delete',
            ],
            'Cases' => [
                'cases.view',
            ],
            'Assignments' => [
                'assignments.view',
                'assignments.manage',
            ],
            'Dental Product Groups' => [
                'dental-product-groups.view',
                'dental-product-groups.create',
                'dental-product-groups.update',
                'dental-product-groups.delete',
            ],
            'Dental Products' => [
                'dental-products.view',
                'dental-products.create',
                'dental-products.update',
                'dental-products.delete',
            ],
            'Dental Materials' => [
                'dental-materials.view',
                'dental-materials.create',
                'dental-materials.update',
                'dental-materials.delete',
            ],
            'Dental Package Prices' => [
                'dental-package-prices.view',
                'dental-package-prices.create',
                'dental-package-prices.update',
                'dental-package-prices.delete',
            ],
            'Parameter Groups' => [
                'parameter-groups.view',
                'parameter-groups.create',
                'parameter-groups.update',
                'parameter-groups.delete',
            ],
            'Parameters' => [
                'parameters.view',
                'parameters.create',
                'parameters.update',
                'parameters.delete',
            ],
            'Design Reviews' => [
                'design-reviews.view',
            ],
            'Manufacturing' => [
                'manufacturing.view',
            ],
            'Products & Services' => [
                'products.view',
                'products.create',
                'products.update',
                'products.delete',
            ],
            'Billing & Finance' => [
                'billing.view',
                'billing.create',
                'billing.update',
                'billing.delete',
            ],
            'Reports & Analytics' => [
                'reports.view',
            ],
            'Notifications' => [
                'notifications.view',
                'notifications.broadcast',
            ],
            'System Settings' => [
                'settings.view',
            ],
            'Roles & Permissions' => [
                'roles.view',
                'roles.create',
                'roles.update',
                'roles.delete',
            ],
            'Permissions' => [
                'permissions.view',
            ],
            'Admin Staff' => [
                'admins.view',
                'admins.create',
                'admins.update',
                'admins.delete',
            ],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function portalGrouped(): array
    {
        return [
            'Dashboard' => [
                'dashboard.view',
            ],
            'Cases' => [
                'cases.view',
                'cases.create',
            ],
            'Assignments' => [
                'assignments.view',
            ],
            'Designs' => [
                'designs.view',
            ],
            'Manufacturing' => [
                'manufacturing.view',
            ],
            'Billing & Finance' => [
                'billing.view',
            ],
            'Notifications' => [
                'notifications.view',
            ],
            'Profile' => [
                'profile.view',
            ],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function grouped(): array
    {
        $grouped = self::adminGrouped();

        foreach (self::portalGrouped() as $group => $permissions) {
            $grouped[$group] = array_values(array_unique([
                ...($grouped[$group] ?? []),
                ...$permissions,
            ]));
        }

        return $grouped;
    }

    /**
     * @return list<string>
     */
    public static function adminPermissions(): array
    {
        return collect(self::adminGrouped())->flatten()->values()->all();
    }

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return collect(self::grouped())->flatten()->unique()->values()->all();
    }

    /**
     * @return array<string, list<string>>
     */
    public static function rolePermissionMap(): array
    {
        return [
            self::SUPER_ADMIN_ROLE => [],
            self::DENTIST_ROLE => [
                'dashboard.view',
                'cases.view',
                'cases.create',
                'billing.view',
                'notifications.view',
                'profile.view',
            ],
            self::DENTURIST_ROLE => [
                'dashboard.view',
                'cases.view',
                'cases.create',
                'billing.view',
                'notifications.view',
                'profile.view',
            ],
            self::LAB_ROLE => [
                'dashboard.view',
                'cases.view',
                'cases.create',
                'manufacturing.view',
                'billing.view',
                'notifications.view',
                'profile.view',
            ],
            self::DESIGNER_ROLE => [
                'dashboard.view',
                'cases.view',
                'assignments.view',
                'designs.view',
                'notifications.view',
                'profile.view',
            ],
            self::MANUFACTURER_ROLE => [
                'dashboard.view',
                'cases.view',
                'manufacturing.view',
                'notifications.view',
                'profile.view',
            ],
        ];
    }

    public static function label(string $permission): string
    {
        return str($permission)
            ->replace('.', ' ')
            ->replace('-', ' ')
            ->title()
            ->toString();
    }

    public static function roleFromTab(string $tab): ?string
    {
        return self::tabRoleMap()[$tab] ?? null;
    }

    public static function tabFromRole(string $role): ?string
    {
        return array_search($role, self::tabRoleMap(), true) ?: null;
    }
}
