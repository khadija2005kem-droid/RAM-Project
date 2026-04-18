<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('reference')->unique();
            $table->date('date');
            $table->decimal('prix', 10, 2);
            $table->enum('status', ['payee', 'non payee', 'en attente'])->default('en attente');
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('factures');
    }
};