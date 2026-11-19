import {
    PortalCaseTable,
    type PortalCaseRow,
} from '@/components/portal/case-table';
import { PortalPageShell } from '@/components/portal/page-shell';
import { create, edit } from '@/routes/cases';

type Props = {
    title: string;
    cases: PortalCaseRow[];
    showCreateButton?: boolean;
};

export default function DraftCases({ title, cases, showCreateButton }: Props) {
    return (
        <PortalPageShell
            title={title}
            createHref={showCreateButton ? create.url() : undefined}
        >
            <PortalCaseTable
                cases={cases}
                actionHrefs={{
                    edit: (row) => edit.url(row.databaseId ?? row.id),
                }}
            />
        </PortalPageShell>
    );
}
