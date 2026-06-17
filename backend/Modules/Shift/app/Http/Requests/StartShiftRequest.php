<?php
namespace Modules\Shift\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StartShiftRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'opening_cash' => ['required', 'numeric', 'min:0'],
        ];
    }
}
