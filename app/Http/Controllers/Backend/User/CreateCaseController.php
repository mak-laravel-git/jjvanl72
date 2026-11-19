<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreDentalCaseRequest;
use App\Http\Requests\Backend\User\UpdateDentalCaseRequest;
use App\Models\DentalCase;
use App\Models\User;
use App\Services\DentalCaseService;
use App\Services\DentalClientService;
use App\Support\CaseCreateCatalog;
use App\Support\DentalCasePresenter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CreateCaseController extends Controller
{
    public function __construct(
        protected DentalCaseService $cases,
        protected DentalClientService $clients,
    ) {}

    public function create(): Response
    {
        return Inertia::render('backend/User/CreateCase', $this->pageProps(request()->user()));
    }

    public function store(StoreDentalCaseRequest $request): RedirectResponse
    {
        $payload = $request->validated();
        $payload['files'] = $request->file('files') ?? [];

        $case = $this->cases->create($request->user(), $payload);

        if (($request->validated('intent') ?? 'draft') === 'submit') {
            return redirect()
                ->route('cases.active')
                ->with('success', "Case {$case->case_number} was submitted.");
        }

        return redirect()
            ->route('cases.edit', $case)
            ->with('success', "Draft {$case->case_number} was saved.");
    }

    public function edit(DentalCase $dentalCase): Response
    {
        $user = request()->user();

        if ($user === null || $user->cannot('view', $dentalCase)) {
            abort(404);
        }

        abort_unless($user->can('update', $dentalCase), 403);

        $dentalCase->load(['client', 'patient', 'items.teeth', 'items.product', 'files', 'fileSlots']);

        return Inertia::render('backend/User/CreateCase', $this->pageProps($user, $dentalCase));
    }

    public function update(UpdateDentalCaseRequest $request, DentalCase $dentalCase): RedirectResponse
    {
        $payload = $request->validated();
        $payload['files'] = $request->file('files') ?? [];

        $case = $this->cases->update($dentalCase, $request->user(), $payload);

        if (($request->validated('intent') ?? 'draft') === 'submit') {
            return redirect()
                ->route('cases.active')
                ->with('success', "Case {$case->case_number} was submitted.");
        }

        $message = $case->isDraft()
            ? "Draft {$case->case_number} was saved."
            : "Case {$case->case_number} was saved.";

        return redirect()
            ->route('cases.edit', $case)
            ->with('success', $message);
    }

    /**
     * @return array{
     *     caseReference: string,
     *     catalog: array<string, mixed>,
     *     client: array{id: int, name: string, code: string}|null,
     *     clients: list<array{id: int, code: string, name: string}>,
     *     draftCase: array<string, mixed>|null,
     *     adminMode: bool
     * }
     */
    public function pageProps(?User $user, ?DentalCase $dentalCase = null, bool $adminMode = false): array
    {
        return [
            ...$this->createCaseProps($user, $dentalCase),
            'adminMode' => $adminMode,
        ];
    }

    /**
     * @return array{
     *     caseReference: string,
     *     catalog: array<string, mixed>,
     *     client: array{id: int, name: string, code: string}|null,
     *     clients: list<array{id: int, code: string, name: string}>,
     *     draftCase: array<string, mixed>|null
     * }
     */
    private function createCaseProps(?User $user, ?DentalCase $dentalCase = null): array
    {
        $clients = $this->clients->optionsForForms();

        if (
            $dentalCase?->client !== null
            && ! collect($clients)->contains(fn (array $row): bool => $row['id'] === $dentalCase->client_id)
        ) {
            array_unshift($clients, [
                'id' => $dentalCase->client->id,
                'code' => $dentalCase->client->code,
                'name' => $dentalCase->client->name,
            ]);
        }

        $default = null;

        if ($dentalCase?->client !== null) {
            $default = [
                'id' => $dentalCase->client->id,
                'code' => $dentalCase->client->code,
                'name' => $dentalCase->client->name,
            ];
        } else {
            $default = DentalCasePresenter::clientPayload($user) ?? ($clients[0] ?? null);
        }

        return [
            'caseReference' => $dentalCase?->case_number ?? '',
            'catalog' => CaseCreateCatalog::forPortal(),
            'client' => $default,
            'clients' => $clients,
            'draftCase' => $dentalCase === null ? null : DentalCasePresenter::toDraft($dentalCase),
        ];
    }
}
