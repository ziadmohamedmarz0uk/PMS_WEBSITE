<?php
namespace Modules\Shift\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class CloseShiftRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'actual_cash_submitted' => ['required', 'numeric', 'min:0'],
        ];
    }
}
