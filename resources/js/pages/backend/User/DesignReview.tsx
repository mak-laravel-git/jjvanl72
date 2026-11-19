import { Head, Link } from '@inertiajs/react';

import PortalLayout from '@/layouts/portal-layout';
import { portalAsset } from '@/lib/portal-role';
import { pendingReviews } from '@/routes/cases';

type Review = {
    id: string;
    patient: string;
    product: string;
    status: string;
    file_name: string;
    designer_initials: string;
    designer_notes: string;
    revision_history: string;
};

type Props = {
    review: Review;
};

export default function DesignReview({ review }: Props) {
    return (
        <PortalLayout>
            <Head title="Design Review" />

            <div className="p-8 font-inter">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
                    <div className="flex items-start">
                        <Link
                            href={pendingReviews.url()}
                            className="mt-1 shrink-0 transition-opacity hover:opacity-70"
                            aria-label="Back to pending reviews"
                        >
                            <span className="relative block size-5 overflow-hidden">
                                <img
                                    src={portalAsset('review-back.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                        </Link>

                        <div className="flex flex-col gap-1 pl-4">
                            <h1 className="text-2xl leading-[30px] font-semibold tracking-[-0.15px] text-[#050315]">
                                Design Review
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm font-medium tracking-[-0.16px] text-[#475569]">
                                    {review.id}
                                </span>
                                <span className="text-base leading-6 text-[#cbd5e1]">
                                    •
                                </span>
                                <span className="text-sm font-medium tracking-[-0.16px] text-[#475569]">
                                    {review.patient}
                                </span>
                                <span className="text-base leading-6 text-[#cbd5e1]">
                                    •
                                </span>
                                <span className="rounded-md bg-[rgba(2,96,189,0.1)] px-2.5 py-0.5 text-xs font-medium tracking-[-0.12px] text-[#0260bd]">
                                    {review.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-8 xl:flex-row">
                        <section className="flex w-full flex-col gap-6 rounded-xl border border-[#e2e8f0] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] xl:min-w-0 xl:flex-1">
                            <h2 className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#050315]">
                                Design Preview
                            </h2>

                            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#fdfdfd] px-[50px] py-[105px]">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#eff6ff]">
                                    <span className="relative block size-8 overflow-hidden">
                                        <img
                                            src={portalAsset(
                                                'review-preview-eye.svg',
                                            )}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                </div>
                                <p className="text-sm font-semibold tracking-[-0.16px] text-[#475569]">
                                    {review.file_name}
                                </p>
                                <p className="mt-1 text-xs tracking-[-0.12px] text-[#f967a1]">
                                    Interactive 3D preview would load here
                                </p>
                                <div className="mt-8 flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg border border-[#e2e8f0] bg-white px-[25px] py-[13px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f8fafc]"
                                    >
                                        <span className="relative block size-4 overflow-hidden">
                                            <img
                                                src={portalAsset(
                                                    'review-btn-preview.svg',
                                                )}
                                                alt=""
                                                className="size-full"
                                            />
                                        </span>
                                        <span className="pl-2 text-base leading-[22px] font-medium tracking-[-0.18px] text-[#475569]">
                                            Preview
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg border border-[#e2e8f0] bg-white px-[25px] py-[13px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f8fafc]"
                                    >
                                        <span className="relative block size-4 overflow-hidden">
                                            <img
                                                src={portalAsset(
                                                    'review-btn-download.svg',
                                                )}
                                                alt=""
                                                className="size-full"
                                            />
                                        </span>
                                        <span className="pl-2 text-base leading-[22px] font-medium tracking-[-0.18px] text-[#475569]">
                                            Download
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        <aside className="flex w-full flex-col gap-6 xl:w-80 xl:shrink-0">
                            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <h3 className="text-sm font-semibold tracking-[-0.16px] text-[#050315]">
                                    Designer Notes
                                </h3>
                                <div className="flex items-start">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe]">
                                        <span className="text-xs leading-4 font-bold text-[#0056b3]">
                                            {review.designer_initials}
                                        </span>
                                    </div>
                                    <p className="pl-3 text-sm leading-5 tracking-[-0.16px] text-[#475569]">
                                        {review.designer_notes}
                                    </p>
                                </div>
                            </section>

                            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <h3 className="text-sm font-semibold tracking-[-0.16px] text-[#050315]">
                                    Revision History
                                </h3>
                                <p className="text-sm tracking-[-0.16px] text-[#94a3b8]">
                                    {review.revision_history}
                                </p>
                            </section>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#0260bd] py-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#024f9c]"
                                >
                                    <span className="relative block size-4 overflow-hidden">
                                        <img
                                            src={portalAsset(
                                                'review-approve.svg',
                                            )}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                    <span className="pl-2 text-base leading-[22px] font-medium tracking-[-0.18px] text-white">
                                        Approve Design
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white py-[13px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f8fafc]"
                                >
                                    <span className="relative block size-4 overflow-hidden">
                                        <img
                                            src={portalAsset(
                                                'review-revision.svg',
                                            )}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                    <span className="pl-2 text-base leading-[22px] font-medium tracking-[-0.18px] text-[#475569]">
                                        Request Revision
                                    </span>
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
