<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportsAnalyticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/Admin/ReportsAnalytics', [
            'casesChart' => [
                'title' => 'Cases: Submitted vs Completed',
                'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                'values' => [32, 38, 45, 40, 50, 55],
                'max' => 60,
                'y_labels' => [0, 15, 30, 45, 60],
            ],
            'revenueChart' => [
                'title' => 'Revenue Growth',
                'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                'values' => [20, 28, 35, 32, 48, 58],
                'max' => 80,
                'y_labels' => ['$0k', '$20k', '$40k', '$60k', '$80k'],
            ],
            'designers' => [
                [
                    'id' => 1,
                    'name' => 'Marcus Chen',
                    'initials' => 'MC',
                    'cases' => 142,
                    'avg_turnaround' => '18 hrs',
                    'approval_rate' => 96,
                    'revision_rate' => 4,
                ],
                [
                    'id' => 2,
                    'name' => 'Sofia Nakamura',
                    'initials' => 'SN',
                    'cases' => 115,
                    'avg_turnaround' => '16 hrs',
                    'approval_rate' => 98,
                    'revision_rate' => 2,
                ],
                [
                    'id' => 3,
                    'name' => 'Aisha Patel',
                    'initials' => 'AP',
                    'cases' => 98,
                    'avg_turnaround' => '14 hrs',
                    'approval_rate' => 94,
                    'revision_rate' => 6,
                ],
                [
                    'id' => 4,
                    'name' => 'Luis Fernandez',
                    'initials' => 'LF',
                    'cases' => 87,
                    'avg_turnaround' => '22 hrs',
                    'approval_rate' => 91,
                    'revision_rate' => 9,
                ],
                [
                    'id' => 5,
                    'name' => 'David Okafor',
                    'initials' => 'DO',
                    'cases' => 203,
                    'avg_turnaround' => '24 hrs',
                    'approval_rate' => 97,
                    'revision_rate' => 3,
                ],
            ],
        ]);
    }
}
