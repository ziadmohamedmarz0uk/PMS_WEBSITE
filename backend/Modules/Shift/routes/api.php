<?php
use Illuminate\Support\Facades\Route;
use Modules\Shift\Http\Controllers\ShiftController;

Route::prefix('v1/shifts')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ShiftController::class, 'index']);
    Route::post('start', [ShiftController::class, 'startShift']);
    Route::post('close', [ShiftController::class, 'closeShift']);
    Route::get('expenses', [\Modules\Shift\Http\Controllers\ExpenseController::class, 'index']);
    Route::post('expenses', [\Modules\Shift\Http\Controllers\ExpenseController::class, 'store']);
});
