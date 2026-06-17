<?php
namespace Modules\Transfer\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransferItem extends Model
{
    protected $fillable = ['stock_transfer_id', 'medicine_id', 'quantity'];
    protected $casts = ['quantity' => 'integer'];

    public function transfer() { return $this->belongsTo(StockTransfer::class, 'stock_transfer_id'); }
    public function medicine() { return $this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
}
