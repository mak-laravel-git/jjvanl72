import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    AdminAssignCaseModal,
    type AssignableUser,
    type AssignmentQueueTarget,
} from '@/components/admin-assign-designer-modal';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type QueueItem = {
    id: string;
    database_id: number;
    customer: string;
    detail: string;
    product?: string;
    priority?: string;
    status?: string;
    needs_designer: boolean;
    needs_manufacturer: boolean;
};

type Designer = {
    name: string;
    initials: string;
    active: number;
    load: number;
    status: string;
};

type Manufacturer = {
    name: string;
    capacity: number;
};

type Project = {
    id: number;
    assignment_id: number | null;
    case_number: string;
    patient: string;
    product: string;
    case_status: string;
    assignment_status: string | null;
};

type RoleUser = {
    id: number;
    name: string;
    initials: string;
    projects: Project[];
};

type RoleSection = {
    name: string;
    assignable: boolean;
    users: RoleUser[];
};

type Props = {
    pendingCount: number;
    roles: RoleSection[];
    designerQueue: QueueItem[];
    designers: Designer[];
    assignableDesigners: AssignableUser[];
    manufacturerQueue: QueueItem[];
    manufacturers: Manufacturer[];
    assignableUsers: AssignableUser[];
};

function loadBarColor(load: number): string {
    if (load >= 85) {
        return 'bg-[#ef4444]';
    }
    if (load >= 70) {
        return 'bg-[#f59e0b]';
    }

    return 'bg-[#22c55e]';
}

function toAssignTarget(item: QueueItem): AssignmentQueueTarget {
    return {
        id: item.database_id,
        case_number: item.id,
        customer: item.customer,
        product: item.product ?? '',
        needs_designer: item.needs_designer,
        needs_manufacturer: item.needs_manufacturer,
    };
}

export default function AssignmentCenter({
    pendingCount,
    roles,
    designerQueue,
    designers,
    manufacturerQueue,
    manufacturers,
    assignableUsers,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions ?? auth.permissions ?? [];
    const canManage = permissions.includes('assignments.manage');
    const [assignTarget, setAssignTarget] =
        useState<AssignmentQueueTarget | null>(null);

    return (
        <AdminLayout>
            <Head title="Assignment Center" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Assignment Center
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        {pendingCount} pending assignments
                    </p>
                </div>

                <div className="mt-[22.5px] grid grid-cols-1 gap-[22px] xl:grid-cols-2">
                    <div className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                        <div className="flex items-center justify-between bg-[#eff6ff] px-[18.75px] py-[15px]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-[37.5px] items-center justify-center rounded-full bg-[#0260bd]">
                                    <span className="relative size-4 overflow-hidden">
                                        <img
                                            src={asset('assign-designer.svg')}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-[18.75px] leading-[28.125px] font-bold text-[#050315]">
                                        Designer Assignments
                                    </h2>
                                    <p className="text-[11.25px] leading-[15px] text-[#6a7282]">
                                        Cases awaiting a designer
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-[26.25px] items-center justify-center rounded-full bg-[#0260bd] text-[13.125px] font-bold text-white">
                                {designerQueue.length}
                            </span>
                        </div>

                        <div className="divide-y divide-[#e2e8f0]">
                            {designerQueue.length === 0 ? (
                                <p className="px-[18.75px] py-8 text-sm text-[#6a7282]">
                                    No cases waiting for a designer.
                                </p>
                            ) : (
                                designerQueue.map((item) => (
                                    <div
                                        key={item.database_id}
                                        className="flex items-start justify-between gap-3 px-[18.75px] py-[15px]"
                                    >
                                        <div>
                                            <div className="flex items-center gap-[7.5px]">
                                                <span className="font-mono text-[11.25px] font-bold text-[#0260bd]">
                                                    {item.id}
                                                </span>
                                                <span className="size-[5.625px] rounded-full bg-[#2b7fff]" />
                                                <span className="text-[11.25px] font-semibold text-[#155dfc]">
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                {item.customer}
                                            </p>
                                            <p className="text-[11.25px] leading-[15px] text-[#99a1af]">
                                                {item.detail}
                                            </p>
                                        </div>
                                        {canManage ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAssignTarget(
                                                        toAssignTarget(item),
                                                    )
                                                }
                                                className="inline-flex shrink-0 items-center gap-[5.625px] rounded-[9.375px] bg-[#0260bd] px-[11.25px] py-[5.625px] text-[11.25px] font-medium text-white"
                                            >
                                                <span className="relative size-3 overflow-hidden">
                                                    <img
                                                        src={asset(
                                                            'assign-wand-blue.svg',
                                                        )}
                                                        alt=""
                                                        className="size-full"
                                                    />
                                                </span>
                                                Assign
                                            </button>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-[#e2e8f0] px-[18.75px] py-[15px]">
                            <p className="mb-3 text-[11.25px] font-bold tracking-[0.5625px] text-[#99a1af] uppercase">
                                Designer Workload
                            </p>
                            <div className="space-y-3">
                                {designers.length === 0 ? (
                                    <p className="text-sm text-[#6a7282]">
                                        No designers available.
                                    </p>
                                ) : (
                                    designers.map((designer) => (
                                        <div
                                            key={designer.name}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="flex size-[26.25px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5]">
                                                <span className="text-[11.25px] font-semibold text-white">
                                                    {designer.initials}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className="text-[13.125px] font-semibold text-[#050315]">
                                                        {designer.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11.25px] text-[#6a7282]">
                                                            {designer.active}{' '}
                                                            active
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'rounded-full px-2 py-0.5 text-[11.25px] font-semibold',
                                                                designer.status ===
                                                                    'Full'
                                                                    ? 'bg-[#fee2e2] text-[#c10007]'
                                                                    : 'bg-[#dcfce7] text-[#008236]',
                                                            )}
                                                        >
                                                            {designer.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full',
                                                            loadBarColor(
                                                                designer.load,
                                                            ),
                                                        )}
                                                        style={{
                                                            width: `${designer.load}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                        <div className="flex items-center justify-between bg-[#fdf2f8] px-[18.75px] py-[15px]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-[37.5px] items-center justify-center rounded-full bg-[#f967a1]">
                                    <span className="relative size-4 overflow-hidden">
                                        <img
                                            src={asset('assign-mfg.svg')}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-[18.75px] leading-[28.125px] font-bold text-[#050315]">
                                        Mfg Assignments
                                    </h2>
                                    <p className="text-[11.25px] leading-[15px] text-[#6a7282]">
                                        Approved cases awaiting manufacturer
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-[26.25px] items-center justify-center rounded-full bg-[#f967a1] text-[13.125px] font-bold text-white">
                                {manufacturerQueue.length}
                            </span>
                        </div>

                        <div className="divide-y divide-[#e2e8f0]">
                            {manufacturerQueue.length === 0 ? (
                                <p className="px-[18.75px] py-8 text-sm text-[#6a7282]">
                                    No cases waiting for a manufacturer.
                                </p>
                            ) : (
                                manufacturerQueue.map((item) => (
                                    <div
                                        key={item.database_id}
                                        className="flex items-start justify-between gap-3 px-[18.75px] py-[15px]"
                                    >
                                        <div>
                                            <div className="flex items-center gap-[7.5px]">
                                                <span className="font-mono text-[11.25px] font-bold text-[#f967a1]">
                                                    {item.id}
                                                </span>
                                                <span className="rounded-full border border-[#b9f8cf] bg-[#f0fdf4] px-[7.5px] py-[1.5px] text-[11.25px] text-[#008236]">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                {item.customer}
                                            </p>
                                            <p className="text-[11.25px] leading-[15px] text-[#99a1af]">
                                                {item.detail}
                                            </p>
                                        </div>
                                        {canManage ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAssignTarget(
                                                        toAssignTarget(item),
                                                    )
                                                }
                                                className="inline-flex shrink-0 items-center gap-[5.625px] rounded-[9.375px] bg-[#f967a1] px-[11.25px] py-[5.625px] text-[11.25px] font-medium text-white"
                                            >
                                                <span className="relative size-3 overflow-hidden">
                                                    <img
                                                        src={asset(
                                                            'assign-wand-pink.svg',
                                                        )}
                                                        alt=""
                                                        className="size-full"
                                                    />
                                                </span>
                                                Assign
                                            </button>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-[#e2e8f0] px-[18.75px] py-[15px]">
                            <p className="mb-3 text-[11.25px] font-bold tracking-[0.5625px] text-[#99a1af] uppercase">
                                Manufacturer Capacity
                            </p>
                            <div className="space-y-3">
                                {manufacturers.length === 0 ? (
                                    <p className="text-sm text-[#6a7282]">
                                        No manufacturers available.
                                    </p>
                                ) : (
                                    manufacturers.map((mfg) => (
                                        <div
                                            key={mfg.name}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="flex size-[26.25px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f967a1] to-[#6ea2d5]">
                                                <span className="relative size-3.5 overflow-hidden">
                                                    <img
                                                        src={asset(
                                                            'assign-factory.svg',
                                                        )}
                                                        alt=""
                                                        className="size-full"
                                                    />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className="text-[13.125px] font-semibold text-[#050315]">
                                                        {mfg.name}
                                                    </span>
                                                    <span className="text-[11.25px] font-semibold text-[#050315]">
                                                        {mfg.capacity}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full',
                                                            loadBarColor(
                                                                mfg.capacity,
                                                            ),
                                                        )}
                                                        style={{
                                                            width: `${mfg.capacity}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-[22.5px]">
                    <h2 className="text-[16px] font-bold text-[#050315]">
                        Roles overview
                    </h2>
                    <p className="mt-1 text-[12px] text-[#6a7282]">
                        All portal roles except Dentist and Admin. Designer and
                        Manufacturer can be assigned cases.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {roles.map((role) => (
                            <section
                                key={role.name}
                                className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white"
                            >
                                <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc] px-[18.75px] py-3">
                                    <div>
                                        <h3 className="text-[15px] font-bold text-[#050315]">
                                            {role.name}
                                        </h3>
                                        <p className="text-[11px] text-[#6a7282]">
                                            {role.users.length} user(s)
                                            {role.assignable
                                                ? ' · assignable'
                                                : ' · created cases'}
                                        </p>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#f1f5f9]">
                                    {role.users.length === 0 ? (
                                        <p className="px-[18.75px] py-6 text-sm text-[#6a7282]">
                                            No users with this role.
                                        </p>
                                    ) : (
                                        role.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="px-[18.75px] py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5] text-[11px] font-semibold text-white">
                                                        {user.initials}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#050315]">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[11px] text-[#6a7282]">
                                                            {
                                                                user.projects
                                                                    .length
                                                            }{' '}
                                                            project(s)
                                                        </p>
                                                    </div>
                                                </div>
                                                {user.projects.length > 0 ? (
                                                    <ul className="mt-2 space-y-1.5">
                                                        {user.projects.map(
                                                            (project) => (
                                                                <li
                                                                    key={`${user.id}-${project.id}-${project.assignment_id ?? 'owned'}`}
                                                                    className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2 text-[11px] text-[#475569]"
                                                                >
                                                                    <span className="font-semibold text-[#050315]">
                                                                        {
                                                                            project.case_number
                                                                        }
                                                                    </span>
                                                                    {' · '}
                                                                    {
                                                                        project.patient
                                                                    }
                                                                    {' · '}
                                                                    {
                                                                        project.product
                                                                    }
                                                                    {' · '}
                                                                    {
                                                                        project.case_status
                                                                    }
                                                                    {project.assignment_status
                                                                        ? ` · ${project.assignment_status}`
                                                                        : ''}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            <AdminAssignCaseModal
                key={assignTarget?.id}
                target={assignTarget}
                users={assignableUsers}
                onClose={() => setAssignTarget(null)}
            />
        </AdminLayout>
    );
}
