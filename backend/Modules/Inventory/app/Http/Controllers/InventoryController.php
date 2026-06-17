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

        $inventories = BranchInventory::with(['medicine'])
            ->where('branch_id', $branchId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => InventoryResource::collection($inventories),
            'message' => 'Branch inventory retrieved successfully.'
        ]);
    }


    public function crossBranchAvailability($medicine_id)
    {
        $currentBranch = auth()->user()->branch_id;
        $availability = \Modules\Inventory\Models\BranchInventory::with('branch')
            ->where('medicine_id', $medicine_id)
            ->where('branch_id', '!=', $currentBranch)
            ->where('quantity', '>', 0)
            ->get()
            ->map(function ($inv) {
                return [
                    'branch_id' => $inv->branch_id,
                    'branch_name' => $inv->branch->name,
                    'quantity' => $inv->quantity,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $availability,
            'message' => 'Cross-branch availability retrieved.'
        ]);
    }

}
