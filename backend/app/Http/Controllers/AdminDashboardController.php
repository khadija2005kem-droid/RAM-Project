<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Facture;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Get the dashboard statistics.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // 1. Total number of clients
        $clientsCount = User::where('role', 'client')->count();

        // 2. Number of unread messages
        $unreadMessagesCount = ContactMessage::where('status', 'unread')->count();

        // 3. Number of pending factures
        $pendingFacturesCount = Facture::where('status', Facture::STATUS_PENDING)->count();

        return response()->json([
            'clients' => $clientsCount,
            'unread_messages' => $unreadMessagesCount,
            'pending_factures' => $pendingFacturesCount,
        ]);
    }
}
