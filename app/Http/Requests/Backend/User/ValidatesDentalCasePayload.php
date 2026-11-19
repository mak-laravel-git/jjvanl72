<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Support\CaseCreateCatalog;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesDentalCasePayload
{
    /**
     * @var list<int>
     */
    private const FDI_TEETH = [
        11, 12, 13, 14, 15, 16, 17, 18,
        21, 22, 23, 24, 25, 26, 27, 28,
        31, 32, 33, 34, 35, 36, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48,
    ];

    protected function prepareCasePayload(): void
    {
        if (is_string($this->input('items'))) {
            $decoded = json_decode((string) $this->input('items'), true);
            $this->merge(['items' => is_array($decoded) ? $decoded : []]);
        }

        if (is_string($this->input('keep_file_ids'))) {
            $decoded = json_decode((string) $this->input('keep_file_ids'), true);
            $this->merge(['keep_file_ids' => is_array($decoded) ? $decoded : []]);
        }

        if (is_string($this->input('file_slots'))) {
            $decoded = json_decode((string) $this->input('file_slots'), true);
            $this->merge(['file_slots' => is_array($decoded) ? $decoded : []]);
        }

        $reference = trim((string) $this->input('reference', ''));

        $this->merge([
            'reference' => $reference === '' ? null : $reference,
            'notes' => $this->input('notes', $this->input('description')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function caseRules(): array
    {
        $submitting = $this->input('intent') === 'submit';

        return [
            'intent' => ['required', 'in:draft,submit'],
            'client_id' => [
                'required',
                'integer',
                Rule::exists('dental_clients', 'id')->where(
                    fn ($query) => $query->where('is_active', true)->whereNull('deleted_at'),
                ),
            ],
            'patient_name' => ['required', 'string', 'max:160'],
            'due_date' => [$submitting ? 'required' : 'nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'reference' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('dental_cases', 'reference')
                    ->where(fn ($query) => $query->where('client_id', $this->input('client_id')))
                    ->ignore($this->route('dentalCase')),
            ],
            'lock_version' => ['nullable', 'integer', 'min:1'],
            'shade' => ['nullable', 'string', 'max:12'],
            'impression_type' => ['nullable', 'string', 'max:40'],
            'service' => ['nullable', Rule::enum(CaseService::class)],
            'output' => ['nullable', Rule::enum(CaseOutput::class)],
            'items' => array_values(array_filter([
                $submitting ? 'required' : 'nullable',
                'array',
                $submitting ? 'min:1' : null,
            ])),
            'items.*.product_key' => ['required_with:items', 'string', 'max:50'],
            'items.*.teeth' => ['nullable', 'array'],
            'items.*.teeth.*' => ['integer', 'in:'.implode(',', self::FDI_TEETH)],
            'items.*.arch' => ['nullable', 'string', 'max:10'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.price_overridden' => ['nullable', 'boolean'],
            'items.*.material' => ['nullable', 'string', 'max:120'],
            'items.*.material_id' => ['nullable', 'integer', 'exists:dental_materials,id'],
            'items.*.shade' => ['nullable', 'string', 'max:12'],
            'items.*.shade_overridden' => ['nullable', 'boolean'],
            'items.*.config' => ['nullable', 'array'],
            'items.*.kind' => ['nullable', 'in:tooth,bridge'],
            'items.*.bridge_from' => ['nullable', 'integer'],
            'items.*.bridge_to' => ['nullable', 'integer'],
            'items.*.broken_edges' => ['nullable', 'array'],
            'keep_file_ids' => ['nullable', 'array'],
            'keep_file_ids.*' => ['integer'],
            'file_slots' => ['nullable', 'array'],
            'file_slots.*.code' => ['nullable', 'string', 'max:80'],
            'file_slots.*.label' => ['required_with:file_slots', 'string', 'max:160'],
            'file_slots.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'files' => ['nullable', 'array'],
            'files.*' => ['array'],
            'files.*.*' => ['file'],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function caseMessages(): array
    {
        return [
            'client_id.required' => 'Select a dental client.',
            'client_id.exists' => 'Select an active dental client.',
            'patient_name.required' => 'Patient name is required.',
            'due_date.required' => 'Due date is required.',
            'items.required' => 'Add at least one prescription item.',
            'items.min' => 'Add at least one prescription item.',
        ];
    }

    /**
     * @return list<\Closure>
     */
    protected function caseAfterValidation(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('intent') !== 'submit' || $validator->errors()->isNotEmpty()) {
                    return;
                }

                $this->validateSubmitItems($validator);
            },
        ];
    }

    protected function validateSubmitItems(Validator $validator): void
    {
        $catalog = CaseCreateCatalog::forPortal();
        $items = is_array($this->input('items')) ? $this->input('items') : [];

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $product = $catalog['products'][$item['product_key'] ?? ''] ?? null;
            $materials = $catalog['materialsByProduct'][$item['product_key'] ?? ''] ?? [];

            if ($product === null) {
                $validator->errors()->add("items.{$index}.product_key", 'The selected product is invalid.');

                continue;
            }

            if ($materials !== [] && empty($item['material_id']) && trim((string) ($item['material'] ?? '')) === '') {
                $validator->errors()->add("items.{$index}.material", 'Select a material for this product.');
            }

            $kind = $item['kind'] ?? 'tooth';
            $teeth = $item['teeth'] ?? [];

            if ($kind === 'tooth' && (! is_array($teeth) || $teeth === [])) {
                $validator->errors()->add("items.{$index}.teeth", 'Select at least one tooth.');
            }
        }

        $this->validateBridgeItems($validator, $items);
    }

    /**
     * Bridge rule (mirrors bridgeMembersQualify() in the create-case helpers):
     * every bridge line must span at least one retainer (crown / implant
     * crown) AND one explicitly prescribed pontic. Pontics auto-filled in a
     * gap are not prescriptions and do not count.
     *
     * @param  array<int|string, mixed>  $items
     */
    protected function validateBridgeItems(Validator $validator, array $items): void
    {
        $retainerTeeth = [];
        $ponticTeeth = [];

        foreach ($items as $item) {
            if (! is_array($item) || ($item['kind'] ?? 'tooth') === 'bridge') {
                continue;
            }

            $productKey = (string) ($item['product_key'] ?? '');
            $teeth = is_array($item['teeth'] ?? null) ? $item['teeth'] : [];

            foreach ($teeth as $tooth) {
                if (in_array($productKey, CaseCreateCatalog::BRIDGE_RETAINER_PRODUCT_KEYS, true)) {
                    $retainerTeeth[(int) $tooth] = true;
                } elseif ($productKey === CaseCreateCatalog::PONTIC_PRODUCT_KEY) {
                    $ponticTeeth[(int) $tooth] = true;
                }
            }
        }

        foreach ($items as $index => $item) {
            if (! is_array($item) || ($item['kind'] ?? 'tooth') !== 'bridge') {
                continue;
            }

            $span = array_map('intval', is_array($item['teeth'] ?? null) ? $item['teeth'] : []);
            $hasRetainer = array_intersect_key(array_flip($span), $retainerTeeth) !== [];
            $hasPontic = array_intersect_key(array_flip($span), $ponticTeeth) !== [];

            if (! $hasRetainer || ! $hasPontic) {
                $validator->errors()->add(
                    "items.{$index}.kind",
                    'A bridge needs at least one crown/retainer and one pontic in its span.',
                );
            }
        }
    }
}
