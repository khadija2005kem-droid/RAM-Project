<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReplyMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_reply_marks_message_as_replied_and_returns_success_message(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);

        $message = ContactMessage::create([
            'user_id' => $client->id,
            'nom' => 'Doe',
            'prenom' => 'Jane',
            'email' => 'jane@example.com',
            'sujet' => 'Need help',
            'message' => 'I need help with my booking details.',
            'status' => ContactMessage::STATUS_NON_REPONDU,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/admin/messages/{$message->id}/reply", [
            'reply' => 'Your message has been handled.',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('message', 'Message sent successfully via email')
            ->assertJsonPath('data.id', $message->id)
            ->assertJsonPath('data.status', ContactMessage::STATUS_REPONDU);

        $this->assertDatabaseHas('contact_messages', [
            'id' => $message->id,
            'status' => ContactMessage::STATUS_REPONDU,
        ]);
    }

    public function test_admin_messages_endpoint_only_returns_unresponded_messages(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);

        $pendingMessage = ContactMessage::create([
            'user_id' => $client->id,
            'nom' => 'Doe',
            'prenom' => 'Jane',
            'email' => 'jane@example.com',
            'sujet' => 'Pending',
            'message' => 'I still need help with my booking details.',
            'status' => ContactMessage::STATUS_NON_REPONDU,
        ]);

        ContactMessage::create([
            'user_id' => $client->id,
            'nom' => 'Doe',
            'prenom' => 'John',
            'email' => 'john@example.com',
            'sujet' => 'Answered',
            'message' => 'This message has already received a reply.',
            'status' => ContactMessage::STATUS_REPONDU,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/messages');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pendingMessage->id)
            ->assertJsonPath('data.0.status', ContactMessage::STATUS_NON_REPONDU);
    }
}
