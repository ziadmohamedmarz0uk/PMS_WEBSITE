<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InventoryAdjustmentController extends Controller
{
    public function index()
    {
        $adjustments = \Modules\Inventory\Models\InventoryAdjustment::with(['medicine', 'user'])->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $adjustments]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'required|string',
            'adjustment_type' => 'required|in:addition,deduction',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:255'
        ]);

        $user = auth()->user();

        try {
            $adjustment = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user) {
                $inventory = \Modules\Inventory\Models\BranchInventory::where('branch_id', $user->branch_id)
                    ->where('medicine_id', $validated['medicine_id'])
                    ->where('batch_number', $validated['batch_number'])
                    ->first();

                if (!$inventory && $validated['adjustment_type'] === 'deduction') {
                    throw new \Exception("Cannot deduct from a batch that does not exist.");
                }

                if ($inventory && $validated['adjustment_type'] === 'deduction' && $inventory->quantity < $validated['quantity']) {
                    throw new \Exception("Insufficient stock to deduct.");
                }

                if (!$inventory && $validated['adjustment_type'] === 'addition') {
                    // Create if adding to new batch (needs expiry/price, but for simple adj we default)
                    $inventory = \Modules\Inventory\Models\BranchInventory::create([
                        'branch_id' => $user->branch_id,
                        'medicine_id' => $validated['medicine_id'],
                        'quantity' => 0,
                        'batch_number' => $validated['batch_number'],
                        'expiry_date' => now()->addYears(1),
                        'purchase_price' => 0
                    ]);
                }

                if ($validated['adjustment_type'] === 'addition') {
                    $inventory->quantity += $validated['quantity'];
                } else {
                    $inventory->quantity -= $validated['quantity'];
                }

                $inventory->save();

                return \Modules\Inventory\Models\InventoryAdjustment::create([
                    'branch_id' => $user->branch_id,
                    'user_id' => $user->id,
                    'medicine_id' => $validated['medicine_id'],
                    'batch_number' => $validated['batch_number'],
                    'adjustment_type' => $validated['adjustment_type'],
                    'quantity' => $validated['quantity'],
                    'reason' => $validated['reason']
                ]);
            });

            return response()->json([
                'success' => true,
                'data' => $adjustment,
                'message' => 'Inventory adjusted successfully.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'adjustments' => 'required|array',
            'adjustments.*.medicine_id' => 'required|exists:medicines,id',
            'adjustments.*.batch_number' => 'required|string',
            'adjustments.*.adjustment_type' => 'required|in:addition,deduction',
            'adjustments.*.quantity' => 'required|integer|min:1',
            'adjustments.*.reason' => 'required|string|max:255'
        ]);

        $user = auth()->user();
        $successfulCount = 0;

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user, &$successfulCount) {
                foreach ($validated['adjustments'] as $adj) {
                    $inventory = \Modules\Inventory\Models\BranchInventory::where('branch_id', $user->branch_id)
                        ->where('medicine_id', $adj['medicine_id'])
                        ->where('batch_number', $adj['batch_number'])
                        ->first();

                    if (!$inventory && $adj['adjustment_type'] === 'deduction') continue;
                    if ($inventory && $adj['adjustment_type'] === 'deduction' && $inventory->quantity < $adj['quantity']) continue;

                    if (!$inventory && $adj['adjustment_type'] === 'addition') {
                        $inventory = \Modules\Inventory\Models\BranchInventory::create([
                            'branch_id' => $user->branch_id,
                            'medicine_id' => $adj['medicine_id'],
                            'quantity' => 0,
                            'batch_number' => $adj['batch_number'],
                            'expiry_date' => now()->addYears(1),
                            'purchase_price' => 0
                        ]);
                    }

                    if ($adj['adjustment_type'] === 'addition') {
                        $inventory->quantity += $adj['quantity'];
                    } else {
                        $inventory->quantity -= $adj['quantity'];
                    }

                    $inventory->save();

                    \Modules\Inventory\Models\InventoryAdjustment::create([
                        'branch_id' => $user->branch_id,
                        'user_id' => $user->id,
                        'medicine_id' => $adj['medicine_id'],
                        'batch_number' => $adj['batch_number'],
                        'adjustment_type' => $adj['adjustment_type'],
                        'quantity' => $adj['quantity'],
                        'reason' => $adj['reason']
                    ]);
                    $successfulCount++;
                }
            });

            return response()->json([
                'success' => true,
                'message' => "Bulk inventory adjustment completed. $successfulCount items updated."
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
