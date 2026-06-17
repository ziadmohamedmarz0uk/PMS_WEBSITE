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
                'from_branch' => auth()->user()->branch_id,
                'to_branch' => $request->to_branch_id,
                'status' => 'pending',
            ]);

            foreach ($request->items as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return $transfer;
        });

        $transfer->load(['items.medicine', 'sourceBranch', 'destinationBranch']);
        return response()->json([
            'success' => true,
            'data' => new StockTransferResource($transfer),
            'message' => 'Transfer requested successfully.'
        ], 201);
    }

    public function updateStatus(UpdateTransferStatusRequest $request, StockTransfer $transfer)
    {
        try {
            DB::transaction(function () use ($request, $transfer) {
                $newStatus = $request->status;

                if ($newStatus === 'shipped' && $transfer->status === 'pending') {
                    // Deduct from source branch
                    foreach ($transfer->items as $item) {
                        $remainingToDeduct = $item->quantity;
                        $inventories = BranchInventory::where('branch_id', $transfer->from_branch)
                            ->where('medicine_id', $item->medicine_id)
                            ->where('quantity', '>', 0)
                            ->orderBy('expiry_date', 'asc')
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
                    $transfer->update(['status' => 'shipped']);

                } elseif ($newStatus === 'received' && $transfer->status === 'shipped') {
                    // Add to destination branch
                    foreach ($transfer->items as $item) {
                        $inventory = BranchInventory::firstOrCreate(
                            [
                                'branch_id' => $transfer->to_branch,
                                'medicine_id' => $item->medicine_id,
                                'batch_number' => 'TRANSFER-' . $transfer->id,
                            ],
                            [
                                'quantity' => 0,
                                'expiry_date' => now()->addYears(1) // Usually we would transfer exact batches, but for simplicity here we assume a generic date or map it.
                            ]
                        );
                        $inventory->increment('quantity', $item->quantity);
                    }
                    $transfer->update(['status' => 'received']);
                } else {
                    throw new Exception("Invalid status transition.");
                }
            });

            $transfer->load(['items.medicine', 'sourceBranch', 'destinationBranch']);
            return response()->json([
                'success' => true,
                'data' => new StockTransferResource($transfer),
                'message' => "Transfer status updated to {$request->status}."
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error_code' => 'TRANSFER_UPDATE_FAILED',
                'message' => $e->getMessage(),
            ], 400);
        }
    }


    public function index()
    {
        $user = auth()->user();
        $query = StockTransfer::with(['sourceBranch', 'destinationBranch', 'items.medicine'])->orderBy('created_at', 'desc');
        if ($user->role === 'BranchManager') {
            $query->where(function($q) use ($user) {
                $q->where('from_branch', $user->branch_id)
                  ->orWhere('to_branch', $user->branch_id);
            });
        }
        return response()->json(['success'=>true, 'data'=>$query->get()]);
    }

}
