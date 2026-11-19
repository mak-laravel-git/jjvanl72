<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ProductCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteProductRequest;
use App\Http\Requests\Backend\Admin\StoreProductRequest;
use App\Http\Requests\Backend\Admin\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductsServicesController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with('creator:id,name,email')
            ->orderBy('name')
            ->get()
            ->map(fn(Product $product): array => $this->productPayload($product))
            ->values()
            ->all();

        return Inertia::render('backend/Admin/ProductsServices', [
            'products' => $products,
            'categories' => ProductCategory::values(),
            'canCreateProducts' => $request->user()?->can('products.create') ?? false,
            'canUpdateProducts' => $request->user()?->can('products.update') ?? false,
            'canDeleteProducts' => $request->user()?->can('products.delete') ?? false,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$product->name} was added to the catalog.");
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$product->name} was updated.");
    }

    public function destroy(DeleteProductRequest $request, Product $product): RedirectResponse
    {
        $name = $product->name;
        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$name} was permanently deleted.");
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     category: string,
     *     category_tone: string,
     *     material: string,
     *     design_price: string,
     *     mfg_price: string,
     *     rush_fee: string,
     *     design_price_amount: string,
     *     mfg_price_amount: string,
     *     rush_fee_amount: string,
     *     created_by: string,
     *     created_at: string
     * }
     */
    private function productPayload(Product $product): array
    {
        $creator = $product->creator;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category->value,
            'category_tone' => $product->category->tone(),
            'material' => $product->material,
            'design_price' => $this->formatMoney((float) $product->design_price),
            'mfg_price' => $this->formatMoney((float) $product->mfg_price),
            'rush_fee' => '+' . $this->formatMoney((float) $product->rush_fee),
            'design_price_amount' => number_format((float) $product->design_price, 2, '.', ''),
            'mfg_price_amount' => number_format((float) $product->mfg_price, 2, '.', ''),
            'rush_fee_amount' => number_format((float) $product->rush_fee, 2, '.', ''),
            'created_by' => $creator?->name ?: ($creator?->email ?? 'System'),
            'created_at' => $product->created_at
                ? $product->created_at->timezone(config('app.timezone'))->format('M j, Y · g:i A')
                : '—',
        ];
    }

    private function formatMoney(float $amount): string
    {
        if ($amount == floor($amount)) {
            return '$' . number_format($amount, 0);
        }

        return '$' . number_format($amount, 2);
    }
}
