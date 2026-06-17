<?php
namespace Modules\Catalog\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'scientific_name' => ['required', 'string', 'max:255'],
            'barcode' => ['required', 'string', 'unique:medicines,barcode'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'active_ingredient_id' => ['nullable', 'exists:active_ingredients,id'],
            'has_sub_unit' => ['boolean'],
            'sub_unit_name' => ['nullable', 'string', 'max:50'],
            'sub_units_per_box' => ['nullable', 'integer', 'min:1'],
            'sub_unit_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
