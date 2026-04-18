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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('facture_id')->constrained()->onDelete('cascade');
            $table->string('numero_facture');
            $table->string('nom_titulaire');
            $table->string('numero_carte')->index(); // masked for security
            $table->date('date_expiration');
            $table->string('cvc', 4); // encrypted
            $table->decimal('montant', 10, 2);
            $table->enum('status', ['reussi', 'echoue', 'en_cours']);
            $table->string('transaction_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
