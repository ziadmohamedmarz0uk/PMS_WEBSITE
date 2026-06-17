<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class BranchInventory extends Model
{
    protected $fillable = ['branch_id', 'medicine_id', 'quantity', 'expiry_date', 'batch_number'];

    protected $casts = ['expiry_date' => 'date', 'quantity' => 'integer'];

    public function branch() { return $this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function medicine() { return $this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
}
