<?php

namespace Modules\Procurement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Procurement\Database\Factories\SupplierFactory;

class Supplier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['name', 'contact_number', 'email', 'address', 'balance'];

    // protected static function newFactory(): SupplierFactory
    // {
    //     // return SupplierFactory::new();
    // }
}
