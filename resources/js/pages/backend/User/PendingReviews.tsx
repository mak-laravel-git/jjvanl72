import {
    PortalCaseTable,
    type PortalCaseRow,
} from '@/components/portal/case-table';
import { PortalPageShell } from '@/components/portal/page-shell';
import { show } from '@/routes/cases/pending-reviews';

type Props = {
    title: string;
    cases: PortalCaseRow[];
};

export default function PendingReviews({ title, cases }: Props) {
    return (
        <PortalPageShell title={title}>
            <PortalCaseTable
                cases={cases}
                actionHrefs={{
                    view: (row) => show.url(row.id),
                }}
            />
        </PortalPageShell>
    );
}
