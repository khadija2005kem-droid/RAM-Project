<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            try {
                DB::statement("ALTER TABLE factures DROP CHECK check_status");
            } catch (\Throwable $exception) {
                try {
                    DB::statement("ALTER TABLE factures DROP CONSTRAINT check_status");
                } catch (\Throwable $ignored) {
                }
            }

            DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected', 'unpaid', 'paid') NOT NULL DEFAULT 'non payee'");
        }

        DB::statement("UPDATE factures SET status = 'non payee' WHERE status IN ('unpaid', 'rejected')");
        DB::statement("UPDATE factures SET status = 'en attente' WHERE status IN ('pending')");
        DB::statement("UPDATE factures SET status = 'payee' WHERE status IN ('paid', 'accepted')");

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente') NOT NULL DEFAULT 'non payee'");
        DB::statement("ALTER TABLE factures ADD CONSTRAINT check_status CHECK (`status` in ('payee','non payee','en attente'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            try {
                DB::statement("ALTER TABLE factures DROP CHECK check_status");
            } catch (\Throwable $exception) {
                try {
                    DB::statement("ALTER TABLE factures DROP CONSTRAINT check_status");
                } catch (\Throwable $ignored) {
                }
            }

            DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected', 'unpaid', 'paid') NOT NULL DEFAULT 'unpaid'");
        }

        DB::statement("UPDATE factures SET status = 'unpaid' WHERE status = 'non payee'");
        DB::statement("UPDATE factures SET status = 'pending' WHERE status = 'en attente'");
        DB::statement("UPDATE factures SET status = 'paid' WHERE status = 'payee'");

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('unpaid', 'pending', 'paid') NOT NULL DEFAULT 'unpaid'");
    }
};
