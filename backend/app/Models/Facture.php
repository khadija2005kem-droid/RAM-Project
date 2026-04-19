<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    public const STATUS_UNPAID = 'non payee';
    public const STATUS_PENDING = 'en attente';
    public const STATUS_PAID = 'payee';

    public const LEGACY_STATUS_MAP = [
        'unpaid' => self::STATUS_UNPAID,
        'non_payee' => self::STATUS_UNPAID,
        'non payée' => self::STATUS_UNPAID,
        'rejected' => self::STATUS_UNPAID,
        'pending' => self::STATUS_PENDING,
        'en_attente' => self::STATUS_PENDING,
        'paid' => self::STATUS_PAID,
        'payée' => self::STATUS_PAID,
        'accepted' => self::STATUS_PAID,
    ];

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
        'status',
    ];

    public static function generateReference()
    {
        $year = now()->year;
        $count = Facture::whereYear('created_at', $year)->count();
        $increment = $count + 1;
        $reference = sprintf('FACT-%d-%03d', $year, $increment);

        while (Facture::where('reference', $reference)->exists()) {
            $increment++;
            $reference = sprintf('FACT-%d-%03d', $year, $increment);
        }

        return $reference;
    }

    public static function normalizeStatus(?string $status): string
    {
        $value = trim(mb_strtolower((string) $status));

        if ($value === '') {
            return self::STATUS_UNPAID;
        }

        return self::LEGACY_STATUS_MAP[$value] ?? $value;
    }

    public function hasStatus(string $status): bool
    {
        return self::normalizeStatus($this->status) === self::normalizeStatus($status);
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

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->reference)) {
                $model->reference = self::generateReference();
            }
        });

        static::saving(function ($model) {
            $model->status = self::normalizeStatus($model->status);
        });
    }
}
