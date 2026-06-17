<?php

namespace Modules\Auth\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'branch_id', 'action', 'entity_type', 'entity_id', 'timestamp'];

    protected $casts = ['timestamp' => 'datetime'];

    public function user() { return $this->belongsTo(\App\Models\User::class); }
    public function branch() { return $this->belongsTo(\Modules\Auth\Models\Branch::class); }
}
