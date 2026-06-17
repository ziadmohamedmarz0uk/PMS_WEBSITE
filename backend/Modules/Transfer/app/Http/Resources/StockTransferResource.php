<?php
namespace Modules\Transfer\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class StockTransferResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'from_branch' => $this->from_branch,
            'source_branch' => new BranchResource($this->whenLoaded('sourceBranch')),
            'to_branch' => $this->to_branch,
            'destination_branch' => new BranchResource($this->whenLoaded('destinationBranch')),
            'status' => $this->status,
            'items' => TransferItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
