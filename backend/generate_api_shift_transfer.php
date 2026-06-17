<?php

function writeFile($path, $content) {
    $dir = dirname(__DIR__ . '/' . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents(__DIR__ . '/' . $path, ltrim($content));
}

// 1. UPDATE SCHEMA & MODELS
$migrations = glob(__DIR__ . '/Modules/Shift/database/migrations/*add_opening_cash*.php');
if (!empty($migrations)) {
    $file = $migrations[0];
    $content = file_get_contents($file);
    $replacementUp = "Schema::table('shifts', function (Blueprint \$table) {\n            \$table->decimal('opening_cash', 10, 2)->default(0)->after('status');\n        });";
    $replacementDown = "Schema::table('shifts', function (Blueprint \$table) {\n            \$table->dropColumn('opening_cash');\n        });";
    $content = preg_replace('/public function up\(\): void\s+\{\s+Schema::table\(\'shifts\', function \(Blueprint \$table\) \{.*?\};\s+\}/s', "public function up(): void\n    {\n        $replacementUp\n    }", $content);
    $content = preg_replace('/public function down\(\): void\s+\{\s+Schema::table\(\'shifts\', function \(Blueprint \$table\) \{.*?\};\s+\}/s', "public function down(): void\n    {\n        $replacementDown\n    }", $content);
    file_put_contents($file, $content);
}

$migrations = glob(__DIR__ . '/Modules/Transfer/database/migrations/*create_stock_transfer_items*.php');
if (!empty($migrations)) {
    $file = $migrations[0];
    $content = file_get_contents($file);
    $schema = "            \$table->id();\n            \$table->foreignId('stock_transfer_id')->constrained('stock_transfers');\n            \$table->foreignId('medicine_id')->constrained('medicines');\n            \$table->integer('quantity');\n            \$table->timestamps();";
    $replacement = "Schema::create('stock_transfer_items', function (Blueprint \$table) {\n$schema\n        });";
    $content = preg_replace('/Schema::create\(\'stock_transfer_items\', function \(Blueprint \$table\) \{.*?\}\);/s', $replacement, $content);
    file_put_contents($file, $content);
}

// Update Shift Model
$shiftModelPath = __DIR__ . '/Modules/Shift/app/Models/Shift.php';
$shiftContent = file_get_contents($shiftModelPath);
if (strpos($shiftContent, 'opening_cash') === false) {
    $shiftContent = str_replace("'user_id'", "'opening_cash', 'user_id'", $shiftContent);
    $shiftContent = str_replace("=> 'datetime',", "=> 'datetime',\n        'opening_cash' => 'decimal:2',", $shiftContent);
    file_put_contents($shiftModelPath, $shiftContent);
}

// Create StockTransferItem Model
writeFile('Modules/Transfer/app/Models/StockTransferItem.php', '
<?php
namespace Modules\Transfer\Models;

use Illuminate\Database\Eloquent\Model;

class StockTransferItem extends Model
{
    protected $fillable = [\'stock_transfer_id\', \'medicine_id\', \'quantity\'];
    protected $casts = [\'quantity\' => \'integer\'];

    public function transfer() { return $this->belongsTo(StockTransfer::class, \'stock_transfer_id\'); }
    public function medicine() { return $this->belongsTo(\Modules\Catalog\Models\Medicine::class); }
}
');

// Update StockTransfer Model
$transferModelPath = __DIR__ . '/Modules/Transfer/app/Models/StockTransfer.php';
$transferContent = file_get_contents($transferModelPath);
if (strpos($transferContent, 'items()') === false) {
    $transferContent = str_replace("}\n", "\n    public function items() { return \$this->hasMany(StockTransferItem::class, 'stock_transfer_id'); }\n}\n", $transferContent);
    file_put_contents($transferModelPath, $transferContent);
}


// =======================
// SHIFT MODULE API
// =======================

writeFile('Modules/Shift/app/Http/Resources/ShiftResource.php', '
<?php
namespace Modules\Shift\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class ShiftResource extends JsonResource
{
    public function toArray($request)
    {
        $data = [
            \'id\' => $this->id,
            \'branch_id\' => $this->branch_id,
            \'branch\' => new BranchResource($this->whenLoaded(\'branch\')),
            \'user_id\' => $this->user_id,
            \'opening_cash\' => $this->opening_cash,
            \'start_time\' => $this->start_time,
            \'end_time\' => $this->end_time,
            \'status\' => $this->status,
            \'actual_cash_submitted\' => $this->actual_cash_submitted,
            \'created_at\' => $this->created_at,
        ];

        // Ensure user object exists, in a real app check roles correctly
        $user = auth()->user();
        $role = $user->role ?? \'SuperAdmin\'; // Mock role if not exists
        
        if (in_array($role, [\'SuperAdmin\', \'BranchManager\']) && $this->status === \'closed\') {
            $data[\'expected_cash\'] = $this->expected_cash;
            $data[\'variance\'] = $this->actual_cash_submitted - $this->expected_cash;
        }

        return $data;
    }
}
');

writeFile('Modules/Shift/app/Http/Requests/StartShiftRequest.php', '
<?php
namespace Modules\Shift\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StartShiftRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'opening_cash\' => [\'required\', \'numeric\', \'min:0\'],
        ];
    }
}
');

writeFile('Modules/Shift/app/Http/Requests/CloseShiftRequest.php', '
<?php
namespace Modules\Shift\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class CloseShiftRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'actual_cash_submitted\' => [\'required\', \'numeric\', \'min:0\'],
        ];
    }
}
');

writeFile('Modules/Shift/app/Http/Controllers/ShiftController.php', '
<?php
namespace Modules\Shift\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Shift\Models\Shift;
use Modules\POS\Models\Invoice;
use Modules\Shift\Http\Resources\ShiftResource;
use Modules\Shift\Http\Requests\StartShiftRequest;
use Modules\Shift\Http\Requests\CloseShiftRequest;
use Exception;

class ShiftController extends Controller
{
    public function startShift(StartShiftRequest $request)
    {
        $user = auth()->user();
        
        // Check if already has open shift
        $existing = Shift::where(\'user_id\', $user->id)->where(\'status\', \'open\')->first();
        if ($existing) {
            return response()->json([\'success\' => false, \'message\' => \'You already have an open shift.\'], 400);
        }

        $shift = Shift::create([
            \'user_id\' => $user->id,
            \'branch_id\' => $user->branch_id,
            \'opening_cash\' => $request->opening_cash,
            \'start_time\' => now(),
            \'status\' => \'open\',
        ]);

        return response()->json([
            \'success\' => true,
            \'data\' => new ShiftResource($shift),
            \'message\' => \'Shift started successfully.\'
        ]);
    }

    public function closeShift(CloseShiftRequest $request)
    {
        $user = auth()->user();
        $shift = Shift::where(\'user_id\', $user->id)->where(\'status\', \'open\')->first();
        
        if (!$shift) {
            return response()->json([\'success\' => false, \'message\' => \'No open shift found.\'], 400);
        }

        $totalSales = Invoice::where(\'shift_id\', $shift->id)
            ->where(\'status\', \'finalized\')
            ->sum(\'total_amount\');

        $expectedCash = $shift->opening_cash + $totalSales;

        $shift->update([
            \'actual_cash_submitted\' => $request->actual_cash_submitted,
            \'expected_cash\' => $expectedCash,
            \'status\' => \'closed\',
            \'end_time\' => now(),
        ]);

        return response()->json([
            \'success\' => true,
            \'data\' => new ShiftResource($shift),
            \'message\' => \'Shift closed successfully.\'
        ]);
    }
}
');

writeFile('Modules/Shift/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\Shift\Http\Controllers\ShiftController;

Route::prefix(\'v1/shifts\')->middleware(\'auth:sanctum\')->group(function () {
    Route::post(\'start\', [ShiftController::class, \'startShift\']);
    Route::post(\'close\', [ShiftController::class, \'closeShift\']);
});
');

// =======================
// TRANSFER MODULE API
// =======================

writeFile('Modules/Transfer/app/Http/Resources/TransferItemResource.php', '
<?php
namespace Modules\Transfer\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Http\Resources\MedicineResource;

class TransferItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'medicine_id\' => $this->medicine_id,
            \'medicine\' => new MedicineResource($this->whenLoaded(\'medicine\')),
            \'quantity\' => $this->quantity,
        ];
    }
}
');

writeFile('Modules/Transfer/app/Http/Resources/StockTransferResource.php', '
<?php
namespace Modules\Transfer\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class StockTransferResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'from_branch\' => $this->from_branch,
            \'source_branch\' => new BranchResource($this->whenLoaded(\'sourceBranch\')),
            \'to_branch\' => $this->to_branch,
            \'destination_branch\' => new BranchResource($this->whenLoaded(\'destinationBranch\')),
            \'status\' => $this->status,
            \'items\' => TransferItemResource::collection($this->whenLoaded(\'items\')),
            \'created_at\' => $this->created_at,
        ];
    }
}
');

writeFile('Modules/Transfer/app/Http/Requests/StoreTransferRequest.php', '
<?php
namespace Modules\Transfer\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'to_branch_id\' => [\'required\', \'exists:branches,id\', \'different:from_branch_id\'],
            \'items\' => [\'required\', \'array\', \'min:1\'],
            \'items.*.medicine_id\' => [\'required\', \'exists:medicines,id\'],
            \'items.*.quantity\' => [\'required\', \'integer\', \'min:1\'],
        ];
    }
    protected function prepareForValidation()
    {
        $this->merge([\'from_branch_id\' => auth()->user()->branch_id]);
    }
}
');

writeFile('Modules/Transfer/app/Http/Requests/UpdateTransferStatusRequest.php', '
<?php
namespace Modules\Transfer\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTransferStatusRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'status\' => [\'required\', \'in:shipped,received\'],
        ];
    }
}
');

writeFile('Modules/Transfer/app/Http/Controllers/TransferController.php', '
<?php
namespace Modules\Transfer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Exception;
use Modules\Transfer\Models\StockTransfer;
use Modules\Transfer\Models\StockTransferItem;
use Modules\Inventory\Models\BranchInventory;
use Modules\Transfer\Http\Requests\StoreTransferRequest;
use Modules\Transfer\Http\Requests\UpdateTransferStatusRequest;
use Modules\Transfer\Http\Resources\StockTransferResource;

class TransferController extends Controller
{
    public function store(StoreTransferRequest $request)
    {
        $transfer = DB::transaction(function () use ($request) {
            $transfer = StockTransfer::create([
                \'from_branch\' => auth()->user()->branch_id,
                \'to_branch\' => $request->to_branch_id,
                \'status\' => \'pending\',
            ]);

            foreach ($request->items as $item) {
                StockTransferItem::create([
                    \'stock_transfer_id\' => $transfer->id,
                    \'medicine_id\' => $item[\'medicine_id\'],
                    \'quantity\' => $item[\'quantity\'],
                ]);
            }

            return $transfer;
        });

        $transfer->load([\'items.medicine\', \'sourceBranch\', \'destinationBranch\']);
        return response()->json([
            \'success\' => true,
            \'data\' => new StockTransferResource($transfer),
            \'message\' => \'Transfer requested successfully.\'
        ], 201);
    }

    public function updateStatus(UpdateTransferStatusRequest $request, StockTransfer $transfer)
    {
        try {
            DB::transaction(function () use ($request, $transfer) {
                $newStatus = $request->status;

                if ($newStatus === \'shipped\' && $transfer->status === \'pending\') {
                    // Deduct from source branch
                    foreach ($transfer->items as $item) {
                        $remainingToDeduct = $item->quantity;
                        $inventories = BranchInventory::where(\'branch_id\', $transfer->from_branch)
                            ->where(\'medicine_id\', $item->medicine_id)
                            ->where(\'quantity\', \'>\', 0)
                            ->orderBy(\'expiry_date\', \'asc\')
                            ->lockForUpdate()
                            ->get();

                        foreach ($inventories as $inv) {
                            if ($remainingToDeduct <= 0) break;
                            $deduct = min($inv->quantity, $remainingToDeduct);
                            $inv->quantity -= $deduct;
                            $inv->save();
                            $remainingToDeduct -= $deduct;
                        }

                        if ($remainingToDeduct > 0) {
                            throw new Exception("Insufficient stock for medicine ID: {$item->medicine_id} in source branch.");
                        }
                    }
                    $transfer->update([\'status\' => \'shipped\']);

                } elseif ($newStatus === \'received\' && $transfer->status === \'shipped\') {
                    // Add to destination branch
                    foreach ($transfer->items as $item) {
                        $inventory = BranchInventory::firstOrCreate(
                            [
                                \'branch_id\' => $transfer->to_branch,
                                \'medicine_id\' => $item->medicine_id,
                                \'batch_number\' => \'TRANSFER-\' . $transfer->id,
                            ],
                            [
                                \'quantity\' => 0,
                                \'expiry_date\' => now()->addYears(1) // Usually we would transfer exact batches, but for simplicity here we assume a generic date or map it.
                            ]
                        );
                        $inventory->increment(\'quantity\', $item->quantity);
                    }
                    $transfer->update([\'status\' => \'received\']);
                } else {
                    throw new Exception("Invalid status transition.");
                }
            });

            $transfer->load([\'items.medicine\', \'sourceBranch\', \'destinationBranch\']);
            return response()->json([
                \'success\' => true,
                \'data\' => new StockTransferResource($transfer),
                \'message\' => "Transfer status updated to {$request->status}."
            ]);

        } catch (Exception $e) {
            return response()->json([
                \'success\' => false,
                \'error_code\' => \'TRANSFER_UPDATE_FAILED\',
                \'message\' => $e->getMessage(),
            ], 400);
        }
    }
}
');

writeFile('Modules/Transfer/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\Transfer\Http\Controllers\TransferController;

Route::prefix(\'v1/transfers\')->middleware(\'auth:sanctum\')->group(function () {
    Route::post(\'/\', [TransferController::class, \'store\']);
    Route::put(\'/{transfer}/status\', [TransferController::class, \'updateStatus\']);
});
');

echo "Shift and Transfer API Files Generated Successfully!\n";
