<?php

namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('pos::index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('pos::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        $user = auth()->user();
        $invoice = \Modules\POS\Models\Invoice::with('items')->find($validated['invoice_id']);

        if ($invoice->branch_id !== $user->branch_id) {
            return response()->json(['success' => false, 'message' => 'Invoice belongs to a different branch.'], 403);
        }

        $activeShift = \Modules\Shift\Models\Shift::where('user_id', $user->id)
            ->where('branch_id', $user->branch_id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift) {
            return response()->json(['success' => false, 'message' => 'No active shift found.'], 400);
        }

        try {
            $returnInvoice = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $invoice, $user, $activeShift) {
                $totalReturnSubtotal = 0;
                $returnItemsData = [];

                foreach ($validated['items'] as $returnItem) {
                    $originalItem = $invoice->items->where('medicine_id', $returnItem['medicine_id'])->first();
                    if (!$originalItem) {
                        throw new \Exception("Medicine ID {$returnItem['medicine_id']} not found in this invoice.");
                    }
                    
                    // Simple validation: cannot return more than bought. (In a real system, we'd check previous returns too)
                    if ($returnItem['quantity'] > $originalItem->quantity) {
                        throw new \Exception("Cannot return more than purchased for Medicine ID {$returnItem['medicine_id']}.");
                    }

                    $itemSubtotal = $returnItem['quantity'] * $originalItem->unit_price;
                    $totalReturnSubtotal += $itemSubtotal;

                    $returnItemsData[] = [
                        'medicine_id' => $returnItem['medicine_id'],
                        'quantity' => $returnItem['quantity'],
                        'regular_subtotal' => $itemSubtotal
                    ];

                    // Restock inventory
                    $inventory = \Modules\Inventory\Models\BranchInventory::firstOrCreate(
                        ['branch_id' => $user->branch_id, 'medicine_id' => $returnItem['medicine_id']],
                        ['quantity' => 0, 'expiry_date' => now()->addYears(1)] // Default expiry if not exists
                    );
                    $inventory->quantity += $returnItem['quantity'];
                    $inventory->save();
                }

                // Calculate actual refund with proportional discount
                $refundRatio = $invoice->total_amount > 0 ? ($totalReturnSubtotal / $invoice->total_amount) : 0;
                $actualRefundAmount = $invoice->total_amount * $refundRatio;

                $returnRecord = \Modules\POS\Models\ReturnInvoice::create([
                    'invoice_id' => $invoice->id,
                    'shift_id' => $activeShift->id,
                    'branch_id' => $user->branch_id,
                    'total_refund_amount' => $actualRefundAmount
                ]);

                foreach ($returnItemsData as $data) {
                    $itemRefund = $data['regular_subtotal'] * ($invoice->total_amount > 0 ? ($invoice->total_amount / $invoice->total_amount) : 0);
                    \Modules\POS\Models\ReturnItem::create([
                        'return_invoice_id' => $returnRecord->id,
                        'medicine_id' => $data['medicine_id'],
                        'quantity' => $data['quantity'],
                        'refund_amount' => $itemRefund
                    ]);
                }

                return $returnRecord;
            });

            return response()->json([
                'success' => true,
                'data' => clone $returnInvoice,
                'message' => 'Return processed successfully.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
