import { useContext, useMemo } from "react";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { ToastContext } from "../../../../../context/ToastContext/ToastContext";
import { FaBarcode } from "react-icons/fa";

function OperationCard(props) {
    const { t } = useTranslation("documentation");
    const { showToast } = useContext(ToastContext);

    const columns = useMemo(() => {
        const cols = [
            {
                name: t("key"),
                selector: (row) => row.operationKey,
                width: "12rem",
                cell: (row) => <span className='font-monospace'>{row.operationKey}</span>,
            },
            {
                name: t("operation"),
                selector: (row) => row.name,
            },
            {
                name: "Potrditev",
                selector: () => null,
                right: true,
                width: "10rem",
                cell: (row) => {
                    const op = String(row.sequence).padStart(4, "0");
                    const hit = props.confirmations?.find(
                        (c) => String(c.Operation).padStart(4, "0") == op,
                    );

                    return (
                        <div className='d-flex align-items-center justify-content-end gap-2'>
                            <span className='font-monospace'>{hit?.ConfirmationDisplay ?? ""}</span>
                            {hit?.ConfirmationDisplay && (
                                <FaBarcode
                                    title='Prikaži črtno kodo potrditve'
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        props.onShowBarcode?.(hit.ConfirmationDisplay);
                                    }}
                                />
                            )}
                        </div>
                    );
                },
            },
        ];

        if (props.sapOps?.length > 0) {
            const match = (row) =>
                props.sapOps.find(
                    (o) =>
                        String(o.Operation).padStart(4, "0") ===
                        String(row.sequence).padStart(4, "0"),
                );

            cols.push(
                {
                    name: "Za izdelati",
                    selector: () => null,
                    right: true,
                    width: "10rem",
                    cell: (row) => (
                        <span className='font-monospace'>{match(row)?.OperationAmount ?? ""}</span>
                    ),
                },
                {
                    name: "Donos na nalogu",
                    selector: () => null,
                    right: true,
                    width: "12rem",
                    cell: (row) => (
                        <span className='font-monospace'>{match(row)?.ConfirmedYield ?? ""}</span>
                    ),
                },
            );
        }

        return cols;
    }, [t, props.sapOps, props.confirmations]);
    const onRowClicked = (row) => {
        const firstMachine = row.operation_machines?.[0];
        if (!firstMachine) {
            showToast(t("warning"), t("no_documents_available"), "warning");
            return;
        }
        props.clicked(row.operation_machines, firstMachine, null, "operation");
    };

    return (
        <DataTable
            dense
            columns={columns}
            data={Object.values(props.operations)}
            onRowClicked={onRowClicked}
            highlightOnHover
        />
    );
}
export default OperationCard;
