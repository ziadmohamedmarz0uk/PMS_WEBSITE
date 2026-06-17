<?php
namespace Modules\Transfer\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'to_branch_id' => ['required', 'exists:branches,id', 'different:from_branch_id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'exists:medicines,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
    protected function prepareForValidation()
    {
        $this->merge(['from_branch_id' => auth()->user()->branch_id]);
    }
}
