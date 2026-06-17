<?php
use Illuminate\Support\Facades\Route;
Route::get('test-cors', function() {
    return response()->json(config('cors'));
});
