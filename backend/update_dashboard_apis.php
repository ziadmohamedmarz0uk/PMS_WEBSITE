<?php

function appendMethod($filePath, $methodContent) {
    $content = file_get_contents($filePath);
    $content = preg_replace('/\}\s*$/', "\n$methodContent\n}\n", $content);
    file_put_contents($filePath, $content);
}

// 1. Dashboard Metrics
$dashboardPath = __DIR__ . '/Modules/POS/app/Http/Controllers/DashboardController.php';
file_put_contents($dashboardPath, '<?php
namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\POS\Models\Invoice;
use Modules\Inventory\Models\BranchInventory;

class DashboardController extends Controller
{
    public function metrics()
    {
        $user = auth()->user();
        $isManager = $user->role === \'BranchManager\';

        $invoicesQuery = Invoice::query();
        $inventoryQuery = BranchInventory::query();

        if ($isManager) {
            $invoicesQuery->where(\'branch_id\', $user->branch_id);
            $inventoryQuery->where(\'branch_id\', $user->branch_id);
        }

        return response()->json([
            \'success\' => true,
            \'data\' => [
                \'total_sales\' => (clone $invoicesQuery)->count(),
                \'total_revenue\' => (clone $invoicesQuery)->sum(\'grand_total\'),
                \'expiring_items\' => (clone $inventoryQuery)->where(\'quantity\', \'>\', 0)->where(\'expiry_date\', \'<=\', now()->addDays(90))->count(),
                \'shortages\' => (clone $inventoryQuery)->where(\'quantity\', 0)->count(),
            ]
        ]);
    }
}
');

$posRoutes = __DIR__ . '/Modules/POS/routes/api.php';
$posRContent = file_get_contents($posRoutes);
$posRContent = str_replace("Route::post('invoices', [InvoiceController::class, 'store']);", "Route::post('invoices', [InvoiceController::class, 'store']);\n    Route::get('dashboard/metrics', [\Modules\POS\Http\Controllers\DashboardController::class, 'metrics']);", $posRContent);
file_put_contents($posRoutes, $posRContent);


// 2. ShiftController index
appendMethod(__DIR__ . '/Modules/Shift/app/Http/Controllers/ShiftController.php', '
    public function index()
    {
        $user = auth()->user();
        $query = \Modules\Shift\Models\Shift::with(\'user\')->orderBy(\'created_at\', \'desc\');
        if ($user->role === \'BranchManager\') {
            $query->where(\'branch_id\', $user->branch_id);
        }
        return \Modules\Shift\Transformers\ShiftResource::collection($query->get());
    }
');

$shiftRoutes = __DIR__ . '/Modules/Shift/routes/api.php';
$shiftRContent = file_get_contents($shiftRoutes);
if (strpos($shiftRContent, "Route::get('/', [ShiftController::class, 'index']);") === false) {
    $shiftRContent = str_replace("Route::post('start', [ShiftController::class, 'startShift']);", "Route::get('/', [ShiftController::class, 'index']);\n    Route::post('start', [ShiftController::class, 'startShift']);", $shiftRContent);
    file_put_contents($shiftRoutes, $shiftRContent);
}

// 3. TransferController index
appendMethod(__DIR__ . '/Modules/Transfer/app/Http/Controllers/TransferController.php', '
    public function index()
    {
        $user = auth()->user();
        $query = \Modules\Transfer\Models\StockTransfer::with([\'fromBranch\', \'toBranch\', \'items.medicine\'])->orderBy(\'created_at\', \'desc\');
        if ($user->role === \'BranchManager\') {
            $query->where(function($q) use ($user) {
                $q->where(\'from_branch_id\', $user->branch_id)
                  ->orWhere(\'to_branch_id\', $user->branch_id);
            });
        }
        return response()->json([\'success\'=>true, \'data\'=>$query->get()]);
    }
');

$transferRoutes = __DIR__ . '/Modules/Transfer/routes/api.php';
$transferRContent = file_get_contents($transferRoutes);
if (strpos($transferRContent, "Route::get('/', [TransferController::class, 'index']);") === false) {
    $transferRContent = str_replace("Route::post('/', [TransferController::class, 'store']);", "Route::get('/', [TransferController::class, 'index']);\n    Route::post('/', [TransferController::class, 'store']);", $transferRContent);
    file_put_contents($transferRoutes, $transferRContent);
}

echo "Dashboard Backend Setup Complete\n";
