<?php

namespace Modules\Procurement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $orders = \Modules\Procurement\Models\PurchaseOrder::with(['supplier', 'user', 'items.medicine'])->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $orders]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.purchase_price' => 'required|numeric|min:0',
            'items.*.batch_number' => 'required|string',
            'items.*.expiry_date' => 'required|date'
        ]);

        $user = auth()->user();

        try {
            $order = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user) {
                $totalCost = 0;
                foreach ($validated['items'] as $item) {
                    $totalCost += ($item['quantity'] * $item['purchase_price']);
                }

                $po = \Modules\Procurement\Models\PurchaseOrder::create([
                    'supplier_id' => $validated['supplier_id'],
                    'branch_id' => $user->branch_id,
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'total_cost' => $totalCost
                ]);

                foreach ($validated['items'] as $item) {
                    \Modules\Procurement\Models\PurchaseOrderItem::create([
                        'purchase_order_id' => $po->id,
                        'medicine_id' => $item['medicine_id'],
                        'quantity' => $item['quantity'],
                        'purchase_price' => $item['purchase_price'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date']
                    ]);
                }

                return $po;
            });

            $order->load(['supplier', 'items.medicine']);

            return response()->json([
                'success' => true,
                'data' => $order,
                'message' => 'Purchase Order created successfully.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function receive($id)
    {
        $po = \Modules\Procurement\Models\PurchaseOrder::with('items')->find($id);

        if (!$po) {
            return response()->json(['success' => false, 'message' => 'Purchase Order not found.'], 404);
        }

        if ($po->status === 'received') {
            return response()->json(['success' => false, 'message' => 'Order already received.'], 400);
        }

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($po) {
                foreach ($po->items as $item) {
                    // Update branch inventory
                    $inventory = \Modules\Inventory\Models\BranchInventory::firstOrCreate(
                        [
                            'branch_id' => $po->branch_id,
                            'medicine_id' => $item->medicine_id,
                            'batch_number' => $item->batch_number
                        ],
                        [
                            'quantity' => 0,
                            'expiry_date' => $item->expiry_date,
                            'purchase_price' => $item->purchase_price
                        ]
                    );

                    $inventory->quantity += $item->quantity;
                    $inventory->save();
                }

                // Update supplier balance
                $supplier = \Modules\Procurement\Models\Supplier::find($po->supplier_id);
                $supplier->balance += $po->total_cost;
                $supplier->save();

                $po->update([
                    'status' => 'received',
                    'received_at' => now()
                ]);
            });

            return response()->json(['success' => true, 'message' => 'Purchase order received and inventory updated.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
