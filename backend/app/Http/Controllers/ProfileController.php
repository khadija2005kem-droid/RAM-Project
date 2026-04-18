<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile information
     */
    public function show(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Profile show failed', [
                'user_id' => $request->user()->id ?? null,
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Unable to retrieve profile at this time.',
                'errors' => []
            ], 500);
        }
    }

    /**
     * Update the authenticated user's profile information (name, email)
     */
    public function update(Request $request)
    {
        try {
            $user = $request->user();

            $data = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $user->id,
                'password' => 'nullable|min:6|confirmed'
            ], [
                'prenom.required' => 'Le prénom est requis.',
                'prenom.string' => 'Le prénom doit être un texte valide.',
                'prenom.max' => 'Le prénom ne doit pas dépasser 255 caractères.',

                'nom.required' => 'Le nom est requis.',
                'nom.string' => 'Le nom doit être un texte valide.',
                'nom.max' => 'Le nom ne doit pas dépasser 255 caractères.',

                'email.required' => "L'email est requis.",
                'email.email' => 'Email invalide.',
                'email.unique' => 'Cet email est déjà utilisé.',

                'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
                'password.confirmed' => 'Les mots de passe ne correspondent pas.'
            ]);

            $user->prenom = $data['prenom'];
            $user->nom = $data['nom'];
            $user->email = $data['email'];

            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }

            if (!$user->save()) {
                Log::error('Profile update failed: save did not complete', [
                    'user_id' => $user->id,
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Unable to update profile at this time.',
                    'errors' => []
                ], 500);
            }

            return response()->json([
                'status' => true,
                'message' => 'Profil mis à jour avec succès.',
                'data' => [
                    'id' => $user->id,
                    'prenom' => $user->prenom,
                    'nom' => $user->nom,
                    'email' => $user->email,
                    'updated_at' => $user->updated_at
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Profile update failed with exception', [
                'user_id' => $request->user()->id ?? null,
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Unable to update profile at this time.',
                'errors' => []
            ], 500);
        }
    }

    /**
     * Update the authenticated user's password
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = $request->user();

            $data = $request->validate([
                'current_password' => 'required',
                'new_password' => [
                    'required',
                    'min:6',
                    'confirmed'
                ]
            ], [
                'current_password.required' => 'Le mot de passe actuel est requis.',
                'new_password.required' => 'Le nouveau mot de passe est requis.',
                'new_password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
                'new_password.confirmed' => 'Les mots de passe ne correspondent pas.'
            ]);

            // Verify current password
            if (!Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Le mot de passe actuel est incorrect.',
                    'errors' => [
                        'current_password' => ['Le mot de passe actuel est incorrect.']
                    ]
                ], 422);
            }

            // Update password
            $user->password = Hash::make($data['new_password']);

            if (!$user->save()) {
                Log::error('Password update failed: save did not complete', [
                    'user_id' => $user->id,
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Unable to update password at this time.',
                    'errors' => []
                ], 500);
            }

            return response()->json([
                'status' => true,
                'message' => 'Mot de passe mis à jour avec succès.',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Password update failed with exception', [
                'user_id' => $request->user()->id ?? null,
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Unable to update password at this time.',
                'errors' => []
            ], 500);
        }
    }
}
