import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { FaRegFileAlt, FaClipboardList, FaRegCopy, FaBarcode } from "react-icons/fa";
import { translateUnit } from "../../../../../utils/utils";
import { useContext } from "react";
import { ToastContext } from "../../../../../context/ToastContext/ToastContext";

function PartsCard(props) {
    const { t } = useTranslation("documentation");
    const onRowClicked = (row) => {
        props.clicked(null, null, row.egoCode, "material");
    };

    const { showToast } = useContext(ToastContext);

    const copyText = async (text) => {
        try {
            if (window.isSecureContext && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("readonly", "");
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            showToast("Info", `${text} copied`, "info");
        } catch (err) {
            showToast("Error", "Copy failed", "danger");
        }
    };

    const columns = useMemo(
        () => [
            {
                name: t("ego_code"),
                width: "14rem",
                cell: (row) => (
                    <div className='d-flex align-items-center'>
                        <span className='font-monospace me-2'>{row.egoCode}</span>
                        <FaRegCopy
                            style={{ cursor: "pointer", fontSize: "1rem", color: "#6c757d" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                copyText(row.egoCode);
                            }}
                        />
                        <FaBarcode
                            style={{
                                cursor: "pointer",
                                fontSize: "1rem",
                                color: "#6c757d",
                                marginLeft: 8,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                props.onShowBarcode?.(row.egoCode, false);
                            }}
                        />
                    </div>
                ),
            },
            {
                name: t("name"),
                minWidth: "20rem",
                selector: (row) => row.name,
            },
            {
                name: t("dimension"),
                selector: (row) => row.dimension,
            },
            {
                name: t("quantity_required"),
                selector: (row) =>
                    row.quantityRequired != null
                        ? `${row.quantityRequired} ${translateUnit(row.unit)}`
                        : "",
            },
            {
                name: t("available_quantity"),
                cell: (row) => {
                    const hasBoth = row.availableQuantity != null && row.quantityRequired != null;

                    const isLow =
                        hasBoth && Number(row.availableQuantity) < Number(row.quantityRequired);

                    const text =
                        row.availableQuantity != null
                            ? `${row.availableQuantity} ${translateUnit(row.unit)}`
                            : "";

                    return (
                        <span
                            className={isLow ? "text-danger fw-bold" : ""}
                            style={
                                isLow
                                    ? {
                                          backgroundColor: "#ffe5e5",
                                          padding: "2px 4px",
                                          borderRadius: 4,
                                      }
                                    : {}
                            }
                        >
                            {text}
                        </span>
                    );
                },
            },
            {
                name: t("documents"),
                width: "8rem",
                cell: (row) => (
                    <span
                        onClick={(e) => {
                            props.clicked(null, null, row.egoCode, "material");
                        }}
                        style={{ cursor: "pointer" }}
                    >
                        {props.documentPresence?.[row.egoCode] && (
                            <FaRegFileAlt className='ms-1+2 text-primary' />
                        )}
                    </span>
                ),
            },
            {
                name: "Odprti nalogi",
                width: "9rem",
                cell: (row) => (
                    <span
                        title='Odprti nalogi'
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onOpenOrders?.(row.egoCode, row.name ?? row.Ime ?? null);
                        }}
                        style={{ cursor: "pointer" }}
                        className='d-inline-flex align-items-center gap-2 text-primary'
                    >
                        <FaClipboardList />
                    </span>
                ),
            },
        ],
        [t, props],
    );

    return <DataTable dense columns={columns} data={props.parts} highlightOnHover />;
}

export default PartsCard;
