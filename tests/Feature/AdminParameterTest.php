<?php

use App\Enums\ParameterType;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\Parameter;
use App\Models\ParameterGroup;
use App\Models\ParameterOption;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createParametersSuperAdmin(string $email = 'parameters-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createParametersLimitedAdmin(array $permissions, string $email = 'parameters-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Parameters Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view parameters', function () {
    $this->get(route('admin.parameters.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open parameters', function () {
    $admin = createParametersLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.parameters.index'))
        ->assertForbidden();
});

test('super admins can list parameters with index props', function () {
    $admin = createParametersSuperAdmin();
    $group = ParameterGroup::factory()->create(['name' => 'Shade']);
    $product = DentalProduct::factory()->create(['code' => 'DP01', 'name' => 'Crown']);
    $material = DentalMaterial::factory()->create(['code' => 'ZIR', 'name' => 'Zirconia']);
    $parameter = Parameter::factory()->create([
        'name' => 'Shade Selector',
        'field_name' => 'shade_selector',
        'group_id' => $group->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
        'type' => ParameterType::Option,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameters.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Parameters/Index')
                ->has('parameters', 1)
                ->where('parameters.0.id', $parameter->id)
                ->where('parameters.0.name', 'Shade Selector')
                ->where('parameters.0.field_name', 'shade_selector')
                ->where('parameters.0.type', ParameterType::Option->value)
                ->where('parameters.0.type_label', ParameterType::Option->label())
                ->where('parameters.0.group_name', 'Shade')
                ->where('parameters.0.group_code', null)
                ->where('parameters.0.product_code', 'DP01')
                ->where('parameters.0.material_code', 'ZIR')
                ->where('canCreate', true)
                ->where('canUpdate', true)
                ->where('canDelete', true)
                ->has('groupOptions')
                ->has('productOptions')
                ->has('materialOptions')
                ->has('typeOptions')
                ->has('pagination')
                ->where('pagination.total', 1)
        );
});

test('super admins can open the create parameter page', function () {
    $admin = createParametersSuperAdmin('create-page-parameters@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.parameters.create'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Parameters/Create')
                ->has('groupOptions')
                ->has('productOptions')
                ->has('materialOptions')
                ->has('typeOptions')
        );
});

test('users without create permission cannot open the create parameter page', function () {
    $admin = createParametersLimitedAdmin(
        ['parameters.view'],
        'no-create-page-parameters@dev.com',
    );

    $this->actingAs($admin)
        ->get(route('admin.parameters.create'))
        ->assertForbidden();
});

test('super admins can open the edit parameter page', function () {
    $admin = createParametersSuperAdmin('edit-page-parameters@dev.com');
    $parameter = Parameter::factory()->create([
        'name' => 'Shade Selector',
        'type' => ParameterType::Option,
    ]);
    ParameterOption::factory()->create([
        'parameter_id' => $parameter->id,
        'label' => 'Shade A1',
        'value' => 'A1',
        'color' => '#0260BD',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameters.edit', $parameter))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Parameters/Edit')
                ->where('parameter.id', $parameter->id)
                ->where('parameter.name', 'Shade Selector')
                ->where('parameter.options.0.label', 'Shade A1')
                ->where('parameter.options.0.color', '#0260BD')
                ->has('groupOptions')
                ->has('typeOptions')
        );
});

test('users without update permission cannot open the edit parameter page', function () {
    $admin = createParametersLimitedAdmin(
        ['parameters.view'],
        'no-edit-page-parameters@dev.com',
    );
    $parameter = Parameter::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.parameters.edit', $parameter))
        ->assertForbidden();
});

test('super admins can search parameters', function () {
    $admin = createParametersSuperAdmin('search-parameters@dev.com');
    $groupA = ParameterGroup::factory()->create(['name' => 'Shade Group']);
    $groupB = ParameterGroup::factory()->create(['name' => 'Size Group']);
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    Parameter::factory()->create([
        'name' => 'Shade Selector',
        'group_id' => $groupA->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
    ]);
    Parameter::factory()->create([
        'name' => 'Size Selector',
        'group_id' => $groupB->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameters.index', ['search' => 'Shade Selector']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('parameters', 1)
                ->where('parameters.0.name', 'Shade Selector')
                ->where('search', 'Shade Selector')
        );
});

test('super admins can filter parameters by group', function () {
    $admin = createParametersSuperAdmin('filter-group-parameters@dev.com');
    $groupA = ParameterGroup::factory()->create(['name' => 'Group A']);
    $groupB = ParameterGroup::factory()->create(['name' => 'Group B']);
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    Parameter::factory()->create([
        'group_id' => $groupA->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
    ]);
    Parameter::factory()->create([
        'group_id' => $groupB->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameters.index', [
            'filters' => ['group_id' => $groupA->id],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('parameters', 1)
                ->where('parameters.0.group_id', $groupA->id)
                ->where('parameters.0.group_name', 'Group A')
        );
});

test('super admins can filter parameters by type', function () {
    $admin = createParametersSuperAdmin('filter-type-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    Parameter::factory()->create([
        'group_id' => $group->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
        'type' => ParameterType::Option,
    ]);
    Parameter::factory()->input()->create([
        'group_id' => $group->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameters.index', [
            'filters' => ['type' => ParameterType::Input->value],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('parameters', 1)
                ->where('parameters.0.type', ParameterType::Input->value)
                ->where('parameters.0.type_label', ParameterType::Input->label())
        );
});

test('super admins can paginate parameters', function () {
    $admin = createParametersSuperAdmin('paginate-parameters@dev.com');
    Parameter::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.parameters.index', [
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('parameters', 1)
                ->where('pagination.current_page', 2)
                ->where('pagination.per_page', 2)
                ->where('pagination.total', 3)
                ->where('pagination.last_page', 2)
        );
});

test('super admins can create a parameter with options and optional image', function () {
    Storage::fake('public');

    $admin = createParametersSuperAdmin('create-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    $image = UploadedFile::fake()->image('shade.jpg');

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'name' => 'Shade',
            'field_name' => 'shade',
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'label' => 'Shade A1',
                    'value' => 'A1',
                    'color' => '#e6e9e9',
                    'image' => $image,
                ],
                [
                    'label' => 'Shade A2',
                    'value' => 'A2',
                    'color' => '#0260BD',
                ],
            ],
        ])
        ->assertRedirect(route('admin.parameters.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('parameters', [
        'name' => 'Shade',
        'field_name' => 'shade',
        'group_id' => $group->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
        'type' => ParameterType::Option->value,
    ]);

    $parameter = Parameter::query()->where('name', 'Shade')->first();

    expect($parameter)->not->toBeNull();

    $this->assertDatabaseHas('parameters_options', [
        'parameter_id' => $parameter?->id,
        'label' => 'Shade A1',
        'field_name' => 'a1',
        'value' => 'A1',
        'color' => '#E6E9E9',
    ]);

    $this->assertDatabaseHas('parameters_options', [
        'parameter_id' => $parameter?->id,
        'label' => 'Shade A2',
        'field_name' => 'a2',
        'value' => 'A2',
        'color' => '#0260BD',
    ]);

    $optionWithImage = ParameterOption::query()
        ->where('parameter_id', $parameter?->id)
        ->where('value', 'A1')
        ->first();

    expect($optionWithImage?->image)->not->toBeNull();
    Storage::disk('public')->assertExists($optionWithImage?->image);
});

test('creating a parameter requires a unique name', function () {
    $admin = createParametersSuperAdmin('unique-name-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    Parameter::factory()->create([
        'name' => 'Shade',
        'product_id' => $product->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'name' => 'Shade',
            'field_name' => 'shade',
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'label' => 'Shade A1',
                    'value' => 'A1',
                    'color' => '#AA00B8',
                ],
            ],
        ])
        ->assertSessionHasErrors(['name']);
});

test('creating a parameter requires a unique field name', function () {
    $admin = createParametersSuperAdmin('unique-field-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    Parameter::factory()->create([
        'field_name' => 'shade',
        'product_id' => $product->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'name' => 'Another Shade',
            'field_name' => 'shade',
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'label' => 'Shade A1',
                    'value' => 'A1',
                    'color' => '#AA00B8',
                ],
            ],
        ])
        ->assertSessionHasErrors(['field_name']);
});

test('creating a parameter rejects field names with spaces', function () {
    $admin = createParametersSuperAdmin('space-field-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'name' => 'Shade',
            'field_name' => 'shade name',
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'label' => 'Shade A1',
                    'value' => 'A1',
                ],
            ],
        ])
        ->assertSessionHasErrors(['field_name']);
});
test('super admins can update a parameter and sync options', function () {
    Storage::fake('public');

    $admin = createParametersSuperAdmin('update-parameters@dev.com');
    $parameter = Parameter::factory()->create([
        'name' => 'Old Shade',
        'type' => ParameterType::Option,
    ]);
    $keep = ParameterOption::factory()->create([
        'parameter_id' => $parameter->id,
        'label' => 'Keep Me',
        'field_name' => 'keep_me',
        'value' => 'keep',
    ]);
    $drop = ParameterOption::factory()->create([
        'parameter_id' => $parameter->id,
        'label' => 'Drop Me',
        'field_name' => 'drop_me',
        'value' => 'drop',
    ]);

    $otherGroup = ParameterGroup::factory()->create();
    $otherProduct = DentalProduct::factory()->create();
    $otherMaterial = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.parameters.update', $parameter), [
            'name' => 'Updated Shade',
            'field_name' => 'updated_shade',
            'group_id' => $otherGroup->id,
            'product_id' => $otherProduct->id,
            'material_id' => $otherMaterial->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'id' => $keep->id,
                    'label' => 'Kept Updated',
                    'value' => 'keep',
                    'color' => '#111111',
                ],
                [
                    'label' => 'Added Option',
                    'value' => 'added',
                    'color' => '#abcdef',
                ],
            ],
        ])
        ->assertRedirect(route('admin.parameters.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('parameters', [
        'id' => $parameter->id,
        'name' => 'Updated Shade',
        'field_name' => 'updated_shade',
        'group_id' => $otherGroup->id,
        'product_id' => $otherProduct->id,
        'material_id' => $otherMaterial->id,
        'type' => ParameterType::Option->value,
    ]);

    $this->assertDatabaseHas('parameters_options', [
        'id' => $keep->id,
        'label' => 'Kept Updated',
        'field_name' => 'keep',
        'value' => 'keep',
        'color' => '#111111',
    ]);

    $this->assertDatabaseHas('parameters_options', [
        'parameter_id' => $parameter->id,
        'label' => 'Added Option',
        'field_name' => 'added',
        'value' => 'added',
        'color' => '#ABCDEF',
    ]);

    $this->assertDatabaseMissing('parameters_options', [
        'id' => $drop->id,
    ]);
});
test('creating a parameter validates required foreign keys', function () {
    $admin = createParametersSuperAdmin('validate-fk-parameters@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'type' => ParameterType::Option->value,
        ])
        ->assertSessionHasErrors(['group_id', 'product_id', 'material_id']);
});

test('creating a parameter validates invalid foreign keys', function () {
    $admin = createParametersSuperAdmin('validate-invalid-fk-parameters@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'group_id' => 999999,
            'product_id' => 999999,
            'material_id' => 999999,
            'type' => ParameterType::Option->value,
        ])
        ->assertSessionHasErrors(['group_id', 'product_id', 'material_id']);
});

test('creating a parameter validates option fields', function () {
    $admin = createParametersSuperAdmin('validate-options-parameters@dev.com');
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'name' => 'Shade',
            'field_name' => 'shade',
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
            'options' => [
                [
                    'label' => '',
                    'value' => '',
                    'color' => '',
                ],
            ],
        ])
        ->assertSessionHasErrors([
            'options.0.label',
            'options.0.value',
            'options.0.color',
        ]);
});
test('users without create permission cannot store parameters', function () {
    $admin = createParametersLimitedAdmin(
        ['parameters.view'],
        'no-create-parameters@dev.com',
    );
    $group = ParameterGroup::factory()->create();
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.parameters.store'), [
            'group_id' => $group->id,
            'product_id' => $product->id,
            'material_id' => $material->id,
            'type' => ParameterType::Option->value,
        ])
        ->assertForbidden();
});

test('users without update permission cannot update parameters', function () {
    $admin = createParametersLimitedAdmin(
        ['parameters.view'],
        'no-update-parameters@dev.com',
    );
    $parameter = Parameter::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.parameters.update', $parameter), [
            'group_id' => $parameter->group_id,
            'product_id' => $parameter->product_id,
            'material_id' => $parameter->material_id,
            'type' => ParameterType::Input->value,
        ])
        ->assertForbidden();
});

test('super admins can delete a parameter and its options', function () {
    Storage::fake('public');

    $admin = createParametersSuperAdmin('delete-parameters@dev.com');
    $parameter = Parameter::factory()->create();
    $imagePath = UploadedFile::fake()->image('gone.png')->store('parameter-options/images', 'public');
    $option = ParameterOption::factory()->create([
        'parameter_id' => $parameter->id,
        'image' => $imagePath,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.parameters.destroy', $parameter))
        ->assertRedirect(route('admin.parameters.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('parameters', [
        'id' => $parameter->id,
    ]);

    $this->assertDatabaseMissing('parameters_options', [
        'id' => $option->id,
    ]);

    Storage::disk('public')->assertMissing($imagePath);
});

test('users without delete permission cannot delete parameters', function () {
    $admin = createParametersLimitedAdmin(
        ['parameters.view'],
        'view-only-parameters@dev.com',
    );
    $parameter = Parameter::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.parameters.destroy', $parameter))
        ->assertForbidden();

    $this->assertDatabaseHas('parameters', [
        'id' => $parameter->id,
    ]);
});
