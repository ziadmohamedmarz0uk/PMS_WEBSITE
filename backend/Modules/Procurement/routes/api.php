<?php

use Illuminate\Support\Facades\Route;
use Modules\Procurement\Http\Controllers\ProcurementController;

Route::prefix('v1/procurement')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('suppliers', \Modules\Procurement\Http\Controllers\SupplierController::class);
    Route::get('purchase-orders', [\Modules\Procurement\Http\Controllers\PurchaseOrderController::class, 'index']);
    Route::post('purchase-orders', [\Modules\Procurement\Http\Controllers\PurchaseOrderController::class, 'store']);
    Route::post('purchase-orders/{id}/receive', [\Modules\Procurement\Http\Controllers\PurchaseOrderController::class, 'receive']);
});
