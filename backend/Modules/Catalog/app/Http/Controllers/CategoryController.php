<?php
namespace Modules\Catalog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Http\Resources\CategoryResource;
use Modules\Catalog\Http\Requests\StoreCategoryRequest;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return response()->json([
            'success' => true,
            'data' => CategoryResource::collection($categories),
            'message' => 'Categories retrieved successfully.'
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
            'message' => 'Category created successfully.'
        ], 201);
    }
}
