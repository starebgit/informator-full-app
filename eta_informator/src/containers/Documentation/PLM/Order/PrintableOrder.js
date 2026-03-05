import React from "react";
import { useTranslation } from "react-i18next";
import { translateUnit } from "../../../../utils/utils";
import Barcode from "react-barcode";

const PrintableOrder = ({
    orderRow,
    parts,
    operations = [],
    sapOps = [],
    confirmations = [],
    orderNumber,
    selectedUnit,
    unitKey,
    materialBarcode,
}) => {
    const { t } = useTranslation(["documentation", "labels"]);
    const pad4 = (v) => String(v ?? "").padStart(4, "0");
    const opsArray = Array.isArray(operations) ? operations : Object.values(operations || {});
    const findSap = (seq) => sapOps?.find((o) => pad4(o.Operation) === pad4(seq));
    const findConf = (seq) => confirmations?.find((c) => pad4(c.Operation) === pad4(seq));
    const withCL = (v) => (v ? (String(v).startsWith("CL") ? String(v) : `CL${v}`) : "");

    const unitName = unitKey ? t(unitKey, { ns: "labels" }) : "";

    const now = new Date();
    const formattedDate = now.toLocaleString("sl-SI");

    return (
        <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
            <style>{`
                body {
                    font-family: sans-serif;
                    padding: 20px;
                }
                .op-confirm-cell {
                padding-top: 4px;
                padding-bottom: 4px;
                }

                .op-confirm-text {
                margin-bottom: 4px;
                }

                /* let table content wrap normally */
                th, td {
                white-space: normal;
                overflow-wrap: anywhere;
                word-break: break-word;
                }

                /* REMOVE your current "nowrap" rule or it will fight wrapping */
                /* delete this block:
                table td:nth-child(2) {
                font-size: 0.65rem;
                white-space: nowrap;
                }
                */

                /* only keep nowrap where you really want it */
                .op-mono { white-space: nowrap; }

                /* force wrap on specific cells even if they have op-mono too */
                .op-wrap { white-space: normal !important; }

                /* barcode cell centered */
                .op-barcode-cell {
                text-align: center;
                vertical-align: middle;
                }

                h3, h4, h5 {
                    margin: 0.5em 0;
                }

                .h3, .h4, .h5 {
                    font-size: 1rem !important;
                }

                button, .btn, .text-decoration-none {
                    display: none !important;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                th, td {
                    text-align: left;
                    padding: 2px 4px;
                    vertical-align: top;
                    border: 1px solid #ccc;
                    font-size: 0.7rem;
                    word-wrap: break-word;
                    word-break: break-word;
                }

                th {
                    background-color: #f0f0f0;
                }
                table td:nth-child(2) {
                    font-size: 0.65rem;
                    white-space: nowrap;
                }
                /* --- Operations table --- */
                .op-table td, .op-table th {
                font-size: 0.7rem;
                vertical-align: top;
                }
                .op-barcode {
                display: inline-block;
                padding: 4px 0;
                }
                .op-row {
                /* enough height to comfortably fit the barcode */
                min-height: 88px;
                }
                .op-mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
                white-space: nowrap;
                }
                .no-break { break-inside: avoid; page-break-inside: avoid; }
                .op-barcode-row td { padding-top: 6px; padding-bottom: 10px; }
                .op-barcode-center { text-align: center; }

                .ets-stamp {
                position: fixed;
                right: 14px;
                bottom: 14px;
                font-weight: 400;      /* was 700 */
                font-size: 10px;     /* was 16px -> 20% smaller */
                letter-spacing: 0.08em;
                color: #111;
                background: transparent;
                line-height: 1;
                }

                .op-writein td {
                font-size: 0.7rem;
                padding: 10px 4px;
                }

                .op-writein-row {
                display: flex;
                gap: 18px;
                align-items: flex-end;
                }

                .op-writein-item {
                min-width: 140px;
                }

                .op-writein-line {
                display: inline-block;
                border-bottom: 1px solid #111;
                width: 160px;
                height: 0.9em;
                vertical-align: bottom;
                margin-left: 6px;
                }

                /* force non-bold just for the order header block (between SPREMNI LIST and KOSOVNICA) */
                .po-orderrow,
                .po-orderrow * {
                font-weight: 400 !important;
                }

                .po-orderrow b,
                .po-orderrow strong {
                font-weight: 400 !important;
                }

                .data-stamp {
                position: fixed;
                left: 14px;
                bottom: 14px;
                font-weight: 400;
                font-size: 10px;
                letter-spacing: 0.02em;
                color: #cfcfcf;
                background: transparent;
                line-height: 1;
                }
            `}</style>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                    lineHeight: 1.1,
                    fontSize: "1rem",
                }}
            >
                <div>
                    <div>ETA d.o.o. Cerkno</div>
                    <div>DE {unitName}</div>
                </div>

                <div style={{ textAlign: "right" }}>{formattedDate}</div>
            </div>
            <div
                style={{
                    textAlign: "center",
                    margin: "12px 0 14px",
                    fontSize: "1.2rem",
                    letterSpacing: "0.08em",
                }}
            >
                {String(t("ready_sheet")).toUpperCase()}
            </div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <div className='po-orderrow' style={{ flex: 1, paddingRight: 16 }}>
                    {orderRow}
                </div>
                <div
                    style={{
                        minWidth: 260,
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column", // ✅ stack vertically
                        alignItems: "flex-end", // ✅ right align the barcodes
                        gap: 10, // spacing between the two
                    }}
                >
                    <Barcode value={orderNumber} width={1.6} height={48} fontSize={11.2} />
                    {materialBarcode ? (
                        <Barcode value={materialBarcode} width={1.6} height={48} fontSize={11.2} />
                    ) : null}
                </div>
            </div>
            {parts?.length > 0 && (
                <div className='mt-3'>
                    <div
                        style={{
                            textAlign: "center",
                            margin: "18px 0 14px",
                            fontSize: "1.2rem",
                            letterSpacing: "0.08em",
                            paddingBottom: 4,
                        }}
                    >
                        {String(t("parts")).toUpperCase()}
                    </div>
                    <table>
                        <colgroup>
                            <col style={{ width: "22%" }} /> {/* EGO koda */}
                            <col style={{ width: "42%" }} /> {/* Ime */}
                            <col style={{ width: "16%" }} /> {/* Dimenzija */}
                            <col style={{ width: "10%" }} /> {/* Potreba za nalog */}
                            <col style={{ width: "10%" }} /> {/* Trenutna zaloga */}
                        </colgroup>
                        <thead>
                            <tr>
                                <th>{t("ego_code")}</th>
                                <th>{t("name")}</th>
                                <th>{t("dimension")}</th>
                                <th>{t("quantity_required")}</th>
                                <th>{t("available_quantity")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((part, index) => (
                                <tr key={index}>
                                    <td>{part.egoCode}</td>
                                    <td>{part.name}</td>
                                    <td>{part.dimension}</td>
                                    <td>
                                        {part.quantityRequired != null
                                            ? `${part.quantityRequired} ${
                                                  translateUnit(part.unit) ?? ""
                                              }`
                                            : ""}
                                    </td>
                                    <td>
                                        {part.availableQuantity != null
                                            ? `${part.availableQuantity} ${
                                                  translateUnit(part.unit) ?? ""
                                              }`
                                            : ""}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {opsArray.length > 0 && (
                <div className='mt-3'>
                    <div
                        style={{
                            textAlign: "center",
                            margin: "18px 0 16px",
                            fontSize: "1.2rem",
                            letterSpacing: "0.08em",
                            paddingBottom: 4,
                        }}
                    >
                        {String(t("operation", { count: 3 })).toUpperCase()}
                    </div>
                    <table className='op-table'>
                        <colgroup>
                            <col style={{ width: "10%" }} /> {/* Key */}
                            <col style={{ width: "35%" }} /> {/* Operation */}
                            <col style={{ width: "10%" }} /> {/* Za izdelati */}
                            <col style={{ width: "10%" }} /> {/* Donos */}
                            <col style={{ width: "35%" }} /> {/* Št. potrditve (barcode) */}
                        </colgroup>{" "}
                        <thead>
                            <tr>
                                <th>{t("key")}</th>
                                <th>{t("operation")}</th>
                                <th>Za izdelati</th>
                                <th>Donos na nalogu</th>
                                <th>Št. potrditve</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opsArray.map((op, i) => {
                                const sap = findSap(op.sequence);
                                const conf = findConf(op.sequence);
                                return (
                                    <React.Fragment key={i}>
                                        {/* Row 1: basic data (no barcode here) */}
                                        <tr className='no-break'>
                                            <td className='op-mono'>{op.operationKey}</td>
                                            <td className='op-wrap'>{op.name}</td>
                                            <td className='op-mono'>
                                                {sap?.OperationAmount ?? ""}
                                            </td>
                                            <td className='op-mono'>{sap?.ConfirmedYield ?? ""}</td>
                                            <td className='op-barcode-cell'>
                                                {conf?.ConfirmationDisplay ? (
                                                    <Barcode
                                                        value={withCL(conf?.ConfirmationDisplay)}
                                                        width={1.4} // was 1.35 -> 20% smaller
                                                        height={30} // was 38 -> 20% smaller
                                                        fontSize={12} // was 9 -> 20% smaller
                                                        margin={0}
                                                    />
                                                ) : null}
                                            </td>
                                        </tr>
                                        <tr className='no-break op-writein'>
                                            <td colSpan={5}>
                                                <div className='op-writein-row'>
                                                    <div className='op-writein-item'>
                                                        Datum:
                                                        <span className='op-writein-line' />
                                                    </div>
                                                    <div className='op-writein-item'>
                                                        Količina:
                                                        <span className='op-writein-line' />
                                                    </div>
                                                    <div className='op-writein-item'>
                                                        Podpis:
                                                        <span className='op-writein-line' />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className='data-stamp'>Podatki veljajo za: {formattedDate}</div>
            <div className='ets-stamp'>ETS 013.037</div>
        </div>
    );
};

export default PrintableOrder;
