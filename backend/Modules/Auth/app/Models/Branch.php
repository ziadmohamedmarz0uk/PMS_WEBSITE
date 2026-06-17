<?php

namespace Modules\Auth\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name', 'location', 'contact_number', 'status'];

    protected $casts = ['status' => 'string'];

    public function users() { return $this->hasMany(\App\Models\User::class); }
    public function inventories() { return $this->hasMany(\Modules\Inventory\Models\BranchInventory::class); }
    public function shifts() { return $this->hasMany(\Modules\Shift\Models\Shift::class); }
    public function invoices() { return $this->hasMany(\Modules\POS\Models\Invoice::class); }
    public function stockTransfersFrom() { return $this->hasMany(\Modules\Transfer\Models\StockTransfer::class, 'from_branch'); }
    public function stockTransfersTo() { return $this->hasMany(\Modules\Transfer\Models\StockTransfer::class, 'to_branch'); }
}
