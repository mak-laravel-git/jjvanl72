import { Head } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type Review = {
    id: string;
    status: string;
    customer: string;
    product: string;
    designer: string;
    due_date: string;
};

type Props = {
    pendingCount: number;
    reviews: Review[];
};

export default function DesignReviews({ pendingCount, reviews }: Props) {
    return (
        <AdminLayout>
            <Head title="Design Reviews" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Design Reviews
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        {pendingCount} cases pending review or revision
                    </p>
                </div>

                <div className="mt-[22.5px] grid grid-cols-1 gap-[15px] md:grid-cols-2">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5 shadow-sm"
                        >
                            <span className="inline-flex rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-[11.25px] font-semibold text-[#c2410c]">
                                {review.status}
                            </span>

                            <h2 className="mt-3 text-[18.75px] leading-[28px] font-bold text-[#050315]">
                                {review.customer}
                            </h2>

                            <p className="mt-1 text-[11.25px] leading-[15px] text-[#6a7282]">
                                <span className="font-mono">{review.id}</span>
                                {' · '}
                                {review.product}
                                {' · Designer: '}
                                <span className="font-semibold text-[#050315]">
                                    {review.designer}
                                </span>
                            </p>

                            <p className="mt-1 text-[11.25px] leading-[15px] text-[#99a1af]">
                                Due: {review.due_date}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[9.375px] bg-[#0260bd] px-3 py-2 text-[11.25px] font-semibold text-white"
                                >
                                    <span className="relative size-3.5 overflow-hidden">
                                        <img
                                            src={asset('review-approve.svg')}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                    Approve Design
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[9.375px] bg-[#f967a1] px-3 py-2 text-[11.25px] font-semibold text-white"
                                >
                                    <span className="relative size-3.5 overflow-hidden">
                                        <img
                                            src={asset('review-revision.svg')}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                    Request Revision
                                </button>
                                <button
                                    type="button"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-[9.375px] bg-[#f3f4f6]"
                                    aria-label="Send"
                                >
                                    <span className="relative size-3.5 overflow-hidden">
                                        <img
                                            src={asset('review-send.svg')}
                                            alt=""
                                            className="size-full"
                                        />
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
