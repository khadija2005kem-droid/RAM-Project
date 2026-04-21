<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    public const STATUS_EN_ATTENTE = 'en_attente';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'facture_id',
        'numero_facture',
        'nom_titulaire',
        'numero_carte',
        'date_expiration',
        'cvc',
        'montant',
        'status',
        'transaction_id'
    ];

    protected $casts = [
        'date_expiration' => 'date',
        'montant' => 'decimal:2'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_EN_ATTENTE);
    }
}
