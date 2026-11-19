<?php

namespace App\Models;

use Database\Factories\ParameterOptionFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParameterOption extends Model
{
    /** @use HasFactory<ParameterOptionFactory> */
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'parameters_options';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'parameter_id',
        'label',
        'field_name',
        'placeholder',
        'value',
        'color',
        'image',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'parameter_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Parameter, $this>
     */
    public function parameter(): BelongsTo
    {
        return $this->belongsTo(Parameter::class, 'parameter_id');
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->image) {
                return null;
            }

            if (str_starts_with($this->image, 'images/')) {
                return asset($this->image);
            }

            return asset('storage/'.$this->image);
        });
    }
}
