<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$m = \Modules\Catalog\Models\Medicine::first();
if ($m) {
    $m->update([
        'has_sub_unit' => true,
        'sub_unit_name' => 'Strip',
        'sub_units_per_box' => 3,
        'sub_unit_price' => round($m->base_price / 3, 2)
    ]);
    echo "Updated " . $m->name . "\n";
} else {
    echo "No medicines found.\n";
}
