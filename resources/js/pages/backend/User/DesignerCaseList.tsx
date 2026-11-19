import {
    PortalCaseTable,
    type PortalCaseRow,
} from '@/components/portal/case-table';
import { PortalPageShell } from '@/components/portal/page-shell';

type Props = {
    title: string;
    cases: PortalCaseRow[];
};

export default function DesignerCaseList({ title, cases }: Props) {
    return (
        <PortalPageShell title={title}>
            <PortalCaseTable cases={cases} />
        </PortalPageShell>
    );
}
