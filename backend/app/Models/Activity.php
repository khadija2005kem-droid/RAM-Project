<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    public const ACTION_VIEWED_INVOICE = 'viewed_invoice';

    protected $table = 'activities';

    protected $fillable = [
        'user_id',
        'invoice_id',
        'action',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'invoice_id');
    }
}
