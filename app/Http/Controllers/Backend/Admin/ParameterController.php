<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ParameterType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteParameterRequest;
use App\Http\Requests\Backend\Admin\StoreParameterRequest;
use App\Http\Requests\Backend\Admin\UpdateParameterRequest;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\Parameter;
use App\Models\ParameterGroup;
use App\Services\ParameterService;
use App\Support\ParameterOptionSync;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParameterController extends Controller
{
    public function __construct(
        protected ParameterService $parameters,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->parameters->paginateForIndex($request);

        return Inertia::render('backend/Admin/Parameters/Index', [
            'parameters' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            ...$this->formOptions(),
            'canCreate' => $request->user()?->can('parameters.create') ?? false,
            'canUpdate' => $request->user()?->can('parameters.update') ?? false,
            'canDelete' => $request->user()?->can('parameters.delete') ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backend/Admin/Parameters/Create', $this->formOptions());
    }

    public function store(StoreParameterRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['options']);
        $options = $this->optionsFromRequest($request);
        $parameter = $this->parameters->create($data, $options);

        return redirect()
            ->route('admin.parameters.index')
            ->with('success', "{$parameter->name} was added.");
    }

    public function edit(Parameter $parameter): Response
    {
        $parameter->load([
            'group:id,code,name',
            'product:id,code,name',
            'material:id,code,name',
            'options',
        ]);

        return Inertia::render('backend/Admin/Parameters/Edit', [
            'parameter' => $this->mapParameter($parameter),
            ...$this->formOptions(),
        ]);
    }

    public function update(
        UpdateParameterRequest $request,
        Parameter $parameter,
    ): RedirectResponse {
        $data = $request->safe()->except(['options']);
        $options = $this->optionsFromRequest($request);
        $updated = $this->parameters->update($parameter->id, $data, $options);

        return redirect()
            ->route('admin.parameters.index')
            ->with('success', "{$updated->name} was updated.");
    }

    public function destroy(
        DeleteParameterRequest $request,
        Parameter $parameter,
    ): RedirectResponse {
        $name = $parameter->name;
        $this->parameters->delete($parameter);

        return redirect()
            ->route('admin.parameters.index')
            ->with('success', "{$name} was permanently deleted.");
    }

    /**
     * @return array{
     *     groupOptions: list<array{id: int, code: string|null, name: string, label: string}>,
     *     productOptions: list<array{id: int, code: string, name: string, label: string}>,
     *     materialOptions: list<array{id: int, code: string, name: string, label: string}>,
     *     typeOptions: list<array{value: string, label: string}>
     * }
     */
    protected function formOptions(): array
    {
        $groupOptions = ParameterGroup::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (ParameterGroup $group): array => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->name,
                'label' => $group->name,
            ])
            ->values()
            ->all();

        $productOptions = DentalProduct::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (DentalProduct $product): array => [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'label' => "{$product->code} — {$product->name}",
            ])
            ->values()
            ->all();

        $materialOptions = DentalMaterial::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (DentalMaterial $material): array => [
                'id' => $material->id,
                'code' => $material->code,
                'name' => $material->name,
                'label' => "{$material->code} — {$material->name}",
            ])
            ->values()
            ->all();

        $typeOptions = collect(ParameterType::cases())
            ->map(fn (ParameterType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])
            ->values()
            ->all();

        return [
            'groupOptions' => $groupOptions,
            'productOptions' => $productOptions,
            'materialOptions' => $materialOptions,
            'typeOptions' => $typeOptions,
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     field_name: string,
     *     group_id: int,
     *     product_id: int,
     *     material_id: int,
     *     type: string,
     *     type_label: string,
     *     group_code: string|null,
     *     group_name: string|null,
     *     product_code: string|null,
     *     product_name: string|null,
     *     material_code: string|null,
     *     material_name: string|null,
     *     options: list<array{
     *         id: int,
     *         label: string,
     *         field_name: string|null,
     *         placeholder: string|null,
     *         value: string|null,
     *         color: string|null,
     *         image: string|null,
     *         image_url: string|null
     *     }>,
     *     options_count: int,
     *     updated_at: string
     * }
     */
    protected function mapParameter(Parameter $parameter): array
    {
        return [
            'id' => $parameter->id,
            'name' => $parameter->name,
            'field_name' => $parameter->field_name,
            'group_id' => $parameter->group_id,
            'product_id' => $parameter->product_id,
            'material_id' => $parameter->material_id,
            'type' => $parameter->type->value,
            'type_label' => $parameter->type->label(),
            'group_code' => $parameter->group?->code,
            'group_name' => $parameter->group?->name,
            'product_code' => $parameter->product?->code,
            'product_name' => $parameter->product?->name,
            'material_code' => $parameter->material?->code,
            'material_name' => $parameter->material?->name,
            'options' => $parameter->options
                ->map(fn ($option) => ParameterOptionSync::mapOption($option))
                ->values()
                ->all(),
            'options_count' => $parameter->options->count(),
            'updated_at' => $parameter->updated_at
                ?->timezone(config('app.timezone'))
                ->format('M j, Y · g:i A') ?? '—',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function optionsFromRequest(Request $request): array
    {
        $options = $request->input('options', []);

        if (! is_array($options)) {
            return [];
        }

        $files = $request->file('options', []);

        foreach ($options as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            if (is_array($files) && isset($files[$index]['image'])) {
                $options[$index]['image'] = $files[$index]['image'];
            }
        }

        return array_values($options);
    }
}
