<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteDentalClientRequest;
use App\Http\Requests\Backend\Admin\StoreDentalClientRequest;
use App\Http\Requests\Backend\Admin\UpdateDentalClientRequest;
use App\Models\DentalClient;
use App\Services\DentalClientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentalClientController extends Controller
{
    public function __construct(
        protected DentalClientService $dentalClients,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->dentalClients->paginateForIndex($request);

        return Inertia::render('backend/Admin/DentalClients/Index', [
            'clients' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            'canCreate' => $request->user()?->can('dental-clients.create') ?? false,
            'canUpdate' => $request->user()?->can('dental-clients.update') ?? false,
            'canDelete' => $request->user()?->can('dental-clients.delete') ?? false,
        ]);
    }

    public function store(StoreDentalClientRequest $request): RedirectResponse
    {
        $client = $this->dentalClients->create($request->validated());

        return redirect()
            ->route('admin.dental-clients.index')
            ->with('success', "{$client->name} was added.");
    }

    public function update(
        UpdateDentalClientRequest $request,
        DentalClient $dentalClient,
    ): RedirectResponse {
        $client = $this->dentalClients->update(
            $dentalClient->id,
            $request->validated(),
        );

        return redirect()
            ->route('admin.dental-clients.index')
            ->with('success', "{$client->name} was updated.");
    }

    public function destroy(
        DeleteDentalClientRequest $request,
        DentalClient $dentalClient,
    ): RedirectResponse {
        $name = $dentalClient->name;
        $this->dentalClients->delete($dentalClient);

        return redirect()
            ->route('admin.dental-clients.index')
            ->with('success', "{$name} was deleted.");
    }
}
