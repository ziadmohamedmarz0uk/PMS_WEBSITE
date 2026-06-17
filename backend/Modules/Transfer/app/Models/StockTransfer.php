<?php

namespace Modules\Transfer\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    protected $fillable = ['from_branch', 'to_branch', 'status'];

    protected $casts = [];

    public function sourceBranch()
    {
        return $this->belongsTo(\Modules\Auth\Models\Branch::class, 'from_branch');
    }

    public function destinationBranch()
    {
        return $this->belongsTo(\Modules\Auth\Models\Branch::class, 'to_branch');
    }

    public function items()
    {
        return $this->hasMany(StockTransferItem::class, 'stock_transfer_id');
    }
}
