<?php

use Illuminate\Support\Facades\Route;
use Modules\POS\Http\Controllers\POSController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('pos', POSController::class)->names('pos');
});
