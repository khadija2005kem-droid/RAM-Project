<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Facture extends Model
{
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';

    public const ALLOWED_STATUSES = [
        self::STATUS_UNPAID,
        self::STATUS_PENDING,
        self::STATUS_PAID,
    ];

    protected $fillable = [
        'user_id',
        'reference',
        'date',
        'prix',
        'status'
    ];

    /**
     * Generate a unique invoice reference in format FACT-YYYY-XXX
     * YYYY = current year
     * XXX = incremental number (per year)
     */
    public static function generateReference()
    {
        $year = now()->year;
        
        // Count invoices created this year
        $count = Facture::whereYear('created_at', $year)->count();
        
        // Increment count for next reference
        $increment = $count + 1;
        
        // Format: FACT-YYYY-XXX (pad number to 3 digits)
        $reference = sprintf('FACT-%d-%03d', $year, $increment);
        
        // Ensure uniqueness (very unlikely but safe)
        while (Facture::where('reference', $reference)->exists()) {
            $increment++;
            $reference = sprintf('FACT-%d-%03d', $year, $increment);
        }
        
        return $reference;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsPending(): bool
    {
        return $this->update(['status' => self::STATUS_PENDING]);
    }

    public function markAsPaid(): bool
    {
        return $this->update(['status' => self::STATUS_PAID]);
    }

    public function markAsUnpaid(): bool
    {
        return $this->update(['status' => self::STATUS_UNPAID]);
    }

    /**
     * Boot method to auto-generate reference on create
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->reference)) {
                $model->reference = self::generateReference();
            }
        });
    }
}