import CreateCasePage from './create-case/CreateCase';
import type { AssignedClient, CaseCreateCatalog, CaseDraft } from './create-case/types';

type Props = {
    caseReference: string;
    catalog: CaseCreateCatalog;
    client?: AssignedClient | null;
    clients?: AssignedClient[];
    draftCase?: CaseDraft | null;
    adminMode?: boolean;
};

export default function CreateCase(props: Props) {
    return <CreateCasePage {...props} />;
}
