<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminFactureController;
use App\Http\Controllers\AdminPaiementController;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public contact route
Route::post('/contact', [ContactController::class, 'store']);

// Protected routes - require authentication
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/activities', [ActivityController::class, 'index']);

    // Factures (Invoices)
    Route::get('/factures', [FactureController::class, 'index']);
    Route::get('/factures/recent', [FactureController::class, 'recent']);
    Route::get('/factures/unseen', [FactureController::class, 'unseen']);
    Route::get('/factures/{id}', [FactureController::class, 'show']);
    Route::get('/factures/check/{reference}', [FactureController::class, 'checkByReference']);
    Route::post('/factures', [FactureController::class, 'store']);
    Route::put('/factures/{id}/pay', [FactureController::class, 'pay']);

    // Paiements (Payments)
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements', [PaiementController::class, 'store']);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'userById'])->whereNumber('id');
        Route::get('/messages', [AdminController::class, 'messages']);
        Route::post('/messages/{id}/reply', [AdminController::class, 'replyToMessage'])->whereNumber('id');
        Route::get('/factures', [AdminFactureController::class, 'index']);
        Route::post('/factures', [AdminFactureController::class, 'store']);
        Route::put('/factures/{id}/validate', [AdminFactureController::class, 'validatePayment']);
        Route::put('/factures/{id}/accept', [AdminFactureController::class, 'accept']);
        Route::put('/factures/{id}/reject', [AdminFactureController::class, 'reject']);
        Route::put('/factures/{id}/pending', [AdminFactureController::class, 'pending']);
        Route::get('/paiements', [AdminPaiementController::class, 'index']);
        Route::put('/paiements/{id}/accept', [AdminPaiementController::class, 'accept'])->whereNumber('id');
        Route::put('/paiements/{id}/reject', [AdminPaiementController::class, 'reject'])->whereNumber('id');
    });
});
