<?php
namespace Modules\Catalog\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
