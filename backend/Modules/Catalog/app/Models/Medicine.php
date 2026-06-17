<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = ['name', 'scientific_name', 'barcode', 'base_price', 'purchase_price', 'category_id', 'active_ingredient_id', 'has_sub_unit', 'sub_unit_name', 'sub_units_per_box', 'sub_unit_price'];

    protected $casts = ['base_price' => 'decimal:2', 'purchase_price' => 'decimal:2', 'has_sub_unit' => 'boolean', 'sub_unit_price' => 'decimal:2'];

    public function category() { return $this->belongsTo(\Modules\Catalog\Models\Category::class); }
    public function activeIngredient() { return $this->belongsTo(\Modules\Catalog\Models\ActiveIngredient::class); }
    public function branchInventories() { return $this->hasMany(\Modules\Inventory\Models\BranchInventory::class); }
    public function invoiceItems() { return $this->hasMany(\Modules\POS\Models\InvoiceItem::class); }
}
