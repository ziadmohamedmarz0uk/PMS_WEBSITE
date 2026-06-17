<?php

function writeFile($path, $content) {
    $dir = dirname(__DIR__ . '/' . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents(__DIR__ . '/' . $path, ltrim($content));
}

// 1. Create Migration for Role
writeFile('database/migrations/2026_06_09_194413_add_role_to_users_table.php', '
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table(\'users\', function (Blueprint $table) {
            $table->string(\'role\')->default(\'Cashier\')->after(\'email\');
        });
    }
    public function down(): void {
        Schema::table(\'users\', function (Blueprint $table) {
            $table->dropColumn(\'role\');
        });
    }
};
');

// 2. Update User Model
$userModelPath = __DIR__ . '/app/Models/User.php';
$userContent = file_get_contents($userModelPath);
if (strpos($userContent, "'role'") === false) {
    $userContent = str_replace("'name',", "'name',\n        'role',", $userContent);
    file_put_contents($userModelPath, $userContent);
}

// 3. Write DatabaseSeeder
writeFile('database/seeders/DatabaseSeeder.php', '
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use App\Models\User;
use Modules\Auth\Models\Branch;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\ActiveIngredient;
use Modules\Catalog\Models\Medicine;
use Modules\Inventory\Models\BranchInventory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Branches
        $branches = [
            Branch::create([\'name\' => \'Main Branch\', \'location\' => \'Downtown\']),
            Branch::create([\'name\' => \'Branch A\', \'location\' => \'Northside\']),
            Branch::create([\'name\' => \'Branch B\', \'location\' => \'Southside\']),
        ];

        // Users
        // SuperAdmin
        User::create([
            \'name\' => \'Super Admin\',
            \'email\' => \'admin@pms.com\',
            \'password\' => Hash::make(\'password\'),
            \'role\' => \'SuperAdmin\',
            \'branch_id\' => $branches[0]->id,
        ]);

        // Branch Managers and Cashiers
        foreach ($branches as $i => $branch) {
            User::create([
                \'name\' => "Manager " . $branch->name,
                \'email\' => "manager{$i}@pms.com",
                \'password\' => Hash::make(\'password\'),
                \'role\' => \'BranchManager\',
                \'branch_id\' => $branch->id,
            ]);
            
            User::create([
                \'name\' => "Cashier 1 " . $branch->name,
                \'email\' => "cashier{$i}_1@pms.com",
                \'password\' => Hash::make(\'password\'),
                \'role\' => \'Cashier\',
                \'branch_id\' => $branch->id,
            ]);
            User::create([
                \'name\' => "Cashier 2 " . $branch->name,
                \'email\' => "cashier{$i}_2@pms.com",
                \'password\' => Hash::make(\'password\'),
                \'role\' => \'Cashier\',
                \'branch_id\' => $branch->id,
            ]);
        }

        // Categories
        $categories = [];
        for ($i = 0; $i < 10; $i++) {
            $categories[] = Category::create([\'name\' => ucfirst($faker->unique()->word()) . \' Category\']);
        }

        // Active Ingredients
        $ingredients = [];
        for ($i = 0; $i < 20; $i++) {
            $ingredients[] = ActiveIngredient::create([\'name\' => ucfirst($faker->unique()->word()) . \' Ingredient\']);
        }

        // Medicines
        $medicines = [];
        for ($i = 0; $i < 50; $i++) {
            $purchasePrice = $faker->randomFloat(2, 5, 50);
            $basePrice = $purchasePrice + $faker->randomFloat(2, 2, 20); // selling > purchase
            
            $medicines[] = Medicine::create([
                \'name\' => ucfirst($faker->unique()->word()) . \' Medicine\',
                \'scientific_name\' => $faker->words(2, true),
                \'barcode\' => $faker->unique()->ean13(),
                \'base_price\' => $basePrice,
                \'purchase_price\' => $purchasePrice,
                \'category_id\' => $categories[array_rand($categories)]->id,
                \'active_ingredient_id\' => $ingredients[array_rand($ingredients)]->id,
            ]);
        }

        // Inventories
        foreach ($branches as $branch) {
            foreach ($medicines as $medicine) {
                // Determine expiry scenario
                $scenario = rand(1, 100);
                if ($scenario <= 20) {
                    $expiry = now()->addDays(rand(1, 29)); // Red
                } elseif ($scenario <= 50) {
                    $expiry = now()->addDays(rand(30, 90)); // Yellow
                } else {
                    $expiry = now()->addDays(rand(91, 500)); // Green
                }

                // Determine quantity (10% chance of 0)
                $qty = rand(1, 10) > 1 ? rand(10, 100) : 0;

                BranchInventory::create([
                    \'branch_id\' => $branch->id,
                    \'medicine_id\' => $medicine->id,
                    \'quantity\' => $qty,
                    \'expiry_date\' => $expiry,
                    \'batch_number\' => strtoupper($faker->bothify(\'BATCH-####??\')),
                ]);
            }
        }
    }
}
');

echo "Seeder script completed.\n";
