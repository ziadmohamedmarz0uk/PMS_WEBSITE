<?php
use Illuminate\Support\Facades\Route;
use Modules\Transfer\Http\Controllers\TransferController;

Route::prefix('v1/transfers')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [TransferController::class, 'index']);
    Route::post('/', [TransferController::class, 'store']);
    Route::put('/{transfer}/status', [TransferController::class, 'updateStatus']);
});
