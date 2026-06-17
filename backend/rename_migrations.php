<?php
// rename_migrations.php
$dir = __DIR__;
$migrations = glob($dir . '/Modules/*/database/migrations/*.php');
$order = [
    'create_branches_table.php' => '01',
    'create_audit_logs_table.php' => '02',
    'add_branch_id_to_users_table.php' => '03',
    'create_categories_table.php' => '04',
    'create_active_ingredients_table.php' => '05',
    'create_medicines_table.php' => '06',
    'create_customers_table.php' => '07',
    'create_shifts_table.php' => '08',
    'create_invoices_table.php' => '09',
    'create_invoice_items_table.php' => '10',
    'create_branch_inventories_table.php' => '11',
    'create_stock_transfers_table.php' => '12'
];

foreach ($migrations as $file) {
    $basename = basename($file);
    foreach ($order as $name => $idx) {
        if (str_ends_with($basename, $name)) {
            $newBasename = '2026_06_09_0000' . $idx . '_' . $name;
            $newFile = dirname($file) . '/' . $newBasename;
            if ($file !== $newFile) {
                rename($file, $newFile);
                echo "Renamed: $newBasename\n";
            }
        }
    }
}
