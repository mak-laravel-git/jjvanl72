<?php

use App\Http\Controllers\Backend\User\CaseFileSlotController;
use App\Http\Controllers\Backend\User\CreateCaseController;
use App\Http\Controllers\Backend\User\DesignerPortalController;
use App\Http\Controllers\Backend\User\ManufacturerPortalController;
use App\Http\Controllers\Backend\User\PortalBillingController;
use App\Http\Controllers\Backend\User\PortalCaseController;
use App\Http\Controllers\Backend\User\PortalNotificationsController;
use App\Http\Controllers\Backend\User\UserDashboardController;
use App\Http\Controllers\UserProfileController;
use App\Support\AppPermissions;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'portal.type'])->group(function (): void {
    Route::middleware('permission:dashboard.view')->group(function (): void {
        Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
    });

    Route::middleware(['portal.type:'.implode(',', AppPermissions::submitterTypes())])->group(function (): void {
        Route::middleware('permission:cases.create')->group(function (): void {
            Route::get('/cases/create', [CreateCaseController::class, 'create'])->name('cases.create');
            Route::post('/cases', [CreateCaseController::class, 'store'])->name('cases.store');
            Route::get('/cases/{dentalCase}/edit', [CreateCaseController::class, 'edit'])
                ->whereNumber('dentalCase')
                ->name('cases.edit');
            Route::put('/cases/{dentalCase}', [CreateCaseController::class, 'update'])
                ->whereNumber('dentalCase')
                ->name('cases.update');
            Route::get('/cases/drafts', [PortalCaseController::class, 'draft'])->name('cases.drafts');
        });

        Route::middleware('permission:cases.view')->group(function (): void {
            Route::get('/cases/active', [PortalCaseController::class, 'active'])->name('cases.active');
            Route::get('/cases/pending-reviews', [PortalCaseController::class, 'pendingReviews'])->name('cases.pending-reviews');
            Route::get('/cases/pending-reviews/{case}', [PortalCaseController::class, 'showReview'])->name('cases.pending-reviews.show');
            Route::get('/cases/manufacturing', [PortalCaseController::class, 'manufacturing'])->name('cases.manufacturing');
            Route::get('/cases/manufacturing/{case}', [PortalCaseController::class, 'showManufacturing'])->name('cases.manufacturing.show');
            Route::get('/cases/completed', [PortalCaseController::class, 'completed'])->name('cases.completed');
            Route::get('/cases/completed/{case}', [PortalCaseController::class, 'showCompleted'])->name('cases.completed.show');
            Route::get('/cases/{case}/files/download', [PortalCaseController::class, 'downloadFiles'])
                ->name('cases.files.download');
            Route::get('/cases/{case}', [PortalCaseController::class, 'show'])->name('cases.show');
        });

        Route::middleware('permission:billing.view')->group(function (): void {
            Route::get('/billing', PortalBillingController::class)->name('billing.index');
        });

        Route::middleware('permission:notifications.view')->group(function (): void {
            Route::get('/notifications', PortalNotificationsController::class)->name('notifications.index');
        });
    });

    // Lab + Designer collaborative file slots (outside submitter-only group)
    Route::middleware('permission:cases.view')->group(function (): void {
        Route::post('/cases/{dentalCase}/file-slots', [CaseFileSlotController::class, 'store'])
            ->whereNumber('dentalCase')
            ->name('cases.file-slots.store');
        Route::post('/cases/{dentalCase}/file-slots/{slot}/files', [CaseFileSlotController::class, 'upload'])
            ->whereNumber('dentalCase')
            ->whereNumber('slot')
            ->name('cases.file-slots.files.store');
        Route::delete('/cases/{dentalCase}/file-slots/{slot}', [CaseFileSlotController::class, 'destroy'])
            ->whereNumber('dentalCase')
            ->whereNumber('slot')
            ->name('cases.file-slots.destroy');
    });

    Route::prefix('designer')->name('designer.')->middleware('portal.type:'.AppPermissions::DESIGNER_ROLE)->group(function (): void {
        Route::middleware('permission:assignments.view')->group(function (): void {
            Route::get('/assigned', [DesignerPortalController::class, 'assigned'])->name('assigned');
            Route::get('/assigned/{case}', [DesignerPortalController::class, 'show'])->name('assigned.show');
        });

        Route::middleware('permission:designs.view')->group(function (): void {
            Route::get('/in-progress', [DesignerPortalController::class, 'inProgress'])->name('in-progress');
            Route::get('/revisions', [DesignerPortalController::class, 'revisions'])->name('revisions');
            Route::get('/submitted', [DesignerPortalController::class, 'submitted'])->name('submitted');
            Route::get('/completed', [DesignerPortalController::class, 'completed'])->name('completed');
        });

        Route::middleware('permission:cases.view')->group(function (): void {
            Route::get('/downloads', [DesignerPortalController::class, 'downloads'])->name('downloads');
        });

        Route::middleware('permission:notifications.view')->group(function (): void {
            Route::get('/notifications', [DesignerPortalController::class, 'notifications'])->name('notifications');
        });
    });

    Route::prefix('manufacturer')->name('manufacturer.')->middleware('portal.type:'.AppPermissions::MANUFACTURER_ROLE)->group(function (): void {
        Route::middleware('permission:manufacturing.view')->group(function (): void {
            Route::get('/assigned', [ManufacturerPortalController::class, 'assigned'])->name('assigned');
            Route::get('/assigned/{case}', [ManufacturerPortalController::class, 'showAssigned'])->name('assigned.show');
            Route::get('/in-production', [ManufacturerPortalController::class, 'inProduction'])->name('in-production');
            Route::get('/in-production/{case}', [ManufacturerPortalController::class, 'showInProduction'])->name('in-production.show');
            Route::get('/quality-check', [ManufacturerPortalController::class, 'qualityCheck'])->name('quality-check');
            Route::get('/quality-check/{case}', [ManufacturerPortalController::class, 'showQualityCheck'])->name('quality-check.show');
            Route::get('/ready-to-ship', [ManufacturerPortalController::class, 'readyToShip'])->name('ready-to-ship');
            Route::get('/ready-to-ship/{case}', [ManufacturerPortalController::class, 'showReadyToShip'])->name('ready-to-ship.show');
            Route::get('/shipped', [ManufacturerPortalController::class, 'shipped'])->name('shipped');
            Route::get('/shipped/{case}', [ManufacturerPortalController::class, 'showShipped'])->name('shipped.show');
            Route::get('/completed', [ManufacturerPortalController::class, 'completed'])->name('completed');
        });

        Route::middleware('permission:cases.view')->group(function (): void {
            Route::get('/downloads', [ManufacturerPortalController::class, 'downloads'])->name('downloads');
        });

        Route::middleware('permission:notifications.view')->group(function (): void {
            Route::get('/notifications', [ManufacturerPortalController::class, 'notifications'])->name('notifications');
        });
    });

    Route::middleware('permission:profile.view')->group(function (): void {
        Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
        Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
        Route::post('/profile/email-change/verify-current', [UserProfileController::class, 'verifyCurrentEmail'])
            ->middleware('throttle:6,1')
            ->name('user-profile.email-change.verify-current');
        Route::post('/profile/email-change/verify-new', [UserProfileController::class, 'verifyNewEmail'])
            ->middleware('throttle:6,1')
            ->name('user-profile.email-change.verify-new');
        Route::post('/profile/email-change/resend', [UserProfileController::class, 'resendEmailChangeCode'])
            ->middleware('throttle:6,1')
            ->name('user-profile.email-change.resend');
        Route::post('/profile/email-change/cancel', [UserProfileController::class, 'cancelEmailChange'])
            ->name('user-profile.email-change.cancel');
    });
});
