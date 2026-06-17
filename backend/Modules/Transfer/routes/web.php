<?php

use Illuminate\Support\Facades\Route;
use Modules\Transfer\Http\Controllers\TransferController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('transfers', TransferController::class)->names('transfer');
});
