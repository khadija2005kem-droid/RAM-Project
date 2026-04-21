<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewing_an_invoice_creates_an_activity_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $facture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-001',
            'date' => '2026-04-19',
            'prix' => 1500,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/factures/{$facture->id}");

        $response->assertOk()
            ->assertJson([
                'id' => $facture->id,
                'reference' => 'FACT-2026-001',
            ]);

        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'invoice_id' => $facture->id,
            'action' => Activity::ACTION_VIEWED_INVOICE,
        ]);
    }

    public function test_viewing_the_same_invoice_multiple_times_refreshes_the_existing_activity_timestamp(): void
    {
        $user = User::factory()->create();
        $facture = Facture::create([
            'user_id' => $user->id,
            'reference' => 'FACT-2026-777',
            'date' => '2026-04-19',
            'prix' => 1700,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Sanctum::actingAs($user);

        Carbon::setTestNow('2026-04-19 08:00:00');
        $this->getJson("/api/factures/{$facture->id}")->assertOk();

        $firstActivity = Activity::query()
            ->where('user_id', $user->id)
            ->where('invoice_id', $facture->id)
            ->where('action', Activity::ACTION_VIEWED_INVOICE)
            ->firstOrFail();

        Carbon::setTestNow('2026-04-19 10:30:00');
        $this->getJson("/api/factures/{$facture->id}")->assertOk();
        $this->getJson("/api/factures/{$facture->id}")->assertOk();

        $activity = Activity::query()
            ->where('user_id', $user->id)
            ->where('invoice_id', $facture->id)
            ->where('action', Activity::ACTION_VIEWED_INVOICE)
            ->firstOrFail();

        $this->assertSame(
            1,
            Activity::query()
                ->where('user_id', $user->id)
                ->where('invoice_id', $facture->id)
                ->where('action', Activity::ACTION_VIEWED_INVOICE)
                ->count()
        );

        $this->assertSame($firstActivity->id, $activity->id);
        $this->assertSame('2026-04-19 10:30:00', $activity->created_at->format('Y-m-d H:i:s'));

        Carbon::setTestNow();
    }

    public function test_activities_endpoint_returns_only_the_latest_three_invoice_views_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $factures = collect(range(1, 4))->map(function (int $index) use ($user) {
            return Facture::create([
                'user_id' => $user->id,
                'reference' => sprintf('FACT-2026-%03d', $index),
                'date' => '2026-04-19',
                'prix' => 1000 + $index,
                'status' => Facture::STATUS_UNPAID,
            ]);
        });

        foreach ($factures as $index => $facture) {
            $activity = Activity::create([
                'user_id' => $user->id,
                'invoice_id' => $facture->id,
                'action' => Activity::ACTION_VIEWED_INVOICE,
            ]);

            $activity->timestamps = false;
            $activity->created_at = now()->addSeconds($index);
            $activity->updated_at = now()->addSeconds($index);
            $activity->save();
        }

        $otherFacture = Facture::create([
            'user_id' => $otherUser->id,
            'reference' => 'FACT-2026-999',
            'date' => '2026-04-19',
            'prix' => 9999,
            'status' => Facture::STATUS_UNPAID,
        ]);

        Activity::create([
            'user_id' => $otherUser->id,
            'invoice_id' => $otherFacture->id,
            'action' => Activity::ACTION_VIEWED_INVOICE,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/activities');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.invoice.reference', 'FACT-2026-004')
            ->assertJsonPath('data.1.invoice.reference', 'FACT-2026-003')
            ->assertJsonPath('data.2.invoice.reference', 'FACT-2026-002');
    }
}
