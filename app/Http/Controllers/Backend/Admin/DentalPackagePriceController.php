<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteDentalPackagePriceRequest;
use App\Http\Requests\Backend\Admin\StoreDentalPackagePriceRequest;
use App\Http\Requests\Backend\Admin\UpdateDentalPackagePriceRequest;
use App\Models\DentalMaterial;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Services\DentalPackagePriceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentalPackagePriceController extends Controller
{
    public function __construct(
        protected DentalPackagePriceService $packagePrices,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->packagePrices->paginateForIndex($request);

        return Inertia::render('backend/Admin/DentalPackagePrices/Index', [
            'packagePrices' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            ...$this->formOptions(),
            'canCreate' => $request->user()?->can('dental-package-prices.create') ?? false,
            'canUpdate' => $request->user()?->can('dental-package-prices.update') ?? false,
            'canDelete' => $request->user()?->can('dental-package-prices.delete') ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backend/Admin/DentalPackagePrices/Create', $this->formOptions());
    }

    public function store(StoreDentalPackagePriceRequest $request): RedirectResponse
    {
        $package = $this->packagePrices->create($request->validated());

        return redirect()
            ->route('admin.dental-package-prices.index')
            ->with('success', 'Package price was added.');
    }

    public function edit(DentalPackagePrice $dentalPackagePrice): Response
    {
        $dentalPackagePrice->load(['product:id,code,name', 'material:id,code,name']);

        return Inertia::render('backend/Admin/DentalPackagePrices/Edit', [
            'packagePrice' => $this->packagePrices->mapRow($dentalPackagePrice),
            ...$this->formOptions(),
        ]);
    }

    public function update(
        UpdateDentalPackagePriceRequest $request,
        DentalPackagePrice $dentalPackagePrice,
    ): RedirectResponse {
        $this->packagePrices->update($dentalPackagePrice->id, $request->validated());

        return redirect()
            ->route('admin.dental-package-prices.index')
            ->with('success', 'Package price was updated.');
    }

    public function destroy(
        DeleteDentalPackagePriceRequest $request,
        DentalPackagePrice $dentalPackagePrice,
    ): RedirectResponse {
        $this->packagePrices->delete($dentalPackagePrice);

        return redirect()
            ->route('admin.dental-package-prices.index')
            ->with('success', 'Package price was permanently deleted.');
    }

    /**
     * @return array{
     *     productOptions: list<array{id: int, code: string, name: string, label: string, dental_product_group_id: int|null}>,
     *     groupOptions: list<array{id: int, name: string, label: string}>,
     *     materialOptions: list<array{id: int, code: string, name: string, label: string, product_ids: list<int>}>,
     *     serviceOptions: list<array{value: string, label: string}>,
     *     outputOptions: list<array{value: string, label: string}>
     * }
     */
    protected function formOptions(): array
    {
        $productOptions = DentalProduct::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'dental_product_group_id'])
            ->map(fn (DentalProduct $product): array => [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'label' => "{$product->code} — {$product->name}",
                'dental_product_group_id' => $product->dental_product_group_id !== null
                    ? (int) $product->dental_product_group_id
                    : null,
            ])
            ->values()
            ->all();

        $groupOptions = DentalProductGroup::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (DentalProductGroup $group): array => [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->name,
            ])
            ->values()
            ->all();

        $materialOptions = DentalMaterial::query()
            ->with(['products:id'])
            ->orderBy('name')
            ->get()
            ->map(fn (DentalMaterial $material): array => [
                'id' => $material->id,
                'code' => $material->code,
                'name' => $material->name,
                'label' => "{$material->code} — {$material->name}",
                'product_ids' => $material->products->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            ])
            ->values()
            ->all();

        return [
            'productOptions' => $productOptions,
            'groupOptions' => $groupOptions,
            'materialOptions' => $materialOptions,
            'serviceOptions' => collect(CaseService::cases())
                ->map(fn (CaseService $case): array => [
                    'value' => $case->value,
                    'label' => $case->label(),
                ])
                ->values()
                ->all(),
            'outputOptions' => collect(CaseOutput::cases())
                ->map(fn (CaseOutput $case): array => [
                    'value' => $case->value,
                    'label' => $case->label(),
                ])
                ->values()
                ->all(),
        ];
    }
}
