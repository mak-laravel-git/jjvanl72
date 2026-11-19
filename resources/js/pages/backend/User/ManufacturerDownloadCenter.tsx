import { Head } from '@inertiajs/react';
import { ChevronDown, Download, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';

export type ManufacturerDownloadFile = {
    id: string;
    name: string;
    case_id: string;
    customer: string;
    category: string;
    size: string;
};

type Props = {
    files: ManufacturerDownloadFile[];
};

const categoryOptions = [
    'All Categories',
    'Design',
    'Instructions',
    'Prescription',
    'Reference',
] as const;

export default function ManufacturerDownloadCenter({ files }: Props) {
    const [search, setSearch] = useState('');
    const [category, setCategory] =
        useState<(typeof categoryOptions)[number]>('All Categories');

    const visibleFiles = useMemo(() => {
        const query = search.trim().toLowerCase();

        return files.filter((file) => {
            const matchesCategory =
                category === 'All Categories' || file.category === category;
            const matchesSearch =
                query === '' ||
                file.name.toLowerCase().includes(query) ||
                file.case_id.toLowerCase().includes(query) ||
                file.customer.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [category, files, search]);

    return (
        <PortalLayout>
            <Head title="Download Center" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Download Center
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Access all manufacturing files and documents
                        </p>
                    </div>

                    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-[17px]">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search files or cases..."
                                    className="h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#fdfdfd] py-2.5 pr-4 pl-10 text-base text-[#050315] outline-none placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    aria-label="Filter by category"
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(
                                            event.target
                                                .value as (typeof categoryOptions)[number],
                                        )
                                    }
                                    className="h-[42px] w-full appearance-none rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-sm tracking-[-0.16px] text-[#050315] outline-none focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10"
                                >
                                    {categoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#050315]" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {visibleFiles.map((file) => (
                            <article
                                key={file.id}
                                className="flex flex-col rounded-[10px] border border-[#e2e8f0] bg-white p-[17px]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="rounded-[10px] bg-[#e2e8f0] p-3 text-[#475569]">
                                        <FileText className="size-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm leading-5 font-medium text-[#050315]">
                                            {file.name}
                                        </h3>
                                        <p className="pt-1 text-xs leading-4 text-[#f967a1]">
                                            {file.case_id}
                                        </p>
                                        <p className="text-xs leading-4 text-[#475569]">
                                            {file.customer}
                                        </p>
                                        <div className="flex items-center gap-2 pt-2">
                                            <span className="rounded bg-[#e2e8f0] px-2 py-0.5 text-xs leading-4 text-[#f967a1]">
                                                {file.category}
                                            </span>
                                            <span className="text-xs leading-4 text-[#475569]">
                                                {file.size}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={cn(
                                        'mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0260bd] px-4 py-2 text-sm leading-5 font-medium text-white',
                                        'hover:bg-[#024f9c]',
                                    )}
                                >
                                    <Download className="size-4" />
                                    Download
                                </button>
                            </article>
                        ))}
                    </div>

                    {visibleFiles.length === 0 ? (
                        <div className="rounded-[10px] border border-[#e2e8f0] bg-white px-6 py-12 text-center text-sm text-[#475569]">
                            No files match your search.
                        </div>
                    ) : null}
                </div>
            </div>
        </PortalLayout>
    );
}
