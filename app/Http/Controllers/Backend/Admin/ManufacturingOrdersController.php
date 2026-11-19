<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManufacturingOrdersController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/Admin/ManufacturingOrders', [
            'activeCount' => 4,
            'stats' => [
                ['label' => 'Assigned', 'count' => 0, 'tone' => 'blue'],
                ['label' => 'Production', 'count' => 1, 'tone' => 'sky'],
                ['label' => 'Quality Check', 'count' => 1, 'tone' => 'purple'],
                ['label' => 'Ready to Ship', 'count' => 0, 'tone' => 'orange'],
                ['label' => 'Shipped', 'count' => 1, 'tone' => 'green'],
            ],
            'orders' => [
                [
                    'id' => 'APX-2847',
                    'customer' => 'Dr. Sarah Mitchell',
                    'product' => 'Crown',
                    'manufacturer' => 'PrecisionDent Labs',
                    'status' => 'In Production',
                    'status_tone' => 'blue',
                    'due_date' => '2026-07-04',
                    'can_advance' => true,
                ],
                [
                    'id' => 'APX-2841',
                    'customer' => 'Dr. Kevin Park',
                    'product' => 'Crown',
                    'manufacturer' => 'PrecisionDent Labs',
                    'status' => 'QC',
                    'status_tone' => 'purple',
                    'due_date' => '2026-07-02',
                    'can_advance' => true,
                ],
                [
                    'id' => 'APX-2840',
                    'customer' => 'Sunrise Dental Partners',
                    'product' => 'Partial',
                    'manufacturer' => 'ProCraft Dental',
                    'status' => 'Shipped',
                    'status_tone' => 'teal',
                    'due_date' => '2026-06-30',
                    'can_advance' => true,
                ],
                [
                    'id' => 'APX-2838',
                    'customer' => 'Capital Denture Clinic',
                    'product' => 'Denture',
                    'manufacturer' => 'Artisan Dental Mfg',
                    'status' => 'Completed',
                    'status_tone' => 'green',
                    'due_date' => '2026-06-25',
                    'can_advance' => false,
                ],
            ],
        ]);
    }
}
