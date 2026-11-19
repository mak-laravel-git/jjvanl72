<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteDentalProductRequest;
use App\Http\Requests\Backend\Admin\StoreDentalProductRequest;
use App\Http\Requests\Backend\Admin\UpdateDentalProductRequest;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Services\DentalProductService;
use App\Support\DentalMaterialProductPivot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentalProductController extends Controller
{
    public function __construct(
        protected DentalProductService $dentalProducts,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->dentalProducts->paginateForIndex($request);

        return Inertia::render('backend/Admin/DentalProducts/Index', [
            'products' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            ...$this->formOptions(),
            'canCreate' => $request->user()?->can('dental-products.create') ?? false,
            'canUpdate' => $request->user()?->can('dental-products.update') ?? false,
            'canDelete' => $request->user()?->can('dental-products.delete') ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backend/Admin/DentalProducts/Create', $this->formOptions());
    }

    public function store(StoreDentalProductRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['icon', 'materials']);
        $materials = $request->input('materials', []);
        $product = $this->dentalProducts->create(
            $data,
            $request->file('icon'),
            is_array($materials) ? $materials : [],
        );

        return redirect()
            ->route('admin.dental-products.index')
            ->with('success', "{$product->name} was added.");
    }

    public function edit(DentalProduct $dentalProduct): Response
    {
        $dentalProduct->load([
            'group:id,code,name',
            'materials' => fn ($query) => $query->orderByPivot('sort_order')->orderBy('code'),
        ]);

        return Inertia::render('backend/Admin/DentalProducts/Edit', [
            'product' => $this->mapProduct($dentalProduct),
            ...$this->formOptions(),
        ]);
    }

    public function update(
        UpdateDentalProductRequest $request,
        DentalProduct $dentalProduct,
    ): RedirectResponse {
        $data = $request->safe()->except(['icon', 'remove_icon', 'materials']);
        $materials = $request->input('materials', []);
        $product = $this->dentalProducts->update(
            $dentalProduct->id,
            $data,
            $request->file('icon'),
            $request->boolean('remove_icon'),
            is_array($materials) ? $materials : [],
        );

        return redirect()
            ->route('admin.dental-products.index')
            ->with('success', "{$product->name} was updated.");
    }

    public function destroy(
        DeleteDentalProductRequest $request,
        DentalProduct $dentalProduct,
    ): RedirectResponse {
        $name = $dentalProduct->name;
        $this->dentalProducts->delete($dentalProduct);

        return redirect()
            ->route('admin.dental-products.index')
            ->with('success', "{$name} was permanently deleted.");
    }

    /**
     * @return array{
     *     groupOptions: list<array{id: int, code: string|null, name: string, label: string}>,
     *     materialOptions: list<array{id: int, code: string, name: string, label: string}>
     * }
     */
    protected function formOptions(): array
    {
        $groupOptions = DentalProductGroup::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (DentalProductGroup $group): array => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->name,
                'label' => $group->code
                    ? "{$group->code} — {$group->name}"
                    : $group->name,
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

        return [
            'groupOptions' => $groupOptions,
            'materialOptions' => $materialOptions,
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     code: string,
     *     name: string,
     *     icon: string|null,
     *     icon_url: string|null,
     *     is_active: bool,
     *     status: string,
     *     dental_product_group_id: int,
     *     group_code: string|null,
     *     group_name: string|null,
     *     materials: list<array{
     *         id: int,
     *         code: string,
     *         name: string,
     *         sort_order: int,
     *         is_default: bool
     *     }>,
     *     materials_count: int,
     *     updated_at: string
     * }
     */
    protected function mapProduct(DentalProduct $product): array
    {
        $materials = $product->materials
            ->map(fn ($material) => DentalMaterialProductPivot::mapRelated($material))
            ->values()
            ->all();

        return [
            'id' => $product->id,
            'code' => $product->code,
            'name' => $product->name,
            'icon' => $product->icon,
            'icon_url' => $product->icon_url,
            'is_active' => $product->is_active,
            'status' => $product->is_active ? 'Active' : 'Inactive',
            'dental_product_group_id' => $product->dental_product_group_id,
            'group_code' => $product->group?->code,
            'group_name' => $product->group?->name,
            'materials' => $materials,
            'materials_count' => $product->materials->count(),
            'updated_at' => $product->updated_at
                ?->timezone(config('app.timezone'))
                ->format('M j, Y · g:i A') ?? '—',
        ];
    }
}
