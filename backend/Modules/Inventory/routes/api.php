<?php
use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;
use Modules\Inventory\Http\Controllers\InventoryAdjustmentController;

Route::prefix('v1/inventory')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [InventoryController::class, 'index']);
    Route::get('/cross-branch/{medicine_id}', [InventoryController::class, 'crossBranchAvailability']);
    
    Route::middleware('admin')->group(function () {
        Route::post('/adjustments', [InventoryAdjustmentController::class, 'store']);
        Route::post('/adjustments/bulk', [InventoryAdjustmentController::class, 'bulkStore']);
        Route::get('/adjustments', [InventoryAdjustmentController::class, 'index']);
    });
});
