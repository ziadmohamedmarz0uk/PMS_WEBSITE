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
        $expiryStatus = 'Green';
        if ($daysToExpiry < 30) {
            $expiryStatus = 'Red';
        } elseif ($daysToExpiry <= 90) {
            $expiryStatus = 'Yellow';
        }

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'medicine_id' => $this->medicine_id,
            'medicine' => new MedicineResource($this->whenLoaded('medicine')),
            'quantity' => $this->quantity,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'batch_number' => $this->batch_number,
            'expiry_status' => $expiryStatus,
        ];
    }
}
