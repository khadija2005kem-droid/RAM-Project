<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('email', 'admin@example.com')->exists()) {
            return;
        }

        $user = new User();
        $user->prenom = 'Admin';
        $user->nom = 'Demo';
        $user->email = 'admin@example.com';
        $user->email_verified_at = now();
        $user->password = Hash::make('admine1234');
        $user->role = 'admin';
        $user->save();
    }
}
