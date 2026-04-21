<?php

namespace Tests\Feature;

use App\Models\Facture;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaiementStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_request_stores_only_valid_payment_columns_and_marks_invoice_pending(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $facture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-401',
            'date' => '2026-04-20',
            'prix' => 2500,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/paiements', [
            'invoice_id' => $facture->id,
            'prenom' => 'Jane',
            'nom' => 'Doe',
            'email' => 'jane@example.com',
            'numero_facture' => $facture->reference,
            'nom_titulaire' => 'Jane Doe',
            'numero_carte' => '4111111111111111',
            'date_expiration' => now()->addMonth()->toDateString(),
            'cvc' => '123',
            'montant' => 2500,
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.invoice_id', $facture->id)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.montant', '2500.00')
            ->assertJsonPath('data.status', Paiement::STATUS_EN_ATTENTE);

        $this->assertDatabaseHas('paiements', [
            'user_id' => $user->id,
            'facture_id' => $facture->id,
            'numero_facture' => $facture->reference,
            'nom_titulaire' => 'Jane Doe',
            'cvc' => '123',
            'montant' => 2500,
            'status' => Paiement::STATUS_EN_ATTENTE,
            'transaction_id' => null,
        ]);

        $this->assertDatabaseMissing('paiements', [
            'numero_facture' => $facture->reference,
            'nom_titulaire' => 'Jane Doe',
            'montant' => 2500,
            'status' => Paiement::STATUS_ACCEPTED,
        ]);

        $this->assertTrue($facture->fresh()->hasStatus(Facture::STATUS_PENDING));
    }

    public function test_pending_payment_appears_in_admin_payments_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'client']);
        $facture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-402',
            'date' => '2026-04-20',
            'prix' => 1800,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Paiement::create([
            'user_id' => $user->id,
            'facture_id' => $facture->id,
            'numero_facture' => $facture->reference,
            'nom_titulaire' => 'John Doe',
            'numero_carte' => '**** **** **** 1111',
            'date_expiration' => now()->addMonth()->toDateString(),
            'cvc' => '123',
            'montant' => 1800,
            'status' => Paiement::STATUS_EN_ATTENTE,
            'transaction_id' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/paiements');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.facture_id', $facture->id)
            ->assertJsonPath('data.0.status', Paiement::STATUS_EN_ATTENTE);
    }
}
