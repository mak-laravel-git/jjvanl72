<?php

namespace App\Support;

class PortalDemoData
{
    /**
     * @return list<array{
     *     id: string,
     *     patient: string,
     *     product: string,
     *     status: string,
     *     status_tone: string,
     *     submission_date: string|null,
     *     due_date: string|null,
     *     manufacturing_type: string,
     *     actions: list<string>
     * }>
     */
    public static function cases(): array
    {
        return [
            [
                'id' => 'ADX-12496',
                'patient' => 'David Kim',
                'product' => 'Implant Crown',
                'status' => 'Draft',
                'status_tone' => 'gray',
                'submission_date' => null,
                'due_date' => 'Jun 23, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'submit', 'edit', 'duplicate', 'delete'],
            ],
            [
                'id' => 'ADX-41109',
                'patient' => 'a',
                'product' => 'Crown',
                'status' => 'Submitted',
                'status_tone' => 'blue',
                'submission_date' => 'Jun 17, 2026',
                'due_date' => null,
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download'],
            ],
            [
                'id' => 'ADX-12491',
                'patient' => 'Jane Doe',
                'product' => 'Crown',
                'status' => 'Ready For Review',
                'status_tone' => 'orange',
                'submission_date' => 'Jun 13, 2026',
                'due_date' => 'Jun 22, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'approve', 'download'],
            ],
            [
                'id' => 'ADX-12492',
                'patient' => 'John Miller',
                'product' => 'Bridge',
                'status' => 'Revision Requested',
                'status_tone' => 'red',
                'submission_date' => 'Jun 9, 2026',
                'due_date' => 'Jun 27, 2026',
                'manufacturing_type' => 'Design File Only',
                'actions' => ['view', 'download'],
            ],
            [
                'id' => 'ADX-12493',
                'patient' => 'Sarah Lee',
                'product' => 'Implant Abutment',
                'status' => 'Manufacturing',
                'status_tone' => 'purple',
                'submission_date' => 'Jun 7, 2026',
                'due_date' => 'Jun 20, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download'],
            ],
            [
                'id' => 'ADX-12494',
                'patient' => 'Michael Brown',
                'product' => 'Full Arch',
                'status' => 'Shipped',
                'status_tone' => 'sky',
                'submission_date' => 'Jun 3, 2026',
                'due_date' => 'Jul 1, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download'],
            ],
            [
                'id' => 'ADX-12495',
                'patient' => 'Emily Chen',
                'product' => 'Veneer',
                'status' => 'Completed',
                'status_tone' => 'green',
                'submission_date' => 'May 28, 2026',
                'due_date' => 'Jun 15, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download'],
            ],
        ];
    }

    /**
     * @param  list<string>  $statuses
     * @return list<array<string, mixed>>
     */
    public static function casesForStatuses(array $statuses): array
    {
        return array_values(array_filter(
            self::cases(),
            fn (array $case): bool => in_array($case['status'], $statuses, true),
        ));
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     type: string,
     *     product: string,
     *     material: string,
     *     due_date: string,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function manufacturerAssignedJobs(): array
    {
        return [
            [
                'id' => 'APEX-2026-001',
                'customer' => 'Dr. Sarah Johnson',
                'type' => 'Dentist',
                'product' => 'Crown',
                'material' => 'Zirconia',
                'due_date' => 'Jul 02, 2026',
                'priority' => 'High',
                'status' => 'Assigned',
                'status_tone' => 'assigned',
            ],
            [
                'id' => 'APEX-2026-002',
                'customer' => 'Elite Dental Lab',
                'type' => 'Lab',
                'product' => 'Bridge',
                'material' => 'PFM',
                'due_date' => 'Jun 30, 2026',
                'priority' => 'High',
                'status' => 'Accepted',
                'status_tone' => 'accepted',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     material: string,
     *     due_date: string,
     *     priority: string
     * }>
     */
    public static function manufacturerInProductionJobs(): array
    {
        return [
            [
                'id' => 'APEX-2026-003',
                'customer' => 'Dr. Michael Chen',
                'product' => 'Implant',
                'material' => 'Titanium',
                'due_date' => 'Jun 29, 2026',
                'priority' => 'Medium',
            ],
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     subtitle: string,
     *     customer_name: string,
     *     customer_type: string,
     *     product_type: string,
     *     material: string,
     *     shade: string,
     *     quantity: string,
     *     due_date: string,
     *     priority: string,
     *     priority_tone: string,
     *     status: string,
     *     status_tone: string,
     *     manufacturing_notes: string,
     *     shipping_address: string,
     *     files: list<array{name: string, meta: string}>,
     *     timeline: list<array{label: string, date: string}>,
     *     action_label: string,
     *     action_tone: string,
     *     back_url: string
     * }|null
     */
    public static function manufacturerAssignedJobDetail(string $id): ?array
    {
        return match ($id) {
            'APEX-2026-001' => [
                'id' => 'APEX-2026-001',
                'subtitle' => 'Crown for Dr. Sarah Johnson',
                'customer_name' => 'Dr. Sarah Johnson',
                'customer_type' => 'Dentist',
                'product_type' => 'Crown',
                'material' => 'Zirconia',
                'shade' => 'A2',
                'quantity' => '1',
                'due_date' => 'Jul 02, 2026',
                'priority' => 'High',
                'priority_tone' => 'high',
                'status' => 'Assigned',
                'status_tone' => 'assigned',
                'manufacturing_notes' => 'Patient prefers natural translucency. Please ensure proper margin fit.',
                'shipping_address' => '123 Dental Plaza, Suite 200, Seattle, WA 98101',
                'files' => [
                    ['name' => 'upper_molar_14.stl', 'meta' => '2.4 MB • Design'],
                    ['name' => 'manufacturing_specs.pdf', 'meta' => '486 KB • Instructions'],
                    ['name' => 'prescription.pdf', 'meta' => '124 KB • Prescription'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 25, 2026 9:30 AM • System'],
                ],
                'action_label' => 'Accept Job',
                'action_tone' => 'primary',
                'back_url' => route('manufacturer.assigned'),
            ],
            'APEX-2026-002' => [
                'id' => 'APEX-2026-002',
                'subtitle' => 'Bridge for Elite Dental Lab',
                'customer_name' => 'Elite Dental Lab',
                'customer_type' => 'Lab',
                'product_type' => 'Bridge',
                'material' => 'PFM',
                'shade' => 'A3',
                'quantity' => '1',
                'due_date' => 'Jun 30, 2026',
                'priority' => 'High',
                'priority_tone' => 'high',
                'status' => 'Accepted',
                'status_tone' => 'accepted',
                'manufacturing_notes' => 'Bridge unit spacing approved. Follow the supplied connector dimensions exactly.',
                'shipping_address' => '2800 Aurora Ave N, Seattle, WA 98109',
                'files' => [
                    ['name' => 'bridge_case_files.zip', 'meta' => '3.8 MB • Design'],
                    ['name' => 'manufacturer_notes.pdf', 'meta' => '320 KB • Instructions'],
                    ['name' => 'prescription.pdf', 'meta' => '128 KB • Prescription'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 24, 2026 11:15 AM • System'],
                    ['label' => 'Job Accepted', 'date' => 'Jun 24, 2026 12:02 PM • Max Smith'],
                ],
                'action_label' => 'Start Production',
                'action_tone' => 'primary',
                'back_url' => route('manufacturer.assigned'),
            ],
            default => null,
        };
    }

    /**
     * @return array{
     *     id: string,
     *     subtitle: string,
     *     customer_name: string,
     *     customer_type: string,
     *     product_type: string,
     *     material: string,
     *     shade: string,
     *     quantity: string,
     *     due_date: string,
     *     priority: string,
     *     priority_tone: string,
     *     status: string,
     *     status_tone: string,
     *     manufacturing_notes: string,
     *     shipping_address: string,
     *     files: list<array{name: string, meta: string}>,
     *     timeline: list<array{label: string, date: string}>,
     *     action_label: string,
     *     action_tone: string,
     *     back_url: string
     * }|null
     */
    public static function manufacturerInProductionJobDetail(string $id): ?array
    {
        return match ($id) {
            'APEX-2026-003' => [
                'id' => 'APEX-2026-003',
                'subtitle' => 'Implant for Dr. Michael Chen',
                'customer_name' => 'Dr. Michael Chen',
                'customer_type' => 'Dentist',
                'product_type' => 'Implant',
                'material' => 'Titanium',
                'shade' => 'N/A',
                'quantity' => '2',
                'due_date' => 'Jun 29, 2026',
                'priority' => 'Medium',
                'priority_tone' => 'medium',
                'status' => 'In Production',
                'status_tone' => 'in-production',
                'manufacturing_notes' => 'Custom abutments for Nobel Biocare implant system. Verify screw access holes.',
                'shipping_address' => '789 Medical Center, Floor 3, San Francisco, CA 94102',
                'files' => [
                    ['name' => 'abutment_left.stl', 'meta' => '1.9 MB • Design'],
                    ['name' => 'abutment_right.stl', 'meta' => '1.8 MB • Design'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 23, 2026 8:00 AM • System'],
                    ['label' => 'Job Accepted', 'date' => 'Jun 23, 2026 9:15 AM • Manufacturing Team'],
                    ['label' => 'Production Started', 'date' => 'Jun 23, 2026 10:00 AM • Manufacturing Team'],
                ],
                'action_label' => 'Move To Quality Check',
                'action_tone' => 'accent',
                'back_url' => route('manufacturer.in-production'),
            ],
            default => null,
        };
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     material: string,
     *     due_date: string,
     *     priority: string
     * }>
     */
    public static function manufacturerQualityCheckJobs(): array
    {
        return [
            [
                'id' => 'APEX-2026-004',
                'customer' => 'Perfect Smile Dentures',
                'product' => 'Denture',
                'material' => 'Acrylic',
                'due_date' => 'Jun 28, 2026',
                'priority' => 'Medium',
            ],
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     subtitle: string,
     *     customer_name: string,
     *     customer_type: string,
     *     product_type: string,
     *     material: string,
     *     shade: string,
     *     quantity: string,
     *     due_date: string,
     *     priority: string,
     *     priority_tone: string,
     *     status: string,
     *     status_tone: string,
     *     manufacturing_notes: string,
     *     shipping_address: string,
     *     files: list<array{name: string, meta: string}>,
     *     timeline: list<array{label: string, date: string}>,
     *     action_label: string,
     *     action_tone: string,
     *     actions: list<array{label: string, tone: string, icon: string}>,
     *     back_url: string
     * }|null
     */
    public static function manufacturerQualityCheckJobDetail(string $id): ?array
    {
        return match ($id) {
            'APEX-2026-004' => [
                'id' => 'APEX-2026-004',
                'subtitle' => 'Denture for Perfect Smile Dentures',
                'customer_name' => 'Perfect Smile Dentures',
                'customer_type' => 'Denturist',
                'product_type' => 'Denture',
                'material' => 'Acrylic',
                'shade' => 'Light Pink',
                'quantity' => '1',
                'due_date' => 'Jun 28, 2026',
                'priority' => 'Medium',
                'priority_tone' => 'medium',
                'status' => 'Quality Check',
                'status_tone' => 'quality-check',
                'manufacturing_notes' => 'Complete upper denture. Patient has high smile line - ensure natural gingival contours.',
                'shipping_address' => '321 Denture Clinic, Vancouver, BC V6B 1A1',
                'files' => [
                    ['name' => 'upper_denture.stl', 'meta' => '4.2 MB • Design'],
                    ['name' => 'tooth_setup.pdf', 'meta' => '2.1 MB • Instructions'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 22, 2026 7:30 AM • System'],
                    ['label' => 'Job Accepted', 'date' => 'Jun 22, 2026 8:45 AM • Manufacturing Team'],
                    ['label' => 'Production Started', 'date' => 'Jun 22, 2026 11:00 AM • Manufacturing Team'],
                    ['label' => 'Moved to QC', 'date' => 'Jun 25, 2026 4:00 PM • Manufacturing Team'],
                ],
                'action_label' => 'Mark Ready To Ship',
                'action_tone' => 'primary',
                'actions' => [
                    ['label' => 'Mark Ready To Ship', 'tone' => 'primary', 'icon' => 'package'],
                    ['label' => 'Return To Production', 'tone' => 'accent', 'icon' => 'return'],
                ],
                'back_url' => route('manufacturer.quality-check'),
            ],
            default => null,
        };
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     material: string,
     *     due_date: string,
     *     shipping_address: string
     * }>
     */
    public static function manufacturerReadyToShipJobs(): array
    {
        return [
            [
                'id' => 'APEX-2026-005',
                'customer' => 'Dr. Emily Rodriguez',
                'product' => 'Bridge',
                'material' => 'Zirconia',
                'due_date' => 'Jul 01, 2026',
                'shipping_address' => '456 Medical Plaza, Floor 2, Boston, MA 02115',
            ],
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     subtitle: string,
     *     customer_name: string,
     *     customer_type: string,
     *     product_type: string,
     *     material: string,
     *     shade: string,
     *     quantity: string,
     *     due_date: string,
     *     priority: string,
     *     priority_tone: string,
     *     status: string,
     *     status_tone: string,
     *     manufacturing_notes: string,
     *     shipping_address: string,
     *     files: list<array{name: string, meta: string}>,
     *     timeline: list<array{label: string, date: string}>,
     *     action_label: string,
     *     action_tone: string,
     *     production_panel: string,
     *     back_url: string
     * }|null
     */
    public static function manufacturerReadyToShipJobDetail(string $id): ?array
    {
        return match ($id) {
            'APEX-2026-005' => [
                'id' => 'APEX-2026-005',
                'subtitle' => 'Bridge for Dr. Emily Rodriguez',
                'customer_name' => 'Dr. Emily Rodriguez',
                'customer_type' => 'Dentist',
                'product_type' => 'Bridge',
                'material' => 'Zirconia',
                'shade' => 'A3',
                'quantity' => '3',
                'due_date' => 'Jul 01, 2026',
                'priority' => 'High',
                'priority_tone' => 'high',
                'status' => 'Ready To Ship',
                'status_tone' => 'ready-to-ship',
                'manufacturing_notes' => '3-unit anterior bridge. Match shade carefully for #7-9. Use layered zirconia.',
                'shipping_address' => '456 Medical Plaza, Floor 2, Boston, MA 02115',
                'files' => [
                    ['name' => 'bridge_design.stl', 'meta' => '5.1 MB • Design'],
                    ['name' => 'shade_guide.pdf', 'meta' => '890 KB • Instructions'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 20, 2026 10:00 AM • System'],
                    ['label' => 'Job Accepted', 'date' => 'Jun 20, 2026 10:30 AM • Manufacturing Team'],
                    ['label' => 'Production Started', 'date' => 'Jun 21, 2026 9:00 AM • Manufacturing Team'],
                    ['label' => 'Moved to QC', 'date' => 'Jun 28, 2026 2:00 PM • Manufacturing Team'],
                    ['label' => 'QC Approved', 'date' => 'Jun 29, 2026 11:00 AM • QC Team'],
                ],
                'action_label' => 'Create Shipment',
                'action_tone' => 'primary',
                'production_panel' => 'shipping',
                'back_url' => route('manufacturer.ready-to-ship'),
            ],
            default => null,
        };
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     courier: string,
     *     tracking_number: string,
     *     est_delivery: string
     * }>
     */
    public static function manufacturerShippedJobs(): array
    {
        return [
            [
                'id' => 'APEX-2026-006',
                'customer' => 'Dr. James Wilson',
                'product' => 'Nightguard',
                'courier' => 'FedEx',
                'tracking_number' => '1Z999AA10123456784',
                'est_delivery' => 'Jun 22, 2026',
            ],
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     subtitle: string,
     *     customer_name: string,
     *     customer_type: string,
     *     customer_type_label: string,
     *     product_type: string,
     *     material: string,
     *     shade: string,
     *     shade_label: string,
     *     quantity: string,
     *     due_date: string,
     *     priority: string,
     *     priority_tone: string,
     *     status: string,
     *     status_tone: string,
     *     manufacturing_notes: string,
     *     shipping_address: string,
     *     files: list<array{name: string, meta: string}>,
     *     timeline: list<array{label: string, date: string}>,
     *     action_label: string,
     *     action_tone: string,
     *     production_panel: string,
     *     shipment: array{courier: string, tracking_number: string, est_delivery: string},
     *     back_url: string
     * }|null
     */
    public static function manufacturerShippedJobDetail(string $id): ?array
    {
        return match ($id) {
            'APEX-2026-006' => [
                'id' => 'APEX-2026-006',
                'subtitle' => 'Nightguard for Dr. James Wilson',
                'customer_name' => 'Dr. James Wilson',
                'customer_type' => 'dent123',
                'customer_type_label' => 'Dentist Case ID',
                'product_type' => 'Nightguard',
                'material' => 'Hard/Soft',
                'shade' => 'Clear',
                'shade_label' => 'Color',
                'quantity' => '1',
                'due_date' => 'Jun 28, 2026',
                'priority' => 'Low',
                'priority_tone' => 'low',
                'status' => 'Shipped',
                'status_tone' => 'shipped',
                'manufacturing_notes' => 'Upper nightguard for bruxism patient. 2mm thickness.',
                'shipping_address' => '807 Deep Dentistry, Austin, TX 78701',
                'files' => [
                    ['name' => 'Nightguard_Layout.stl', 'meta' => '1.5 MB • Design'],
                ],
                'timeline' => [
                    ['label' => 'Job Assigned', 'date' => 'Jun 10, 2026 9:00 AM • System'],
                    ['label' => 'Job Accepted', 'date' => 'Jun 10, 2026 10:15 AM • Manufacturing Team'],
                    ['label' => 'Production Started', 'date' => 'Jun 11, 2026 8:30 AM • Manufacturing Team'],
                    ['label' => 'Moved to QC', 'date' => 'Jun 18, 2026 3:00 PM • Manufacturing Team'],
                    ['label' => 'QC Approved', 'date' => 'Jun 19, 2026 11:30 AM • QC Team'],
                    ['label' => 'Shipped', 'date' => 'Jun 20, 2026 2:00 PM • Manufacturing Team'],
                ],
                'action_label' => 'Mark As Delivered',
                'action_tone' => 'primary',
                'production_panel' => 'shipment-status',
                'shipment' => [
                    'courier' => 'FedEx',
                    'tracking_number' => '1Z999AA10123456784',
                    'est_delivery' => 'Jun 22, 2026',
                ],
                'back_url' => route('manufacturer.shipped'),
            ],
            default => null,
        };
    }

    /**
     * @return list<array{
     *     id: string,
     *     name: string,
     *     case_id: string,
     *     customer: string,
     *     category: string,
     *     size: string
     * }>
     */
    public static function manufacturerDownloadFiles(): array
    {
        return [
            [
                'id' => '1',
                'name' => 'upper_molar_14.stl',
                'case_id' => 'APEX-2026-001',
                'customer' => 'Dr. Sarah Johnson',
                'category' => 'Design',
                'size' => '2.4 MB',
            ],
            [
                'id' => '2',
                'name' => 'manufacturing_specs.pdf',
                'case_id' => 'APEX-2026-001',
                'customer' => 'Dr. Sarah Johnson',
                'category' => 'Instructions',
                'size' => '486 KB',
            ],
            [
                'id' => '3',
                'name' => 'prescription.pdf',
                'case_id' => 'APEX-2026-001',
                'customer' => 'Dr. Sarah Johnson',
                'category' => 'Prescription',
                'size' => '124 KB',
            ],
            [
                'id' => '4',
                'name' => 'bridge_design.stl',
                'case_id' => 'APEX-2026-002',
                'customer' => 'Elite Dental Lab',
                'category' => 'Design',
                'size' => '3.8 MB',
            ],
            [
                'id' => '5',
                'name' => 'occlusion_reference.jpg',
                'case_id' => 'APEX-2026-002',
                'customer' => 'Elite Dental Lab',
                'category' => 'Reference',
                'size' => '1.2 MB',
            ],
            [
                'id' => '6',
                'name' => 'abutment_left.stl',
                'case_id' => 'APEX-2026-003',
                'customer' => 'Dr. Michael Chen',
                'category' => 'Design',
                'size' => '1.9 MB',
            ],
            [
                'id' => '7',
                'name' => 'abutment_right.stl',
                'case_id' => 'APEX-2026-003',
                'customer' => 'Dr. Michael Chen',
                'category' => 'Design',
                'size' => '1.8 MB',
            ],
            [
                'id' => '8',
                'name' => 'upper_denture.stl',
                'case_id' => 'APEX-2026-004',
                'customer' => 'Perfect Smile Dentures',
                'category' => 'Design',
                'size' => '4.2 MB',
            ],
            [
                'id' => '9',
                'name' => 'tooth_setup.pdf',
                'case_id' => 'APEX-2026-004',
                'customer' => 'Perfect Smile Dentures',
                'category' => 'Instructions',
                'size' => '2.1 MB',
            ],
            [
                'id' => '10',
                'name' => 'partial_framework.stl',
                'case_id' => 'APEX-2026-005',
                'customer' => 'Dr. Emily Rodriguez',
                'category' => 'Design',
                'size' => '2.7 MB',
            ],
            [
                'id' => '11',
                'name' => 'nightguard_upper.stl',
                'case_id' => 'APEX-2026-006',
                'customer' => 'Dr. James Wilson',
                'category' => 'Design',
                'size' => '1.5 MB',
            ],
            [
                'id' => '12',
                'name' => 'crown_11.stl',
                'case_id' => 'APEX-2026-007',
                'customer' => 'Precision Dental Lab',
                'category' => 'Design',
                'size' => '2.1 MB',
            ],
            [
                'id' => '13',
                'name' => 'crown_21.stl',
                'case_id' => 'APEX-2026-007',
                'customer' => 'Precision Dental Lab',
                'category' => 'Design',
                'size' => '2.0 MB',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     patient: string,
     *     product: string,
     *     status: string,
     *     status_tone: string,
     *     submission_date: string|null,
     *     due_date: string|null,
     *     manufacturing_type: string,
     *     actions: list<string>
     * }>
     */
    public static function completedCases(): array
    {
        return [
            [
                'id' => 'ADX-12493',
                'patient' => 'Sarah Lee',
                'product' => 'Implant Abutment',
                'status' => 'Completed',
                'status_tone' => 'completed',
                'submission_date' => 'Jun 7, 2026',
                'due_date' => 'Jun 20, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download', 'duplicate', 'delete'],
            ],
            [
                'id' => 'ADX-12494',
                'patient' => 'Michael Brown',
                'product' => 'Full Arch',
                'status' => 'Completed',
                'status_tone' => 'completed',
                'submission_date' => 'Jun 3, 2026',
                'due_date' => 'Jul 1, 2026',
                'manufacturing_type' => 'Design + Manufacturing',
                'actions' => ['view', 'download', 'duplicate', 'delete'],
            ],
            [
                'id' => 'ADX-12495',
                'patient' => 'Emily Clark',
                'product' => 'Veneer',
                'status' => 'Completed',
                'status_tone' => 'completed',
                'submission_date' => 'May 28, 2026',
                'due_date' => 'Jun 24, 2026',
                'manufacturing_type' => 'Design File Only',
                'actions' => ['view', 'download', 'duplicate', 'delete'],
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     product: string,
     *     reference: string,
     *     patient: string,
     *     status: string,
     *     status_tone: string,
     *     files_label: string,
     *     files_ok: bool,
     *     updated: string
     * }>
     */
    public static function completedOrders(): array
    {
        return [
            [
                'id' => 'APX-SSTQBJ',
                'product' => 'Crown & Bridge',
                'reference' => 'mull 21',
                'patient' => '',
                'status' => 'Completed',
                'status_tone' => 'green',
                'files_label' => 'DSP',
                'files_ok' => true,
                'updated' => '1h ago',
            ],
            [
                'id' => 'APX-LQ9VCJ',
                'product' => 'Crown & Bridge',
                'reference' => 'smoke 16',
                'patient' => 'Smoke Test',
                'status' => 'Completed',
                'status_tone' => 'green',
                'files_label' => 'DSP',
                'files_ok' => true,
                'updated' => '2h ago',
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function completedTracking(string $caseId): ?array
    {
        $order = collect(self::completedOrders())->firstWhere('id', $caseId);

        if ($order === null) {
            return null;
        }

        return [
            'id' => $order['id'],
            'product' => $order['product'],
            'reference' => $order['reference'],
            'patient' => $order['patient'],
            'status' => 'Completed',
            'status_tone' => 'green',
            'pipeline' => [
                ['label' => 'Prescription Created', 'done' => true],
                ['label' => 'Files Awaited', 'done' => true],
                ['label' => 'Files Received', 'done' => true],
                ['label' => 'Design', 'done' => true],
                ['label' => 'Approval', 'done' => true],
                ['label' => 'Manufacturing', 'done' => true],
                ['label' => 'Finishing', 'done' => true],
                ['label' => 'Shipped', 'done' => true],
                ['label' => 'Complete', 'done' => true],
            ],
            'client' => $order['reference'],
            'office' => 'Whitfield Dental',
            'customer' => 'dentist@arcworks.ca',
            'service' => 'Design & Process (Appliance Only)',
            'case_approval' => 'Not purchased',
            'header_shade' => '',
            'scan_mode' => '',
            'source_scanner' => '',
            'due_date' => '',
            'teeth' => [
                [
                    'tooth_number' => 21,
                    'action' => 'Crown',
                    'material' => 'Zirconia',
                    'contour' => 'Full Contour',
                    'shade' => 'A2',
                    'price' => 942.50,
                ],
            ],
            'design_output' => [
                ['name' => 'out.stl', 'type' => 'design', 'size' => '0 KB'],
            ],
            'order_total' => 942.50,
            'payment_method' => 'paypal',
            'files' => [
                ['name' => 'upper.stl', 'type' => 'ULB/upper', 'size' => '0 KB'],
                ['name' => 'lower.stl', 'type' => 'ULB/lower', 'size' => '0 KB'],
                ['name' => 'bite.stl', 'type' => 'ULB/bite', 'size' => '0 KB'],
                ['name' => 's.jpg', 'type' => 'SHADE_PH', 'size' => '0 KB'],
            ],
            'files_complete' => true,
            'messages' => [],
            'event_log_count' => 19,
            'carrier' => 'FedEx',
            'tracking_number' => 'AW M3HYDGE5',
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     patient: string,
     *     product: string,
     *     status: string,
     *     status_tone: string,
     *     file_name: string,
     *     designer_initials: string,
     *     designer_notes: string,
     *     revision_history: string
     * }|null
     */
    public static function review(string $caseId): ?array
    {
        $case = collect(self::cases())->firstWhere('id', $caseId);

        if ($case === null) {
            return null;
        }

        $slug = strtolower(str_replace(' ', '_', $case['product']));

        return [
            'id' => $case['id'],
            'patient' => $case['patient'],
            'product' => $case['product'],
            'status' => $case['status'],
            'status_tone' => $case['status_tone'],
            'file_name' => $case['id'] === 'ADX-12491'
                ? 'crown_14_design.stl'
                : $slug.'_design.stl',
            'designer_initials' => 'DS',
            'designer_notes' => 'Designed with 0.05mm cement gap and full anatomical contour.',
            'revision_history' => 'No revisions yet.',
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     product: string,
     *     reference: string,
     *     patient: string,
     *     status: string,
     *     status_tone: string,
     *     files_label: string,
     *     files_ok: bool,
     *     updated: string
     * }>
     */
    public static function manufacturingOrders(): array
    {
        return [
            [
                'id' => 'APX-SSTQBJ',
                'product' => 'Crown & Bridge',
                'reference' => 'mull 21',
                'patient' => '',
                'status' => 'Completed',
                'status_tone' => 'green',
                'files_label' => 'DSP',
                'files_ok' => true,
                'updated' => '2h ago',
            ],
            [
                'id' => 'APX-LQ9VCJ',
                'product' => 'Crown & Bridge',
                'reference' => 'smoke 16',
                'patient' => 'Smoke Test',
                'status' => 'Completed',
                'status_tone' => 'green',
                'files_label' => 'DSP',
                'files_ok' => true,
                'updated' => '2h ago',
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function manufacturingTracking(string $caseId): ?array
    {
        $orders = collect(self::manufacturingOrders());
        $order = $orders->firstWhere('id', $caseId);

        if ($order === null) {
            $case = collect(self::cases())->firstWhere('id', $caseId);

            if ($case === null || ! in_array($case['status'], ['Manufacturing', 'Shipped'], true)) {
                return null;
            }

            $order = [
                'id' => $case['id'],
                'product' => $case['product'],
                'reference' => strtolower($case['patient']),
                'patient' => $case['patient'],
            ];
        }

        $isCompleted = ($order['status'] ?? '') === 'Completed';

        return [
            'id' => $order['id'],
            'product' => $order['product'],
            'reference' => $order['reference'] ?? '',
            'patient' => $order['patient'] ?? '',
            'status' => $isCompleted ? 'Completed' : 'Manufacturing',
            'status_tone' => $isCompleted ? 'green' : 'purple',
            'pipeline' => [
                ['label' => 'Prescription Created', 'done' => true],
                ['label' => 'Files Awaited', 'done' => true],
                ['label' => 'Files Received', 'done' => true],
                ['label' => 'Design', 'done' => true],
                ['label' => 'Approval', 'done' => true],
                ['label' => 'Manufacturing', 'done' => true],
                ['label' => 'Finishing', 'done' => $isCompleted],
                ['label' => 'Shipped', 'done' => $isCompleted],
                ['label' => 'Complete', 'done' => $isCompleted],
            ],
            'client' => $order['reference'] ?? '',
            'office' => 'Whitfield Dental',
            'customer' => 'dentist@arcworks.ca',
            'service' => 'Design & Process (Appliance Only)',
            'case_approval' => 'Not purchased',
            'header_shade' => '',
            'scan_mode' => '',
            'source_scanner' => '',
            'due_date' => '',
            'teeth' => [
                [
                    'tooth_number' => 21,
                    'action' => 'Crown',
                    'material' => 'Zirconia',
                    'contour' => 'Full Contour',
                    'shade' => 'A2',
                    'price' => 942.50,
                ],
            ],
            'design_output' => [
                ['name' => 'out.stl', 'type' => 'design', 'size' => '0 KB'],
            ],
            'order_total' => 942.50,
            'payment_method' => 'paypal',
            'files' => [
                ['name' => 'upper.stl', 'type' => 'ULB/upper', 'size' => '0 KB'],
                ['name' => 'lower.stl', 'type' => 'ULB/lower', 'size' => '0 KB'],
                ['name' => 'bite.stl', 'type' => 'ULB/bite', 'size' => '0 KB'],
                ['name' => 's.jpg', 'type' => 'SHADE_PH', 'size' => '0 KB'],
            ],
            'files_complete' => true,
            'messages' => [],
            'event_log_count' => 19,
            'carrier' => $isCompleted ? 'FedEx' : '-',
            'tracking_number' => $isCompleted ? 'AW M3HYDGE5' : '-',
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     patient: string,
     *     product: string,
     *     status: string,
     *     status_tone: string,
     *     submission_date: string|null,
     *     due_date: string|null,
     *     manufacturing_type: string,
     *     reference: string,
     *     notes: string,
     *     service: string,
     *     case_approval: bool,
     *     case_shade: string,
     *     scan_mode: string,
     *     source_scanner: string,
     *     model_output: string,
     *     teeth: list<array{tooth_number: int, product_key: string, action: string, material: string, contour: string, shade: string, price: float}>,
     *     files: list<array{id: string, label: string, required: bool, uploaded: bool}>,
     *     cart_total: float
     * }|null
     */
    public static function caseDetail(string $caseId): ?array
    {
        $case = collect(self::cases())->firstWhere('id', $caseId);

        if ($case === null) {
            return null;
        }

        return [
            'id' => $case['id'],
            'patient' => $case['patient'],
            'product' => $case['product'],
            'status' => $case['status'],
            'status_tone' => $case['status_tone'],
            'submission_date' => $case['submission_date'],
            'due_date' => $case['due_date'],
            'manufacturing_type' => $case['manufacturing_type'],
            'reference' => strtolower($case['patient']),
            'notes' => 'Standard clinical protocol.',
            'service' => 'design_only',
            'case_approval' => true,
            'case_shade' => 'A3',
            'scan_mode' => 'IOS (intraoral scan)',
            'source_scanner' => '',
            'model_output' => 'No model output',
            'teeth' => [
                [
                    'tooth_number' => 13,
                    'product_key' => 'pontic',
                    'action' => 'Pontic',
                    'material' => 'Zirconia',
                    'contour' => 'Full Contour',
                    'shade' => 'A2',
                    'price' => 625.00,
                ],
                [
                    'tooth_number' => 44,
                    'product_key' => 'crown',
                    'action' => 'Crown',
                    'material' => 'Lithium Disilicate',
                    'contour' => 'Buccal Cutback',
                    'shade' => 'A3',
                    'price' => 630.00,
                ],
            ],
            'files' => [
                ['id' => 'scans', 'label' => '1. Upper / Lower / Bite', 'required' => true, 'uploaded' => true],
                ['id' => 'retracted', 'label' => '2. Retracted Facescan', 'required' => false, 'uploaded' => false],
                ['id' => 'smiling', 'label' => '3. Smiling Facescan', 'required' => false, 'uploaded' => false],
                ['id' => 'photos', 'label' => '4. Photographs', 'required' => false, 'uploaded' => true],
                ['id' => 'shade-photos', 'label' => '5. Shade Photographs', 'required' => true, 'uploaded' => true],
            ],
            'cart_total' => 1614.00,
        ];
    }

    /**
     * @return list<array{
     *     invoice: string,
     *     case_id: string,
     *     description: string,
     *     amount: string,
     *     due_date: string|null,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function invoices(): array
    {
        return [
            [
                'invoice' => 'INV-41109',
                'case_id' => 'ADX-41109',
                'description' => 'Crown',
                'amount' => '$216.00',
                'due_date' => 'Jun 22, 2026',
                'status' => 'Unpaid',
                'status_tone' => 'blue',
            ],
            [
                'invoice' => 'INV-12491',
                'case_id' => 'ADX-12491',
                'description' => 'Crown',
                'amount' => '$249.00',
                'due_date' => 'Jun 22, 2026',
                'status' => 'Paid',
                'status_tone' => 'gray',
            ],
            [
                'invoice' => 'INV-12492',
                'case_id' => 'ADX-12492',
                'description' => 'Bridge',
                'amount' => '$189.00',
                'due_date' => 'Jun 22, 2026',
                'status' => 'Unpaid',
                'status_tone' => 'blue',
            ],
            [
                'invoice' => 'INV-12493',
                'case_id' => 'ADX-12493',
                'description' => 'Implant Abutment',
                'amount' => '$399.00',
                'due_date' => 'Jun 22, 2026',
                'status' => 'Unpaid',
                'status_tone' => 'blue',
            ],
            [
                'invoice' => 'INV-12494',
                'case_id' => 'ADX-12494',
                'description' => 'Full Arch',
                'amount' => '$1,299.00',
                'due_date' => null,
                'status' => 'Unpaid',
                'status_tone' => 'blue',
            ],
            [
                'invoice' => 'INV-12495',
                'case_id' => 'ADX-12495',
                'description' => 'Veneer',
                'amount' => '$349.00',
                'due_date' => 'Jun 22, 2026',
                'status' => 'Unpaid',
                'status_tone' => 'blue',
            ],
        ];
    }

    /**
     * @return array{
     *     outstanding_balance: string,
     *     outstanding_label: string,
     *     paid_this_month: string,
     *     paid_this_month_change: string,
     *     paid_ytd: string,
     *     paid_ytd_change: string,
     *     avg_case_value: string,
     *     avg_case_value_note: string
     * }
     */
    public static function paymentsSummary(): array
    {
        return [
            'outstanding_balance' => '$2,452.00',
            'outstanding_label' => 'OVERDUE',
            'paid_this_month' => '$249.00',
            'paid_this_month_change' => '+12% from last month',
            'paid_ytd' => '$12,840.00',
            'paid_ytd_change' => '5% YoY increase',
            'avg_case_value' => '$850.00',
            'avg_case_value_note' => 'Based on last 30 cases',
        ];
    }

    /**
     * @return list<array{
     *     invoice: string,
     *     date: string,
     *     period: string,
     *     amount: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function paymentInvoices(): array
    {
        return [
            [
                'invoice' => '#INV-00824',
                'date' => 'Oct 24, 2023',
                'period' => 'Oct 01 - Oct 31',
                'amount' => '$1,200.00',
                'status' => 'Paid',
                'status_tone' => 'completed',
            ],
            [
                'invoice' => '#INV-00825',
                'date' => 'Nov 05, 2023',
                'period' => 'Nov 01 - Nov 30',
                'amount' => '$2,452.00',
                'status' => 'Overdue',
                'status_tone' => 'completed',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     brand: string,
     *     last_four: string,
     *     expires: string,
     *     is_default: bool
     * }>
     */
    public static function paymentMethods(): array
    {
        return [
            [
                'id' => 'visa',
                'brand' => 'Visa',
                'last_four' => '4242',
                'expires' => '12/25',
                'is_default' => true,
            ],
            [
                'id' => 'paypal',
                'brand' => 'PayPal',
                'last_four' => '4242',
                'expires' => '12/25',
                'is_default' => false,
            ],
        ];
    }

    /**
     * @return array{
     *     items: list<array{label: string, amount: string, percent: int, color: string}>,
     *     total: string
     * }
     */
    public static function costBreakdown(): array
    {
        return [
            'items' => [
                [
                    'label' => 'Crowns & bridges',
                    'amount' => '$149.40',
                    'percent' => 60,
                    'color' => '#0260bd',
                ],
                [
                    'label' => 'Dentures',
                    'amount' => '$49.80',
                    'percent' => 20,
                    'color' => '#60a5fa',
                ],
                [
                    'label' => 'Implants',
                    'amount' => '$24.90',
                    'percent' => 10,
                    'color' => '#f967a1',
                ],
                [
                    'label' => 'Other',
                    'amount' => '$24.90',
                    'percent' => 10,
                    'color' => '#93c5fd',
                ],
            ],
            'total' => '$249.00',
        ];
    }

    /**
     * @return list<array{
     *     title: string,
     *     date: string,
     *     payment_detail: string,
     *     amount: string
     * }>
     */
    public static function transactionHistory(): array
    {
        return [
            [
                'title' => 'Payment for ADX-12491',
                'date' => 'Jun 17, 2026',
                'payment_detail' => 'Card ending in 4242',
                'amount' => '-$249.00',
            ],
        ];
    }

    /**
     * @return list<array{case_id: string, refund_status: string}>
     */
    public static function refundRequests(): array
    {
        return [
            [
                'case_id' => 'ADX-12491',
                'refund_status' => 'N/A',
            ],
        ];
    }

    /**
     * @return list<array{id: string, brand: string, last_four: string, expires: string}>
     */
    public static function savedPaymentMethods(): array
    {
        return [
            [
                'id' => 'visa-4242',
                'brand' => 'Visa',
                'last_four' => '4242',
                'expires' => '12/26',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function assignedCases(): array
    {
        return [
            [
                'id' => 'APX-2847',
                'customer' => 'Dentist',
                'product' => 'Full Arch Implant',
                'client' => 'Dr. Michael Torres',
                'assigned_date' => '2026-06-25',
                'due_date' => '2026-07-01',
                'due_urgent' => false,
                'priority' => 'High',
                'status' => 'In Design',
                'status_tone' => 'in-design',
            ],
            [
                'id' => 'APX-2851',
                'customer' => 'Lab',
                'product' => 'Single Crown',
                'client' => 'Bright Dental Lab',
                'assigned_date' => '2026-06-26',
                'due_date' => '2026-07-02',
                'due_urgent' => false,
                'priority' => 'Medium',
                'status' => 'Assigned',
                'status_tone' => 'assigned',
            ],
            [
                'id' => 'APX-2856',
                'customer' => 'Denturist',
                'product' => 'Complete Denture',
                'client' => 'Sandra Walsh CDT',
                'assigned_date' => '2026-06-26',
                'due_date' => '2026-06-30',
                'due_urgent' => true,
                'priority' => 'High',
                'status' => 'Revision Requested',
                'status_tone' => 'revision',
            ],
            [
                'id' => 'APX-2859',
                'customer' => 'Dentist',
                'product' => '3-Unit Bridge',
                'client' => 'Dr. Priya Anand',
                'assigned_date' => '2026-06-27',
                'due_date' => '2026-07-03',
                'due_urgent' => false,
                'priority' => 'Low',
                'status' => 'Downloaded',
                'status_tone' => 'downloaded',
            ],
            [
                'id' => 'APX-2861',
                'customer' => 'Dentist',
                'product' => 'Implant Abutment',
                'client' => 'Dr. Carlos Mendes',
                'assigned_date' => '2026-06-27',
                'due_date' => '2026-07-05',
                'due_urgent' => false,
                'priority' => 'Medium',
                'status' => 'Assigned',
                'status_tone' => 'assigned',
            ],
            [
                'id' => 'APX-2863',
                'customer' => 'Lab',
                'product' => 'Partial Denture',
                'client' => 'Pacific Dental Lab',
                'assigned_date' => '2026-06-28',
                'due_date' => '2026-07-04',
                'due_urgent' => false,
                'priority' => 'Medium',
                'status' => 'Submitted',
                'status_tone' => 'submitted',
            ],
            [
                'id' => 'APX-2841',
                'customer' => 'Dentist',
                'product' => 'Full Arch Implant',
                'client' => 'Dr. Lena Kovacs',
                'assigned_date' => '2026-06-20',
                'due_date' => '2026-06-29',
                'due_urgent' => true,
                'priority' => 'High',
                'status' => 'Approved',
                'status_tone' => 'approved',
            ],
            [
                'id' => 'APX-2835',
                'customer' => 'Denturist',
                'product' => 'Immediate Denture',
                'client' => 'James Holt CDT',
                'assigned_date' => '2026-06-18',
                'due_date' => '2026-06-25',
                'due_urgent' => true,
                'priority' => 'High',
                'status' => 'Completed',
                'status_tone' => 'completed',
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function inProgressCases(): array
    {
        return collect(self::assignedCases())
            ->whereIn('id', ['APX-2847', 'APX-2859'])
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function revisionCases(): array
    {
        return collect(self::inProgressCases())
            ->map(fn (array $case): array => [
                ...$case,
                'status' => 'Revision Requested',
                'status_tone' => 'revision',
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function submittedCases(): array
    {
        return collect(self::inProgressCases())
            ->map(function (array $case): array {
                if ($case['id'] === 'APX-2859') {
                    return [
                        ...$case,
                        'status' => 'Approved',
                        'status_tone' => 'approved',
                    ];
                }

                return [
                    ...$case,
                    'status' => 'Submitted',
                    'status_tone' => 'submitted',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function designerCompletedCases(): array
    {
        return collect(self::inProgressCases())
            ->map(function (array $case): array {
                if ($case['id'] === 'APX-2859') {
                    return [
                        ...$case,
                        'status' => 'Approved',
                        'status_tone' => 'approved',
                    ];
                }

                return [
                    ...$case,
                    'status' => 'Completed',
                    'status_tone' => 'completed',
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string
     * }>
     */
    public static function fileDownloadCases(): array
    {
        return self::assignedCases();
    }

    /**
     * @return array{
     *     id: string,
     *     customer: string,
     *     product: string,
     *     client: string,
     *     assigned_date: string,
     *     due_date: string,
     *     due_urgent: bool,
     *     priority: string,
     *     status: string,
     *     status_tone: string,
     *     material: string,
     *     shade: string,
     *     implant_system: string,
     *     files: list<array{name: string, meta: string, type: string, type_tone: string}>,
     *     timeline: list<array{label: string, date: string|null, complete: bool}>,
     *     source: string,
     *     back_url: string,
     *     back_label: string,
     *     can_upload: bool,
     *     files_heading: string,
     *     notes_heading: string,
     *     alert: array{tone: string, title: string, body: string}|null,
     *     header_actions: list<array{label: string, variant: string}>,
     *     workflow: list<array{label: string, icon: string, state: string, tone?: string}>,
     *     uploaded_design_files: list<string>
     * }|null
     */
    public static function assignedCaseDetail(string $caseId, string $from = 'assigned'): ?array
    {
        $from = in_array($from, ['assigned', 'in-progress', 'revisions', 'submitted', 'completed', 'downloads'], true)
            ? $from
            : 'assigned';

        $sourceCases = match ($from) {
            'in-progress' => self::inProgressCases(),
            'revisions' => self::revisionCases(),
            'submitted' => self::submittedCases(),
            'completed' => self::designerCompletedCases(),
            'downloads' => self::fileDownloadCases(),
            default => self::assignedCases(),
        };

        $case = collect($sourceCases)->firstWhere('id', $caseId)
            ?? collect(self::assignedCases())->firstWhere('id', $caseId);

        if ($case === null) {
            return null;
        }

        $added = $case['assigned_date'];

        return [
            ...$case,
            'material' => 'Zirconia',
            'shade' => 'A2',
            'implant_system' => 'Nobel Biocare',
            'files' => [
                [
                    'name' => 'upper_arch_scan.stl',
                    'meta' => '42.3 MB · Added '.$added,
                    'type' => 'STL',
                    'type_tone' => 'stl',
                ],
                [
                    'name' => 'lower_arch_scan.stl',
                    'meta' => '38.7 MB · Added '.$added,
                    'type' => 'STL',
                    'type_tone' => 'stl',
                ],
                [
                    'name' => 'bite_registration.stl',
                    'meta' => '12.1 MB · Added '.$added,
                    'type' => 'STL',
                    'type_tone' => 'stl',
                ],
                [
                    'name' => 'intraoral_photos.zip',
                    'meta' => '24.6 MB · Added '.$added,
                    'type' => 'ZIP',
                    'type_tone' => 'zip',
                ],
                [
                    'name' => 'xray_panoramic.jpg',
                    'meta' => '3.2 MB · Added '.$added,
                    'type' => 'Photo',
                    'type_tone' => 'photo',
                ],
                [
                    'name' => 'prescription_'.$caseId.'.pdf',
                    'meta' => '0.8 MB · Added '.$added,
                    'type' => 'PDF',
                    'type_tone' => 'pdf',
                ],
            ],
            'timeline' => self::assignedCaseTimeline($case, $from),
            ...self::designerCaseChrome($from, $case),
        ];
    }

    /**
     * @param  array{id: string, assigned_date: string, status: string}  $case
     * @return array{
     *     source: string,
     *     back_url: string,
     *     back_label: string,
     *     can_upload: bool,
     *     files_heading: string,
     *     notes_heading: string,
     *     alert: array{tone: string, title: string, body: string}|null,
     *     header_actions: list<array{label: string, variant: string}>,
     *     workflow: list<array{label: string, icon: string, state: string, tone?: string}>,
     *     uploaded_design_files: list<string>
     * }
     */
    private static function designerCaseChrome(string $from, array $case): array
    {
        $download = ['label' => 'Download All Files', 'icon' => 'case-detail-wf-download.svg', 'state' => 'enabled'];
        $start = ['label' => 'Start Design', 'icon' => 'case-detail-wf-start.svg', 'state' => 'disabled'];
        $progress = ['label' => 'Mark In Progress', 'icon' => 'case-detail-wf-progress.svg', 'state' => 'muted'];
        $submit = ['label' => 'Submit For Review', 'icon' => 'case-detail-wf-submit.svg', 'state' => 'disabled'];

        $mode = $from === 'assigned'
            ? match ($case['status']) {
                'Revision Requested' => 'revisions',
                'Submitted', 'Approved' => 'submitted',
                'Completed' => 'completed',
                default => 'assigned',
            }
        : $from;

        [$backUrl, $backLabel] = match ($from) {
            'in-progress' => [route('designer.in-progress'), 'Back to In Progress'],
            'revisions' => [route('designer.revisions'), 'Back to Revisions'],
            'submitted' => [route('designer.submitted'), 'Back to Submitted'],
            'completed' => [route('designer.completed'), 'Back to Completed'],
            'downloads' => [route('designer.downloads'), 'Back to File Downloads'],
            default => [route('designer.assigned'), 'Back to Cases'],
        };

        $chrome = match ($mode) {
            'downloads' => [
                'can_upload' => true,
                'files_heading' => 'File Download Center',
                'notes_heading' => 'Designer Notes',
                'alert' => null,
                'header_actions' => [],
                'workflow' => [
                    $download,
                    $start,
                    $progress,
                    [...$submit, 'state' => 'enabled', 'tone' => 'accent'],
                ],
                'uploaded_design_files' => $case['id'] === 'APX-2847'
                    ? ['Master_Colors_Saurabh_Saini.pdf']
                    : [],
            ],
            'in-progress' => [
                'can_upload' => true,
                'files_heading' => 'File Download Center',
                'notes_heading' => 'Designer Notes',
                'alert' => $case['status'] === 'Downloaded'
                    ? [
                        'tone' => 'info',
                        'title' => 'Files ready',
                        'body' => 'Scan files are available. Start the design, then submit when the work is complete.',
                    ]
                    : [
                        'tone' => 'info',
                        'title' => 'Design in progress',
                        'body' => 'Upload working files here and submit for review when the design is ready.',
                    ],
                'header_actions' => [],
                'workflow' => [
                    $download,
                    [...$start, 'state' => $case['status'] === 'Downloaded' ? 'enabled' : 'disabled'],
                    [...$progress, 'state' => $case['status'] === 'In Design' ? 'enabled' : 'muted'],
                    [...$submit, 'state' => 'enabled'],
                ],
                'uploaded_design_files' => [],
            ],
            'revisions' => [
                'can_upload' => true,
                'files_heading' => 'Case Files',
                'notes_heading' => 'Revision Notes',
                'alert' => [
                    'tone' => 'warning',
                    'title' => 'Revision requested',
                    'body' => 'The dentist requested a shade and contour adjustment. Review the notes, upload the updated design, then submit the revision.',
                ],
                'header_actions' => [
                    ['label' => 'Accept Revision', 'variant' => 'primary'],
                    ['label' => 'Hold Case', 'variant' => 'danger'],
                ],
                'workflow' => [
                    $download,
                    [...$start, 'state' => 'disabled'],
                    [...$progress, 'state' => 'disabled'],
                    [...$submit, 'label' => 'Submit Revision', 'state' => 'enabled'],
                ],
                'uploaded_design_files' => [],
            ],
            'submitted' => [
                'can_upload' => $case['status'] !== 'Approved',
                'files_heading' => 'Submitted Files',
                'notes_heading' => 'Designer Notes',
                'alert' => $case['status'] === 'Approved'
                    ? [
                        'tone' => 'success',
                        'title' => 'Design approved',
                        'body' => 'The dentist approved this design. Files remain available for download.',
                    ]
                    : [
                        'tone' => 'info',
                        'title' => 'Awaiting review',
                        'body' => 'This design has been submitted. You can download files while the dentist reviews.',
                    ],
                'header_actions' => $case['status'] === 'Approved'
                    ? []
                    : [['label' => 'Withdraw Submission', 'variant' => 'danger']],
                'workflow' => [
                    $download,
                    [...$start, 'state' => 'disabled'],
                    [...$progress, 'state' => 'disabled'],
                    [...$submit, 'state' => 'disabled'],
                ],
                'uploaded_design_files' => [],
            ],
            'completed' => [
                'can_upload' => false,
                'files_heading' => 'Completed Files',
                'notes_heading' => 'Case Notes',
                'alert' => [
                    'tone' => 'success',
                    'title' => 'Case complete',
                    'body' => 'This case is closed. Download the final files below, or resubmit if a follow-up is required.',
                ],
                'header_actions' => [
                    ['label' => 'Resubmit Case', 'variant' => 'accent'],
                ],
                'workflow' => [
                    $download,
                    ['label' => 'Download Submitted', 'icon' => 'case-detail-more-download.svg', 'state' => 'enabled'],
                ],
                'uploaded_design_files' => [],
            ],
            default => [
                'can_upload' => true,
                'files_heading' => 'File Download Center',
                'notes_heading' => 'Designer Notes',
                'alert' => null,
                'header_actions' => [],
                'workflow' => [
                    $download,
                    [...$start, 'state' => $case['status'] === 'Assigned' ? 'enabled' : 'disabled'],
                    $progress,
                    $submit,
                ],
                'uploaded_design_files' => [],
            ],
        };

        return [
            'source' => $from,
            'back_url' => $backUrl,
            'back_label' => $backLabel,
            ...$chrome,
        ];
    }

    /**
     * @param  array{
     *     id: string,
     *     assigned_date: string,
     *     status: string
     * }  $case
     * @return list<array{label: string, date: string|null, complete: bool}>
     */
    private static function assignedCaseTimeline(array $case, string $from = 'assigned'): array
    {
        if ($from === 'assigned' && $case['id'] === 'APX-2847') {
            return [
                ['label' => 'Case Assigned', 'date' => '2026-06-25', 'complete' => true],
                ['label' => 'Files Downloaded', 'date' => null, 'complete' => false],
                ['label' => 'Design Started', 'date' => '2026-06-27', 'complete' => true],
                ['label' => 'Submitted for Review', 'date' => null, 'complete' => false],
                ['label' => 'Approved', 'date' => null, 'complete' => false],
            ];
        }

        $status = $case['status'];
        $filesDownloaded = in_array($status, ['Downloaded', 'In Design', 'Revision Requested', 'Submitted', 'Approved', 'Completed'], true);
        $designStarted = in_array($status, ['In Design', 'Revision Requested', 'Submitted', 'Approved', 'Completed'], true);
        $submitted = in_array($status, ['Submitted', 'Approved', 'Completed'], true);
        $approved = in_array($status, ['Approved', 'Completed'], true);

        $timeline = [
            ['label' => 'Case Assigned', 'date' => $case['assigned_date'], 'complete' => true],
            ['label' => 'Files Downloaded', 'date' => $filesDownloaded ? $case['assigned_date'] : null, 'complete' => $filesDownloaded],
            ['label' => 'Design Started', 'date' => $designStarted ? $case['assigned_date'] : null, 'complete' => $designStarted],
            ['label' => 'Submitted for Review', 'date' => $submitted ? $case['assigned_date'] : null, 'complete' => $submitted],
            ['label' => 'Approved', 'date' => $approved ? $case['assigned_date'] : null, 'complete' => $approved],
        ];

        if ($from === 'revisions') {
            $timeline[] = [
                'label' => 'Revision Requested',
                'date' => $case['assigned_date'],
                'complete' => true,
            ];
        }

        return $timeline;
    }

    /**
     * @return list<array{
     *     id: string,
     *     title: string,
     *     body: string,
     *     time: string,
     *     icon: string,
     *     read: bool
     * }>
     */
    public static function designerNotifications(): array
    {
        return [
            [
                'id' => '1',
                'title' => 'New Case Assigned',
                'body' => 'APX-2861 — Implant Abutment from Dr. Carlos Mendes. Due July 5.',
                'time' => '14 min ago',
                'icon' => 'notif-new-case.svg',
                'read' => false,
            ],
            [
                'id' => '2',
                'title' => 'Revision Requested',
                'body' => 'APX-2856 — Complete Denture. Upper arch reline required.',
                'time' => '1h 22m ago',
                'icon' => 'notif-revision.svg',
                'read' => false,
            ],
            [
                'id' => '3',
                'title' => 'Design Approved',
                'body' => 'APX-2841 — Full Arch Implant approved by Dr. Lena Kovacs.',
                'time' => '3h ago',
                'icon' => 'notif-approved.svg',
                'read' => false,
            ],
            [
                'id' => '4',
                'title' => 'Due Date Alert',
                'body' => 'APX-2856 is due today. Revision is still pending.',
                'time' => '5h ago',
                'icon' => 'notif-due-date.svg',
                'read' => true,
            ],
            [
                'id' => '5',
                'title' => 'Case Completed',
                'body' => 'APX-2835 — Immediate Denture marked complete by manufacturing.',
                'time' => 'Yesterday',
                'icon' => 'notif-completed.svg',
                'read' => true,
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     title: string,
     *     body: string,
     *     time: string,
     *     category: string,
     *     tone: string,
     *     read: bool
     * }>
     */
    public static function manufacturerNotifications(): array
    {
        return [
            [
                'id' => '1',
                'title' => 'New Job Assigned',
                'body' => 'APEX-2026-001: Crown for Dr. Sarah Johnson',
                'time' => 'Jun 25, 2026 9:30 AM',
                'category' => 'new-jobs',
                'tone' => 'info',
                'read' => false,
            ],
            [
                'id' => '2',
                'title' => 'Urgent Deadline Warning',
                'body' => 'APEX-2026-002: Bridge due in 2 days',
                'time' => 'Jun 28, 2026 8:00 AM',
                'category' => 'urgent',
                'tone' => 'urgent',
                'read' => false,
            ],
            [
                'id' => '3',
                'title' => 'QC Reminder',
                'body' => 'APEX-2026-004: Denture awaiting quality check',
                'time' => 'Jun 25, 2026 4:00 PM',
                'category' => 'qc',
                'tone' => 'default',
                'read' => true,
            ],
            [
                'id' => '4',
                'title' => 'Delivery Confirmation',
                'body' => 'APEX-2026-007: Crown delivered successfully',
                'time' => 'Jun 25, 2026 2:00 PM',
                'category' => 'delivery',
                'tone' => 'default',
                'read' => true,
            ],
        ];
    }

    /**
     * @return list<array{
     *     id: string,
     *     title: string,
     *     message: string,
     *     meta: string,
     *     read: bool,
     *     view_url: string
     * }>
     */
    public static function notifications(): array
    {
        return [
            [
                'id' => '1',
                'title' => 'Manufacturing update',
                'message' => 'Case ADX-12493 manufacturing status: Delivered.',
                'meta' => 'Manufacturing Update • Jun 17, 2026, 5:39 PM',
                'read' => false,
                'view_url' => route('cases.manufacturing.show', 'ADX-12493'),
            ],
            [
                'id' => '2',
                'title' => 'Order shipped',
                'message' => 'Case ADX-12493 manufacturing status: Shipped.',
                'meta' => 'Shipping Update • Jun 17, 2026, 5:39 PM',
                'read' => false,
                'view_url' => route('cases.manufacturing.show', 'ADX-12493'),
            ],
            [
                'id' => '3',
                'title' => 'Manufacturing update',
                'message' => 'Case ADX-12493 manufacturing status: Ready To Ship.',
                'meta' => 'Manufacturing Update • Jun 17, 2026, 5:39 PM',
                'read' => false,
                'view_url' => route('cases.manufacturing.show', 'ADX-12493'),
            ],
            [
                'id' => '4',
                'title' => 'Manufacturing update',
                'message' => 'Case ADX-12493 manufacturing status: Quality Check.',
                'meta' => 'Manufacturing Update • Jun 17, 2026, 5:39 PM',
                'read' => false,
                'view_url' => route('cases.manufacturing.show', 'ADX-12493'),
            ],
            [
                'id' => '5',
                'title' => 'Case status updated',
                'message' => 'Case ADX-12494 is now Completed.',
                'meta' => 'Case Update • Jun 17, 2026, 5:11 PM',
                'read' => false,
                'view_url' => route('cases.completed'),
            ],
            [
                'id' => '6',
                'title' => 'Case submitted',
                'message' => 'Case ADX-41109 has been submitted.',
                'meta' => 'Case Update • Jun 17, 2026, 5:04 PM',
                'read' => false,
                'view_url' => route('cases.active'),
            ],
            [
                'id' => '7',
                'title' => 'Invoice paid',
                'message' => 'Invoice for ADX-12491 has been paid.',
                'meta' => 'Billing Update • Jun 17, 2026, 2:44 PM',
                'read' => false,
                'view_url' => route('billing.index'),
            ],
            [
                'id' => '8',
                'title' => 'Design ready for review',
                'message' => 'Case ADX-12491 is ready for your design review.',
                'meta' => 'Approval Request • Jun 17, 2026, 2:43 PM',
                'read' => false,
                'view_url' => route('cases.pending-reviews.show', 'ADX-12491'),
            ],
            [
                'id' => '9',
                'title' => 'Manufacturing update',
                'message' => 'Case ADX-12493 is now in production.',
                'meta' => 'Manufacturing Update • Jun 15, 2026, 2:43 PM',
                'read' => true,
                'view_url' => route('cases.manufacturing.show', 'ADX-12493'),
            ],
            [
                'id' => '10',
                'title' => 'Order shipped',
                'message' => 'Case ADX-12494 has shipped via FedEx.',
                'meta' => 'Shipping Update • Jun 17, 2026, 2:43 PM',
                'read' => false,
                'view_url' => route('cases.manufacturing.show', 'ADX-12494'),
            ],
        ];
    }
}
