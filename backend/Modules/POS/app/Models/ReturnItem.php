<?php

namespace Modules\POS\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\POS\Database\Factories\ReturnItemFactory;

class ReturnItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'return_invoice_id',
        'medicine_id',
        'quantity',
        'refund_amount'
    ];

    // protected static function newFactory(): ReturnItemFactory
    // {
    //     // return ReturnItemFactory::new();
    // }
}
