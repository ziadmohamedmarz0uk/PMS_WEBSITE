<?php

namespace Modules\POS\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = ['invoice_id', 'medicine_id', 'quantity', 'unit_price', 'subtotal', 'is_sub_unit'];

    protected $casts = ['quantity' => 'integer', 'unit_price' => 'decimal:2', 'subtotal' => 'decimal:2', 'is_sub_unit' => 'boolean'];

    public function invoice() { return $this->belongsTo(\Modules\POS\Models\Invoice::class); }
    public function medicine() { return $this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
}
