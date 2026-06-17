<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('scientific_name');
            $table->string('barcode')->unique();
            $table->decimal('base_price', 10, 2);
            $table->decimal('purchase_price', 10, 2);
            $table->foreignId('category_id')->nullable()->constrained('categories');
            $table->foreignId('active_ingredient_id')->nullable()->constrained('active_ingredients');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
