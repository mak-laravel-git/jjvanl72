<?php

namespace App\Support;

use App\Enums\ParameterType;
use App\Models\Parameter;
use App\Models\ParameterOption;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ParameterOptionSync
{
    /**
     * @param  list<array<string, mixed>>  $options
     */
    public static function syncForParameter(Parameter $parameter, array $options): void
    {
        $keptIds = [];
        $isOptionType = $parameter->type === ParameterType::Option;

        foreach (array_values($options) as $row) {
            if (! is_array($row)) {
                continue;
            }

            $optionId = isset($row['id']) && is_numeric($row['id']) ? (int) $row['id'] : null;
            $removeImage = filter_var($row['remove_image'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $image = $row['image'] ?? null;
            $label = (string) ($row['label'] ?? '');
            $value = isset($row['value']) && $row['value'] !== ''
                ? (string) $row['value']
                : null;
            $fieldName = isset($row['field_name']) && $row['field_name'] !== ''
                ? (string) $row['field_name']
                : null;
            $color = isset($row['color']) && is_string($row['color']) && $row['color'] !== ''
                ? strtoupper(trim($row['color']))
                : null;

            if ($isOptionType) {
                $fieldName = $value !== null
                    ? Str::slug($value, '_')
                    : Str::slug($label, '_');
            }

            $attributes = [
                'label' => $label,
                'field_name' => $fieldName,
                'placeholder' => $isOptionType
                    ? null
                    : (isset($row['placeholder']) && $row['placeholder'] !== ''
                        ? (string) $row['placeholder']
                        : null),
                'value' => $isOptionType ? $value : null,
                'color' => $isOptionType ? $color : null,
            ];

            if ($optionId) {
                /** @var ParameterOption|null $option */
                $option = $parameter->options()->whereKey($optionId)->first();

                if (! $option) {
                    continue;
                }

                if ($isOptionType) {
                    if ($removeImage && $option->image) {
                        Storage::disk('public')->delete($option->image);
                        $attributes['image'] = null;
                    }

                    if ($image instanceof UploadedFile) {
                        if ($option->image) {
                            Storage::disk('public')->delete($option->image);
                        }

                        $attributes['image'] = $image->store('parameter-options/images', 'public');
                    }
                } else {
                    if ($option->image) {
                        Storage::disk('public')->delete($option->image);
                    }

                    $attributes['image'] = null;
                }

                $option->update($attributes);
                $keptIds[] = $option->id;

                continue;
            }

            if ($isOptionType && $image instanceof UploadedFile) {
                $attributes['image'] = $image->store('parameter-options/images', 'public');
            }

            $created = $parameter->options()->create($attributes);
            $keptIds[] = $created->id;
        }

        $parameter->options()
            ->when($keptIds !== [], fn ($query) => $query->whereNotIn('id', $keptIds))
            ->when($keptIds === [], fn ($query) => $query)
            ->get()
            ->each(function (ParameterOption $option): void {
                if ($option->image) {
                    Storage::disk('public')->delete($option->image);
                }

                $option->delete();
            });
    }

    /**
     * @return array{
     *     id: int,
     *     label: string,
     *     field_name: string|null,
     *     placeholder: string|null,
     *     value: string|null,
     *     color: string|null,
     *     image: string|null,
     *     image_url: string|null
     * }
     */
    public static function mapOption(ParameterOption $option): array
    {
        return [
            'id' => $option->id,
            'label' => $option->label,
            'field_name' => $option->field_name,
            'placeholder' => $option->placeholder,
            'value' => $option->value,
            'color' => $option->color,
            'image' => $option->image,
            'image_url' => $option->image_url,
        ];
    }
}
