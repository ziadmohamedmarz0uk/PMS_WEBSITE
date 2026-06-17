<?php
use Illuminate\Support\Facades\Route;
use Modules\Catalog\Http\Controllers\CategoryController;
use Modules\Catalog\Http\Controllers\MedicineController;
use Modules\Catalog\Http\Controllers\ActiveIngredientController;

Route::prefix('v1/catalog')->middleware('auth:sanctum')->group(function () {
    // Public (Cashier & Admin)
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('active-ingredients', [ActiveIngredientController::class, 'index']);
    Route::get('medicines', [MedicineController::class, 'index']);
    Route::get('medicines/{medicine}', [MedicineController::class, 'show']);
    Route::get('medicines/{medicine_id}/alternatives', [MedicineController::class, 'alternatives']);

    // Admin Only
    Route::middleware('admin')->group(function () {
        Route::post('categories', [CategoryController::class, 'store']);
        Route::post('active-ingredients', [ActiveIngredientController::class, 'store']);
        Route::post('medicines', [MedicineController::class, 'store']);
        Route::put('medicines/{medicine}', [MedicineController::class, 'update']);
        Route::patch('medicines/{medicine}', [MedicineController::class, 'update']);
    });
});
