<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteDentalMaterialRequest;
use App\Http\Requests\Backend\Admin\StoreDentalMaterialRequest;
use App\Http\Requests\Backend\Admin\UpdateDentalMaterialRequest;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Services\DentalMaterialService;
use App\Support\DentalMaterialProductPivot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentalMaterialController extends Controller
{
    public function __construct(
        protected DentalMaterialService $dentalMaterials,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->dentalMaterials->paginateForIndex($request);

        return Inertia::render('backend/Admin/DentalMaterials/Index', [
            'materials' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            ...$this->formOptions(),
            'canCreate' => $request->user()?->can('dental-materials.create') ?? false,
            'canUpdate' => $request->user()?->can('dental-materials.update') ?? false,
            'canDelete' => $request->user()?->can('dental-materials.delete') ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backend/Admin/DentalMaterials/Create', $this->formOptions());
    }

    public function store(StoreDentalMaterialRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['products', 'icon']);
        $products = $request->input('products', []);
        $material = $this->dentalMaterials->create(
            $data,
            $request->file('icon'),
            is_array($products) ? $products : [],
        );

        return redirect()
            ->route('admin.dental-materials.index')
            ->with('success', "{$material->name} was added.");
    }

    public function edit(DentalMaterial $dentalMaterial): Response
    {
        $dentalMaterial->load([
            'products' => fn ($query) => $query->orderByPivot('sort_order')->orderBy('code'),
        ]);

        return Inertia::render('backend/Admin/DentalMaterials/Edit', [
            'material' => $this->mapMaterial($dentalMaterial),
            ...$this->formOptions(),
        ]);
    }

    public function update(
        UpdateDentalMaterialRequest $request,
        DentalMaterial $dentalMaterial,
    ): RedirectResponse {
        $data = $request->safe()->except(['products', 'icon', 'remove_icon']);
        $products = $request->input('products', []);
        $material = $this->dentalMaterials->update(
            $dentalMaterial->id,
            $data,
            $request->file('icon'),
            $request->boolean('remove_icon'),
            is_array($products) ? $products : [],
        );

        return redirect()
            ->route('admin.dental-materials.index')
            ->with('success', "{$material->name} was updated.");
    }

    public function destroy(
        DeleteDentalMaterialRequest $request,
        DentalMaterial $dentalMaterial,
    ): RedirectResponse {
        $name = $dentalMaterial->name;
        $this->dentalMaterials->delete($dentalMaterial);

        return redirect()
            ->route('admin.dental-materials.index')
            ->with('success', "{$name} was permanently deleted.");
    }

    /**
     * @return array{
     *     productOptions: list<array{id: int, code: string, name: string, label: string}>
     * }
     */
    protected function formOptions(): array
    {
        $productOptions = DentalProduct::query()
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

        return [
            'productOptions' => $productOptions,
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
     *     products_count: int,
     *     products: list<array{
     *         id: int,
     *         code: string,
     *         name: string,
     *         sort_order: int,
     *         is_default: bool
     *     }>,
     *     updated_at: string
     * }
     */
    protected function mapMaterial(DentalMaterial $material): array
    {
        return [
            'id' => $material->id,
            'code' => $material->code,
            'name' => $material->name,
            'icon' => $material->icon,
            'icon_url' => $material->icon_url,
            'is_active' => $material->is_active,
            'status' => $material->is_active ? 'Active' : 'Inactive',
            'products_count' => $material->products->count(),
            'products' => $material->products
                ->map(fn ($product) => DentalMaterialProductPivot::mapRelated($product))
                ->values()
                ->all(),
            'updated_at' => $material->updated_at
                ?->timezone(config('app.timezone'))
                ->format('M j, Y · g:i A') ?? '—',
        ];
    }
}
