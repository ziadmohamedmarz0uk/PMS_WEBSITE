<?php

namespace Modules\POS\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['branch_id', 'shift_id', 'customer_id', 'total_amount', 'payment_method', 'discount_amount', 'discount_type', 'status'];

    protected $casts = ['total_amount' => 'decimal:2'];

    public function branch() { return $this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function shift() { return $this->belongsTo(\Modules\Shift\Models\Shift::class); }
    public function customer() { return $this->belongsTo(\Modules\POS\Models\Customer::class); }
    public function items() { return $this->hasMany(\Modules\POS\Models\InvoiceItem::class); }
}
