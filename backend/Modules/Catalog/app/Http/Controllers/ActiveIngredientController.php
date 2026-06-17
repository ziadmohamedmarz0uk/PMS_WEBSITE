<?php
namespace Modules\Catalog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Catalog\Models\ActiveIngredient;
use Modules\Catalog\Http\Resources\ActiveIngredientResource;
use Modules\Catalog\Http\Requests\StoreCategoryRequest; // Reusing for single name field

class ActiveIngredientController extends Controller
{
    public function index()
    {
        $ingredients = ActiveIngredient::all();
        return response()->json([
            'success' => true,
            'data' => ActiveIngredientResource::collection($ingredients),
            'message' => 'Active ingredients retrieved successfully.'
        ]);
    }

    public function store(StoreCategoryRequest $request) // Both just need name
    {
        $ingredient = ActiveIngredient::create($request->validated());
        return response()->json([
            'success' => true,
            'data' => new ActiveIngredientResource($ingredient),
            'message' => 'Active ingredient created successfully.'
        ], 201);
    }
}
