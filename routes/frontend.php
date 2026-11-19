<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\RoutePath;

Route::redirect('/', '/login')->name('home');

$guard = config('fortify.guard');
$limiter = config('fortify.limiters.login');

Route::middleware('guest:'.$guard)->group(function () use ($limiter): void {
    Route::get(RoutePath::for('login', '/login'), [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post(RoutePath::for('login', '/login'), [AuthenticatedSessionController::class, 'store'])
        ->middleware(array_filter([
            $limiter ? 'throttle:'.$limiter : null,
        ]))
        ->name('login.store');
});

Route::post(RoutePath::for('logout', '/logout'), [AuthenticatedSessionController::class, 'destroy'])
    ->middleware(config('fortify.auth_middleware', 'auth').':'.$guard)
    ->name('logout');
