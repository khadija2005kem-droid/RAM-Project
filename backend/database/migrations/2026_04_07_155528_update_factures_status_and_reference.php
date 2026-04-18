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
        Schema::table('factures', function (Blueprint $table) {
            // Add unique constraint to reference
            $table->unique('reference');
            
            // Update status enum values
            $table->enum('status', ['payee', 'non payee', 'en attente'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropUnique(['reference']);
            
            // Revert to old enum values
            $table->enum('status', ['acceptee', 'refusee', 'en_attente'])->change();
        });
    }
};
