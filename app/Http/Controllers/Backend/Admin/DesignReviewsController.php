<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DesignReviewsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/Admin/DesignReviews', [
            'pendingCount' => 1,
            'reviews' => [
                [
                    'id' => 'APX-2842',
                    'status' => 'Ready For Review',
                    'customer' => 'Metro Dental Lab',
                    'product' => 'Nightguard',
                    'designer' => 'Aisha Patel',
                    'due_date' => '2026-07-03',
                ],
            ],
        ]);
    }
}
