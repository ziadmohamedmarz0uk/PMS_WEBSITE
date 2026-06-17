<?php
namespace Modules\Shift\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Auth\Http\Resources\BranchResource;

class ShiftResource extends JsonResource
{
    public function toArray($request)
    {
        $data = [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'user_id' => $this->user_id,
            'opening_cash' => $this->opening_cash,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'status' => $this->status,
            'actual_cash_submitted' => $this->actual_cash_submitted,
            'created_at' => $this->created_at,
        ];

        // Ensure user object exists, in a real app check roles correctly
        $user = auth()->user();
        $role = $user->role ?? 'SuperAdmin'; // Mock role if not exists
        
        if (in_array($role, ['SuperAdmin', 'BranchManager']) && $this->status === 'closed') {
            $data['expected_cash'] = $this->expected_cash;
            $data['variance'] = $this->actual_cash_submitted - $this->expected_cash;
        }

        return $data;
    }
}
