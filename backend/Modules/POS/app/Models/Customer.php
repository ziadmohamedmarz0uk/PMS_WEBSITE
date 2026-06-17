<?php

namespace Modules\POS\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'loyalty_points'];

    protected $casts = ['loyalty_points' => 'integer'];

    public function invoices() { return $this->hasMany(\Modules\POS\Models\Invoice::class); }
}
