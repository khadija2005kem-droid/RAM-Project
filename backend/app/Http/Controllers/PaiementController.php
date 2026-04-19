<?php

namespace App\Http\Controllers;

use App\Models\Paiement;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'numero_facture' => 'required|string|max:255',
                'nom_titulaire' => 'required|string|max:255',
                'numero_carte' => 'required|string|min:16|max:19',
                'date_expiration' => 'required|date|after:today',
                'cvc' => 'required|string|min:3|max:4',
                'montant' => 'required|numeric|min:0.01'
            ], [
                'numero_facture.required' => 'Veuillez remplir les champs.',
                'nom_titulaire.required' => 'Veuillez remplir les champs.',
                'numero_carte.required' => 'Veuillez remplir les champs.',
                'numero_carte.min' => 'Numéro de carte invalide.',
                'date_expiration.required' => 'Veuillez remplir les champs.',
                'date_expiration.date' => 'Date invalide.',
                'date_expiration.after' => 'La date d\'expiration doit être dans le futur.',
                'cvc.required' => 'Veuillez remplir les champs.',
                'cvc.min' => 'CVC invalide.',
                'montant.required' => 'Veuillez remplir les champs.',
                'montant.numeric' => 'Le montant doit être un nombre.',
                'montant.min' => 'Le montant doit être positif.'
            ]);

            return DB::transaction(function () use ($request, $data) {
                $user = $request->user();

                // Find facture by reference with pessimistic locking to prevent race conditions
                $facture = Facture::where('reference', $data['numero_facture'])
                                  ->where('user_id', $user->id)
                                  ->lockForUpdate()
                                  ->first();

                if (!$facture) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Facture introuvable'
                    ], 404);
                }

                // Check for existing successful payment to prevent duplicate payments
                $existingPayment = Paiement::where('facture_id', $facture->id)
                                          ->where('status', 'reussi')
                                          ->exists();

                if ($existingPayment) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture a déjà été payée'
                    ], 400);
                }

                // Primary validation: Check if facture is already marked as paid
                if ($facture->hasStatus(Facture::STATUS_PAID)) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture est déjà payée'
                    ], 400);
                }

                // Validation: Check if facture is pending approval
                if ($facture->hasStatus(Facture::STATUS_PENDING)) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture est en attente de validation'
                    ], 400);
                }

                // Validate montant matches facture price (with small tolerance for floating point)
                if (abs($data['montant'] - $facture->prix) > 0.01) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Le montant ne correspond pas au prix de la facture'
                    ], 400);
                }

                $transactionId = 'TXN-' . time() . '-' . rand(1000, 9999);
                $maskedCard = '**** **** **** ' . substr($data['numero_carte'], -4);
                $encryptedCvc = bcrypt($data['cvc']);

                // Create payment record
                $paiement = Paiement::create([
                    'user_id' => $user->id,
                    'facture_id' => $facture->id,
                    'numero_facture' => $data['numero_facture'],
                    'nom_titulaire' => $data['nom_titulaire'],
                    'numero_carte' => $maskedCard,
                    'date_expiration' => $data['date_expiration'],
                    'cvc' => $encryptedCvc,
                    'montant' => $data['montant'],
                    'status' => 'reussi',
                    'transaction_id' => $transactionId
                ]);

                // Final validation before status update
                if ($paiement->status !== 'reussi') {
                    throw new \Exception('Payment status validation failed');
                }

                // Update facture status to pending for admin validation
                $updateResult = $facture->markAsPending();

                if (!$updateResult) {
                    throw new \Exception('Failed to update invoice status');
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Paiement effectué avec succès',
                    'data' => [
                        'transaction_id' => $transactionId,
                        'montant' => $paiement->montant,
                        'status' => $paiement->status,
                        'facture' => $facture->fresh(),
                    ]
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database constraint violations (e.g., duplicate payment)
            if ($e->getCode() === '23000') { // INTEGRITY CONSTRAINT VIOLATION
                \Illuminate\Support\Facades\Log::warning('Payment constraint violation (likely duplicate payment attempt)', [
                    'user_id' => optional($request->user())->id,
                    'numero_facture' => $data['numero_facture'] ?? null,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Cette facture a déjà été payée'
                ], 400);
            }

            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Payment processing error: ' . $e->getMessage(), [
                'user_id' => optional($request->user())->id,
                'numero_facture' => $data['numero_facture'] ?? null
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Une erreur est survenue lors du traitement du paiement'
            ], 500);
        }
    }

    public function index(Request $request)
    {
        // Get the authenticated user (middleware ensures this exists)
        $user = $request->user();

        $paiements = Paiement::where('user_id', $user->id)
                            ->with('facture')
                            ->orderBy('created_at', 'desc')
                            ->get();

        return response()->json([
            'status' => true,
            'data' => $paiements
        ], 200);
    }
}
