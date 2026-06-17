<?php
namespace Modules\Catalog\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'scientific_name' => $this->scientific_name,
            'barcode' => $this->barcode,
            'base_price' => $this->base_price,
            'purchase_price' => $this->purchase_price,
            'has_sub_unit' => $this->has_sub_unit,
            'sub_unit_name' => $this->sub_unit_name,
            'sub_units_per_box' => $this->sub_units_per_box,
            'sub_unit_price' => $this->sub_unit_price,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'active_ingredient_id' => $this->active_ingredient_id,
            'active_ingredient' => new ActiveIngredientResource($this->whenLoaded('activeIngredient')),
        ];
    }
}
