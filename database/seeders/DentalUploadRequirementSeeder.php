<?php

namespace Database\Seeders;

use App\Models\DentalProduct;
use App\Models\DentalProductUploadRequirement;
use App\Models\DentalUploadRequirement;
use App\Support\CaseCreateCatalog;
use Illuminate\Database\Seeder;

class DentalUploadRequirementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $catalog = CaseCreateCatalog::static();
        $protocols = $catalog['protocols'] ?? [];
        $productsCatalog = $catalog['products'] ?? [];
        $sort = 0;

        foreach ($protocols as $fields) {
            foreach ($fields as $field) {
                $code = (string) $field['id'];
                $accept = (string) ($field['accept'] ?? '');
                $extensions = $this->extensionsFromAccept($accept);

                DentalUploadRequirement::query()->updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => (string) $field['label'],
                        'description' => null,
                        'accepted_extensions' => $extensions,
                        'accepted_mime_types' => str_contains($accept, 'image/')
                            ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
                            : null,
                    ],
                );
            }
        }

        $requirements = DentalUploadRequirement::query()->get()->keyBy('code');

        foreach (DentalProduct::query()->orderBy('id')->get() as $product) {
            $productKey = CaseCreateCatalog::productKey($product);
            $protocol = $productsCatalog[$productKey]['protocol'] ?? null;

            if (! is_string($protocol) || $protocol === '') {
                continue;
            }

            $fields = $protocols[$protocol] ?? [];

            if ($fields === []) {
                continue;
            }

            foreach ($fields as $field) {
                $requirement = $requirements->get($field['id']);

                if ($requirement === null) {
                    continue;
                }

                DentalProductUploadRequirement::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'upload_requirement_id' => $requirement->id,
                    ],
                    [
                        'is_required' => (bool) $field['required'],
                        'requirement_group' => in_array($field['id'], ['frontSmile', 'leftSmile', 'rightSmile', 'frontRetracted', 'faceScan'], true)
                            ? 'photos_or_scan'
                            : null,
                        'min_files' => $field['required'] ? 1 : 0,
                        'sort_order' => $sort++,
                    ],
                );
            }
        }
    }

    /**
     * @return list<string>
     */
    private function extensionsFromAccept(string $accept): array
    {
        $parts = collect(explode(',', $accept))
            ->map(fn (string $part): string => ltrim(trim($part), '.'))
            ->reject(fn (string $part): bool => $part === '' || str_contains($part, '/'))
            ->values()
            ->all();

        return array_values(array_unique($parts));
    }
}
