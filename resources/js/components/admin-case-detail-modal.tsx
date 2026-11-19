import { AdminModal } from '@/components/admin-modal';
import { cn } from '@/lib/utils';
import { edit as editAdminCase } from '@/routes/admin/cases';
import { download as downloadCaseFiles } from '@/routes/admin/cases/files';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

export const caseWorkflowSteps = [
    'Submitted',
    'Designer Assigned',
    'Design In Progress',
    'Ready For Review',
    'Approved',
    'Manufacturing Assigned',
    'In Production',
    'QC',
    'Ready To Ship',
    'Shipped',
    'Completed',
];

export type CaseDetail = {
    id: string;
    database_id?: number;
    customer: string;
    customer_date: string;
    type: string;
    product: string;
    service_type: string;
    designer: string | null;
    manufacturer: string | null;
    status: string;
    due_date: string;
    priority: string;
    notes: string | null;
    has_downloadable_files?: boolean;
};

interface AdminCaseDetailModalProps {
    caseDetail: CaseDetail | null;
    statusClassName: string;
    onClose: () => void;
}

function personLabel(value: string | null): string {
    if (value === null || value === 'assign') {
        return 'Unassigned';
    }

    return value;
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11.25px] leading-[15px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                {label}
            </p>
            <p className="pt-[1.875px] text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                {value}
            </p>
        </div>
    );
}

export function AdminCaseDetailModal({
    caseDetail,
    statusClassName,
    onClose,
}: AdminCaseDetailModalProps) {
    if (caseDetail === null) {
        return null;
    }

    const currentStep = caseWorkflowSteps.indexOf(caseDetail.status);
    const nextStep =
        currentStep >= 0 ? caseWorkflowSteps[currentStep + 1] : undefined;

    return (
        <AdminModal
            open
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
            title={`${caseDetail.id} — ${caseDetail.customer}`}
            className="sm:max-w-[630px]"
            header={
                <div>
                    <div className="flex items-center gap-[11.25px]">
                        <span className="font-mono text-[13.125px] leading-[18.75px] font-bold text-[#0260bd]">
                            {caseDetail.id}
                        </span>
                        <span
                            className={cn(
                                'rounded-full border px-[8.5px] py-[2.875px] text-[11.25px] leading-[15px]',
                                statusClassName,
                            )}
                        >
                            {caseDetail.status}
                        </span>
                    </div>
                    <p className="pt-[3.75px] text-[15px] leading-[22.5px] font-bold text-[#050315]">
                        {caseDetail.customer}
                    </p>
                </div>
            }
        >
            <div className="p-[22.5px]">
                <div className="grid grid-cols-1 gap-[15px] sm:grid-cols-2">
                    <DetailField label="Product" value={caseDetail.product} />
                    <DetailField
                        label="Service Type"
                        value={caseDetail.service_type}
                    />
                    <DetailField
                        label="Customer Type"
                        value={caseDetail.type}
                    />
                    <DetailField label="Priority" value={caseDetail.priority} />
                    <DetailField
                        label="Created"
                        value={caseDetail.customer_date}
                    />
                    <DetailField label="Due Date" value={caseDetail.due_date} />
                    <DetailField
                        label="Designer"
                        value={personLabel(caseDetail.designer)}
                    />
                    <DetailField
                        label="Manufacturer"
                        value={personLabel(caseDetail.manufacturer)}
                    />
                </div>

                {caseDetail.notes ? (
                    <div className="mt-[22.5px] rounded-[13.375px] border border-[#fee685] bg-[#fffbeb] p-4">
                        <p className="text-[11.25px] leading-[15px] font-semibold text-[#bb4d00]">
                            Notes
                        </p>
                        <p className="pt-[3.75px] text-[13.125px] leading-[18.75px] text-[#973c00]">
                            {caseDetail.notes}
                        </p>
                    </div>
                ) : null}

                <div className="mt-[22.5px]">
                    <p className="text-[11.25px] leading-[15px] font-bold tracking-[1.125px] text-[#99a1af] uppercase">
                        Workflow Progress
                    </p>
                    <div className="mt-[11.25px] flex flex-wrap items-center gap-[3.75px]">
                        {caseWorkflowSteps.map((step, index) => {
                            const isDone =
                                currentStep >= 0 && index < currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div
                                    key={step}
                                    className="flex items-center gap-[3.75px]"
                                >
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-[3.75px] rounded-[9.375px] px-[7.5px] py-[3.75px] text-[11.25px] leading-[15px] font-semibold',
                                            isDone &&
                                                'bg-[#d0fae5] text-[#007a55]',
                                            isCurrent &&
                                                'bg-[#0260bd] text-white',
                                            !isDone &&
                                                !isCurrent &&
                                                'bg-[#f3f4f6] text-[#99a1af]',
                                        )}
                                    >
                                        {isDone ? (
                                            <span className="relative block size-[10px] overflow-hidden">
                                                <img
                                                    src={asset(
                                                        'modal-step-check.svg',
                                                    )}
                                                    alt=""
                                                    className="size-full"
                                                />
                                            </span>
                                        ) : null}
                                        {step}
                                    </span>
                                    {index < caseWorkflowSteps.length - 1 ? (
                                        <span className="relative block size-[12px] shrink-0 overflow-hidden">
                                            <img
                                                src={asset(
                                                    'modal-step-chevron.svg',
                                                )}
                                                alt=""
                                                className="size-full"
                                            />
                                        </span>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-[22.5px]">
                    <p className="text-[11.25px] leading-[15px] font-bold tracking-[1.125px] text-[#99a1af] uppercase">
                        Actions
                    </p>
                    <div className="mt-[11.25px] flex flex-wrap items-center gap-[7.5px]">
                        {caseDetail.database_id ? (
                            <a
                                href={editAdminCase.url(caseDetail.database_id)}
                                className="inline-flex items-center gap-[5.625px] rounded-[9.375px] bg-[#0260bd] px-[11.25px] py-[7.5px] text-[11.25px] leading-[15px] font-semibold text-white"
                            >
                                Load
                            </a>
                        ) : null}

                        {nextStep ? (
                            <button
                                type="button"
                                className="inline-flex items-center gap-[5.625px] rounded-[9.375px] border border-[#e5e7eb] px-[12.25px] py-[8.5px] text-[11.25px] leading-[15px] font-semibold text-[#4a5565]"
                            >
                                <span className="relative block size-[12px] overflow-hidden">
                                    <img
                                        src={asset('modal-advance.svg')}
                                        alt=""
                                        className="size-full"
                                    />
                                </span>
                                Advance to {nextStep}
                            </button>
                        ) : null}

                        <button
                            type="button"
                            className="inline-flex items-center gap-[5.625px] rounded-[9.375px] border border-[#e5e7eb] px-[12.25px] py-[8.5px] text-[11.25px] leading-[15px] font-semibold text-[#4a5565]"
                        >
                            <span className="relative block size-[12px] overflow-hidden">
                                <img
                                    src={asset('modal-notify.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Notify Customer
                        </button>

                        {caseDetail.has_downloadable_files ? (
                            <a
                                href={downloadCaseFiles.url(caseDetail.id)}
                                className="inline-flex items-center gap-[5.625px] rounded-[9.375px] border border-[#e5e7eb] px-[12.25px] py-[8.5px] text-[11.25px] leading-[15px] font-semibold text-[#4a5565]"
                            >
                                <span className="relative block size-[12px] overflow-hidden">
                                    <img
                                        src={asset('modal-download.svg')}
                                        alt=""
                                        className="size-full"
                                    />
                                </span>
                                Download Files
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex cursor-not-allowed items-center gap-[5.625px] rounded-[9.375px] border border-[#e5e7eb] px-[12.25px] py-[8.5px] text-[11.25px] leading-[15px] font-semibold text-[#99a1af]"
                            >
                                <span className="relative block size-[12px] overflow-hidden">
                                    <img
                                        src={asset('modal-download.svg')}
                                        alt=""
                                        className="size-full"
                                    />
                                </span>
                                No Files
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminModal>
    );
}
