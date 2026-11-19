import {
    DashboardSidebar,
    type DashboardNavItem,
} from '@/layouts/partials/dashboard/sidebar';
import { dashboard } from '@/routes/admin';
import { index as assignmentsIndex } from '@/routes/admin/assignments';
import { index as billingIndex } from '@/routes/admin/billing';
import { index as casesIndex } from '@/routes/admin/cases';
import { index as designReviewsIndex } from '@/routes/admin/design-reviews';
import { index as manufacturingIndex } from '@/routes/admin/manufacturing';
import { index as notificationsIndex } from '@/routes/admin/notifications';
import { index as permissionsIndex } from '@/routes/admin/permissions';
import { index as productsIndex } from '@/routes/admin/products';
import { index as realtimeIndex } from '@/routes/admin/realtime';
import { index as reportsIndex } from '@/routes/admin/reports';
import { index as rolesIndex } from '@/routes/admin/roles';
import { index as settingsIndex } from '@/routes/admin/settings';
import { index as dentalClientsIndex } from '@/routes/admin/dental-clients';
import { index as dentalProductGroupsIndex } from '@/routes/admin/dental-product-groups';
import { index as dentalProductsIndex } from '@/routes/admin/dental-products';
import { index as dentalMaterialsIndex } from '@/routes/admin/dental-materials';
import { index as dentalPackagePricesIndex } from '@/routes/admin/dental-package-prices';
import { index as parameterGroupsIndex } from '@/routes/admin/parameter-groups';
import { index as parametersIndex } from '@/routes/admin/parameters';
import { index as staffIndex } from '@/routes/admin/staff';
import { index as usersIndex } from '@/routes/admin/users';
import { edit as adminProfileEdit } from '@/routes/admin/profile';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

const buildNavItems = (): DashboardNavItem[] => [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: asset('nav-dashboard.svg'),
        match: ['/admin/dashboard'],
        exact: ['/admin'],
        permission: 'dashboard.view',
    },
    {
        title: 'User Management',
        icon: asset('nav-users.svg'),
        children: [
            {
                title: 'Users',
                href: usersIndex.url(),
                icon: asset('nav-users.svg'),
                match: ['/admin/users'],
                permission: 'users.view',
            },
            {
                title: 'Dental Clients',
                href: dentalClientsIndex.url(),
                icon: asset('nav-users.svg'),
                match: ['/admin/dental-clients'],
                permission: 'dental-clients.view',
            },
            {
                title: 'Admins',
                href: staffIndex.url(),
                icon: asset('nav-users.svg'),
                match: ['/admin/staff'],
                permission: 'admins.view',
            },
            {
                title: 'Roles',
                href: rolesIndex.url(),
                icon: asset('nav-users.svg'),
                match: ['/admin/roles'],
                permission: 'roles.view',
            },
            {
                title: 'Permissions',
                href: permissionsIndex.url(),
                icon: asset('nav-users.svg'),
                match: ['/admin/permissions'],
                permission: 'permissions.view',
            },
        ],
    },
    {
        title: 'All Cases',
        href: casesIndex.url(),
        icon: asset('nav-cases.svg'),
        match: ['/admin/cases'],
        permission: 'cases.view',
    },
    {
        title: 'Assignment Center',
        href: assignmentsIndex.url(),
        icon: asset('nav-assignment.svg'),
        match: ['/admin/assignments'],
        permission: 'assignments.view',
    },
    {
        title: 'Case Config',
        icon: asset('nav-products.svg'),
        children: [
            {
                title: 'Dental Product Groups',
                href: dentalProductGroupsIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/dental-product-groups'],
                permission: 'dental-product-groups.view',
            },
            {
                title: 'Dental Products',
                href: dentalProductsIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/dental-products'],
                permission: 'dental-products.view',
            },
            {
                title: 'Dental Materials',
                href: dentalMaterialsIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/dental-materials'],
                permission: 'dental-materials.view',
            },
            {
                title: 'Package Prices',
                href: dentalPackagePricesIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/dental-package-prices'],
                permission: 'dental-package-prices.view',
            },
            {
                title: 'Parameter Groups',
                href: parameterGroupsIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/parameter-groups'],
                permission: 'parameter-groups.view',
            },
            {
                title: 'Parameters',
                href: parametersIndex.url(),
                icon: asset('nav-products.svg'),
                match: ['/admin/parameters'],
                permission: 'parameters.view',
            },
        ],
    },
    {
        title: 'Design Reviews',
        href: designReviewsIndex.url(),
        icon: asset('nav-design.svg'),
        match: ['/admin/design-reviews'],
        permission: 'design-reviews.view',
    },
    {
        title: 'Manufacturing Orders',
        href: manufacturingIndex.url(),
        icon: asset('nav-manufacturing.svg'),
        match: ['/admin/manufacturing'],
        permission: 'manufacturing.view',
    },
    {
        title: 'Products & Services',
        href: productsIndex.url(),
        icon: asset('nav-products.svg'),
        match: ['/admin/products'],
        permission: 'products.view',
    },
    {
        title: 'Billing & Finance',
        href: billingIndex.url(),
        icon: asset('nav-billing.svg'),
        match: ['/admin/billing'],
        permission: 'billing.view',
    },
    {
        title: 'Reports & Analytics',
        href: reportsIndex.url(),
        icon: asset('nav-reports.svg'),
        match: ['/admin/reports'],
        permission: 'reports.view',
    },
    {
        title: 'Notifications',
        href: notificationsIndex.url(),
        icon: asset('nav-notifications.svg'),
        match: ['/admin/notifications'],
        permission: 'notifications.view',
    },
    {
        title: 'Realtime Console',
        href: realtimeIndex.url(),
        icon: asset('nav-notifications.svg'),
        match: ['/admin/realtime'],
        permission: 'notifications.view',
    },
    {
        title: 'System Settings',
        href: settingsIndex.url(),
        icon: asset('nav-settings.svg'),
        match: ['/admin/settings'],
        permission: 'settings.view',
    },
    {
        title: 'Profile Settings',
        href: adminProfileEdit.url(),
        icon: asset('nav-profile.svg'),
        match: ['/admin/profile', '/settings/two-factor'],
    },
];

export function AdminSidebar() {
    return (
        <DashboardSidebar
            logoutIcon={asset('nav-logout.svg')}
            items={buildNavItems()}
            density="compact"
        />
    );
}
