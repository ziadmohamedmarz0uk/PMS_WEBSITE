<?php

namespace Modules\Procurement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Procurement\Database\Factories\PurchaseOrderFactory;

class PurchaseOrder extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['supplier_id', 'branch_id', 'user_id', 'status', 'total_cost', 'received_at'];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // protected static function newFactory(): PurchaseOrderFactory
    // {
    //     // return PurchaseOrderFactory::new();
    // }
}
