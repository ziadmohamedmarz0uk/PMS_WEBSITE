<?php
$models = [
    'Modules/Auth/app/Models/Branch.php' => [
        'namespace' => 'Modules\Auth\Models',
        'class' => 'Branch',
        'fillable' => "['name', 'location']",
        'casts' => "[]",
        'relations' => "
    public function users() { return \$this->hasMany(\App\Models\User::class); }
    public function inventories() { return \$this->hasMany(\Modules\Inventory\Models\BranchInventory::class); }
    public function shifts() { return \$this->hasMany(\Modules\Shift\Models\Shift::class); }
    public function invoices() { return \$this->hasMany(\Modules\POS\Models\Invoice::class); }
    public function stockTransfersFrom() { return \$this->hasMany(\Modules\Transfer\Models\StockTransfer::class, 'from_branch'); }
    public function stockTransfersTo() { return \$this->hasMany(\Modules\Transfer\Models\StockTransfer::class, 'to_branch'); }
"
    ],
    'Modules/Auth/app/Models/AuditLog.php' => [
        'namespace' => 'Modules\Auth\Models',
        'class' => 'AuditLog',
        'fillable' => "['user_id', 'branch_id', 'action', 'entity_type', 'entity_id', 'timestamp']",
        'casts' => "['timestamp' => 'datetime']",
        'relations' => "
    public function user() { return \$this->belongsTo(\App\Models\User::class); }
    public function branch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class); }
"
    ],
    'Modules/Catalog/app/Models/Category.php' => [
        'namespace' => 'Modules\Catalog\Models',
        'class' => 'Category',
        'fillable' => "['name']",
        'casts' => "[]",
        'relations' => "
    public function medicines() { return \$this->hasMany(\Modules\Catalog\Models\Medicine::class); }
"
    ],
    'Modules/Catalog/app/Models/ActiveIngredient.php' => [
        'namespace' => 'Modules\Catalog\Models',
        'class' => 'ActiveIngredient',
        'fillable' => "['name']",
        'casts' => "[]",
        'relations' => "
    public function medicines() { return \$this->hasMany(\Modules\Catalog\Models\Medicine::class); }
"
    ],
    'Modules/Catalog/app/Models/Medicine.php' => [
        'namespace' => 'Modules\Catalog\Models',
        'class' => 'Medicine',
        'fillable' => "['name', 'scientific_name', 'barcode', 'base_price', 'purchase_price', 'category_id', 'active_ingredient_id']",
        'casts' => "['base_price' => 'decimal:2', 'purchase_price' => 'decimal:2']",
        'relations' => "
    public function category() { return \$this->belongsTo(\Modules\Catalog\Models\Category::class); }
    public function activeIngredient() { return \$this->belongsTo(\Modules\Catalog\Models\ActiveIngredient::class); }
    public function branchInventories() { return \$this->hasMany(\Modules\Inventory\Models\BranchInventory::class); }
    public function invoiceItems() { return \$this->hasMany(\Modules\POS\Models\InvoiceItem::class); }
"
    ],
    'Modules/Inventory/app/Models/BranchInventory.php' => [
        'namespace' => 'Modules\Inventory\Models',
        'class' => 'BranchInventory',
        'fillable' => "['branch_id', 'medicine_id', 'quantity', 'expiry_date', 'batch_number']",
        'casts' => "['expiry_date' => 'date', 'quantity' => 'integer']",
        'relations' => "
    public function branch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function medicine() { return \$this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
"
    ],
    'Modules/POS/app/Models/Customer.php' => [
        'namespace' => 'Modules\POS\Models',
        'class' => 'Customer',
        'fillable' => "['name', 'phone', 'loyalty_points']",
        'casts' => "['loyalty_points' => 'integer']",
        'relations' => "
    public function invoices() { return \$this->hasMany(\Modules\POS\Models\Invoice::class); }
"
    ],
    'Modules/Shift/app/Models/Shift.php' => [
        'namespace' => 'Modules\Shift\Models',
        'class' => 'Shift',
        'fillable' => "['user_id', 'branch_id', 'start_time', 'end_time', 'status', 'actual_cash_submitted', 'expected_cash']",
        'casts' => "['start_time' => 'datetime', 'end_time' => 'datetime', 'actual_cash_submitted' => 'decimal:2', 'expected_cash' => 'decimal:2']",
        'relations' => "
    public function user() { return \$this->belongsTo(\App\Models\User::class); }
    public function branch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function invoices() { return \$this->hasMany(\Modules\POS\Models\Invoice::class); }
"
    ],
    'Modules/POS/app/Models/Invoice.php' => [
        'namespace' => 'Modules\POS\Models',
        'class' => 'Invoice',
        'fillable' => "['branch_id', 'shift_id', 'customer_id', 'total_amount', 'status']",
        'casts' => "['total_amount' => 'decimal:2']",
        'relations' => "
    public function branch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function shift() { return \$this->belongsTo(\Modules\Shift\Models\Shift::class); }
    public function customer() { return \$this->belongsTo(\Modules\POS\Models\Customer::class); }
    public function items() { return \$this->hasMany(\Modules\POS\Models\InvoiceItem::class); }
"
    ],
    'Modules/POS/app/Models/InvoiceItem.php' => [
        'namespace' => 'Modules\POS\Models',
        'class' => 'InvoiceItem',
        'fillable' => "['invoice_id', 'medicine_id', 'quantity', 'unit_price', 'subtotal']",
        'casts' => "['quantity' => 'integer', 'unit_price' => 'decimal:2', 'subtotal' => 'decimal:2']",
        'relations' => "
    public function invoice() { return \$this->belongsTo(\Modules\POS\Models\Invoice::class); }
    public function medicine() { return \$this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
"
    ],
    'Modules/Transfer/app/Models/StockTransfer.php' => [
        'namespace' => 'Modules\Transfer\Models',
        'class' => 'StockTransfer',
        'fillable' => "['from_branch', 'to_branch', 'status']",
        'casts' => "[]",
        'relations' => "
    public function sourceBranch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class, 'from_branch'); }
    public function destinationBranch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class, 'to_branch'); }
"
    ]
];

foreach ($models as $path => $data) {
    $dir = dirname(__DIR__ . '/' . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    $content = "<?php\n\nnamespace {$data['namespace']};\n\nuse Illuminate\Database\Eloquent\Model;\n\nclass {$data['class']} extends Model\n{\n    protected \$fillable = {$data['fillable']};\n\n    protected \$casts = {$data['casts']};\n{$data['relations']}}\n";
    
    file_put_contents(__DIR__ . '/' . $path, $content);
}

// Update User Model
$userModelPath = __DIR__ . '/app/Models/User.php';
$userContent = file_get_contents($userModelPath);
if (strpos($userContent, 'branch()') === false) {
    // Add fillable branch_id
    $userContent = preg_replace('/protected \$fillable = \[\s+/', "protected \$fillable = [\n        'branch_id',\n        ", $userContent);
    // Add relations
    $relations = "
    public function branch() { return \$this->belongsTo(\Modules\Auth\Models\Branch::class); }
    public function shifts() { return \$this->hasMany(\Modules\Shift\Models\Shift::class); }
    public function auditLogs() { return \$this->hasMany(\Modules\Auth\Models\AuditLog::class); }
";
    $userContent = preg_replace('/\}$/', $relations . "}\n", $userContent);
    file_put_contents($userModelPath, $userContent);
}
echo "Models generated successfully.\n";
