import { dashboard } from '@/routes';
import { index as billingIndex } from '@/routes/billing';
import {
    active,
    completed as casesCompleted,
    create,
    drafts,
    manufacturing,
    pendingReviews,
} from '@/routes/cases';
import {
    assigned as designerAssigned,
    completed as designerCompleted,
    downloads as designerDownloads,
    inProgress as designerInProgress,
    notifications as designerNotifications,
    revisions as designerRevisions,
    submitted as designerSubmitted,
} from '@/routes/designer';
import { show as designerAssignedShow } from '@/routes/designer/assigned';
import {
    assigned as manufacturerAssigned,
    completed as manufacturerCompleted,
    downloads as manufacturerDownloads,
    inProduction as manufacturerInProduction,
    notifications as manufacturerNotifications,
    qualityCheck as manufacturerQualityCheck,
    readyToShip as manufacturerReadyToShip,
    shipped as manufacturerShipped,
} from '@/routes/manufacturer';
import { index as notificationsIndex } from '@/routes/notifications';
import { show as twoFactorShow } from '@/routes/two-factor';
import { edit as userProfileEdit } from '@/routes/user-profile';
import type { User } from '@/types';

export const portalRoles = [
    'Dentist',
    'Denturist',
    'Lab',
    'Designer',
    'Manufacturer',
] as const;

export type PortalRole = (typeof portalRoles)[number];

export type PortalNavItem = {
    title: string;
    icon: string;
    href?: string;
    match?: string[];
    permission?: string;
    openInNewTab?: boolean;
};

export type PortalStat = {
    id: string;
    label: string;
    value: string;
    icon: string;
    iconBg: string;
};

export type PortalQuickAction = {
    label: string;
    icon: string;
    href?: string;
    permission?: string;
    openInNewTab?: boolean;
};

export type PortalActivity = {
    title: string;
    caseId: string;
    time: string;
    actor: 'you' | 'partner';
    status: string;
    tone: 'blue' | 'pink';
};

export type PortalRecentCase = {
    id: string;
    clinic: string;
    product: string;
    service: string;
    serviceTone: 'designMfg' | 'mfgOnly' | 'designOnly';
    status: string;
    statusTone:
        | 'readyForReview'
        | 'inProduction'
        | 'designInProgress'
        | 'qualityCheck'
        | 'shipped';
    priority: 'urgent' | 'standard' | 'rush';
    date: string;
};

export type DesignerStat = {
    id: string;
    label: string;
    value: string;
    tone: 'blue' | 'neutral' | 'violet' | 'pink';
};

export type DesignerAction = {
    label: string;
    icon: string;
    href: string;
    variant: 'primary' | 'accent' | 'outline';
    permission?: string;
};

export type DesignerActiveCase = {
    id: string;
    product: string;
    client: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status: string;
    statusTone:
        | 'submitted'
        | 'assigned'
        | 'revision'
        | 'downloaded'
        | 'review'
        | 'completed';
};

export type DesignerFeedItem = {
    id: string;
    text: string;
    time: string;
    tone: 'blue' | 'pink';
};

export type ManufacturerStat = {
    id: string;
    label: string;
    value: string;
    icon: string;
    iconBg: string;
    href: string;
};

export type ManufacturerAction = {
    label: string;
    icon: string;
    iconBg: string;
    href: string;
    permission?: string;
};

export type ManufacturerTimelineItem = {
    id: string;
    title: string;
    caseId: string;
    time: string;
    icon: string;
    iconBg: string;
    accent: 'blue' | 'pink' | 'neutral';
};

export type PortalView = {
    role: PortalRole;
    organization: string;
    partnerName: string;
    layout?: 'submitter' | 'designer' | 'manufacturer';
    subtitle?: string;
    primaryAction?: {
        label: string;
        href?: string;
        permission?: string;
        openInNewTab?: boolean;
    };
    nav: PortalNavItem[];
    stats: PortalStat[];
    designerStats?: DesignerStat[];
    manufacturerStats?: ManufacturerStat[];
    quickActions: PortalQuickAction[];
    designerActions?: DesignerAction[];
    manufacturerActions?: ManufacturerAction[];
    activity: PortalActivity[];
    designerFeed?: DesignerFeedItem[];
    designerActiveCases?: DesignerActiveCase[];
    manufacturerTimeline?: ManufacturerTimelineItem[];
    recentCases?: PortalRecentCase[];
};

export const portalAsset = (name: string) => `/images/portal-dashboard/${name}`;

const twoFactorNavItem: PortalNavItem = {
    title: 'Two-Factor Auth',
    icon: portalAsset('nav-profile-settings.svg'),
    href: twoFactorShow.url(),
    match: ['/settings/two-factor'],
};

export type DesignerCaseSource =
    | 'assigned'
    | 'in-progress'
    | 'revisions'
    | 'submitted'
    | 'completed'
    | 'downloads';

export const designerCaseHref = (
    id: string,
    from: DesignerCaseSource,
): string => designerAssignedShow.url(id, { query: { from } });

type StatDefinition = Omit<PortalStat, 'label'>;

const statDefinitions: Record<string, StatDefinition> = {
    total: {
        id: 'total',
        value: '6',
        icon: portalAsset('stat-total-cases.svg'),
        iconBg: '#eff6ff',
    },
    draft: {
        id: 'draft',
        value: '1',
        icon: portalAsset('stat-draft-cases.svg'),
        iconBg: '#f9fafb',
    },
    submitted: {
        id: 'submitted',
        value: '0',
        icon: portalAsset('stat-submitted-cases.svg'),
        iconBg: '#eff6ff',
    },
    pendingReview: {
        id: 'pendingReview',
        value: '1',
        icon: portalAsset('stat-pending-review.svg'),
        iconBg: '#fff7ed',
    },
    awaitingManufacturing: {
        id: 'awaitingManufacturing',
        value: '0',
        icon: portalAsset('stat-awaiting-manufacturing.svg'),
        iconBg: '#fdf2f8',
    },
    inManufacturing: {
        id: 'inManufacturing',
        value: '1',
        icon: portalAsset('stat-manufacturing-progress.svg'),
        iconBg: '#fdf2f8',
    },
    completed: {
        id: 'completed',
        value: '1',
        icon: portalAsset('stat-completed-cases.svg'),
        iconBg: '#f0fdf4',
    },
    invoices: {
        id: 'invoices',
        value: '2',
        icon: portalAsset('stat-outstanding-invoices.svg'),
        iconBg: '#fef2f2',
    },
};

const buildStats = (labels: Array<[string, string]>): PortalStat[] =>
    labels.map(([id, label]) => ({ ...statDefinitions[id], label }));

const submitterNav: PortalNavItem[] = [
    {
        title: 'Dashboard',
        icon: portalAsset('nav-dashboard.svg'),
        href: dashboard.url(),
        match: ['/dashboard'],
        permission: 'dashboard.view',
    },
    {
        title: 'Create New Case',
        icon: portalAsset('nav-create-case.svg'),
        href: create.url(),
        match: ['/cases/create'],
        permission: 'cases.create',
        openInNewTab: true,
    },
    {
        title: 'Draft Cases',
        icon: portalAsset('nav-draft-cases.svg'),
        href: drafts.url(),
        match: ['/cases/drafts'],
        permission: 'cases.create',
    },
    {
        title: 'Active Cases',
        icon: portalAsset('nav-active-cases.svg'),
        href: active.url(),
        match: ['/cases/active'],
        permission: 'cases.view',
    },
    {
        title: 'Pending Reviews',
        icon: portalAsset('nav-pending-reviews.svg'),
        href: pendingReviews.url(),
        match: ['/cases/pending-reviews'],
        permission: 'cases.view',
    },
    {
        title: 'Manufacturing Orders',
        icon: portalAsset('nav-manufacturing.svg'),
        href: manufacturing.url(),
        match: ['/cases/manufacturing'],
        permission: 'cases.view',
    },
    {
        title: 'Completed Cases',
        icon: portalAsset('nav-completed-cases.svg'),
        href: casesCompleted.url(),
        match: ['/cases/completed'],
        permission: 'cases.view',
    },
    {
        title: 'Billing',
        icon: portalAsset('nav-billing.svg'),
        href: billingIndex.url(),
        match: ['/billing'],
        permission: 'billing.view',
    },
    {
        title: 'Profile Settings',
        icon: portalAsset('nav-profile-settings.svg'),
        href: userProfileEdit.url(),
        match: ['/profile'],
        permission: 'profile.view',
    },
    twoFactorNavItem,
];

const submitterStats = buildStats([
    ['total', 'Total Cases'],
    ['draft', 'Draft Cases'],
    ['submitted', 'Submitted Cases'],
    ['pendingReview', 'Pending Design Review'],
    ['awaitingManufacturing', 'Awaiting Manufacturing'],
    ['inManufacturing', 'Manufacturing In Progress'],
    ['completed', 'Completed Cases'],
    ['invoices', 'Outstanding Invoices'],
]);

const submitterQuickActions: PortalQuickAction[] = [
    {
        label: 'Create New Case',
        icon: portalAsset('action-create-case.svg'),
        href: create.url(),
        permission: 'cases.create',
        openInNewTab: true,
    },
    {
        label: 'Continue Draft',
        icon: portalAsset('nav-draft-cases.svg'),
        href: drafts.url(),
        permission: 'cases.create',
    },
    {
        label: 'Review Pending Designs',
        icon: portalAsset('action-review-designs.svg'),
        href: pendingReviews.url(),
        permission: 'cases.view',
    },
    {
        label: 'Track Manufacturing',
        icon: portalAsset('nav-manufacturing.svg'),
        href: manufacturing.url(),
        permission: 'cases.view',
    },
    {
        label: 'Download Completed Files',
        icon: portalAsset('action-download-files.svg'),
        href: casesCompleted.url(),
        permission: 'cases.view',
    },
    {
        label: 'View Billing',
        icon: portalAsset('action-view-billing.svg'),
        href: billingIndex.url(),
        permission: 'billing.view',
    },
];

const caseActivity: PortalActivity[] = [
    {
        title: 'Submitted — Case submitted by Dr. Smith',
        caseId: 'ADX-12491',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'you',
        status: 'SUBMITTED',
        tone: 'blue',
    },
    {
        title: 'Assigned to Designer — Designer assigned to case',
        caseId: 'ADX-12491',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'partner',
        status: 'ASSIGNED TO DESIGNER',
        tone: 'blue',
    },
    {
        title: 'Design In Progress — Design in progress',
        caseId: 'ADX-12491',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'partner',
        status: 'DESIGN IN PROGRESS',
        tone: 'pink',
    },
    {
        title: 'Ready For Review — Design ready for your review',
        caseId: 'ADX-12491',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'partner',
        status: 'READY FOR REVIEW',
        tone: 'pink',
    },
    {
        title: 'Submitted — Case submitted',
        caseId: 'ADX-12492',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'you',
        status: 'SUBMITTED',
        tone: 'blue',
    },
    {
        title: 'Assigned to Designer — Designer assigned',
        caseId: 'ADX-12492',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'partner',
        status: 'ASSIGNED TO DESIGNER',
        tone: 'blue',
    },
    {
        title: 'Ready For Review — Design ready for review',
        caseId: 'ADX-12492',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'partner',
        status: 'READY FOR REVIEW',
        tone: 'pink',
    },
    {
        title: 'Revision Requested — Revision requested: increase connector height',
        caseId: 'ADX-12492',
        time: 'Jun 17, 2026, 2:43 PM',
        actor: 'you',
        status: 'REVISION REQUESTED',
        tone: 'pink',
    },
];

const submitterView = (organization: string): Omit<PortalView, 'role'> => ({
    organization,
    partnerName: 'ApexDDS',
    primaryAction: {
        label: 'Create New Case',
        href: create.url(),
        permission: 'cases.create',
        openInNewTab: true,
    },
    nav: submitterNav,
    stats: submitterStats,
    quickActions: submitterQuickActions,
    activity: caseActivity,
});

const labRecentCases: PortalRecentCase[] = [
    {
        id: 'APX-2024-0142',
        clinic: 'Riverside Dental Studio',
        product: 'All-On-X · Zirconia',
        service: 'Design + Mfg',
        serviceTone: 'designMfg',
        status: 'Ready For Review',
        statusTone: 'readyForReview',
        priority: 'urgent',
        date: '2026-07-04',
    },
    {
        id: 'APX-2024-0138',
        clinic: 'North Shore Prosthetics',
        product: 'Implant Crown · PFM',
        service: 'Mfg Only',
        serviceTone: 'mfgOnly',
        status: 'In Production',
        statusTone: 'inProduction',
        priority: 'standard',
        date: '2026-07-09',
    },
    {
        id: 'APX-2024-0135',
        clinic: 'Lakefront Dental Lab',
        product: 'Bridge · Full Zirconia',
        service: 'Design Only',
        serviceTone: 'designOnly',
        status: 'Design In Progress',
        statusTone: 'designInProgress',
        priority: 'standard',
        date: '2026-07-14',
    },
    {
        id: 'APX-2024-0129',
        clinic: 'Downtown Dental Group',
        product: 'Nightguard · Hard Acrylic',
        service: 'Design + Mfg',
        serviceTone: 'designMfg',
        status: 'Quality Check',
        statusTone: 'qualityCheck',
        priority: 'rush',
        date: '2026-07-01',
    },
    {
        id: 'APX-2024-0121',
        clinic: 'Premier Oral Lab',
        product: 'Full Denture · PMMA',
        service: 'Design + Mfg',
        serviceTone: 'designMfg',
        status: 'Shipped',
        statusTone: 'shipped',
        priority: 'standard',
        date: '2026-06-27',
    },
];

const portalViews: Record<PortalRole, Omit<PortalView, 'role'>> = {
    Dentist: submitterView('SmileWorks Dental Clinic'),
    Denturist: submitterView('Precision Denture Studio'),
    Lab: {
        ...submitterView('Apex Dental Lab'),
        recentCases: labRecentCases,
    },
    Designer: {
        organization: 'Sunflower Studio',
        partnerName: 'ApexDDS',
        layout: 'designer',
        subtitle: 'Monday, June 29, 2026 — Week 26',
        nav: [
            {
                title: 'Dashboard',
                icon: portalAsset('nav-dashboard.svg'),
                href: dashboard.url(),
                match: ['/dashboard'],
                permission: 'dashboard.view',
            },
            {
                title: 'Assigned Cases',
                icon: portalAsset('nav-active-cases.svg'),
                href: designerAssigned.url(),
                match: ['/designer/assigned'],
                permission: 'assignments.view',
            },
            {
                title: 'In Progress',
                icon: portalAsset('nav-draft-cases.svg'),
                href: designerInProgress.url(),
                match: ['/designer/in-progress'],
                permission: 'designs.view',
            },
            {
                title: 'Revision Requests',
                icon: portalAsset('nav-pending-reviews.svg'),
                href: designerRevisions.url(),
                match: ['/designer/revisions'],
                permission: 'designs.view',
            },
            {
                title: 'Submitted Designs',
                icon: portalAsset('action-review-designs.svg'),
                href: designerSubmitted.url(),
                match: ['/designer/submitted'],
                permission: 'designs.view',
            },
            {
                title: 'Completed Cases',
                icon: portalAsset('nav-completed-cases.svg'),
                href: designerCompleted.url(),
                match: ['/designer/completed'],
                permission: 'designs.view',
            },
            {
                title: 'File Downloads',
                icon: portalAsset('action-download-files.svg'),
                href: designerDownloads.url(),
                match: ['/designer/downloads'],
                permission: 'cases.view',
            },
            {
                title: 'Notifications',
                icon: portalAsset('icon-bell.svg'),
                href: designerNotifications.url(),
                match: ['/designer/notifications'],
                permission: 'notifications.view',
            },
            {
                title: 'Profile Settings',
                icon: portalAsset('nav-profile-settings.svg'),
                href: userProfileEdit.url(),
                match: ['/profile'],
                permission: 'profile.view',
            },
            twoFactorNavItem,
        ],
        stats: [],
        designerStats: [
            { id: 'assigned', label: 'Assigned', value: '2', tone: 'blue' },
            {
                id: 'inProgress',
                label: 'In Progress',
                value: '1',
                tone: 'neutral',
            },
            {
                id: 'pendingSubmit',
                label: 'Pending Submit',
                value: '0',
                tone: 'violet',
            },
            {
                id: 'revisions',
                label: 'Revisions',
                value: '1',
                tone: 'neutral',
            },
            { id: 'approved', label: 'Approved', value: '1', tone: 'neutral' },
            { id: 'completed', label: 'Completed', value: '1', tone: 'pink' },
        ],
        quickActions: [],
        designerActions: [
            {
                label: 'Open Assigned Cases',
                icon: portalAsset('designer-action-assigned.svg'),
                href: designerAssigned.url(),
                variant: 'primary',
                permission: 'assignments.view',
            },
            {
                label: 'Upload Design',
                icon: portalAsset('designer-action-upload.svg'),
                href: designerInProgress.url(),
                variant: 'accent',
                permission: 'designs.view',
            },
            {
                label: 'Review Revisions',
                icon: portalAsset('designer-action-revisions.svg'),
                href: designerRevisions.url(),
                variant: 'outline',
                permission: 'designs.view',
            },
            {
                label: 'View Completed',
                icon: portalAsset('designer-action-completed.svg'),
                href: designerCompleted.url(),
                variant: 'outline',
                permission: 'designs.view',
            },
        ],
        activity: caseActivity,
        designerFeed: [
            {
                id: '1',
                text: 'New case APX-2861 assigned — Implant Abutment',
                time: '14 min ago',
                tone: 'blue',
            },
            {
                id: '2',
                text: 'Revision requested on APX-2856',
                time: 'Yesterday, 09:15',
                tone: 'pink',
            },
            {
                id: '3',
                text: 'Design approved for APX-2841',
                time: 'Yesterday, 16:42',
                tone: 'blue',
            },
            {
                id: '4',
                text: 'Files downloaded for APX-2859',
                time: 'Jun 28, 11:20',
                tone: 'pink',
            },
            {
                id: '5',
                text: 'Case APX-2847 submitted for review',
                time: 'Jun 27, 14:05',
                tone: 'blue',
            },
        ],
        designerActiveCases: [
            {
                id: 'APX-2847',
                product: 'Full Arch Implant',
                client: 'Dr. Michael Torres',
                dueDate: '2026-07-01',
                priority: 'High',
                status: 'Submitted',
                statusTone: 'submitted',
            },
            {
                id: 'APX-2851',
                product: 'Single Crown',
                client: 'Bright Dental Lab',
                dueDate: '2026-07-02',
                priority: 'Medium',
                status: 'Assigned',
                statusTone: 'assigned',
            },
            {
                id: 'APX-2856',
                product: 'Complete Denture',
                client: 'Sandra Walsh CDT',
                dueDate: '2026-06-30',
                priority: 'High',
                status: 'Revision Requested',
                statusTone: 'revision',
            },
            {
                id: 'APX-2859',
                product: '3-Unit Bridge',
                client: 'Dr. Priya Anand',
                dueDate: '2026-07-03',
                priority: 'Low',
                status: 'Downloaded',
                statusTone: 'downloaded',
            },
            {
                id: 'APX-2861',
                product: 'Implant Abutment',
                client: 'Dr. Carlos Mendes',
                dueDate: '2026-07-05',
                priority: 'Medium',
                status: 'Assigned',
                statusTone: 'assigned',
            },
            {
                id: 'APX-2863',
                product: 'Partial Denture',
                client: 'Pacific Dental Lab',
                dueDate: '2026-07-04',
                priority: 'Medium',
                status: 'Submitted',
                statusTone: 'submitted',
            },
            {
                id: 'APX-2864',
                product: 'Dental Crown',
                client: 'Sunny Smiles Lab',
                dueDate: '2026-08-15',
                priority: 'High',
                status: 'In Review',
                statusTone: 'review',
            },
            {
                id: 'APX-2865',
                product: 'Orthodontic Braces',
                client: 'Bright Future Orthodontics',
                dueDate: '2026-09-10',
                priority: 'High',
                status: 'Submitted',
                statusTone: 'submitted',
            },
            {
                id: 'APX-2866',
                product: 'Teeth Whitening Kit',
                client: 'Bright Smile Innovations',
                dueDate: '2026-10-20',
                priority: 'Low',
                status: 'Completed',
                statusTone: 'completed',
            },
        ],
    },
    Manufacturer: {
        organization: 'Texure Factory',
        partnerName: 'ApexDDS',
        layout: 'manufacturer',
        subtitle:
            "Welcome back! Here's an overview of your production workflow.",
        nav: [
            {
                title: 'Dashboard',
                icon: portalAsset('nav-dashboard.svg'),
                href: dashboard.url(),
                match: ['/dashboard'],
                permission: 'dashboard.view',
            },
            {
                title: 'Assigned Jobs',
                icon: portalAsset('nav-active-cases.svg'),
                href: manufacturerAssigned.url(),
                match: ['/manufacturer/assigned'],
                permission: 'manufacturing.view',
            },
            {
                title: 'In Production',
                icon: portalAsset('nav-manufacturing.svg'),
                href: manufacturerInProduction.url(),
                match: ['/manufacturer/in-production'],
                permission: 'manufacturing.view',
            },
            {
                title: 'Quality Check',
                icon: portalAsset('nav-pending-reviews.svg'),
                href: manufacturerQualityCheck.url(),
                match: ['/manufacturer/quality-check'],
                permission: 'manufacturing.view',
            },
            {
                title: 'Ready To Ship',
                icon: portalAsset('action-download-files.svg'),
                href: manufacturerReadyToShip.url(),
                match: ['/manufacturer/ready-to-ship'],
                permission: 'manufacturing.view',
            },
            {
                title: 'Shipped Orders',
                icon: portalAsset('nav-completed-cases.svg'),
                href: manufacturerShipped.url(),
                match: ['/manufacturer/shipped'],
                permission: 'manufacturing.view',
            },
            {
                title: 'Completed Orders',
                icon: portalAsset('stat-completed-cases.svg'),
                href: manufacturerCompleted.url(),
                match: ['/manufacturer/completed'],
                permission: 'manufacturing.view',
            },
            {
                title: 'Download Center',
                icon: portalAsset('action-download-files.svg'),
                href: manufacturerDownloads.url(),
                match: ['/manufacturer/downloads'],
                permission: 'cases.view',
            },
            {
                title: 'Notifications',
                icon: portalAsset('icon-bell.svg'),
                href: manufacturerNotifications.url(),
                match: ['/manufacturer/notifications'],
                permission: 'notifications.view',
            },
            {
                title: 'Profile Settings',
                icon: portalAsset('nav-profile-settings.svg'),
                href: userProfileEdit.url(),
                match: ['/profile'],
                permission: 'profile.view',
            },
            twoFactorNavItem,
        ],
        stats: [],
        manufacturerStats: [
            {
                id: 'assigned',
                label: 'Assigned Jobs',
                value: '1',
                icon: portalAsset('mfg-stat-assigned.svg'),
                iconBg: 'rgba(71,85,105,0.1)',
                href: manufacturerAssigned.url(),
            },
            {
                id: 'pending',
                label: 'Pending Acceptance',
                value: '1',
                icon: portalAsset('mfg-stat-pending.svg'),
                iconBg: 'rgba(2,96,189,0.1)',
                href: manufacturerAssigned.url(),
            },
            {
                id: 'production',
                label: 'In Production',
                value: '1',
                icon: portalAsset('mfg-stat-production.svg'),
                iconBg: 'rgba(2,96,189,0.1)',
                href: manufacturerInProduction.url(),
            },
            {
                id: 'qc',
                label: 'Quality Check',
                value: '1',
                icon: portalAsset('mfg-stat-qc.svg'),
                iconBg: 'rgba(249,103,161,0.1)',
                href: manufacturerQualityCheck.url(),
            },
            {
                id: 'ship',
                label: 'Ready To Ship',
                value: '1',
                icon: portalAsset('mfg-stat-ship.svg'),
                iconBg: 'rgba(5,3,21,0.1)',
                href: manufacturerReadyToShip.url(),
            },
            {
                id: 'completed',
                label: 'Completed Orders',
                value: '1',
                icon: portalAsset('mfg-stat-completed.svg'),
                iconBg: 'rgba(110,162,213,0.1)',
                href: manufacturerCompleted.url(),
            },
        ],
        quickActions: [],
        manufacturerActions: [
            {
                label: 'Accept New Jobs',
                icon: portalAsset('mfg-action-accept.svg'),
                iconBg: 'rgba(2,96,189,0.13)',
                href: manufacturerAssigned.url(),
                permission: 'manufacturing.view',
            },
            {
                label: 'Start Production',
                icon: portalAsset('mfg-action-start.svg'),
                iconBg: 'rgba(110,162,213,0.13)',
                href: manufacturerInProduction.url(),
                permission: 'manufacturing.view',
            },
            {
                label: 'Move To QC',
                icon: portalAsset('mfg-action-qc.svg'),
                iconBg: 'rgba(249,103,161,0.13)',
                href: manufacturerQualityCheck.url(),
                permission: 'manufacturing.view',
            },
            {
                label: 'Create Shipment',
                icon: portalAsset('mfg-action-ship.svg'),
                iconBg: 'rgba(34,197,94,0.13)',
                href: manufacturerReadyToShip.url(),
                permission: 'manufacturing.view',
            },
            {
                label: 'View Completed',
                icon: portalAsset('mfg-action-completed.svg'),
                iconBg: 'rgba(5,3,21,0.13)',
                href: manufacturerCompleted.url(),
                permission: 'manufacturing.view',
            },
        ],
        activity: caseActivity,
        manufacturerTimeline: [
            {
                id: '1',
                title: 'New job assigned: Crown for Dr. Sarah Johnson',
                caseId: 'APEX-2026-001',
                time: 'Jun 25, 2026 9:30 AM',
                icon: portalAsset('mfg-timeline-check.svg'),
                iconBg: 'rgba(110,162,213,0.13)',
                accent: 'blue',
            },
            {
                id: '2',
                title: 'Job accepted: Bridge for Elite Dental Lab',
                caseId: 'APEX-2026-002',
                time: 'Jun 24, 2026 2:30 PM',
                icon: portalAsset('mfg-action-accept.svg'),
                iconBg: 'rgba(2,96,189,0.13)',
                accent: 'blue',
            },
            {
                id: '3',
                title: 'Production started: Implant for Dr. Michael Chen',
                caseId: 'APEX-2026-003',
                time: 'Jun 23, 2026 10:00 AM',
                icon: portalAsset('mfg-timeline-production.svg'),
                iconBg: 'rgba(249,103,161,0.13)',
                accent: 'pink',
            },
            {
                id: '4',
                title: 'Moved to Quality Check: Denture for Perfect Smile Dentures',
                caseId: 'APEX-2026-004',
                time: 'Jun 25, 2026 4:00 PM',
                icon: portalAsset('mfg-timeline-gear.svg'),
                iconBg: 'rgba(249,103,161,0.1)',
                accent: 'pink',
            },
            {
                id: '5',
                title: 'Shipped: Nightguard for Dr. James Wilson',
                caseId: 'APEX-2026-006',
                time: 'Jun 25, 2026 3:00 PM',
                icon: portalAsset('mfg-timeline-qc.svg'),
                iconBg: 'rgba(2,96,189,0.1)',
                accent: 'blue',
            },
            {
                id: '6',
                title: 'Order completed: Crown for Precision Dental Lab',
                caseId: 'APEX-2026-007',
                time: 'Jun 25, 2026 2:00 PM',
                icon: portalAsset('mfg-action-completed.svg'),
                iconBg: 'rgba(5,3,21,0.13)',
                accent: 'neutral',
            },
        ],
    },
};

export function getPortalRole(user: User | null): PortalRole {
    const roles = user?.roles ?? [];

    return portalRoles.find((role) => roles.includes(role)) ?? portalRoles[0];
}

export function getPortalView(user: User | null): PortalView {
    const role = getPortalRole(user);

    return { role, ...portalViews[role] };
}

export function getNotificationHref(user: User | null): string | null {
    const permissions = user?.permissions ?? [];

    if (!permissions.includes('notifications.view')) {
        return null;
    }

    const role = getPortalRole(user);

    if (role === 'Designer') {
        return designerNotifications.url();
    }

    if (role === 'Manufacturer') {
        return manufacturerNotifications.url();
    }

    return notificationsIndex.url();
}

export function activityMeta(
    item: PortalActivity,
    partnerName: string,
): string {
    const actor = item.actor === 'you' ? 'You' : partnerName;

    return `Case ${item.caseId} • ${item.time} • ${actor}`;
}
