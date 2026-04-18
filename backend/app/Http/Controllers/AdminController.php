<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users()
    {
        $users = User::all();
        return response()->json(['status' => true, 'data' => $users], 200);
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
        $messages = \App\Models\ContactMessage::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json(['status' => true, 'data' => $messages], 200);
    }
}
