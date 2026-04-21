<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'sujet' => 'required|string|max:255',
                'message' => 'required|string|min:10'
            ], [
                'nom.required' => 'Veuillez remplir les champs.',
                'prenom.required' => 'Veuillez remplir les champs.',
                'email.required' => 'Veuillez remplir les champs.',
                'email.email' => 'Email invalide.',
                'sujet.required' => 'Veuillez remplir les champs.',
                'message.required' => 'Veuillez remplir les champs.',
                'message.min' => 'Le message doit contenir au moins 10 caractères.'
            ]);

            if (!auth('sanctum')->check()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized. Must be logged in to send a message.'
                ], 401);
            }

            $data['user_id'] = auth('sanctum')->id();
            $data['status'] = ContactMessage::STATUS_NON_REPONDU;

            ContactMessage::create($data);

            return response()->json([
                'status' => true,
                'message' => 'Message saved successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }
}
