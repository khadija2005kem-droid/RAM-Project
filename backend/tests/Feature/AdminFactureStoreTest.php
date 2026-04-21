<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminFactureStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_invoice_creation_groups_multiple_descriptions_into_one_invoice(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/factures', [
            'user_id' => $client->id,
            'date' => '2026-04-20',
            'descriptions' => [
                [
                    'description' => 'Service A',
                    'price' => 100,
                ],
                [
                    'description' => 'Service B',
                    'price' => 200,
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.user.id', $client->id)
            ->assertJsonPath('data.prix', 300)
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.description', 'Service A')
            ->assertJsonPath('data.items.0.price', 100)
            ->assertJsonPath('data.items.1.description', 'Service B')
            ->assertJsonPath('data.items.1.price', 200);

        $this->assertDatabaseCount('factures', 1);
        $this->assertDatabaseHas('factures', [
            'user_id' => $client->id,
            'prix' => 300,
        ]);
    }

    public function test_invoice_show_returns_line_items_for_the_authenticated_client(): void
    {
        $client = User::factory()->create(['role' => 'client']);

        $factureResponse = $this->actingAsAdminAndCreateInvoiceFor($client);

        Sanctum::actingAs($client);

        $response = $this->getJson('/api/factures/' . $factureResponse->json('data.id'));

        $response->assertOk()
            ->assertJsonPath('id', $factureResponse->json('data.id'))
            ->assertJsonPath('prix', 300)
            ->assertJsonCount(2, 'items')
            ->assertJsonPath('items.0.description', 'Service A')
            ->assertJsonPath('items.1.description', 'Service B');
    }

    private function actingAsAdminAndCreateInvoiceFor(User $client)
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        return $this->postJson('/api/admin/factures', [
            'user_id' => $client->id,
            'date' => '2026-04-20',
            'descriptions' => [
                [
                    'description' => 'Service A',
                    'price' => 100,
                ],
                [
                    'description' => 'Service B',
                    'price' => 200,
                ],
            ],
        ])->assertCreated();
    }
}
