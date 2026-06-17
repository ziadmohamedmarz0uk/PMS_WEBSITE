<?php
use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\AuthController;

Route::prefix('v1/auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
});

Route::prefix('v1/admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('users', \Modules\Auth\Http\Controllers\UserController::class);
    Route::apiResource('branches', \Modules\Auth\Http\Controllers\BranchController::class);
});
