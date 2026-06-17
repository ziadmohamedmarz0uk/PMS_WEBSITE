<?php

function writeFile($path, $content) {
    $dir = dirname(__DIR__ . '/' . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents(__DIR__ . '/' . $path, ltrim($content));
}

// =======================
// AUTH MODULE
// =======================

writeFile('Modules/Auth/app/Http/Resources/BranchResource.php', '
<?php
namespace Modules\Auth\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'name\' => $this->name,
            \'location\' => $this->location,
        ];
    }
}
');

writeFile('Modules/Auth/app/Http/Resources/UserResource.php', '
<?php
namespace Modules\Auth\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'name\' => $this->name,
            \'email\' => $this->email,
            \'branch_id\' => $this->branch_id,
            \'branch\' => new BranchResource($this->whenLoaded(\'branch\')),
        ];
    }
}
');

writeFile('Modules/Auth/app/Http/Requests/LoginRequest.php', '
<?php
namespace Modules\Auth\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'email\' => [\'required\', \'email\'],
            \'password\' => [\'required\', \'string\'],
        ];
    }
}
');

writeFile('Modules/Auth/app/Http/Controllers/AuthController.php', '
<?php
namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Http\Resources\UserResource;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        if (!Auth::attempt($request->only(\'email\', \'password\'))) {
            return response()->json([
                \'success\' => false,
                \'error_code\' => \'UNAUTHORIZED\',
                \'message\' => \'Invalid login credentials.\',
                \'errors\' => []
            ], 401);
        }

        $user = Auth::user()->load(\'branch\');
        $token = $user->createToken(\'auth_token\')->plainTextToken;

        return response()->json([
            \'success\' => true,
            \'data\' => [
                \'user\' => new UserResource($user),
                \'token\' => $token
            ],
            \'message\' => \'Logged in successfully.\'
        ]);
    }

    public function logout()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->currentAccessToken()->delete();

        return response()->json([
            \'success\' => true,
            \'data\' => null,
            \'message\' => \'Logged out successfully.\'
        ]);
    }
}
');

writeFile('Modules/Auth/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\Auth\Http\Controllers\AuthController;

Route::prefix(\'v1/auth\')->group(function () {
    Route::post(\'login\', [AuthController::class, \'login\']);
    Route::middleware(\'auth:sanctum\')->post(\'logout\', [AuthController::class, \'logout\']);
});
');


// =======================
// CATALOG MODULE
// =======================

writeFile('Modules/Catalog/app/Http/Resources/CategoryResource.php', '
<?php
namespace Modules\Catalog\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'name\' => $this->name,
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Resources/ActiveIngredientResource.php', '
<?php
namespace Modules\Catalog\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiveIngredientResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'name\' => $this->name,
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Resources/MedicineResource.php', '
<?php
namespace Modules\Catalog\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            \'id\' => $this->id,
            \'name\' => $this->name,
            \'scientific_name\' => $this->scientific_name,
            \'barcode\' => $this->barcode,
            \'base_price\' => $this->base_price,
            \'purchase_price\' => $this->purchase_price,
            \'category_id\' => $this->category_id,
            \'category\' => new CategoryResource($this->whenLoaded(\'category\')),
            \'active_ingredient_id\' => $this->active_ingredient_id,
            \'active_ingredient\' => new ActiveIngredientResource($this->whenLoaded(\'activeIngredient\')),
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Requests/StoreMedicineRequest.php', '
<?php
namespace Modules\Catalog\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'name\' => [\'required\', \'string\', \'max:255\'],
            \'scientific_name\' => [\'required\', \'string\', \'max:255\'],
            \'barcode\' => [\'required\', \'string\', \'unique:medicines,barcode\'],
            \'base_price\' => [\'required\', \'numeric\', \'min:0\'],
            \'purchase_price\' => [\'required\', \'numeric\', \'min:0\'],
            \'category_id\' => [\'nullable\', \'exists:categories,id\'],
            \'active_ingredient_id\' => [\'nullable\', \'exists:active_ingredients,id\'],
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Requests/UpdateMedicineRequest.php', '
<?php
namespace Modules\Catalog\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicineRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'name\' => [\'sometimes\', \'string\', \'max:255\'],
            \'scientific_name\' => [\'sometimes\', \'string\', \'max:255\'],
            \'barcode\' => [\'sometimes\', \'string\', \'unique:medicines,barcode,\' . $this->route(\'medicine\')->id],
            \'base_price\' => [\'sometimes\', \'numeric\', \'min:0\'],
            \'purchase_price\' => [\'sometimes\', \'numeric\', \'min:0\'],
            \'category_id\' => [\'nullable\', \'exists:categories,id\'],
            \'active_ingredient_id\' => [\'nullable\', \'exists:active_ingredients,id\'],
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Requests/StoreCategoryRequest.php', '
<?php
namespace Modules\Catalog\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            \'name\' => [\'required\', \'string\', \'max:255\'],
        ];
    }
}
');

writeFile('Modules/Catalog/app/Http/Controllers/CategoryController.php', '
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
            \'success\' => true,
            \'data\' => CategoryResource::collection($categories),
            \'message\' => \'Categories retrieved successfully.\'
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());
        return response()->json([
            \'success\' => true,
            \'data\' => new CategoryResource($category),
            \'message\' => \'Category created successfully.\'
        ], 201);
    }
}
');

writeFile('Modules/Catalog/app/Http/Controllers/ActiveIngredientController.php', '
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
            \'success\' => true,
            \'data\' => ActiveIngredientResource::collection($ingredients),
            \'message\' => \'Active ingredients retrieved successfully.\'
        ]);
    }

    public function store(StoreCategoryRequest $request) // Both just need name
    {
        $ingredient = ActiveIngredient::create($request->validated());
        return response()->json([
            \'success\' => true,
            \'data\' => new ActiveIngredientResource($ingredient),
            \'message\' => \'Active ingredient created successfully.\'
        ], 201);
    }
}
');

writeFile('Modules/Catalog/app/Http/Controllers/MedicineController.php', '
<?php
namespace Modules\Catalog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Catalog\Models\Medicine;
use Modules\Catalog\Http\Resources\MedicineResource;
use Modules\Catalog\Http\Requests\StoreMedicineRequest;
use Modules\Catalog\Http\Requests\UpdateMedicineRequest;

class MedicineController extends Controller
{
    public function index()
    {
        $medicines = Medicine::with([\'category\', \'activeIngredient\'])->get();
        return response()->json([
            \'success\' => true,
            \'data\' => MedicineResource::collection($medicines),
            \'message\' => \'Medicines retrieved successfully.\'
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create($request->validated());
        $medicine->load([\'category\', \'activeIngredient\']);
        return response()->json([
            \'success\' => true,
            \'data\' => new MedicineResource($medicine),
            \'message\' => \'Medicine created successfully.\'
        ], 201);
    }

    public function show(Medicine $medicine)
    {
        $medicine->load([\'category\', \'activeIngredient\']);
        return response()->json([
            \'success\' => true,
            \'data\' => new MedicineResource($medicine),
            \'message\' => \'Medicine retrieved successfully.\'
        ]);
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());
        $medicine->load([\'category\', \'activeIngredient\']);
        return response()->json([
            \'success\' => true,
            \'data\' => new MedicineResource($medicine),
            \'message\' => \'Medicine updated successfully.\'
        ]);
    }
}
');

writeFile('Modules/Catalog/routes/api.php', '
<?php
use Illuminate\Support\Facades\Route;
use Modules\Catalog\Http\Controllers\CategoryController;
use Modules\Catalog\Http\Controllers\MedicineController;
use Modules\Catalog\Http\Controllers\ActiveIngredientController;

Route::prefix(\'v1/catalog\')->middleware(\'auth:sanctum\')->group(function () {
    Route::apiResource(\'categories\', CategoryController::class)->only([\'index\', \'store\']);
    Route::apiResource(\'active-ingredients\', ActiveIngredientController::class)->only([\'index\', \'store\']);
    Route::apiResource(\'medicines\', MedicineController::class)->except([\'create\', \'edit\', \'destroy\']);
});
');

echo "API Files Generated Successfully!\n";
