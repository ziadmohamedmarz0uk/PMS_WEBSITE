<?php
namespace Modules\POS\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Http\Resources\MedicineResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'medicine_id' => $this->medicine_id,
            'medicine' => new MedicineResource($this->whenLoaded('medicine')),
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'subtotal' => $this->subtotal,
        ];
    }
}
