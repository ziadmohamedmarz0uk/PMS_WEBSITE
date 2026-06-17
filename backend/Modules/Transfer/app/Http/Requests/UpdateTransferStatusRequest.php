<?php
namespace Modules\Transfer\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTransferStatusRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'status' => ['required', 'in:shipped,received'],
        ];
    }
}
