import {
    PortalCaseTable,
    type PortalCaseRow,
} from '@/components/portal/case-table';
import { PortalPageShell } from '@/components/portal/page-shell';
import { edit, show } from '@/routes/cases';

type Props = {
    title: string;
    cases: PortalCaseRow[];
};

export default function ActiveCases({ title, cases }: Props) {
    return (
        <PortalPageShell title={title}>
            <PortalCaseTable
                cases={cases}
                actionHrefs={{
                    view: (row) => show.url(row.id),
                    edit: (row) => edit.url(row.databaseId ?? row.id),
                }}
            />
        </PortalPageShell>
    );
}
