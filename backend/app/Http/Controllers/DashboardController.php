<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthenticated.',
                    'errors' => []
                ], 401);
            }

            $factures = Facture::where('user_id', $user->id)->get();

            $stats = [
                'payees' => $factures->where('status', Facture::STATUS_PAID)->count(),
                'non_payees' => $factures->where('status', Facture::STATUS_UNPAID)->count(),
                'en_attente' => $factures->where('status', Facture::STATUS_PENDING)->count(),
            ];

            return response()->json([
                'status' => true,
                'data' => [
                    'user' => [
                        'nom' => $user->nom,
                        'prenom' => $user->prenom,
                    ],
                    'stats' => $stats,
                ]
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Dashboard load failed', [
                'user_id' => optional($request->user())->id,
                'exception' => $e->getMessage(),
            ]);

            $response = [
                'status' => false,
                'message' => 'Unable to load dashboard right now.',
            ];

            if (config('app.debug')) {
                $response['error'] = $e->getMessage();
            }

            return response()->json($response, 500);
        }
    }
}
