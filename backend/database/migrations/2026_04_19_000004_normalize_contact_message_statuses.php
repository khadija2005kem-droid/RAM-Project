<?php

use App\Models\ContactMessage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('contact_messages')
            ->where('status', 'unread')
            ->update(['status' => ContactMessage::STATUS_NON_REPONDU]);

        DB::table('contact_messages')
            ->where('status', 'read')
            ->update(['status' => ContactMessage::STATUS_REPONDU]);
    }

    public function down(): void
    {
        DB::table('contact_messages')
            ->where('status', ContactMessage::STATUS_NON_REPONDU)
            ->update(['status' => 'unread']);

        DB::table('contact_messages')
            ->where('status', ContactMessage::STATUS_REPONDU)
            ->update(['status' => 'read']);
    }
};
