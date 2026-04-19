<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE factures SET status = 'non payee' WHERE status IN ('unpaid', 'rejected')");
        DB::statement("UPDATE factures SET status = 'en attente' WHERE status IN ('pending')");
        DB::statement("UPDATE factures SET status = 'payee' WHERE status IN ('paid', 'accepted')");

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente') NOT NULL DEFAULT 'non payee'");
    }

    public function down(): void
    {
        DB::statement("UPDATE factures SET status = 'unpaid' WHERE status = 'non payee'");
        DB::statement("UPDATE factures SET status = 'pending' WHERE status = 'en attente'");
        DB::statement("UPDATE factures SET status = 'paid' WHERE status = 'payee'");

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('unpaid', 'pending', 'paid') NOT NULL DEFAULT 'unpaid'");
    }
};
