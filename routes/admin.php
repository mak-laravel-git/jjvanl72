<?php

use App\Http\Controllers\Backend\Admin\AdminDashboardController;
use App\Http\Controllers\Backend\Admin\AdminProfileController;
use App\Http\Controllers\Backend\Admin\AdminStaffController;
use App\Http\Controllers\Backend\Admin\AllCasesController;
use App\Http\Controllers\Backend\Admin\AssignmentCenterController;
use App\Http\Controllers\Backend\Admin\BillingFinanceController;
use App\Http\Controllers\Backend\Admin\DentalClientController;
use App\Http\Controllers\Backend\Admin\DentalMaterialController;
use App\Http\Controllers\Backend\Admin\DentalPackagePriceController;
use App\Http\Controllers\Backend\Admin\DentalProductController;
use App\Http\Controllers\Backend\Admin\DentalProductGroupController;
use App\Http\Controllers\Backend\Admin\DesignReviewsController;
use App\Http\Controllers\Backend\Admin\ManufacturingOrdersController;
use App\Http\Controllers\Backend\Admin\NotificationBroadcastController;
use App\Http\Controllers\Backend\Admin\NotificationInboxController;
use App\Http\Controllers\Backend\Admin\ParameterController;
use App\Http\Controllers\Backend\Admin\ParameterGroupController;
use App\Http\Controllers\Backend\Admin\PermissionController;
use App\Http\Controllers\Backend\Admin\PortalUserController;
use App\Http\Controllers\Backend\Admin\ProductsServicesController;
use App\Http\Controllers\Backend\Admin\RealtimeController;
use App\Http\Controllers\Backend\Admin\ReportsAnalyticsController;
use App\Http\Controllers\Backend\Admin\RoleController;
use App\Http\Controllers\Backend\Admin\SystemSettingsController;
use App\Http\Controllers\Backend\Admin\UserDeleteController;
use App\Http\Controllers\Backend\Admin\UserManagementController;
use App\Http\Controllers\Backend\Admin\UserPasswordUpdateController;
use App\Http\Controllers\Backend\Admin\UserRoleAssignmentController;
use App\Http\Controllers\UserSelectionController;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', fn () => redirect()->route('login'))->name('login');

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

        Route::get('/profile', [AdminProfileController::class, 'edit'])->name('profile.edit');
        Route::post('/profile', [AdminProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/email-change/verify-current', [AdminProfileController::class, 'verifyCurrentEmail'])
            ->middleware('throttle:6,1')
            ->name('profile.email-change.verify-current');
        Route::post('/profile/email-change/verify-new', [AdminProfileController::class, 'verifyNewEmail'])
            ->middleware('throttle:6,1')
            ->name('profile.email-change.verify-new');
        Route::post('/profile/email-change/resend', [AdminProfileController::class, 'resendEmailChangeCode'])
            ->middleware('throttle:6,1')
            ->name('profile.email-change.resend');
        Route::post('/profile/email-change/cancel', [AdminProfileController::class, 'cancelEmailChange'])
            ->name('profile.email-change.cancel');

        Route::middleware('permission:dashboard.view')->group(function () {
            Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
        });

        Route::middleware('permission:users.create')->group(function () {
            Route::get('/users/create', [PortalUserController::class, 'create'])->name('users.create');
            Route::post('/users', [PortalUserController::class, 'store'])
                ->middleware(HandlePrecognitiveRequests::class)
                ->name('users.store');
        });

        Route::middleware('permission:users.view')->group(function () {
            Route::get('/users', UserManagementController::class)->name('users.index');
            Route::get('/users/list', [UserSelectionController::class, 'getUsers'])->name('users.list');
            Route::get('/users/{user}', [PortalUserController::class, 'show'])->name('users.show');
        });

        Route::middleware('permission:users.update')->group(function () {
            Route::get('/users/{user}/edit', [PortalUserController::class, 'edit'])->name('users.edit');
            Route::put('/users/{user}', [PortalUserController::class, 'update'])
                ->middleware(HandlePrecognitiveRequests::class)
                ->name('users.update');
            Route::put('/users/{user}/role', [UserRoleAssignmentController::class, 'update'])
                ->name('users.role.update');
            Route::put('/users/{user}/password', UserPasswordUpdateController::class)
                ->name('users.password.update');
            Route::delete('/users/{user}', UserDeleteController::class)
                ->name('users.destroy');
        });

        Route::middleware('permission:cases.view')->group(function () {
            Route::get('/cases', AllCasesController::class)->name('cases.index');
            Route::get('/cases/{dentalCase}/edit', [AllCasesController::class, 'edit'])
                ->whereNumber('dentalCase')
                ->name('cases.edit');
            Route::put('/cases/{dentalCase}', [AllCasesController::class, 'update'])
                ->whereNumber('dentalCase')
                ->name('cases.update');
            Route::get('/cases/{case}/files/download', [AllCasesController::class, 'downloadFiles'])
                ->name('cases.files.download');
        });

        Route::middleware('permission:dental-clients.view')->group(function () {
            Route::get('/dental-clients', [DentalClientController::class, 'index'])
                ->name('dental-clients.index');
        });

        Route::middleware('permission:dental-clients.create')->group(function () {
            Route::post('/dental-clients', [DentalClientController::class, 'store'])
                ->name('dental-clients.store');
        });

        Route::middleware('permission:dental-clients.update')->group(function () {
            Route::put('/dental-clients/{dentalClient}', [DentalClientController::class, 'update'])
                ->whereNumber('dentalClient')
                ->name('dental-clients.update');
        });

        Route::middleware('permission:dental-clients.delete')->group(function () {
            Route::delete('/dental-clients/{dentalClient}', [DentalClientController::class, 'destroy'])
                ->whereNumber('dentalClient')
                ->name('dental-clients.destroy');
        });

        Route::middleware('permission:assignments.view')->group(function () {
            Route::get('/assignments', [AssignmentCenterController::class, 'index'])
                ->name('assignments.index');
        });

        Route::middleware('permission:assignments.manage')->group(function () {
            Route::post('/assignments', [AssignmentCenterController::class, 'store'])
                ->name('assignments.store');
            Route::delete('/assignments/{assignment}', [AssignmentCenterController::class, 'destroy'])
                ->whereNumber('assignment')
                ->name('assignments.destroy');
        });

        Route::middleware('permission:design-reviews.view')->group(function () {
            Route::get('/design-reviews', DesignReviewsController::class)->name('design-reviews.index');
        });

        Route::middleware('permission:manufacturing.view')->group(function () {
            Route::get('/manufacturing', ManufacturingOrdersController::class)->name('manufacturing.index');
        });

        Route::middleware('permission:products.view')->group(function () {
            Route::get('/products', [ProductsServicesController::class, 'index'])
                ->name('products.index');
        });

        Route::middleware('permission:products.create')->group(function () {
            Route::post('/products', [ProductsServicesController::class, 'store'])
                ->name('products.store');
        });

        Route::middleware('permission:products.update')->group(function () {
            Route::put('/products/{product}', [ProductsServicesController::class, 'update'])
                ->name('products.update');
        });

        Route::middleware('permission:products.delete')->group(function () {
            Route::delete('/products/{product}', [ProductsServicesController::class, 'destroy'])
                ->name('products.destroy');
        });

        Route::middleware('permission:billing.view')->group(function () {
            Route::get('/billing', [BillingFinanceController::class, 'index'])
                ->name('billing.index');
            Route::get('/billing/export', [BillingFinanceController::class, 'export'])
                ->name('billing.export');
            Route::get('/billing/{invoice}/download', [BillingFinanceController::class, 'download'])
                ->name('billing.download');
        });

        Route::middleware('permission:billing.create')->group(function () {
            Route::post('/billing', [BillingFinanceController::class, 'store'])
                ->name('billing.store');
        });

        Route::middleware('permission:billing.update')->group(function () {
            Route::put('/billing/{invoice}', [BillingFinanceController::class, 'update'])
                ->name('billing.update');
            Route::post('/billing/{invoice}/send', [BillingFinanceController::class, 'send'])
                ->name('billing.send');
        });

        Route::middleware('permission:billing.delete')->group(function () {
            Route::delete('/billing/{invoice}', [BillingFinanceController::class, 'destroy'])
                ->name('billing.destroy');
        });

        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports', ReportsAnalyticsController::class)->name('reports.index');
        });

        Route::middleware('permission:notifications.broadcast')->group(function () {
            Route::get('/notifications/broadcast', [NotificationBroadcastController::class, 'create'])
                ->name('notifications.broadcast');
            Route::post('/notifications/broadcast', [NotificationBroadcastController::class, 'store'])
                ->name('notifications.broadcast.store');
        });

        Route::middleware('permission:notifications.view')->group(function () {
            Route::get('/notifications', [NotificationInboxController::class, 'index'])
                ->name('notifications.index');
            Route::get('/notifications/recent', [NotificationInboxController::class, 'recent'])
                ->name('notifications.recent');
            Route::post('/notifications/mark-all-read', [NotificationInboxController::class, 'markAllRead'])
                ->name('notifications.mark-all-read');
            Route::get('/notifications/{userNotification}', [NotificationInboxController::class, 'show'])
                ->name('notifications.show');
            Route::patch('/notifications/{userNotification}/read', [NotificationInboxController::class, 'markRead'])
                ->name('notifications.read');
            Route::patch('/notifications/{userNotification}/unread', [NotificationInboxController::class, 'markUnread'])
                ->name('notifications.unread');
            Route::delete('/notifications/{userNotification}', [NotificationInboxController::class, 'destroy'])
                ->name('notifications.destroy');

            Route::get('/realtime', [RealtimeController::class, 'index'])
                ->name('realtime.index');
            Route::get('/realtime/ping', [RealtimeController::class, 'ping'])
                ->middleware('throttle:30,1')
                ->name('realtime.ping');
            Route::get('/realtime/health', [RealtimeController::class, 'health'])
                ->name('realtime.health');
            Route::post('/realtime/test-notification', [RealtimeController::class, 'testNotification'])
                ->middleware('throttle:30,1')
                ->name('realtime.test-notification');
        });

        Route::middleware('permission:settings.view')->group(function () {
            Route::get('/settings', SystemSettingsController::class)->name('settings.index');
        });

        Route::middleware('permission:roles.view')->group(function () {
            Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        });

        Route::middleware('permission:roles.create')->group(function () {
            Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
            Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        });

        Route::middleware('permission:roles.update')->group(function () {
            Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
            Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        });

        Route::middleware('permission:roles.delete')->group(function () {
            Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        });

        Route::middleware('permission:permissions.view')->group(function () {
            Route::get('/permissions', [PermissionController::class, 'index'])
                ->name('permissions.index');
        });

        Route::middleware('permission:admins.view')->group(function () {
            Route::get('/staff', [AdminStaffController::class, 'index'])->name('staff.index');
            Route::get('/staff/{adminStaff}', [AdminStaffController::class, 'show'])
                ->whereNumber('adminStaff')
                ->name('staff.show');
        });

        Route::middleware('permission:admins.create')->group(function () {
            Route::get('/staff/create', [AdminStaffController::class, 'create'])->name('staff.create');
            Route::post('/staff', [AdminStaffController::class, 'store'])
                ->middleware(HandlePrecognitiveRequests::class)
                ->name('staff.store');
        });

        Route::middleware('permission:admins.update')->group(function () {
            Route::get('/staff/{adminStaff}/edit', [AdminStaffController::class, 'edit'])
                ->whereNumber('adminStaff')
                ->name('staff.edit');
            Route::put('/staff/{adminStaff}', [AdminStaffController::class, 'update'])
                ->whereNumber('adminStaff')
                ->middleware(HandlePrecognitiveRequests::class)
                ->name('staff.update');
        });

        Route::middleware('permission:admins.delete')->group(function () {
            Route::delete('/staff/{adminStaff}', [AdminStaffController::class, 'destroy'])
                ->whereNumber('adminStaff')
                ->name('staff.destroy');
        });

        Route::middleware('permission:dental-product-groups.view')->group(function () {
            Route::get('/dental-product-groups', [DentalProductGroupController::class, 'index'])
                ->name('dental-product-groups.index');
        });

        Route::middleware('permission:dental-product-groups.create')->group(function () {
            Route::post('/dental-product-groups', [DentalProductGroupController::class, 'store'])
                ->name('dental-product-groups.store');
        });

        Route::middleware('permission:dental-product-groups.update')->group(function () {
            Route::put('/dental-product-groups/{dentalProductGroup}', [DentalProductGroupController::class, 'update'])
                ->whereNumber('dentalProductGroup')
                ->name('dental-product-groups.update');
        });

        Route::middleware('permission:dental-product-groups.delete')->group(function () {
            Route::delete('/dental-product-groups/{dentalProductGroup}', [DentalProductGroupController::class, 'destroy'])
                ->whereNumber('dentalProductGroup')
                ->name('dental-product-groups.destroy');
        });

        Route::middleware('permission:dental-products.view')->group(function () {
            Route::get('/dental-products', [DentalProductController::class, 'index'])
                ->name('dental-products.index');
        });

        Route::middleware('permission:dental-products.create')->group(function () {
            Route::get('/dental-products/create', [DentalProductController::class, 'create'])
                ->name('dental-products.create');
            Route::post('/dental-products', [DentalProductController::class, 'store'])
                ->name('dental-products.store');
        });

        Route::middleware('permission:dental-products.update')->group(function () {
            Route::get('/dental-products/{dentalProduct}/edit', [DentalProductController::class, 'edit'])
                ->whereNumber('dentalProduct')
                ->name('dental-products.edit');
            Route::put('/dental-products/{dentalProduct}', [DentalProductController::class, 'update'])
                ->whereNumber('dentalProduct')
                ->name('dental-products.update');
        });

        Route::middleware('permission:dental-products.delete')->group(function () {
            Route::delete('/dental-products/{dentalProduct}', [DentalProductController::class, 'destroy'])
                ->whereNumber('dentalProduct')
                ->name('dental-products.destroy');
        });

        Route::middleware('permission:dental-materials.view')->group(function () {
            Route::get('/dental-materials', [DentalMaterialController::class, 'index'])
                ->name('dental-materials.index');
        });

        Route::middleware('permission:dental-materials.create')->group(function () {
            Route::get('/dental-materials/create', [DentalMaterialController::class, 'create'])
                ->name('dental-materials.create');
            Route::post('/dental-materials', [DentalMaterialController::class, 'store'])
                ->name('dental-materials.store');
        });

        Route::middleware('permission:dental-materials.update')->group(function () {
            Route::get('/dental-materials/{dentalMaterial}/edit', [DentalMaterialController::class, 'edit'])
                ->whereNumber('dentalMaterial')
                ->name('dental-materials.edit');
            Route::put('/dental-materials/{dentalMaterial}', [DentalMaterialController::class, 'update'])
                ->whereNumber('dentalMaterial')
                ->name('dental-materials.update');
        });

        Route::middleware('permission:dental-materials.delete')->group(function () {
            Route::delete('/dental-materials/{dentalMaterial}', [DentalMaterialController::class, 'destroy'])
                ->whereNumber('dentalMaterial')
                ->name('dental-materials.destroy');
        });

        Route::middleware('permission:dental-package-prices.view')->group(function () {
            Route::get('/dental-package-prices', [DentalPackagePriceController::class, 'index'])
                ->name('dental-package-prices.index');
        });

        Route::middleware('permission:dental-package-prices.create')->group(function () {
            Route::get('/dental-package-prices/create', [DentalPackagePriceController::class, 'create'])
                ->name('dental-package-prices.create');
            Route::post('/dental-package-prices', [DentalPackagePriceController::class, 'store'])
                ->name('dental-package-prices.store');
        });

        Route::middleware('permission:dental-package-prices.update')->group(function () {
            Route::get('/dental-package-prices/{dentalPackagePrice}/edit', [DentalPackagePriceController::class, 'edit'])
                ->whereNumber('dentalPackagePrice')
                ->name('dental-package-prices.edit');
            Route::put('/dental-package-prices/{dentalPackagePrice}', [DentalPackagePriceController::class, 'update'])
                ->whereNumber('dentalPackagePrice')
                ->name('dental-package-prices.update');
        });

        Route::middleware('permission:dental-package-prices.delete')->group(function () {
            Route::delete('/dental-package-prices/{dentalPackagePrice}', [DentalPackagePriceController::class, 'destroy'])
                ->whereNumber('dentalPackagePrice')
                ->name('dental-package-prices.destroy');
        });

        Route::middleware('permission:parameter-groups.view')->group(function () {
            Route::get('/parameter-groups', [ParameterGroupController::class, 'index'])
                ->name('parameter-groups.index');
        });

        Route::middleware('permission:parameter-groups.create')->group(function () {
            Route::post('/parameter-groups', [ParameterGroupController::class, 'store'])
                ->name('parameter-groups.store');
        });

        Route::middleware('permission:parameter-groups.update')->group(function () {
            Route::put('/parameter-groups/{parameterGroup}', [ParameterGroupController::class, 'update'])
                ->whereNumber('parameterGroup')
                ->name('parameter-groups.update');
        });

        Route::middleware('permission:parameter-groups.delete')->group(function () {
            Route::delete('/parameter-groups/{parameterGroup}', [ParameterGroupController::class, 'destroy'])
                ->whereNumber('parameterGroup')
                ->name('parameter-groups.destroy');
        });

        Route::middleware('permission:parameters.view')->group(function () {
            Route::get('/parameters', [ParameterController::class, 'index'])
                ->name('parameters.index');
        });

        Route::middleware('permission:parameters.create')->group(function () {
            Route::get('/parameters/create', [ParameterController::class, 'create'])
                ->name('parameters.create');
            Route::post('/parameters', [ParameterController::class, 'store'])
                ->name('parameters.store');
        });

        Route::middleware('permission:parameters.update')->group(function () {
            Route::get('/parameters/{parameter}/edit', [ParameterController::class, 'edit'])
                ->whereNumber('parameter')
                ->name('parameters.edit');
            Route::put('/parameters/{parameter}', [ParameterController::class, 'update'])
                ->whereNumber('parameter')
                ->name('parameters.update');
        });

        Route::middleware('permission:parameters.delete')->group(function () {
            Route::delete('/parameters/{parameter}', [ParameterController::class, 'destroy'])
                ->whereNumber('parameter')
                ->name('parameters.destroy');
        });
    });
});
