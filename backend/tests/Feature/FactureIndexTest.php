<?php

namespace Tests\Feature;

use App\Models\Facture;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FactureIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_factures_endpoint_returns_authenticated_user_invoices_sorted_by_newest_first(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $oldestFacture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-301',
            'date' => '2026-04-17',
            'prix' => 1100,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $middleFacture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-302',
            'date' => '2026-04-18',
            'prix' => 1200,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $newestFacture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-303',
            'date' => '2026-04-19',
            'prix' => 1300,
            'status' => Facture::STATUS_UNPAID,
        ]);

        $oldestFacture->forceFill([
            'created_at' => Carbon::parse('2026-04-17 08:00:00'),
            'updated_at' => Carbon::parse('2026-04-17 08:00:00'),
        ])->save();

        $middleFacture->forceFill([
            'created_at' => Carbon::parse('2026-04-18 08:00:00'),
            'updated_at' => Carbon::parse('2026-04-18 08:00:00'),
        ])->save();

        $newestFacture->forceFill([
            'created_at' => Carbon::parse('2026-04-19 08:00:00'),
            'updated_at' => Carbon::parse('2026-04-19 08:00:00'),
        ])->save();

        Facture::create([
            'user_id' => $otherUser->id,
            'reference' => 'FACT-2026-399',
            'date' => '2026-04-20',
            'prix' => 9900,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/factures');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(3, 'data');

        $this->assertSame(
            [$newestFacture->id, $middleFacture->id, $oldestFacture->id],
            array_column($response->json('data'), 'id')
        );
    }
}
