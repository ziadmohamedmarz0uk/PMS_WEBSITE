<?php

namespace Modules\Procurement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Procurement\Database\Factories\PurchaseOrderItemFactory;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['purchase_order_id', 'medicine_id', 'quantity', 'purchase_price', 'batch_number', 'expiry_date'];

    // protected static function newFactory(): PurchaseOrderItemFactory
    // {
    //     // return PurchaseOrderItemFactory::new();
    // }
}
