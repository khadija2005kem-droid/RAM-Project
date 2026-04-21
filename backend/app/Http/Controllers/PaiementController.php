<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaiementController extends Controller
{
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'invoice_id' => 'required|integer|exists:factures,id',
                'numero_facture' => 'required|string|max:255',
                'nom_titulaire' => 'required|string|max:255',
                'numero_carte' => 'required|string|min:16|max:19',
                'date_expiration' => 'required|date|after:today',
                'cvc' => ['required', 'string', 'regex:/^\d{3,4}$/'],
                'montant' => 'required|numeric|min:0.01',
            ], [
                'invoice_id.required' => 'Veuillez remplir les champs.',
                'numero_facture.required' => 'Veuillez remplir les champs.',
                'nom_titulaire.required' => 'Veuillez remplir les champs.',
                'numero_carte.required' => 'Veuillez remplir les champs.',
                'numero_carte.min' => 'Numero de carte invalide.',
                'date_expiration.required' => 'Veuillez remplir les champs.',
                'date_expiration.date' => 'Date invalide.',
                'date_expiration.after' => "La date d'expiration doit etre dans le futur.",
                'cvc.required' => 'Veuillez remplir les champs.',
                'cvc.regex' => 'CVC invalide.',
                'montant.required' => 'Veuillez remplir les champs.',
                'montant.numeric' => 'Le montant doit etre un nombre.',
                'montant.min' => 'Le montant doit etre positif.',
            ]);

            return DB::transaction(function () use ($request, $data) {
                $user = $request->user();

                $facture = Facture::where('id', $data['invoice_id'])
                    ->where('reference', $data['numero_facture'])
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->first();

                if (!$facture) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Facture introuvable',
                    ], 404);
                }

                if ($facture->hasStatus(Facture::STATUS_PAID)) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture est deja payee',
                    ], 400);
                }

                $pendingPayment = Paiement::where('facture_id', $facture->id)
                    ->where('status', Paiement::STATUS_EN_ATTENTE)
                    ->lockForUpdate()
                    ->first();

                if ($pendingPayment || $facture->hasStatus(Facture::STATUS_PENDING)) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture est en attente de validation',
                    ], 400);
                }

                $acceptedPaymentExists = Paiement::where('facture_id', $facture->id)
                    ->where('status', Paiement::STATUS_ACCEPTED)
                    ->exists();

                if ($acceptedPaymentExists) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cette facture a deja ete payee',
                    ], 400);
                }

                if (abs($data['montant'] - $facture->prix) > 0.01) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Le montant ne correspond pas au prix de la facture',
                    ], 400);
                }

                $maskedCard = '**** **** **** ' . substr($data['numero_carte'], -4);

                $paymentPayload = [
                    'user_id' => $user->id,
                    'facture_id' => $facture->id,
                    'numero_facture' => $data['numero_facture'],
                    'nom_titulaire' => $data['nom_titulaire'],
                    'numero_carte' => $maskedCard,
                    'date_expiration' => $data['date_expiration'],
                    'cvc' => $data['cvc'],
                    'montant' => $data['montant'],
                    'status' => Paiement::STATUS_EN_ATTENTE,
                    'transaction_id' => null,
                ];

                $rejectedPayment = Paiement::where('facture_id', $facture->id)
                    ->where('status', Paiement::STATUS_REJECTED)
                    ->lockForUpdate()
                    ->latest('id')
                    ->first();

                if ($rejectedPayment) {
                    $rejectedPayment->update($paymentPayload);
                    $paiement = $rejectedPayment->fresh(['facture']);
                } else {
                    $paiement = Paiement::create($paymentPayload)->load('facture');
                }

                $facture->markAsPending();

                return response()->json([
                    'status' => true,
                    'message' => 'Payment request sent successfully',
                    'data' => [
                        'id' => $paiement->id,
                        'invoice_id' => $paiement->facture_id,
                        'user_id' => $paiement->user_id,
                        'montant' => $paiement->montant,
                        'status' => $paiement->status,
                        'facture' => $facture->fresh(),
                    ],
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                Log::warning('Payment constraint violation', [
                    'user_id' => optional($request->user())->id,
                    'invoice_id' => $data['invoice_id'] ?? null,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Une demande de paiement existe deja pour cette facture',
                ], 400);
            }

            throw $e;
        } catch (\Exception $e) {
            Log::error('Payment processing error: ' . $e->getMessage(), [
                'user_id' => optional($request->user())->id,
                'invoice_id' => $data['invoice_id'] ?? null,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Une erreur est survenue lors du traitement du paiement',
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $paiements = Paiement::where('user_id', $user->id)
            ->with('facture')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $paiements,
        ], 200);
    }
}
