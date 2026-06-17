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
    public function index()
    {
        $user = auth()->user();
        $query = Invoice::with(['items.medicine', 'branch', 'shift.user'])->orderBy('created_at', 'desc');
        
        if ($user->role === 'BranchManager') {
            $query->where('branch_id', $user->branch_id);
        }
        
        return response()->json([
            'success' => true,
            'data' => $query->paginate(20)
        ]);
    }
    public function store(StoreInvoiceRequest $request)
    {
        try {
            $invoice = DB::transaction(function () use ($request) {
                $user = auth()->user();
                $branchId = $user->branch_id;
                
                // Get active shift for cashier
                $shift = Shift::where('user_id', $user->id)
                    ->where('status', 'open')
                    ->first();
                
                if (!$shift) {
                    throw new Exception("No open shift found for the current user.");
                }

                $totalAmount = 0;
                foreach ($request->items as $item) {
                    $totalAmount += ($item['quantity'] * $item['unit_price']);
                }

                $invoice = Invoice::create([
                    'branch_id' => $branchId,
                    'shift_id' => $shift->id,
                    'customer_id' => $request->customer_id,
                    'total_amount' => $totalAmount,
                    'payment_method' => $request->payment_method ?? 'Cash',
                    'discount_amount' => $request->discount_amount ?? 0,
                    'discount_type' => $request->discount_type,
                    'status' => 'finalized',
                ]);

                foreach ($request->items as $item) {
                    $medicine = \Modules\Catalog\Models\Medicine::find($item['medicine_id']);
                    $isSubUnit = $item['is_sub_unit'] ?? false;
                    
                    $deductionAmount = $item['quantity'];
                    if ($isSubUnit && $medicine->sub_units_per_box) {
                        $deductionAmount = round($item['quantity'] / $medicine->sub_units_per_box, 2);
                    }

                    $remainingToDeduct = $deductionAmount;
                    
                    // FIFO deduction
                    $inventories = BranchInventory::where('branch_id', $branchId)
                        ->where('medicine_id', $item['medicine_id'])
                        ->where('quantity', '>', 0)
                        ->orderBy('expiry_date', 'asc')
                        ->lockForUpdate() // Ensure pessimistic locking
                        ->get();

                    foreach ($inventories as $inv) {
                        if ($remainingToDeduct <= 0) break;
                        $deduct = min($inv->quantity, $remainingToDeduct);
                        $inv->quantity -= $deduct;
                        $inv->save();
                        $remainingToDeduct -= $deduct;
                    }

                    if ($remainingToDeduct > 0.01) { // small tolerance for decimal
                        throw new Exception("Insufficient stock for medicine ID: {$item['medicine_id']}");
                    }

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'medicine_id' => $item['medicine_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal' => $item['quantity'] * $item['unit_price'],
                        'is_sub_unit' => $isSubUnit,
                    ]);
                }

                return $invoice;
            });

            $invoice->load(['items.medicine', 'branch']);

            return response()->json([
                'success' => true,
                'data' => new InvoiceResource($invoice),
                'message' => 'Invoice processed successfully.'
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error_code' => 'CHECKOUT_FAILED',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with(['items.medicine', 'branch', 'shift.user'])->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new InvoiceResource($invoice)
        ]);
    }
}
