<?php

namespace Modules\POS\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\POS\Database\Factories\ReturnInvoiceFactory;

class ReturnInvoice extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'invoice_id',
        'shift_id',
        'branch_id',
        'total_refund_amount'
    ];

    // protected static function newFactory(): ReturnInvoiceFactory
    // {
    //     // return ReturnInvoiceFactory::new();
    // }
}
