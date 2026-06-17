<?php
namespace Modules\Catalog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Catalog\Models\Medicine;
use Modules\Catalog\Http\Resources\MedicineResource;
use Modules\Catalog\Http\Requests\StoreMedicineRequest;
use Modules\Catalog\Http\Requests\UpdateMedicineRequest;

class MedicineController extends Controller
{
    public function index()
    {
        $medicines = Medicine::with(['category', 'activeIngredient'])->get();
        return response()->json([
            'success' => true,
            'data' => MedicineResource::collection($medicines),
            'message' => 'Medicines retrieved successfully.'
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create($request->validated());
        $medicine->load(['category', 'activeIngredient']);
        return response()->json([
            'success' => true,
            'data' => new MedicineResource($medicine),
            'message' => 'Medicine created successfully.'
        ], 201);
    }

    public function show(Medicine $medicine)
    {
        $medicine->load(['category', 'activeIngredient']);
        return response()->json([
            'success' => true,
            'data' => new MedicineResource($medicine),
            'message' => 'Medicine retrieved successfully.'
        ]);
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());
        $medicine->load(['category', 'activeIngredient']);
        return response()->json([
            'success' => true,
            'data' => new MedicineResource($medicine),
            'message' => 'Medicine updated successfully.'
        ]);
    }


    public function alternatives($medicine_id)
    {
        $medicine = Medicine::findOrFail($medicine_id);
        $currentBranch = auth()->user()->branch_id;

        $alternatives = \Modules\Inventory\Models\BranchInventory::with(['medicine'])
            ->where('branch_id', $currentBranch)
            ->where('quantity', '>', 0)
            ->where('medicine_id', '!=', $medicine_id)
            ->whereHas('medicine', function($query) use ($medicine) {
                $query->where('active_ingredient_id', $medicine->active_ingredient_id);
            })
            ->get();

        $formatted = $alternatives->map(function($inv) {
            $daysToExpiry = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($inv->expiry_date), false);
            $expiryStatus = 'Green';
            if ($daysToExpiry < 30) $expiryStatus = 'Red';
            elseif ($daysToExpiry <= 90) $expiryStatus = 'Yellow';

            return [
                'id' => $inv->id,
                'medicine_id' => $inv->medicine_id,
                'quantity' => $inv->quantity,
                'expiry_status' => $expiryStatus,
                'medicine' => [
                    'name' => $inv->medicine->name,
                    'barcode' => $inv->medicine->barcode,
                    'base_price' => $inv->medicine->base_price,
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
            'message' => 'Alternatives retrieved.'
        ]);
    }

}
