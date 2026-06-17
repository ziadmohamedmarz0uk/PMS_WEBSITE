<?php
namespace Modules\Transfer\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Http\Resources\MedicineResource;

class TransferItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'medicine' => new MedicineResource($this->whenLoaded('medicine')),
            'quantity' => $this->quantity,
        ];
    }
}
