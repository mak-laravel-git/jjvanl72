<?php

namespace App\Console\Commands;

use App\Support\FirebaseWebConfig;
use Illuminate\Console\Command;

class SyncFirebaseWebConfigCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'firebase:sync-web-config';

    /**
     * @var string
     */
    protected $description = 'Write storage/app/firebase-web-config.json from VITE_FIREBASE_* env/config';

    public function handle(): int
    {
        $config = FirebaseWebConfig::syncFromEnvironment();

        if (! FirebaseWebConfig::hasAnyValue($config)) {
            $this->warn('Firebase web config is empty. Set VITE_FIREBASE_* and re-run.');
        } else {
            $this->info('Wrote '.FirebaseWebConfig::STORAGE_PATH.' on the local disk.');
        }

        return self::SUCCESS;
    }
}
