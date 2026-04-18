<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize legacy values before tightening enum.
        DB::statement("UPDATE factures SET status = 'unpaid' WHERE status IN ('non payee', 'rejected')");
        DB::statement("UPDATE factures SET status = 'pending' WHERE status IN ('en attente')");
        DB::statement("UPDATE factures SET status = 'paid' WHERE status IN ('payee', 'accepted')");

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('unpaid', 'pending', 'paid') NOT NULL DEFAULT 'unpaid'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE factures SET status = 'non payee' WHERE status = 'unpaid'");
        DB::statement("UPDATE factures SET status = 'en attente' WHERE status = 'pending'");
        DB::statement("UPDATE factures SET status = 'payee' WHERE status = 'paid'");

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending'");
    }
};
