import { Head } from '@inertiajs/react';
import { useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

type SettingItem = {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
};

type SettingSection = {
    key: string;
    title: string;
    items: SettingItem[];
};

type PaymentGateway = {
    key: string;
    name: string;
    connected: boolean;
};

type Props = {
    sections: SettingSection[];
    paymentGateways: PaymentGateway[];
};

function ToggleSwitch({
    enabled,
    onToggle,
    label,
}: {
    enabled: boolean;
    onToggle: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={onToggle}
            className={cn(
                'relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors',
                enabled ? 'bg-[#0260bd]' : 'bg-[#e5e7eb]',
            )}
        >
            <span
                className={cn(
                    'inline-block size-[22px] rounded-full bg-white shadow-sm transition-transform',
                    enabled ? 'translate-x-[22px]' : 'translate-x-[2px]',
                )}
            />
        </button>
    );
}

export default function SystemSettings({
    sections: initialSections,
    paymentGateways,
}: Props) {
    const [sections, setSections] = useState(initialSections);

    const toggleSetting = (sectionKey: string, itemKey: string) => {
        setSections((current) =>
            current.map((section) =>
                section.key === sectionKey
                    ? {
                          ...section,
                          items: section.items.map((item) =>
                              item.key === itemKey
                                  ? { ...item, enabled: !item.enabled }
                                  : item,
                          ),
                      }
                    : section,
            ),
        );
    };

    return (
        <AdminLayout>
            <Head title="System Settings" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        System Settings
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        Platform configuration and security
                    </p>
                </div>

                <div className="mt-[22.5px] space-y-[15px]">
                    {sections.map((section) => (
                        <div
                            key={section.key}
                            className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white"
                        >
                            <div className="border-b border-[#e2e8f0] px-5 py-4">
                                <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                                    {section.title}
                                </h2>
                            </div>
                            <ul className="divide-y divide-[#e2e8f0]">
                                {section.items.map((item) => (
                                    <li
                                        key={item.key}
                                        className="flex items-center justify-between gap-4 px-5 py-4"
                                    >
                                        <div>
                                            <p className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 text-[11.25px] leading-[15px] text-[#475569]">
                                                {item.description}
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            enabled={item.enabled}
                                            onToggle={() =>
                                                toggleSetting(
                                                    section.key,
                                                    item.key,
                                                )
                                            }
                                            label={item.label}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                        <div className="border-b border-[#e2e8f0] px-5 py-4">
                            <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                                Payment Gateways
                            </h2>
                        </div>
                        <ul className="divide-y divide-[#e2e8f0]">
                            {paymentGateways.map((gateway) => (
                                <li
                                    key={gateway.key}
                                    className="flex items-center justify-between gap-4 px-5 py-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <p className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                            {gateway.name}
                                        </p>
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-[7.5px] py-[1.5px] text-[11.25px] leading-[15px] font-semibold',
                                                gateway.connected
                                                    ? 'bg-[#dcfce7] text-[#008236]'
                                                    : 'bg-[#f3f4f6] text-[#475569]',
                                            )}
                                        >
                                            {gateway.connected
                                                ? 'Connected'
                                                : 'Not connected'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-[13.125px] font-semibold text-[#0260bd]"
                                    >
                                        Configure
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-[13.375px] border border-[#fecaca] bg-[#fef2f2] p-5">
                        <h2 className="text-[15px] leading-[22.5px] font-bold text-[#e7000b]">
                            Danger Zone
                        </h2>
                        <p className="mt-2 max-w-2xl text-[13.125px] leading-[18.75px] text-[#475569]">
                            Resetting platform data will permanently delete all
                            cases, users, invoices, and configuration. This
                            action cannot be undone.
                        </p>
                        <button
                            type="button"
                            className="mt-4 rounded-[9.375px] bg-[#e7000b] px-4 py-2.5 text-[13.125px] font-semibold text-white"
                        >
                            Reset Platform Data
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
