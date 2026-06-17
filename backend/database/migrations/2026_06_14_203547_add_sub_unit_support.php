<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->boolean('has_sub_unit')->default(false)->after('purchase_price');
            $table->string('sub_unit_name')->nullable()->after('has_sub_unit'); // e.g., "Strip"
            $table->integer('sub_units_per_box')->nullable()->after('sub_unit_name');
            $table->decimal('sub_unit_price', 10, 2)->nullable()->after('sub_units_per_box');
        });

        Schema::table('branch_inventories', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->change();
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->boolean('is_sub_unit')->default(false)->after('quantity');
        });
    }

    public function down()
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn(['has_sub_unit', 'sub_unit_name', 'sub_units_per_box', 'sub_unit_price']);
        });

        Schema::table('branch_inventories', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('is_sub_unit');
        });
    }
};
