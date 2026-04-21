<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!Schema::hasTable('activities')) {
            return response()->json([
                'status' => true,
                'data' => [],
                'message' => 'Activities table is not available yet.',
            ], 200);
        }

        try {
            $activities = Activity::with('invoice')
                ->where('user_id', $request->user()->id)
                ->where('action', Activity::ACTION_VIEWED_INVOICE)
                ->latest()
                ->take(3)
                ->get()
                ->map(function (Activity $activity) {
                    return [
                        'id' => $activity->id,
                        'action' => $activity->action,
                        'created_at' => $activity->created_at?->toISOString(),
                        'updated_at' => $activity->updated_at?->toISOString(),
                        'invoice' => $activity->invoice ? [
                            'id' => $activity->invoice->id,
                            'reference' => $activity->invoice->reference,
                            'date' => $activity->invoice->date,
                            'prix' => $activity->invoice->prix,
                            'status' => $activity->invoice->status,
                        ] : null,
                    ];
                });
        } catch (Throwable $exception) {
            return response()->json([
                'status' => true,
                'data' => [],
                'message' => 'Unable to load activities right now.',
            ], 200);
        }

        return response()->json([
            'status' => true,
            'data' => $activities,
        ], 200);
    }
}
