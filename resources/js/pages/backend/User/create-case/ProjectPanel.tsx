import { IconBack, IconCalendar, IconExpand, IconInfo, IconNote } from './icons';
import { FloatingField, FloatingInput } from './Field';
import { currentDateText } from './helpers';
import type { AssignedClient } from './types';

type ProjectPanelProps = {
    clients: AssignedClient[];
    clientId?: number | null;
    patientName: string;
    dueDate: string;
    description: string;
    itemCount: number;
    caseId: string;
    onBack: () => void;
    onClientChange: (client: AssignedClient | null) => void;
    onChange: (
        field: 'patientName' | 'dueDate' | 'description',
        value: string,
    ) => void;
};

function projectHelpText(
    patientName: string,
    dueDate: string,
    itemCount: number,
    caseId: string,
): string {
    if (!patientName.trim() || !dueDate) {
        return 'Step 1: Enter the patient name and due date.';
    }

    if (!itemCount) {
        return 'Step 2: Click a tooth in the dental chart to create a prescription.';
    }

    if (!caseId) {
        return 'Step 3: Review the prescription and click Save to proceed.';
    }

    return 'Case saved. Upload digital files, review the order and submit.';
}

export default function ProjectPanel({
    clients,
    clientId,
    patientName,
    dueDate,
    description,
    itemCount,
    caseId,
    onBack,
    onClientChange,
    onChange,
}: ProjectPanelProps) {
    return (
        <>
            <div className="flow-help">
                <button
                    type="button"
                    className="flow-help-back"
                    title="Back to dashboard"
                    aria-label="Back to dashboard"
                    onClick={onBack}
                >
                    <IconBack />
                </button>
                <IconInfo />
                <span>{projectHelpText(patientName, dueDate, itemCount, caseId)}</span>
            </div>

            <section className="panel-card">
                <div className="project-date-row">
                    <IconCalendar />
                    <span>{currentDateText()}</span>
                    <span className="due-label">Due</span>
                </div>
                <div className="project-form">
                    <div className="project-form-full" style={{ marginBottom: 22 }}>
                        <FloatingField
                            label={
                                <>
                                    Client <span className="required">*</span>
                                </>
                            }
                        >
                            <select
                                value={clientId ?? ''}
                                onChange={(event) => {
                                    const selectedId = Number(event.target.value);
                                    const selected =
                                        clients.find(
                                            (option) => option.id === selectedId,
                                        ) ?? null;

                                    onClientChange(selected);
                                }}
                            >
                                <option value="">Select client</option>
                                {clients.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                        {option.code ? ` (${option.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </FloatingField>
                    </div>
                    <div className="project-form-grid">
                        <FloatingInput
                            label={
                                <>
                                    Patient Name <span className="required">*</span>
                                </>
                            }
                            value={patientName}
                            placeholder="Required"
                            onChange={(event) =>
                                onChange('patientName', event.target.value)
                            }
                        />
                        <FloatingInput
                            label={
                                <>
                                    Due Date <span className="required">*</span>
                                </>
                            }
                            type="date"
                            value={dueDate}
                            onChange={(event) => onChange('dueDate', event.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className="panel-card">
                <div className="notes-head">
                    <IconNote /> Description{' '}
                    <span className="expand-icon">
                        <IconExpand />
                    </span>
                </div>
                <div className="notes-body">
                    <textarea
                        placeholder="Type description here..."
                        value={description}
                        onChange={(event) =>
                            onChange('description', event.target.value)
                        }
                    />
                </div>
            </section>
        </>
    );
}
