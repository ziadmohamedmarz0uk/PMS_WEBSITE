<?php

function appendMethod($filePath, $methodContent) {
    $content = file_get_contents($filePath);
    $content = preg_replace('/\}\s*$/', "\n$methodContent\n}\n", $content);
    file_put_contents($filePath, $content);
}

// 1. InventoryController
appendMethod(__DIR__ . '/Modules/Inventory/app/Http/Controllers/InventoryController.php', '
    public function crossBranchAvailability($medicine_id)
    {
        $currentBranch = auth()->user()->branch_id;
        $availability = \Modules\Inventory\Models\BranchInventory::with(\'branch\')
            ->where(\'medicine_id\', $medicine_id)
            ->where(\'branch_id\', \'!=\', $currentBranch)
            ->where(\'quantity\', \'>\', 0)
            ->get()
            ->map(function ($inv) {
                return [
                    \'branch_id\' => $inv->branch_id,
                    \'branch_name\' => $inv->branch->name,
                    \'quantity\' => $inv->quantity,
                ];
            });

        return response()->json([
            \'success\' => true,
            \'data\' => $availability,
            \'message\' => \'Cross-branch availability retrieved.\'
        ]);
    }
');

// Inventory Routes
$invRoutes = __DIR__ . '/Modules/Inventory/routes/api.php';
$invRContent = file_get_contents($invRoutes);
$invRContent = str_replace("Route::get('/', [InventoryController::class, 'index']);", "Route::get('/', [InventoryController::class, 'index']);\n    Route::get('/cross-branch/{medicine_id}', [InventoryController::class, 'crossBranchAvailability']);", $invRContent);
file_put_contents($invRoutes, $invRContent);

// 2. MedicineController
appendMethod(__DIR__ . '/Modules/Catalog/app/Http/Controllers/MedicineController.php', '
    public function alternatives($medicine_id)
    {
        $medicine = Medicine::findOrFail($medicine_id);
        $currentBranch = auth()->user()->branch_id;

        $alternatives = \Modules\Inventory\Models\BranchInventory::with([\'medicine\'])
            ->where(\'branch_id\', $currentBranch)
            ->where(\'quantity\', \'>\', 0)
            ->where(\'medicine_id\', \'!=\', $medicine_id)
            ->whereHas(\'medicine\', function($query) use ($medicine) {
                $query->where(\'active_ingredient_id\', $medicine->active_ingredient_id);
            })
            ->get();

        $formatted = $alternatives->map(function($inv) {
            $daysToExpiry = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($inv->expiry_date), false);
            $expiryStatus = \'Green\';
            if ($daysToExpiry < 30) $expiryStatus = \'Red\';
            elseif ($daysToExpiry <= 90) $expiryStatus = \'Yellow\';

            return [
                \'id\' => $inv->id,
                \'medicine_id\' => $inv->medicine_id,
                \'quantity\' => $inv->quantity,
                \'expiry_status\' => $expiryStatus,
                \'medicine\' => [
                    \'name\' => $inv->medicine->name,
                    \'barcode\' => $inv->medicine->barcode,
                    \'base_price\' => $inv->medicine->base_price,
                ]
            ];
        });

        return response()->json([
            \'success\' => true,
            \'data\' => $formatted,
            \'message\' => \'Alternatives retrieved.\'
        ]);
    }
');

// Catalog Routes
$catRoutes = __DIR__ . '/Modules/Catalog/routes/api.php';
$catRContent = file_get_contents($catRoutes);
$catRContent = str_replace("Route::apiResource('medicines', MedicineController::class)->except(['create', 'edit', 'destroy']);", "Route::apiResource('medicines', MedicineController::class)->except(['create', 'edit', 'destroy']);\n    Route::get('medicines/{medicine_id}/alternatives', [MedicineController::class, 'alternatives']);", $catRContent);
file_put_contents($catRoutes, $catRContent);

echo "Backend routes and controllers updated successfully.\n";
