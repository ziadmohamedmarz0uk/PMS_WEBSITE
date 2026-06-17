<?php
namespace Modules\POS\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'shift_id' => $this->shift_id,
            'customer_id' => $this->customer_id,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
