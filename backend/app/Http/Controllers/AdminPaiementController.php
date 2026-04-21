<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Support\Facades\DB;

class AdminPaiementController extends Controller
{
    public function index()
    {
        $paiements = Paiement::with(['user', 'facture'])
            ->pending()
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $paiements,
        ], 200);
    }

    public function accept($id)
    {
        return DB::transaction(function () use ($id) {
            $paiement = Paiement::with(['user', 'facture'])->lockForUpdate()->findOrFail($id);

            if ($paiement->status !== Paiement::STATUS_EN_ATTENTE) {
                return response()->json([
                    'status' => false,
                    'message' => 'Only pending payment requests can be accepted.',
                ], 422);
            }

            $facture = Facture::lockForUpdate()->findOrFail($paiement->facture_id);

            $paiement->update(['status' => Paiement::STATUS_ACCEPTED]);
            $facture->markAsPaid();

            return response()->json([
                'status' => true,
                'message' => 'Payment request accepted successfully',
                'data' => $paiement->fresh(['user', 'facture']),
            ], 200);
        });
    }

    public function reject($id)
    {
        return DB::transaction(function () use ($id) {
            $paiement = Paiement::with(['user', 'facture'])->lockForUpdate()->findOrFail($id);

            if ($paiement->status !== Paiement::STATUS_EN_ATTENTE) {
                return response()->json([
                    'status' => false,
                    'message' => 'Only pending payment requests can be rejected.',
                ], 422);
            }

            $facture = Facture::lockForUpdate()->findOrFail($paiement->facture_id);

            $paiement->update(['status' => Paiement::STATUS_REJECTED]);
            $facture->markAsUnpaid();

            return response()->json([
                'status' => true,
                'message' => 'Payment request rejected successfully',
                'data' => $paiement->fresh(['user', 'facture']),
            ], 200);
        });
    }
}
