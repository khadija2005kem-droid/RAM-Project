<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnseenFactureTest extends TestCase
{
    use RefreshDatabase;

    public function test_unseen_factures_endpoint_returns_only_admin_created_unviewed_invoices_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $unseenFacture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-101',
            'date' => '2026-04-19',
            'prix' => 1200,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $viewedFacture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-102',
            'date' => '2026-04-19',
            'prix' => 1300,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $paidFacture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-105',
            'date' => '2026-04-19',
            'prix' => 1600,
            'status' => Facture::STATUS_PAID,
        ]);

        $pendingFacture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-106',
            'date' => '2026-04-19',
            'prix' => 1700,
            'status' => Facture::STATUS_PENDING,
        ]);

        $clientCreatedFacture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => false,
            'reference' => 'FACT-2026-103',
            'date' => '2026-04-19',
            'prix' => 1400,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $otherUserFacture = Facture::create([
            'user_id' => $otherUser->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-104',
            'date' => '2026-04-19',
            'prix' => 1500,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Activity::create([
            'user_id' => $user->id,
            'invoice_id' => $viewedFacture->id,
            'action' => Activity::ACTION_VIEWED_INVOICE,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/factures/unseen');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $unseenFacture->id)
            ->assertJsonPath('data.0.reference', 'FACT-2026-101');

        $responseData = $response->json('data');

        $this->assertSame([$unseenFacture->id], array_column($responseData, 'id'));
        $this->assertNotContains($paidFacture->id, array_column($responseData, 'id'));
        $this->assertNotContains($pendingFacture->id, array_column($responseData, 'id'));
    }

    public function test_viewed_invoice_disappears_from_unseen_factures_endpoint_after_it_is_opened(): void
    {
        $user = User::factory()->create();

        $facture = Facture::create([
            'user_id' => $user->id,
            'is_admin_created' => true,
            'reference' => 'FACT-2026-201',
            'date' => '2026-04-19',
            'prix' => 1800,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/factures/unseen')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $facture->id);

        $this->getJson("/api/factures/{$facture->id}")
            ->assertOk()
            ->assertJsonPath('id', $facture->id);

        $this->getJson('/api/factures/unseen')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
