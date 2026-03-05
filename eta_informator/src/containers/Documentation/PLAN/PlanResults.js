// src/views/Documentation/Plan/PlanResults.js
import React, { useContext } from "react";
import { withRouter, useLocation } from "react-router-dom";
import { Container, Table, Alert, Spinner, Button } from "react-bootstrap";
import { translateUnit, useOrderNavigator } from "../../../utils/utils";
import { FaRegCopy, FaExternalLinkAlt } from "react-icons/fa";
import { ToastContext } from "../../../context/ToastContext/ToastContext";
import { useTranslation } from "react-i18next";

function PlanResults(props) {
    const { showToast } = useContext(ToastContext);
    const { t } = useTranslation(["labels", "documentation"]);
    const goToOrderIfExists = useOrderNavigator({ history: props.history, showToast, t });

    const trimOrder = (n) => String(n || "").replace(/^0+/, "") || "0";

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

    const location = useLocation();
    const q = React.useMemo(() => new URLSearchParams(location.search), [location.key]);
    const plant = q.get("plant") || "1061";
    const term = q.get("term") || "";
    const wcLabel = q.get("wcLabel") || "";

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [resolvedWcLabel, setResolvedWcLabel] = React.useState("");

    React.useEffect(() => {
        if (!term) return;

        const controller = new AbortController();

        async function resolveName() {
            try {
                const params = new URLSearchParams();
                params.set("plant", plant);
                params.set("take", "50");
                params.set("term", term);

                const url = `${
                    process.env.REACT_APP_INFORMATORSAP
                }/api/plan/workcenters?${params.toString()}`;
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) return;

                const data = await res.json();
                if (!Array.isArray(data)) return;

                const tTerm = term.toLowerCase();
                const exact = data.find((x) => (x.DelovnoMesto || "").toLowerCase() === tTerm);
                if (exact) {
                    setResolvedWcLabel(`${exact.DelovnoMesto} — ${exact.Opis || ""}`.trim());
                    return;
                }
                const sw = data.find((x) => (x.DelovnoMesto || "").toLowerCase().startsWith(tTerm));
                if (sw) {
                    setResolvedWcLabel(`${sw.DelovnoMesto} — ${sw.Opis || ""}`.trim());
                    return;
                }
            } catch (_) {}
        }

        resolveName();
        return () => controller.abort();
    }, [term, plant]);

    React.useEffect(() => {
        if (!term) return;
        setLoading(true);
        setError("");
        setRows([]);

        const controller = new AbortController();
        const url = `${process.env.REACT_APP_INFORMATORSAP}/api/plan/orders-by-workcenter?plant=${plant}&workCenter=${term}&language=SL&take=500`;

        fetch(url, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                const mapped = (data || []).map((x) => ({
                    Nalog: x.Nalog,
                    Material: x.Material,
                    StdKolicina: x.StdKolicina,
                    Donos: x.Donos,
                    EM: translateUnit(x.EM),
                    KratkiTekstMateriala: x.KratkiTekstMateriala,
                    NajZag: x.NajZag,
                }));
                setRows(mapped);
                setLoading(false);
            })
            .catch((e) => {
                if (e.name !== "AbortError") {
                    setError(e.message || "Napaka pri nalaganju");
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [plant, term, location.key]);

    const openOrder = async (orderNumber) => {
        const trimmedOrder = trimOrder(orderNumber);
        await goToOrderIfExists(trimmedOrder);
    };

    return (
        <Container style={{ paddingTop: "1rem", minHeight: "50vh" }}>
            <h2 className='mb-2'>{t("documentation:plan_results")}</h2>
            <div className='text-muted'>
                <div>
                    <strong>{t("documentation:work_center")}:</strong>{" "}
                    {wcLabel || resolvedWcLabel || term}
                </div>
            </div>
            {loading && (
                <div className='mt-4 d-flex align-items-center gap-2'>
                    <Spinner animation='border' size='sm' />{" "}
                    <span>{t("documentation:loading_long")}</span>
                </div>
            )}
            {error && (
                <Alert className='mt-4' variant='danger'>
                    {t("documentation:error_loading_data", { error })}
                </Alert>
            )}
            {!loading && !error && (
                <div className='mt-4'>
                    <Table striped bordered hover responsive size='sm'>
                        <thead>
                            <tr>
                                <th>{t("documentation:work_order")}</th>
                                <th>Naj. zag.</th>
                                <th>{t("documentation:material")}</th>
                                <th>{t("documentation:planned_quantity")}</th>
                                <th>{t("documentation:yield")}</th>
                                <th>{t("documentation:unit")}</th>
                                <th>{t("documentation:material_description")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='text-center text-muted'>
                                        {t("documentation:no_results_for_criteria")}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, i) => (
                                    <tr key={`${r.Nalog}-${i}`}>
                                        <td>
                                            <div className='d-flex align-items-center'>
                                                <span className='font-monospace me-2'>
                                                    {trimOrder(r.Nalog)}
                                                </span>
                                                <FaRegCopy
                                                    style={{
                                                        cursor: "pointer",
                                                        fontSize: "1rem",
                                                        color: "#6c757d",
                                                    }}
                                                    title={`Kopiraj nalog ${trimOrder(r.Nalog)}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyText(trimOrder(r.Nalog));
                                                    }}
                                                />
                                                <Button
                                                    size='sm'
                                                    variant='link'
                                                    className='text-primary ms-2'
                                                    title={`Odpri nalog ${trimOrder(r.Nalog)}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openOrder(r.Nalog);
                                                    }}
                                                >
                                                    <FaExternalLinkAlt />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className='font-monospace'>{r.NajZag || ""}</td>
                                        <td>{r.Material}</td>
                                        <td>{r.StdKolicina}</td>
                                        <td>{r.Donos}</td>
                                        <td>{r.EM}</td>
                                        <td
                                            className='text-truncate'
                                            title={r.KratkiTekstMateriala}
                                        >
                                            {r.KratkiTekstMateriala}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            )}
        </Container>
    );
}

export default withRouter(PlanResults);
