<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Model;

class ActiveIngredient extends Model
{
    protected $fillable = ['name'];

    protected $casts = [];

    public function medicines() { return $this->hasMany(\Modules\Catalog\Models\Medicine::class); }
}
