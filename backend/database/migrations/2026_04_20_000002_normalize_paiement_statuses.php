<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::create('paiements_tmp', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('facture_id')->constrained()->onDelete('cascade');
                $table->string('numero_facture');
                $table->string('nom_titulaire');
                $table->string('numero_carte')->index();
                $table->date('date_expiration');
                $table->string('cvc', 255);
                $table->decimal('montant', 10, 2);
                $table->enum('status', ['en_attente', 'accepted', 'rejected'])->default('en_attente');
                $table->string('transaction_id')->nullable();
                $table->timestamps();
                $table->unique(['facture_id', 'status']);
                $table->index('transaction_id');
            });

            DB::statement("
                INSERT INTO paiements_tmp (
                    id, user_id, facture_id, numero_facture, nom_titulaire, numero_carte,
                    date_expiration, cvc, montant, status, transaction_id, created_at, updated_at
                )
                SELECT
                    id,
                    user_id,
                    facture_id,
                    numero_facture,
                    nom_titulaire,
                    numero_carte,
                    date_expiration,
                    cvc,
                    montant,
                    CASE
                        WHEN status = 'reussi' THEN 'accepted'
                        WHEN status = 'echoue' THEN 'rejected'
                        ELSE 'en_attente'
                    END,
                    transaction_id,
                    created_at,
                    updated_at
                FROM paiements
            ");

            Schema::drop('paiements');
            Schema::rename('paiements_tmp', 'paiements');

            return;
        }

        DB::statement("UPDATE paiements SET status = 'en_cours' WHERE status = 'en_attente'");
        DB::statement("UPDATE paiements SET status = 'reussi' WHERE status = 'accepted'");
        DB::statement("UPDATE paiements SET status = 'echoue' WHERE status = 'rejected'");

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE paiements MODIFY COLUMN status ENUM('en_attente', 'accepted', 'rejected') NOT NULL DEFAULT 'en_attente'");
        }

        DB::statement("UPDATE paiements SET status = 'en_attente' WHERE status = 'en_cours'");
        DB::statement("UPDATE paiements SET status = 'accepted' WHERE status = 'reussi'");
        DB::statement("UPDATE paiements SET status = 'rejected' WHERE status = 'echoue'");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::create('paiements_tmp', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('facture_id')->constrained()->onDelete('cascade');
                $table->string('numero_facture');
                $table->string('nom_titulaire');
                $table->string('numero_carte')->index();
                $table->date('date_expiration');
                $table->string('cvc', 255);
                $table->decimal('montant', 10, 2);
                $table->enum('status', ['reussi', 'echoue', 'en_cours'])->default('en_cours');
                $table->string('transaction_id')->nullable();
                $table->timestamps();
                $table->unique(['facture_id', 'status']);
                $table->index('transaction_id');
            });

            DB::statement("
                INSERT INTO paiements_tmp (
                    id, user_id, facture_id, numero_facture, nom_titulaire, numero_carte,
                    date_expiration, cvc, montant, status, transaction_id, created_at, updated_at
                )
                SELECT
                    id,
                    user_id,
                    facture_id,
                    numero_facture,
                    nom_titulaire,
                    numero_carte,
                    date_expiration,
                    cvc,
                    montant,
                    CASE
                        WHEN status = 'accepted' THEN 'reussi'
                        WHEN status = 'rejected' THEN 'echoue'
                        ELSE 'en_cours'
                    END,
                    transaction_id,
                    created_at,
                    updated_at
                FROM paiements
            ");

            Schema::drop('paiements');
            Schema::rename('paiements_tmp', 'paiements');

            return;
        }

        DB::statement("UPDATE paiements SET status = 'en_attente' WHERE status = 'en_cours'");
        DB::statement("UPDATE paiements SET status = 'accepted' WHERE status = 'reussi'");
        DB::statement("UPDATE paiements SET status = 'rejected' WHERE status = 'echoue'");

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE paiements MODIFY COLUMN status ENUM('reussi', 'echoue', 'en_cours') NOT NULL DEFAULT 'en_cours'");
        }

        DB::statement("UPDATE paiements SET status = 'en_cours' WHERE status = 'en_attente'");
        DB::statement("UPDATE paiements SET status = 'reussi' WHERE status = 'accepted'");
        DB::statement("UPDATE paiements SET status = 'echoue' WHERE status = 'rejected'");
    }
};
