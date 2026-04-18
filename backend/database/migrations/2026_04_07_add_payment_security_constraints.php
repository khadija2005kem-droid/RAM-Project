<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Add database-level security constraints
     */
    public function up(): void
    {
        // Add unique constraint on facture_id to prevent duplicate successful payments
        // This ensures only one successful payment record can exist per invoice
        Schema::table('paiements', function (Blueprint $table) {
            // Create a unique index on facture_id and status
            // We'll use a generated column approach or just add the index
            $table->unique(['facture_id', 'status'], 'unique_facture_successful_payment');
        });

        // Also add indexes for performance on common queries
        Schema::table('paiements', function (Blueprint $table) {
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropUnique('unique_facture_successful_payment');
            $table->dropIndex(['transaction_id']);
        });
    }
};
