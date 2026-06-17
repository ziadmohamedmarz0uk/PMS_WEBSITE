<?php
$files = glob(__DIR__ . '/Modules/*/database/migrations/*.php');

$schemas = [
    'branches' => '            $table->id();
            $table->string(\'name\');
            $table->string(\'location\')->nullable();
            $table->timestamps();',
            
    'audit_logs' => '            $table->id();
            $table->foreignId(\'user_id\')->constrained(\'users\');
            $table->foreignId(\'branch_id\')->nullable()->constrained(\'branches\');
            $table->string(\'action\');
            $table->string(\'entity_type\');
            $table->bigInteger(\'entity_id\');
            $table->timestamp(\'timestamp\');
            $table->timestamps();',

    'categories' => '            $table->id();
            $table->string(\'name\');
            $table->timestamps();',

    'active_ingredients' => '            $table->id();
            $table->string(\'name\');
            $table->timestamps();',

    'medicines' => '            $table->id();
            $table->string(\'name\');
            $table->string(\'scientific_name\');
            $table->string(\'barcode\')->unique();
            $table->decimal(\'base_price\', 10, 2);
            $table->decimal(\'purchase_price\', 10, 2);
            $table->foreignId(\'category_id\')->nullable()->constrained(\'categories\');
            $table->foreignId(\'active_ingredient_id\')->nullable()->constrained(\'active_ingredients\');
            $table->timestamps();',

    'branch_inventories' => '            $table->id();
            $table->foreignId(\'branch_id\')->constrained(\'branches\');
            $table->foreignId(\'medicine_id\')->constrained(\'medicines\');
            $table->integer(\'quantity\');
            $table->date(\'expiry_date\');
            $table->string(\'batch_number\');
            $table->timestamps();',

    'customers' => '            $table->id();
            $table->string(\'name\');
            $table->string(\'phone\')->nullable();
            $table->integer(\'loyalty_points\')->default(0);
            $table->timestamps();',

    'shifts' => '            $table->id();
            $table->foreignId(\'user_id\')->constrained(\'users\');
            $table->foreignId(\'branch_id\')->constrained(\'branches\');
            $table->timestamp(\'start_time\')->useCurrent();
            $table->timestamp(\'end_time\')->nullable();
            $table->enum(\'status\', [\'open\', \'closed\'])->default(\'open\');
            $table->decimal(\'actual_cash_submitted\', 10, 2)->nullable();
            $table->decimal(\'expected_cash\', 10, 2)->nullable();
            $table->timestamps();',

    'invoices' => '            $table->id();
            $table->foreignId(\'branch_id\')->constrained(\'branches\');
            $table->foreignId(\'shift_id\')->constrained(\'shifts\');
            $table->foreignId(\'customer_id\')->nullable()->constrained(\'customers\');
            $table->decimal(\'total_amount\', 10, 2);
            $table->enum(\'status\', [\'finalized\', \'refunded\', \'draft\'])->default(\'draft\');
            $table->timestamps();',

    'invoice_items' => '            $table->id();
            $table->foreignId(\'invoice_id\')->constrained(\'invoices\');
            $table->foreignId(\'medicine_id\')->constrained(\'medicines\');
            $table->integer(\'quantity\');
            $table->decimal(\'unit_price\', 10, 2);
            $table->decimal(\'subtotal\', 10, 2);
            $table->timestamps();',

    'stock_transfers' => '            $table->id();
            $table->foreignId(\'from_branch\')->constrained(\'branches\');
            $table->foreignId(\'to_branch\')->constrained(\'branches\');
            $table->enum(\'status\', [\'pending\', \'shipped\', \'received\'])->default(\'pending\');
            $table->timestamps();',
];

foreach ($files as $file) {
    $content = file_get_contents($file);
    if (preg_match('/Schema::create\(\'([a-z_]+)\'/', $content, $matches)) {
        $table = $matches[1];
        if (isset($schemas[$table])) {
            $replacement = "Schema::create('$table', function (Blueprint \$table) {\n" . $schemas[$table] . "\n        });";
            $content = preg_replace('/Schema::create\(\'[a-z_]+\', function \(Blueprint \$table\) \{.*?\}\);/s', $replacement, $content);
            file_put_contents($file, $content);
            echo "Updated schema for $table\n";
        }
    } elseif (strpos($file, 'add_branch_id_to_users_table') !== false) {
        $content = preg_replace(
            '/public function up\(\): void\s+\{\s+Schema::table\(\'users\', function \(Blueprint \$table\) \{.*?\};\s+\}/s',
            "public function up(): void\n    {\n        Schema::table('users', function (Blueprint \$table) {\n            \$table->foreignId('branch_id')->nullable()->constrained('branches');\n        });\n    }",
            $content
        );
        $content = preg_replace(
            '/public function down\(\): void\s+\{\s+Schema::table\(\'users\', function \(Blueprint \$table\) \{.*?\};\s+\}/s',
            "public function down(): void\n    {\n        Schema::table('users', function (Blueprint \$table) {\n            \$table->dropForeign(['branch_id']);\n            \$table->dropColumn('branch_id');\n        });\n    }",
            $content
        );
        file_put_contents($file, $content);
        echo "Updated users table migration\n";
    }
}
