<?php

namespace Modules\Shift\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = ['opening_cash', 'user_id', 'branch_id', 'start_time', 'end_time', 'status', 'actual_cash_submitted', 'expected_cash'];

    protected $casts = ['start_time' => 'datetime',
        'opening_cash' => 'decimal:2', 'end_time' => 'datetime',
        'opening_cash' => 'decimal:2', 'actual_cash_submitted' => 'decimal:2', 'expected_cash' => 'decimal:2'];

    public function user() { return $this->belongsTo(\App\Models\User::class); }
    public function branch() { return $this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function invoices() { return $this->hasMany(\Modules\POS\Models\Invoice::class); }
}
