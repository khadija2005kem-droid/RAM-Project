<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(Request $request)
    {
        $users = User::query();

        if ($request->query('role') === 'client') {
            $users->where('role', 'client');
        }

        $users = $users->get();

        return response()->json(['status' => true, 'data' => $users], 200);
    }

    public function userById($id)
    {
        $user = User::where('id', $id)
            ->where('role', 'client')
            ->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Client introuvable',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $user,
        ], 200);
    }

    public function factures()
    {
        $factures = Facture::with('user')->get();
        return response()->json(['status' => true, 'data' => $factures], 200);
    }

    public function validateFacture($id)
    {
        $facture = Facture::findOrFail($id);
        $facture->markAsPaid();

        return response()->json(['status' => true, 'message' => 'Facture validated successfully', 'data' => $facture], 200);
    }

    public function rejectFacture($id)
    {
        $facture = Facture::findOrFail($id);
        $facture->markAsUnpaid();

        return response()->json(['status' => true, 'message' => 'Facture rejected successfully', 'data' => $facture], 200);
    }

    public function messages()
    {
        $messages = ContactMessage::with('user')
            ->pendingResponse()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['status' => true, 'data' => $messages], 200);
    }

    public function replyToMessage(Request $request, $id)
    {
        $data = $request->validate([
            'reply' => 'required|string',
        ], [
            'reply.required' => 'A reply is required.',
        ]);

        $message = ContactMessage::findOrFail($id);
        $message->status = ContactMessage::STATUS_REPONDU;
        $message->save();

        return response()->json([
            'status' => true,
            'message' => 'Message sent successfully via email',
            'data' => [
                'id' => $message->id,
                'status' => $message->status,
                'reply' => $data['reply'],
            ],
        ], 200);
    }
}
