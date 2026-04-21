<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Facture;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Throwable;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        // Get the authenticated user (middleware ensures this exists)
        $user = $request->user();

        $factures = Facture::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $factures
        ], 200);
    }

    public function show(Request $request, $id)
    {
        // Get the authenticated user (middleware ensures this exists)
        $user = $request->user();

        $facture = Facture::with('user')
                          ->where('id', $id)
                          ->where('user_id', $user->id)
                          ->first();

        if (!$facture) {
            return response()->json([
                'status' => false,
                'message' => 'Facture not found'
            ], 404);
        }

        if (Schema::hasTable('activities')) {
            try {
                $activity = Activity::firstOrNew([
                    'user_id' => $user->id,
                    'invoice_id' => $facture->id,
                    'action' => Activity::ACTION_VIEWED_INVOICE,
                ]);

                $activity->created_at = Carbon::now();
                $activity->save();
            } catch (Throwable $exception) {
                // Do not block invoice viewing if activity tracking is unavailable.
            }
        }

        return response()->json([
            'id' => $facture->id,
            'reference' => $facture->reference,
            'date' => $facture->date,
            'prix' => $facture->prix,
            'status' => $facture->status,
            'items' => collect($facture->items ?? [])->values()->all(),
            'user' => [
                'id' => $facture->user->id,
                'name' => trim($facture->user->prenom . ' ' . $facture->user->nom),
                'email' => $facture->user->email,
            ],
        ], 200);
    }

    public function recent(Request $request)
    {
        // Get the authenticated user (middleware ensures this exists)
        $user = $request->user();

        $recentFactures = Facture::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->take(3)
            ->get();

        return response()->json([
            'status' => true,
            'data' => $recentFactures
        ], 200);
    }

    public function unseen(Request $request)
    {
        $user = $request->user();
        $excludedStatuses = array_values(array_unique([
            Facture::STATUS_PAID,
            Facture::STATUS_PENDING,
            'paid',
            'pending',
            'accepted',
            'en_attente',
        ]));

        $viewedInvoiceIds = collect();

        if (Schema::hasTable('activities')) {
            try {
                $viewedInvoiceIds = Activity::query()
                    ->where('user_id', $user->id)
                    ->where('action', Activity::ACTION_VIEWED_INVOICE)
                    ->pluck('invoice_id');
            } catch (Throwable $exception) {
                $viewedInvoiceIds = collect();
            }
        }

        $unseenFactures = Facture::where('user_id', $user->id)
            ->where('is_admin_created', true)
            ->whereNotIn('status', $excludedStatuses)
            ->whereNotIn('id', $viewedInvoiceIds)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $unseenFactures,
        ], 200);
    }

    public function checkByReference(Request $request, $reference)
    {
        // Get the authenticated user (middleware ensures this exists)
        $user = $request->user();

        $facture = Facture::where('reference', $reference)
                          ->where('user_id', $user->id)
                          ->first();

        if (!$facture) {
            return response()->json([
                'status' => false,
                'message' => 'Facture not found'
            ], 404);
        }

        return response()->json([
            'id' => $facture->id,
            'reference' => $facture->reference,
            'date' => $facture->date,
            'prix' => $facture->prix,
            'status' => $facture->status
        ], 200);
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $data = $request->validate([
                'date' => 'required|date',
                'prix' => 'required|numeric|min:0',
            ], [
                'date.required' => 'Veuillez remplir les champs.',
                'date.date' => 'Date invalide.',
                'prix.required' => 'Veuillez remplir les champs.',
                'prix.numeric' => 'Le montant doit être un nombre.',
                'prix.min' => 'Le montant doit être positif.',
            ]);

            // Reference is auto-generated by the Facture model.
            $facture = Facture::create(array_merge($data, [
                'user_id' => $user->id,
                'is_admin_created' => false,
                'status' => Facture::STATUS_UNPAID,
            ]));

            return response()->json([
                'status' => true,
                'message' => 'Facture créée avec succès',
                'data' => $facture
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    public function pay(Request $request, $id)
    {
        $user = $request->user();

        $facture = Facture::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$facture) {
            return response()->json([
                'status' => false,
                'message' => 'Facture not found'
            ], 404);
        }

        if (!$facture->hasStatus(Facture::STATUS_UNPAID)) {
            return response()->json([
                'status' => false,
                'message' => 'Only unpaid invoices can be moved to pending.'
            ], 422);
        }

        $facture->markAsPending();

        return response()->json([
            'status' => true,
            'message' => 'Facture payment request submitted',
            'data' => $facture
        ], 200);
    }
}
