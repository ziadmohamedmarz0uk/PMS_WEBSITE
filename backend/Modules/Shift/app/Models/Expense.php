<?php

namespace Modules\Shift\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Shift\Database\Factories\ExpenseFactory;

class Expense extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'shift_id',
        'branch_id',
        'amount',
        'reason'
    ];

    public function shift()
    {
        return $this->belongsTo(\Modules\Shift\Models\Shift::class);
    }

    public function branch()
    {
        return $this->belongsTo(\Modules\Auth\Models\Branch::class);
    }
}
