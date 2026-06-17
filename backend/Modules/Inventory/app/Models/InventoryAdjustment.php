<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\InventoryAdjustmentFactory;

class InventoryAdjustment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['branch_id', 'user_id', 'medicine_id', 'batch_number', 'adjustment_type', 'quantity', 'reason'];

    // protected static function newFactory(): InventoryAdjustmentFactory
    // {
    //     // return InventoryAdjustmentFactory::new();
    // }
}
