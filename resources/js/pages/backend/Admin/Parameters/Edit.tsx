import { Form, Head, Link } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';
import { index, update } from '@/routes/admin/parameters';

import {
    ParameterFormFields,
    type GroupOption,
    type MaterialOption,
    type ParameterRow,
    type ProductOption,
    type TypeOption,
} from './FormFields';

type Props = {
    parameter: ParameterRow;
    groupOptions: GroupOption[];
    productOptions: ProductOption[];
    materialOptions: MaterialOption[];
    typeOptions: TypeOption[];
};

export default function ParametersEdit({
    parameter,
    groupOptions,
    productOptions,
    materialOptions,
    typeOptions,
}: Props) {
    return (
        <AdminLayout>
            <Head title={`Edit ${parameter.name}`} />

            <div className="p-6">
                <Form
                    {...update.form(parameter.id)}
                    encType="multipart/form-data"
                    className="w-full space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <Link
                                        href={index.url()}
                                        className="text-[13.125px] font-medium text-[#0260bd]"
                                    >
                                        ← Back to parameters
                                    </Link>
                                    <h1 className="mt-2 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                                        Edit parameter
                                    </h1>
                                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                                        Update {parameter.type_label} parameter
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href={index.url()}
                                        className="rounded-[9.375px] border border-[#e5e7eb] px-4 py-2 text-[13.125px] font-medium text-[#050315]"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
                                <ParameterFormFields
                                    errors={errors}
                                    defaults={parameter}
                                    groupOptions={groupOptions}
                                    productOptions={productOptions}
                                    materialOptions={materialOptions}
                                    typeOptions={typeOptions}
                                    footer={null}
                                />
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AdminLayout>
    );
}
