<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicateGroups = DB::table('activities')
            ->select('user_id', 'invoice_id', 'action')
            ->groupBy('user_id', 'invoice_id', 'action')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateGroups as $group) {
            $rows = DB::table('activities')
                ->where('user_id', $group->user_id)
                ->where('invoice_id', $group->invoice_id)
                ->where('action', $group->action)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->get();

            $latestRow = $rows->first();
            $latestCreatedAt = $rows->max('created_at');
            $latestUpdatedAt = $rows->max('updated_at');

            DB::table('activities')
                ->where('id', $latestRow->id)
                ->update([
                    'created_at' => $latestCreatedAt,
                    'updated_at' => $latestUpdatedAt,
                ]);

            DB::table('activities')
                ->where('user_id', $group->user_id)
                ->where('invoice_id', $group->invoice_id)
                ->where('action', $group->action)
                ->where('id', '!=', $latestRow->id)
                ->delete();
        }

        Schema::table('activities', function (Blueprint $table) {
            $table->unique(['user_id', 'invoice_id', 'action'], 'activities_user_invoice_action_unique');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropUnique('activities_user_invoice_action_unique');
        });
    }
};
