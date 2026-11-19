<?php

namespace App\Services;

use App\Models\DentalCase;
use App\Models\DentalCaseFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class DentalCaseFileZipService
{
    public function download(DentalCase $case): BinaryFileResponse
    {
        $case->loadMissing('files');

        abort_if($case->files->isEmpty(), 404);

        $tempPath = tempnam(sys_get_temp_dir(), 'dental-case-');

        if ($tempPath === false) {
            abort(500, 'Unable to prepare case file download.');
        }

        $zipPath = $tempPath.'.zip';
        @unlink($tempPath);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to prepare case file download.');
        }

        $usedNames = [];
        $added = 0;

        foreach ($case->files as $file) {
            if (! $file instanceof DentalCaseFile) {
                continue;
            }

            $disk = Storage::disk($file->storage_disk);

            if (! $disk->exists($file->storage_path)) {
                continue;
            }

            $entryName = $this->uniqueZipEntryName($file, $usedNames);
            $usedNames[$entryName] = true;
            $zip->addFromString($entryName, $disk->get($file->storage_path));
            $added++;
        }

        $zip->close();

        if ($added === 0) {
            @unlink($zipPath);
            abort(404);
        }

        return response()
            ->download($zipPath, $case->case_number.'-files.zip', [
                'Content-Type' => 'application/zip',
            ])
            ->deleteFileAfterSend(true);
    }

    /**
     * @param  array<string, true>  $usedNames
     */
    private function uniqueZipEntryName(DentalCaseFile $file, array $usedNames): string
    {
        $base = trim($file->requirement_code_snapshot.'-'.$file->original_name, '-');
        $base = $base === '' ? 'file-'.$file->id : $base;

        if (! isset($usedNames[$base])) {
            return $base;
        }

        return $file->id.'-'.$base;
    }
}
