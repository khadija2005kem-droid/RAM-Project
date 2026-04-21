<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    public const STATUS_NON_REPONDU = 'non_repondu';
    public const STATUS_REPONDU = 'repondu';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'sujet',
        'message',
        'user_id',
        'status'
    ];

    protected static function booted(): void
    {
        static::creating(function (ContactMessage $message) {
            if (blank($message->status)) {
                $message->status = self::STATUS_NON_REPONDU;
            }
        });
    }

    public function scopePendingResponse($query)
    {
        return $query->where('status', self::STATUS_NON_REPONDU);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
