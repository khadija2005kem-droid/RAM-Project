<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request) {
        try {
            $data = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',

                // ✅ NEW RULE: 6 letters + 3 numbers minimum
                'password' => [
                    'required',
                    'confirmed',
                    'min:9', // minimum possible length (6 letters + 3 numbers = 9 chars)
                    'regex:/^(?=(?:.*[A-Za-z]){6,})(?=(?:.*\d){3,})[A-Za-z\d]+$/'
                ]
            ], [
                'prenom.required' => 'Veuillez remplir les champs.',
                'nom.required' => 'Veuillez remplir les champs.',
                'email.required' => 'Veuillez remplir les champs.',
                'email.email' => 'Email invalide.',
                'email.unique' => 'Cet email est déjà utilisé.',

                'password.required' => 'Veuillez remplir les champs.',
                'password.confirmed' => 'Les mots de passe ne correspondent pas.',

                'password.min' => 'Le mot de passe doit contenir au moins 9 caractères.',

                // ✅ UPDATED MESSAGE
                'password.regex' => 'Le mot de passe doit contenir au moins 6 lettres et 3 chiffres.'
            ]);

            $user = new User();
            $user->prenom = $data['prenom'];
            $user->nom = $data['nom'];
            $user->email = $data['email'];
            $user->password = Hash::make($data['password']);
            $user->role = 'client';

            if (! $user->save() || ! $user->id) {
                Log::error('Register failed: user was not persisted', [
                    'email' => $data['email'],
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Unable to create account right now.',
                    'errors' => []
                ], 500);
            }

            $token = $user->createToken('token')->plainTextToken;

            return response()->json([
                'status' => true,
                'user' => $user->fresh(),
                'token' => $token
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Register failed with exception', [
                'email' => $request->input('email'),
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Unable to create account right now.',
                'errors' => []
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ], [
                'email.required' => 'Veuillez remplir les champs.',
                'email.email' => 'Email invalide.',
                'password.required' => 'Veuillez remplir les champs.'
            ]);

            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email or password is incorrect.',
                    'errors' => []
                ], 401);
            }

            $token = $user->createToken('token')->plainTextToken;

            $accessMessage = $user->isAdmin() ? 'Admin access granted' : 'Client access granted';

            return response()->json([
                'status' => true,
                'message' => $accessMessage,
                'user' => $user,
                'token' => $token
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Login failed with exception', [
                'email' => $request->input('email'),
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Unable to login right now.',
                'errors' => []
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        // Revoke the current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'status' => true,
            'user' => $request->user()
        ]);
    }

    public function update(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $data = $request->validate([
                'prenom' => 'sometimes|required|string|max:255',
                'nom' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|required|confirmed|min:9|regex:/^(?=(?:.*[A-Za-z]){6,})(?=(?:.*\d){3,})[A-Za-z\d]+$/'
            ], [
                'email.email' => 'Email invalide.',
                'email.unique' => 'Cet email est déjà utilisé.',
                'password.confirmed' => 'Les mots de passe ne correspondent pas.',
                'password.min' => 'Le mot de passe doit contenir au moins 9 caractères.',
                'password.regex' => 'Le mot de passe doit contenir au moins 6 lettres et 3 chiffres.'
            ]);

            // Update user data
            if (isset($data['prenom'])) $user->prenom = $data['prenom'];
            if (isset($data['nom'])) $user->nom = $data['nom'];
            if (isset($data['email'])) $user->email = $data['email'];
            if (isset($data['password'])) $user->password = Hash::make($data['password']);

            $user->save();

            return response()->json([
                'status' => true,
                'message' => 'User updated successfully',
                'user' => $user
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
