<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\User;
use Illuminate\Http\Request;

class AdminFactureController extends Controller
{
    public function index()
    {
        $factures = Facture::with('user')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['status' => true, 'data' => $factures], 200);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'prix' => 'nullable|numeric|min:0',
            'user_id' => 'nullable|integer|exists:users,id',
            'client_email' => 'nullable|email|exists:users,email',
            'descriptions' => 'nullable|array|min:1',
            'descriptions.*.description' => 'required|string',
            'descriptions.*.price' => 'required|numeric|min:0',
        ]);

        if (empty($data['user_id']) && empty($data['client_email'])) {
            return response()->json([
                'status' => false,
                'message' => 'A client is required (user_id or client_email).',
            ], 422);
        }

        $client = null;
        if (!empty($data['user_id'])) {
            $client = User::find($data['user_id']);
        } elseif (!empty($data['client_email'])) {
            $client = User::where('email', $data['client_email'])->first();
        }

        if (!$client || !$client->isClient()) {
            return response()->json([
                'status' => false,
                'message' => 'Client not found or invalid role.',
            ], 422);
        }

        $lineItems = collect($data['descriptions'] ?? [])
            ->map(fn (array $item) => [
                'description' => trim((string) $item['description']),
                'price' => round((float) $item['price'], 2),
            ])
            ->filter(fn (array $item) => $item['description'] !== '')
            ->values();

        if ($lineItems->isEmpty() && array_key_exists('prix', $data) && $data['prix'] !== null) {
            $lineItems = collect([[
                'description' => "Billet d'avion",
                'price' => round((float) $data['prix'], 2),
            ]]);
        }

        if ($lineItems->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'At least one invoice item is required.',
            ], 422);
        }

        $total = round($lineItems->sum('price'), 2);

        $facture = Facture::create([
            'user_id' => $client->id,
            'is_admin_created' => true,
            'date' => $data['date'],
            'prix' => $total,
            'items' => $lineItems->all(),
            'status' => Facture::STATUS_UNPAID,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Facture created successfully',
            'data' => $facture->load('user'),
        ], 201);
    }

    public function accept($id)
    {
        $facture = Facture::findOrFail($id);

        if (!$facture->hasStatus(Facture::STATUS_PENDING)) {
            return response()->json([
                'status' => false,
                'message' => 'Only pending invoices can be marked as paid.',
            ], 422);
        }

        $facture->markAsPaid();

        return response()->json([
            'status' => true,
            'message' => 'Facture marked as paid',
            'data' => $facture->fresh(),
        ], 200);
    }

    public function validatePayment($id)
    {
        return $this->accept($id);
    }

    public function reject($id)
    {
        $facture = Facture::findOrFail($id);

        if (!$facture->hasStatus(Facture::STATUS_PENDING)) {
            return response()->json([
                'status' => false,
                'message' => 'Only pending invoices can be rejected.',
            ], 422);
        }

        $facture->markAsUnpaid();

        return response()->json([
            'status' => true,
            'message' => 'Facture marked as unpaid',
            'data' => $facture->fresh(),
        ], 200);
    }

    public function pending($id)
    {
        $facture = Facture::findOrFail($id);

        if (!$facture->hasStatus(Facture::STATUS_UNPAID)) {
            return response()->json([
                'status' => false,
                'message' => 'Only unpaid invoices can be marked as pending.',
            ], 422);
        }

        $facture->markAsPending();

        return response()->json([
            'status' => true,
            'message' => 'Facture marked as pending',
            'data' => $facture->fresh(),
        ], 200);
    }
}
