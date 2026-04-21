<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('factures')->cascadeOnDelete();
            $table->string('action')->default('viewed_invoice');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['invoice_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
