import { Head } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type Stat = { label: string; count: number; tone: string };
type Order = {
    id: string;
    customer: string;
    product: string;
    manufacturer: string;
    status: string;
    status_tone: string;
    due_date: string;
    can_advance: boolean;
};

type Props = {
    activeCount: number;
    stats: Stat[];
    orders: Order[];
};

const statTone: Record<string, string> = {
    blue: 'border-[#bfdbfe] bg-[#eff6ff]',
    sky: 'border-[#bae6fd] bg-[#f0f9ff]',
    purple: 'border-[#ddd6ff] bg-[#f5f3ff]',
    orange: 'border-[#fed7aa] bg-[#fff7ed]',
    green: 'border-[#a7f3d0] bg-[#ecfdf5]',
};

const statusTone: Record<string, string> = {
    blue: 'border-[#b8e6fe] bg-[#f0f9ff] text-[#0069a8]',
    purple: 'border-[#ddd6ff] bg-[#f5f3ff] text-[#7008e7]',
    teal: 'border-[#96f7e4] bg-[#f0fdfa] text-[#475569]',
    green: 'border-[#a4f4cf] bg-[#ecfdf5] text-[#007a55]',
};

export default function ManufacturingOrders({
    activeCount,
    stats,
    orders,
}: Props) {
    return (
        <AdminLayout>
            <Head title="Manufacturing Orders" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Manufacturing Orders
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        {activeCount} active manufacturing orders
                    </p>
                </div>

                <div className="mt-[22.5px] grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className={cn(
                                'rounded-[13.375px] border px-4 py-3',
                                statTone[stat.tone],
                            )}
                        >
                            <p className="text-[11.25px] font-semibold tracking-[0.5px] text-[#6a7282] uppercase">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-[22.5px] font-bold text-[#050315]">
                                {stat.count}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px]">
                                        Case ID
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Customer
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Product
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Manufacturer
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Status
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Due Date
                                    </th>
                                    <th className="px-[19px] py-[11px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        className={cn(
                                            'border-[#e2e8f0]',
                                            index < orders.length - 1 &&
                                                'border-b',
                                        )}
                                    >
                                        <td className="px-[19px] py-4 font-mono text-[11.25px] font-bold text-[#0260bd]">
                                            {order.id}
                                        </td>
                                        <td className="px-[19px] py-4 text-[13.125px] font-semibold text-[#050315]">
                                            {order.customer}
                                        </td>
                                        <td className="px-[19px] py-4 text-[13.125px] text-[#475569]">
                                            {order.product}
                                        </td>
                                        <td className="px-[19px] py-4 text-[13.125px] text-[#475569]">
                                            {order.manufacturer}
                                        </td>
                                        <td className="px-[19px] py-4">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full border px-[7.5px] py-[1.5px] text-[11.25px]',
                                                    statusTone[
                                                        order.status_tone
                                                    ],
                                                )}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-[19px] py-4 text-[11.25px] text-[#475569]">
                                            {order.due_date}
                                        </td>
                                        <td className="px-[19px] py-4">
                                            <div className="flex items-center gap-2">
                                                {order.can_advance ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1.5 rounded-[9.375px] bg-[#0260bd] px-3 py-1.5 text-[11.25px] font-medium text-white"
                                                    >
                                                        <span className="relative size-[11px] overflow-hidden">
                                                            <img
                                                                src={asset(
                                                                    'mfg-advance.svg',
                                                                )}
                                                                alt=""
                                                                className="size-full"
                                                            />
                                                        </span>
                                                        Advance
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 rounded-[9.375px] border border-[#e2e8f0] px-3 py-1.5 text-[11.25px] font-medium text-[#475569]"
                                                >
                                                    <span className="relative size-[11px] overflow-hidden">
                                                        <img
                                                            src={asset(
                                                                'mfg-track.svg',
                                                            )}
                                                            alt=""
                                                            className="size-full"
                                                        />
                                                    </span>
                                                    Track
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
