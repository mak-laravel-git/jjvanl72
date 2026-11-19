<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'number',
        'customer',
        'amount',
        'status',
        'invoice_date',
        'due_date',
        'notes',
        'sent_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'amount' => 'decimal:2',
            'invoice_date' => 'date',
            'due_date' => 'date',
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function syncOverdueStatus(): void
    {
        if ($this->status === InvoiceStatus::Paid) {
            return;
        }

        $isPastDue = $this->due_date->lt(Carbon::today());

        $nextStatus = $isPastDue ? InvoiceStatus::Overdue : InvoiceStatus::Pending;

        if ($this->status !== $nextStatus) {
            $this->forceFill(['status' => $nextStatus])->saveQuietly();
        }
    }

    public static function nextNumber(): string
    {
        $latest = static::query()
            ->orderByDesc('id')
            ->value('number');

        if (is_string($latest) && preg_match('/(\d+)$/', $latest, $matches) === 1) {
            return 'INV-'.((int) $matches[1] + 1);
        }

        return 'INV-1001';
    }
}
