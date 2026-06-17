<?php
namespace Modules\Catalog\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiveIngredientResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
