<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\ParameterType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreParameterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('parameters.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isOption = in_array($this->input('type'), [
            ParameterType::Option->value,
            ParameterType::MultiOption->value,
        ], true);
        $isInput = $this->input('type') === ParameterType::Input->value;

        return [
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('parameters', 'name')->where(
                    fn ($query) => $query->where('product_id', $this->integer('product_id')),
                ),
            ],
            'field_name' => [
                'required',
                'string',
                'max:120',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('parameters', 'field_name')->where(
                    fn ($query) => $query->where('product_id', $this->integer('product_id')),
                ),
            ],
            'group_id' => [
                'required',
                'integer',
                Rule::exists('parameter_groups', 'id'),
            ],
            'product_id' => [
                'required',
                'integer',
                Rule::exists('dental_products', 'id'),
            ],
            'material_id' => [
                'required',
                'integer',
                Rule::exists('dental_materials', 'id'),
            ],
            'type' => [
                'required',
                Rule::enum(ParameterType::class),
            ],
            'options' => [
                Rule::requiredIf($isOption),
                'sometimes',
                'array',
                Rule::when($isOption, ['min:1']),
            ],
            'options.*.id' => ['nullable', 'integer'],
            'options.*.label' => ['required', 'string', 'max:255'],
            'options.*.field_name' => [
                Rule::requiredIf($isInput),
                'nullable',
                'string',
                'max:255',
            ],
            'options.*.placeholder' => ['nullable', 'string', 'max:255'],
            'options.*.value' => [
                Rule::requiredIf($isOption),
                'nullable',
                'string',
                'max:255',
            ],
            'options.*.color' => [
                Rule::requiredIf($isOption),
                'nullable',
                'string',
                'regex:/^#[0-9A-F]{6}$/',
            ],
            'options.*.image' => ['nullable', 'image', 'mimes:jpeg,jpg,png'],
            'options.*.remove_image' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter a parameter name.',
            'name.unique' => 'A parameter with this name already exists.',
            'field_name.required' => 'Enter a field name.',
            'field_name.unique' => 'A parameter with this field name already exists.',
            'field_name.regex' => 'Field name cannot contain spaces. Use letters, numbers, dashes, or underscores only.',
            'group_id.required' => 'Select a parameter group.',
            'group_id.exists' => 'Select a valid parameter group.',
            'product_id.required' => 'Select a product.',
            'product_id.exists' => 'Select a valid product.',
            'material_id.required' => 'Select a material.',
            'material_id.exists' => 'Select a valid material.',
            'type.required' => 'Select a parameter type.',
            'options.required' => 'Add at least one option.',
            'options.min' => 'Add at least one option.',
            'options.*.label.required' => 'Each option needs a name.',
            'options.*.field_name.required' => 'Each input needs a field name.',
            'options.*.value.required' => 'Each option needs a value.',
            'options.*.color.required' => 'Each option needs a color.',
            'options.*.color.regex' => 'Choose a valid hex color (e.g. #AA00B8).',
            'options.*.image.image' => 'Option images must be image files.',
            'options.*.image.mimes' => 'Option images must be JPG or PNG.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $options = $this->input('options');

        if (is_array($options)) {
            $options = collect($options)
                ->map(function (mixed $row): mixed {
                    if (! is_array($row)) {
                        return $row;
                    }

                    $row['remove_image'] = filter_var($row['remove_image'] ?? false, FILTER_VALIDATE_BOOLEAN);

                    if (isset($row['label']) && is_string($row['label'])) {
                        $row['label'] = trim($row['label']);
                    }

                    if (isset($row['value']) && is_string($row['value'])) {
                        $row['value'] = trim($row['value']);
                    }

                    if (isset($row['color']) && is_string($row['color'])) {
                        $row['color'] = $this->normalizeColorCode($row['color']);
                    }

                    return $row;
                })
                ->all();
        }

        $this->merge([
            'name' => is_string($this->input('name')) ? trim($this->input('name')) : $this->input('name'),
            'field_name' => is_string($this->input('field_name'))
                ? trim($this->input('field_name'))
                : $this->input('field_name'),
            'options' => $options ?? [],
        ]);
    }

    private function normalizeColorCode(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = strtoupper(trim($value));

        if ($trimmed === '') {
            return $trimmed;
        }

        if (! str_starts_with($trimmed, '#')) {
            $trimmed = '#'.$trimmed;
        }

        return $trimmed;
    }
}
