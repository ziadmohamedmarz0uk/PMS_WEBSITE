<?php
use Illuminate\Support\Facades\Route;
use Modules\POS\Http\Controllers\InvoiceController;
use Modules\POS\Http\Controllers\ReturnController;
use Modules\POS\Http\Controllers\DashboardController;

Route::prefix('v1/pos')->middleware('auth:sanctum')->group(function () {
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::post('invoices', [InvoiceController::class, 'store']);
    Route::get('invoices/{id}', [InvoiceController::class, 'show']);
    Route::post('returns', [ReturnController::class, 'store']);
    
    Route::middleware('admin')->group(function () {
        Route::get('dashboard/metrics', [DashboardController::class, 'metrics']);
        Route::get('reports/vat', [\Modules\POS\Http\Controllers\ReportController::class, 'vatReport']);
        Route::get('reports/category-profit', [\Modules\POS\Http\Controllers\ReportController::class, 'categoryProfitReport']);
    });
});
