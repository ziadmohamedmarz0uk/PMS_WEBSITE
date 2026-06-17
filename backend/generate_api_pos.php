<?php

function writeFile($path, $content) {
    $dir = dirname(__DIR__ . '/' . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents(__DIR__ . '/' . $path, ltrim($content));
}

// =======================
// INVENTORY MODULE
// =======================

writeFile('Modules/Inventory/app/Http/Resources/InventoryResource.php', '
<?php
namespace Modules\Inventory\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;
use Modules\Catalog\Http\Resources\MedicineResource;
use Modules\Auth\Http\Resources\BranchResource;

class InventoryResource extends JsonResource
{
    public function toArray($request)
    {
        $daysToExpiry = Carbon::now()->diffInDays(Carbon::parse($this->expiry_date), false);
        $expiryStatus = \'Green\';
        if ($daysToExpiry < 30) {
            $expiryStatus = \'Red\';
        } elseif ($daysToExpiry <= 90) {
            $expiryStatus = \'Yellow\';
        }

        return [
            \'id\' => $this->id,
            \'branch_id\' => $this->branch_id,
            \'branch\' => new BranchResource($this->whenLoaded(\'branch\')),
            \'medicine_id\' => $this->medicine_id,
            \'medicine\' => new MedicineResource($this->whenLoaded(\'medicine\')),
            \'quantity\' => $this->quantity,
            \'expiry_date\' => $this->expiry_date->format(\'Y-m-d\'),
            \'batch_number\' => $this->batch_number,
            \'expiry_status\' => $expiryStatus,
        ];
    }
}
');

writeFile('Modules/Inventory/app/Http/Controllers/InventoryController.php', '
<?php
namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Inventory\Models\BranchInventory;
use Modules\Inventory\Http\Resources\InventoryResource;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $branchId = auth()->user()->branch_id;

        $inventories = BranchInventory::with([\'medicine\'])
            ->where(\'branch_id\', $branchId)
            ->get();

        return response()->json([
            \'success\' => true,
            \'data\' => InventoryResource::collection($inventories),
            \'message\' => \'Branch inventory retrieved successfully.\'
        ]);
    }
}
');

writeFile('Modules/Inventory/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;

Route::prefix(\'v1/inventory\')->middleware(\'auth:sanctum\')->group(function () {
    Route::get(\'/\', [InventoryController::class, \'index\']);
});
');


// =======================
// POS MODULE
// =======================

writeFile('Modules/POS/app/Http/Resources/InvoiceItemResource.php', '
<?php
namespace Modules\POS\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Http\Resources\MedicineResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'invoice_id\' => $this->invoice_id,
            \'medicine_id\' => $this->medicine_id,
            \'medicine\' => new MedicineResource($this->whenLoaded(\'medicine\')),
            \'quantity\' => $this->quantity,
            \'unit_price\' => $this->unit_price,
            \'subtotal\' => $this->subtotal,
        ];
    }
}
');

writeFile('Modules/POS/app/Http/Resources/InvoiceResource.php', '
<?php
namespace Modules\POS\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'branch_id\' => $this->branch_id,
            \'branch\' => new BranchResource($this->whenLoaded(\'branch\')),
            \'shift_id\' => $this->shift_id,
            \'customer_id\' => $this->customer_id,
            \'total_amount\' => $this->total_amount,
            \'status\' => $this->status,
            \'items\' => InvoiceItemResource::collection($this->whenLoaded(\'items\')),
            \'created_at\' => $this->created_at,
        ];
    }
}
');

writeFile('Modules/POS/app/Http/Requests/StoreInvoiceRequest.php', '
<?php
namespace Modules\POS\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'customer_id\' => [\'nullable\', \'exists:customers,id\'],
            \'items\' => [\'required\', \'array\', \'min:1\'],
            \'items.*.medicine_id\' => [\'required\', \'exists:medicines,id\'],
            \'items.*.quantity\' => [\'required\', \'integer\', \'min:1\'],
            \'items.*.unit_price\' => [\'required\', \'numeric\', \'min:0\'],
        ];
    }
}
');

writeFile('Modules/POS/app/Http/Controllers/InvoiceController.php', '
<?php
namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Exception;
use Modules\POS\Models\Invoice;
use Modules\POS\Models\InvoiceItem;
use Modules\Inventory\Models\BranchInventory;
use Modules\POS\Http\Requests\StoreInvoiceRequest;
use Modules\POS\Http\Resources\InvoiceResource;
use Modules\Shift\Models\Shift;

class InvoiceController extends Controller
{
    public function store(StoreInvoiceRequest $request)
    {
        try {
            $invoice = DB::transaction(function () use ($request) {
                $user = auth()->user();
                $branchId = $user->branch_id;
                
                // Get active shift for cashier
                $shift = Shift::where(\'user_id\', $user->id)
                    ->where(\'status\', \'open\')
                    ->first();
                
                if (!$shift) {
                    throw new Exception("No open shift found for the current user.");
                }

                $totalAmount = 0;
                foreach ($request->items as $item) {
                    $totalAmount += ($item[\'quantity\'] * $item[\'unit_price\']);
                }

                $invoice = Invoice::create([
                    \'branch_id\' => $branchId,
                    \'shift_id\' => $shift->id,
                    \'customer_id\' => $request->customer_id,
                    \'total_amount\' => $totalAmount,
                    \'status\' => \'finalized\',
                ]);

                foreach ($request->items as $item) {
                    $remainingToDeduct = $item[\'quantity\'];
                    
                    // FIFO deduction
                    $inventories = BranchInventory::where(\'branch_id\', $branchId)
                        ->where(\'medicine_id\', $item[\'medicine_id\'])
                        ->where(\'quantity\', \'>\', 0)
                        ->orderBy(\'expiry_date\', \'asc\')
                        ->lockForUpdate() // Ensure pessimistic locking
                        ->get();

                    foreach ($inventories as $inv) {
                        if ($remainingToDeduct <= 0) break;
                        $deduct = min($inv->quantity, $remainingToDeduct);
                        $inv->quantity -= $deduct;
                        $inv->save();
                        $remainingToDeduct -= $deduct;
                    }

                    if ($remainingToDeduct > 0) {
                        throw new Exception("Insufficient stock for medicine ID: {$item[\'medicine_id\']}");
                    }

                    InvoiceItem::create([
                        \'invoice_id\' => $invoice->id,
                        \'medicine_id\' => $item[\'medicine_id\'],
                        \'quantity\' => $item[\'quantity\'],
                        \'unit_price\' => $item[\'unit_price\'],
                        \'subtotal\' => $item[\'quantity\'] * $item[\'unit_price\'],
                    ]);
                }

                return $invoice;
            });

            $invoice->load([\'items.medicine\', \'branch\']);

            return response()->json([
                \'success\' => true,
                \'data\' => new InvoiceResource($invoice),
                \'message\' => \'Invoice processed successfully.\'
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                \'success\' => false,
                \'error_code\' => \'CHECKOUT_FAILED\',
                \'message\' => $e->getMessage(),
            ], 400);
        }
    }
}
');

writeFile('Modules/POS/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\POS\Http\Controllers\InvoiceController;

Route::prefix(\'v1/pos\')->middleware(\'auth:sanctum\')->group(function () {
    Route::post(\'invoices\', [InvoiceController::class, \'store\']);
});
');

echo "Inventory and POS API Files Generated Successfully!\n";
