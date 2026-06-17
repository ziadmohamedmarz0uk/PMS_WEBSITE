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
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_method')->default('Cash')->after('total_amount');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('payment_method');
            $table->string('discount_type')->nullable()->after('discount_amount'); // 'percentage' or 'fixed'
            $table->decimal('grand_total', 10, 2)->virtualAs('total_amount - (CASE WHEN discount_type = "fixed" THEN discount_amount WHEN discount_type = "percentage" THEN (total_amount * discount_amount / 100) ELSE 0 END)')->after('discount_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'discount_amount', 'discount_type', 'grand_total']);
        });
    }
};
