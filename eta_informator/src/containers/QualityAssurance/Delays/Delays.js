import React, { useMemo, useEffect, useState, useContext } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useQueryClient } from "react-query";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from "react-bootstrap/Modal";

import { qualityClient } from "../../../feathers/feathers";
import { useApprovers, useMachinesAll } from "../../../data/ReactQuery";
import { AuthContext } from "../../../context/AuthContext/AuthContext";

const getDelayId = (row) => row?.id ?? row?.ID ?? row?.delayId ?? row?.delayID ?? row?.Id ?? null;

const Delays = ({ selectedSubunit }) => {
    const history = useHistory();
    const { url } = useRouteMatch();
    const { t } = useTranslation(["labels", "shopfloor"]);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const machinesAll = useMachinesAll();
    const approvers = useApprovers();
    const unitsLabels = queryClient.getQueryData("unitsLabels") ?? [];

    const formatDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
    };

    const departmentMap = useMemo(() => {
        const map = new Map();
        (unitsLabels ?? []).forEach((unit) => {
            if (unit?.subunitId != null) map.set(String(unit.subunitId), unit.label);
            if (unit?.subunitID != null) map.set(String(unit.subunitID), unit.label);
            if (unit?.id != null) map.set(String(unit.id), unit.label);
            if (unit?.value != null) map.set(String(unit.value), unit.label);
        });
        return map;
    }, [unitsLabels]);

    const resolveDepartmentLabel = (row) => {
        if (selectedSubunit?.label || selectedSubunit?.name) {
            return selectedSubunit?.label ?? selectedSubunit?.name;
        }
        const rawId = row?.subunitID ?? row?.subunitId ?? row?.department ?? "";
        const resolved = departmentMap.get(String(rawId));
        if (resolved) return resolved;
        return rawId ?? "";
    };

    const machineMap = useMemo(() => {
        const map = new Map();
        (machinesAll?.data ?? []).forEach((machine) => {
            const label =
                machine?.idAlt && machine?.nameShort
                    ? `${machine.idAlt} - ${machine.nameShort}`
                    : machine?.idAlt || machine?.name || String(machine?.id ?? "");

            if (machine?.id != null) map.set(String(machine.id), label);
            if (machine?.idAlt != null) map.set(String(machine.idAlt), label);
        });
        return map;
    }, [machinesAll?.data]);

    const approverMap = useMemo(() => {
        const map = new Map();
        (approvers?.data ?? []).forEach((approver) => {
            if (approver?.id != null) map.set(String(approver.id), approver.name);
            if (approver?.value != null)
                map.set(String(approver.value), approver.label ?? approver.name);
        });
        return map;
    }, [approvers?.data]);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [deletingDelayId, setDeletingDelayId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rowPendingDelete, setRowPendingDelete] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const selectedSubunitId = selectedSubunit?.subunitId ?? selectedSubunit?.value ?? null;
    const isAdmin = state?.user?.role?.role === "admin";

    useEffect(() => {
        if (!selectedSubunitId) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        qualityClient
            .service("delays")
            .find({
                query: {
                    subunitID: Number(selectedSubunitId),
                    $limit: 500,
                },
            })
            .then((res) => {
                setData((res.data || res).map((row) => ({ ...row, __delayId: getDelayId(row) })));
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, [selectedSubunitId]);

    const openDeleteModal = (row) => {
        if (!isAdmin) return;

        const delayId = row?.__delayId;
        if (!delayId || deletingDelayId === delayId) return;

        setRowPendingDelete(row);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deletingDelayId) return;
        setShowDeleteModal(false);
        setRowPendingDelete(null);
    };

    const confirmDeleteDelay = async () => {
        if (!isAdmin) return;

        const delayId = rowPendingDelete?.__delayId;
        if (!delayId || deletingDelayId === delayId) return;

        setDeletingDelayId(delayId);
        setError(null);

        try {
            await qualityClient.service("delays").remove(delayId);
            setData((prev) => prev.filter((item) => item.__delayId !== delayId));
            setHoveredRowId((prev) => (prev === delayId ? null : prev));
            setShowDeleteModal(false);
            setRowPendingDelete(null);
        } catch (err) {
            setError(err);
        } finally {
            setDeletingDelayId(null);
        }
    };

    const openDetailsModal = (row) => {
        if (!row) return;
        setSelectedRow(row);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRow(null);
    };

    const detailRows = useMemo(() => {
        if (!selectedRow) return [];

        return [
            {
                label: t("labels:date"),
                value: formatDate(selectedRow.date),
            },
            {
                label: t("labels:shift"),
                value: selectedRow.shift ?? "",
            },
            {
                label: t("labels:subunit"),
                value: resolveDepartmentLabel(selectedRow),
            },
            {
                label: t("labels:machine"),
                value:
                    machineMap.get(String(selectedRow.machine_name ?? selectedRow.machine ?? "")) ??
                    selectedRow.machine_name ??
                    selectedRow.machine ??
                    "",
            },
            {
                label: t("labels:delay_description"),
                value: selectedRow.delay_type ?? selectedRow.type ?? "",
            },
            {
                label: t("labels:duration_minutes"),
                value: selectedRow.duration ?? "",
            },
            {
                label: t("labels:approver"),
                value:
                    approverMap.get(String(selectedRow.approverID ?? selectedRow.approver ?? "")) ??
                    selectedRow.approver ??
                    selectedRow.approverID ??
                    "",
            },
        ];
    }, [selectedRow, t, departmentMap, machineMap, approverMap]);

    const tableHoverStyles = useMemo(
        () => ({
            rows: {
                style: {
                    transition: "background-color 0.2s ease",
                },
                highlightOnHoverStyle: {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    boxShadow: "inset 0 1px 0 rgba(0, 0, 0, 0.08)",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                },
            },
        }),
        [],
    );

    const columns = useMemo(
        () => [
            {
                name: t("labels:date"),
                selector: (row) => row.date,
                cell: (row) => formatDate(row.date),
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:shift"),
                selector: (row) => row.shift,
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:subunit"),
                selector: (row) => resolveDepartmentLabel(row),
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:machine"),
                selector: (row) =>
                    machineMap.get(String(row.machine_name ?? row.machine ?? "")) ??
                    row.machine_name ??
                    row.machine ??
                    "",
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:delay_description"),
                selector: (row) => row.delay_type ?? row.type ?? "",
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:duration_minutes"),
                selector: (row) => row.duration,
                wrap: true,
                sortable: true,
            },
            {
                name: t("labels:approver"),
                selector: (row) =>
                    approverMap.get(String(row.approverID ?? row.approver ?? "")) ??
                    row.approver ??
                    row.approverID ??
                    "",
                wrap: true,
                sortable: true,
            },
            {
                name: "",
                width: "90px",
                omit: !isAdmin,
                allowOverflow: true,
                button: true,
                cell: (row) => {
                    const isHovered = hoveredRowId === row.__delayId;

                    return (
                        <div
                            className='d-flex align-items-center gap-2'
                            style={{
                                opacity: isHovered ? 1 : 0,
                                pointerEvents: isHovered ? "auto" : "none",
                                transition: "opacity 0.15s ease",
                            }}
                        >
                            <button
                                type='button'
                                aria-label={t("labels:edit")}
                                className='btn btn-link p-0'
                                disabled={!row.__delayId}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (!row.__delayId) return;
                                    history.push(`${url}/delay-input?editId=${row.__delayId}`, {
                                        mode: "edit",
                                        delay: row,
                                    });
                                }}
                            >
                                <FontAwesomeIcon icon='pencil-alt' />
                            </button>

                            <button
                                type='button'
                                aria-label={t("labels:delete")}
                                data-delete-delay='true'
                                className='btn btn-link p-0'
                                disabled={!row.__delayId || deletingDelayId === row.__delayId}
                                style={{ color: "var(--bs-danger)" }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteModal(row);
                                }}
                            >
                                <FontAwesomeIcon icon='trash-alt' />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [
            t,
            departmentMap,
            machineMap,
            approverMap,
            isAdmin,
            hoveredRowId,
            deletingDelayId,
            openDeleteModal,
            history,
            url,
        ],
    );

    return (
        <div className='delays-page'>
            <Modal centered size='lg' show={showDetailsModal} onHide={closeDetailsModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t("labels:details", { defaultValue: "Podrobnosti" })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='table-responsive'>
                        <table className='table table-sm mb-0'>
                            <thead>
                                <tr>
                                    <th style={{ width: "30%" }}>
                                        {t("labels:field", { defaultValue: "Polje" })}
                                    </th>
                                    <th>{t("labels:value", { defaultValue: "Vrednost" })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailRows.map((row) => (
                                    <tr key={row.label}>
                                        <th style={{ width: "30%" }}>{row.label}</th>
                                        <td>{row.value || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal centered show={showDeleteModal} onHide={closeDeleteModal}>
                <Modal.Body
                    style={{
                        fontSize: "1.1rem",
                        textAlign: "center",
                        padding: "2rem 1.5rem",
                    }}
                >
                    <FontAwesomeIcon
                        icon='trash-alt'
                        color='var(--bs-danger)'
                        size='3x'
                        style={{ marginBottom: 12 }}
                    />
                    <div className='mb-3'>{t("labels:confirm_delete")}</div>
                    <div className='d-flex justify-content-center gap-2'>
                        <button
                            type='button'
                            className='btn btn-outline-secondary'
                            disabled={Boolean(deletingDelayId)}
                            onClick={closeDeleteModal}
                        >
                            {t("labels:cancel", { defaultValue: "Prekli�i" })}
                        </button>
                        <button
                            type='button'
                            className='btn btn-danger'
                            disabled={Boolean(deletingDelayId)}
                            onClick={confirmDeleteDelay}
                        >
                            {t("labels:confirm", { defaultValue: "Potrdi" })}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            <div className='d-flex justify-content-end mb-3'>
                <button
                    type='button'
                    className='btn btn-primary'
                    onClick={() => history.push(`${url}/delay-input`)}
                >
                    {t("labels:delay-input")}
                </button>
            </div>
            {loading ? (
                <div>{t("labels:loading")}</div>
            ) : error ? (
                <div style={{ color: "red" }}>{t("labels:error_loading_data")}</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    pagination
                    dense
                    highlightOnHover
                    pointerOnHover
                    customStyles={tableHoverStyles}
                    onRowClicked={openDetailsModal}
                    onRowMouseEnter={(row) => setHoveredRowId(row.__delayId)}
                    onRowMouseLeave={() => setHoveredRowId(null)}
                />
            )}
        </div>
    );
};

export default Delays;
