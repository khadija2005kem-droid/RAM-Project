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
        if (DB::getDriverName() !== 'sqlite') {
            try {
                DB::statement("ALTER TABLE factures DROP CHECK check_status");
            } catch (\Throwable $exception) {
                try {
                    DB::statement("ALTER TABLE factures DROP CONSTRAINT check_status");
                } catch (\Throwable $innerException) {
                    // Some MySQL/MariaDB environments never created this constraint.
                }
            }

            // Expand the enum first so MySQL accepts the normalized values
            // before we rewrite existing rows and tighten the column.
            DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected', 'unpaid', 'paid') NOT NULL DEFAULT 'unpaid'");
        }

        // Normalize legacy values before tightening enum.
        DB::statement("UPDATE factures SET status = 'unpaid' WHERE status IN ('non payee', 'rejected')");
        DB::statement("UPDATE factures SET status = 'pending' WHERE status IN ('en attente')");
        DB::statement("UPDATE factures SET status = 'paid' WHERE status IN ('payee', 'accepted')");

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('unpaid', 'pending', 'paid') NOT NULL DEFAULT 'unpaid'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected', 'unpaid', 'paid') NOT NULL DEFAULT 'pending'");
        }

        DB::statement("UPDATE factures SET status = 'non payee' WHERE status = 'unpaid'");
        DB::statement("UPDATE factures SET status = 'en attente' WHERE status = 'pending'");
        DB::statement("UPDATE factures SET status = 'payee' WHERE status = 'paid'");

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE factures MODIFY COLUMN status ENUM('payee', 'non payee', 'en attente', 'pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending'");
        try {
            DB::statement("ALTER TABLE factures ADD CONSTRAINT check_status CHECK (`status` in ('payee','non payee','en attente'))");
        } catch (\Throwable $exception) {
            // Ignore if the constraint syntax is unsupported or already handled differently.
        }
    }
};
