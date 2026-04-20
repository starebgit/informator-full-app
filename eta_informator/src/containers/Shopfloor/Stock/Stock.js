import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Modal, Row, Spinner } from "react-bootstrap";
import { FiClock } from "react-icons/fi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import "chart.js/auto";
import { Line } from "react-chartjs-2";
import { translateUnit } from "../../../utils/utils";
import StockCard from "./StockCard";
import { useLastSync } from "../../../data/ReactQuery";

dayjs.extend(utc);

const stockCategories = {
    default: ["casts", "protectors", "fireclays", "spirals", "clips", "rings"],
    livarna_obdelovalnica: ["casts", "rings"],
};

export default function Stock({ selectedUnit, ...props }) {
    const categories = stockCategories[selectedUnit?.keyword] || stockCategories["default"];
    const lastSync = useLastSync();
    const { t } = useTranslation("labels");
    const { t: tShopfloor } = useTranslation("shopfloor");
    const [snapshotData, setSnapshotData] = useState([]);

    useEffect(() => {
        const unitId = selectedUnit?.unitId;
        if (!unitId) {
            setSnapshotData([]);
            return;
        }

        const werks = selectedUnit?.werks || "1061";
        const url = buildStockSnapshotsUrl({
            werks,
            unitId,
            latestPerTerm: true,
        });

        console.log("[Zaloga API] request url", url);
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then((result) => {
                console.log("[Zaloga API] response", result);
                setSnapshotData(Array.isArray(result) ? result : []);
            })
            .catch((error) => {
                console.error("[Zaloga API] request failed", error);
                setSnapshotData([]);
            });
    }, [selectedUnit?.unitId, selectedUnit?.werks]);

    const newestByTerm = useMemo(() => {
        const map = {};

        snapshotData.forEach((entry) => {
            const termId = entry?.TermId || entry?.termId;
            const query = entry?.Query || entry?.query || "";
            const exactText = entry?.ExactText || entry?.exactText || "";
            const retrievedAtUtc = entry?.RetrievedAtUtc || entry?.retrieved_at_utc;
            const key = termId || query || exactText;

            if (!key || !retrievedAtUtc) return;
            const current = map[key];
            if (!current) {
                map[key] = entry;
                return;
            }

            const currentTs = dayjs.utc(current?.RetrievedAtUtc || current?.retrieved_at_utc);
            const nextTs = dayjs.utc(retrievedAtUtc);
            if (nextTs.isAfter(currentTs)) {
                map[key] = entry;
            }
        });

        return Object.values(map);
    }, [snapshotData]);

    const latestRetrievedAtUtc = useMemo(() => {
        const allDates = snapshotData
            .map((entry) => entry?.RetrievedAtUtc || entry?.retrieved_at_utc)
            .filter(Boolean);

        if (!allDates.length) return null;
        return allDates.reduce((latest, current) =>
            dayjs.utc(current).isAfter(dayjs.utc(latest)) ? current : latest,
        );
    }, [snapshotData]);

    const showOldStockCards = selectedUnit?.unitId === 2;
    return (
        <Container className='g-0'>
            <Row className='gy-4 pb-4'>
                <div className='d-flex gap-2'>
                    <div>{t("last_updated")}:</div>
                    <div>
                        {latestRetrievedAtUtc
                            ? dayjs.utc(latestRetrievedAtUtc).local().format("LLL")
                            : lastSync.isSuccess && dayjs(lastSync.data[0].date).format("LLL")}
                    </div>
                </div>
            </Row>

            {newestByTerm.length > 0 ? (
                <Row className='gy-4 pb-4'>
                    {newestByTerm.map((entry) => (
                        <SnapshotCard
                            key={
                                entry?.SnapshotId ||
                                entry?.snapshotId ||
                                entry?.TermId ||
                                entry?.termId ||
                                entry?.ExactText ||
                                entry?.Query
                            }
                            entry={entry}
                            selectedUnit={selectedUnit}
                        />
                    ))}
                </Row>
            ) : (
                <Row className='gy-4 pb-4'>
                    <Col xs={12}>
                        <div className='text-muted'>{tShopfloor("no_stock_terms_defined")}</div>
                    </Col>
                </Row>
            )}

            {showOldStockCards && (
                <>
                    <Row className='gy-4 pb-4'>
                        <div className='d-flex gap-2'>
                            <div>{t("last_updated")}:</div>
                            <div>
                                {lastSync.isSuccess && dayjs(lastSync.data[0].date).format("LLL")}
                            </div>
                        </div>
                    </Row>
                    <Row className='gy-4 pb-4'>
                        {categories.map((category) => (
                            <StockCard key={category} stockCategory={category} />
                        ))}
                    </Row>
                </>
            )}
        </Container>
    );
}

function SnapshotCard({ entry, selectedUnit }) {
    const { t } = useTranslation("shopfloor");
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const query = entry?.Query || entry?.query || "";
    const exactText = entry?.ExactText || entry?.exactText || "";
    const searchMode = (entry?.SearchMode || entry?.searchMode || "").toLowerCase();
    const translatedSearchMode =
        searchMode === "exact"
            ? t("exact_mode", "exact")
            : searchMode === "contains"
            ? t("contains_mode", "contains")
            : searchMode;
    const title =
        searchMode === "exact"
            ? exactText || query || "-"
            : query
            ? `"${query}"`
            : exactText || "-";

    const row = {
        stock: formatValueWithUnit(entry?.Total ?? entry?.total, entry?.Unit ?? entry?.unit),
        plan: formatValueWithUnit(
            entry?.PlannedTotal ?? entry?.plannedTotal,
            entry?.PlannedUnit ?? entry?.plannedUnit,
        ),
        delivered: formatValueWithUnit(
            entry?.DeliveredTotal ?? entry?.deliveredTotal,
            entry?.DeliveredUnit ?? entry?.deliveredUnit,
        ),
        difference: formatValueWithUnit(
            entry?.PlannedMinusDeliveredTotal ?? entry?.plannedMinusDeliveredTotal,
            entry?.PlannedMinusDeliveredUnit ?? entry?.plannedMinusDeliveredUnit,
        ),
    };

    const columns = [
        { name: t("stock"), selector: (r) => r.stock },
        { name: t("plan"), selector: (r) => r.plan },
        { name: t("delivered"), selector: (r) => r.delivered },
        { name: t("difference"), selector: (r) => r.difference },
    ];

    return (
        <Col xs={12} sm={6}>
            <Card
                className='shadow border-0 p-4 flex flex-column h-100'
                style={{ background: "linear-gradient(30deg, #8cc5ff, #d9eeff)" }}
            >
                <h3 className='mb-2'>
                    <div className='d-flex align-items-start justify-content-between gap-2'>
                        <div>
                            {title}
                            {translatedSearchMode ? (
                                <span className='ms-2 fs-6 fw-normal text-muted'>
                                    ({translatedSearchMode})
                                </span>
                            ) : null}
                        </div>
                        <Button
                            variant='outline-dark'
                            size='sm'
                            title={t("history", "History")}
                            onClick={() => setShowHistoryModal(true)}
                        >
                            <FiClock />
                        </Button>
                    </div>
                </h3>
                <div className='rounded'>
                    <DataTable columns={columns} data={[row]} noHeader dense />
                </div>
            </Card>
            <SnapshotHistoryModal
                show={showHistoryModal}
                onHide={() => setShowHistoryModal(false)}
                entry={entry}
                selectedUnit={selectedUnit}
                title={title}
            />
        </Col>
    );
}

function SnapshotHistoryModal({ show, onHide, entry, selectedUnit, title }) {
    const { t } = useTranslation("shopfloor");
    const [year, setYear] = useState(dayjs().year());
    const [month, setMonth] = useState(dayjs().month() + 1);
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!show) return;
        const unitId = selectedUnit?.unitId;
        if (!unitId) return;

        const parsedYear = Number(year);
        const parsedMonth = Number(month);
        if (
            !Number.isInteger(parsedYear) ||
            !Number.isInteger(parsedMonth) ||
            parsedMonth < 1 ||
            parsedMonth > 12
        ) {
            setError(t("invalid_month_year", "Enter a valid month and year."));
            setHistoryData([]);
            return;
        }

        const monthStart = dayjs.utc(`${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01`);
        const monthEnd = monthStart.endOf("month");
        const werks = selectedUnit?.werks || "1061";
        const lgort = selectedUnit?.lgort || null;

        const url = buildStockSnapshotsUrl({
            werks,
            unitId,
            latestPerTerm: false,
            from: monthStart.toISOString(),
            to: monthEnd.toISOString(),
            lgort,
        });

        setIsLoading(true);
        setError("");
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.json();
            })
            .then((result) => {
                setHistoryData(Array.isArray(result) ? result : []);
            })
            .catch((fetchError) => {
                console.error("[Zaloga API] history request failed", fetchError);
                setError(t("history_load_failed", "Unable to load history data."));
                setHistoryData([]);
            })
            .finally(() => setIsLoading(false));
    }, [show, month, year, selectedUnit?.unitId, selectedUnit?.werks, selectedUnit?.lgort, t]);

    const termId = entry?.TermId || entry?.termId;
    const termHistoryData = useMemo(() => {
        const filtered = historyData.filter((row) => (row?.TermId || row?.termId) === termId);
        return filtered.sort((a, b) => {
            const aTs = dayjs.utc(a?.RetrievedAtUtc || a?.retrieved_at_utc).valueOf();
            const bTs = dayjs.utc(b?.RetrievedAtUtc || b?.retrieved_at_utc).valueOf();
            return aTs - bTs;
        });
    }, [historyData, termId]);

    const chartData = useMemo(() => {
        return {
            labels: termHistoryData.map((item) =>
                dayjs
                    .utc(item?.RetrievedAtUtc || item?.retrieved_at_utc)
                    .local()
                    .format("DD.MM"),
            ),
            datasets: [
                {
                    label: t("stock", "Stock"),
                    data: termHistoryData.map((item) => toNumeric(item?.Total ?? item?.total)),
                    borderColor: "#0d6efd",
                    backgroundColor: "rgba(13, 110, 253, 0.15)",
                    tension: 0.3,
                },
                {
                    label: t("plan", "Plan"),
                    data: termHistoryData.map((item) =>
                        toNumeric(item?.PlannedTotal ?? item?.plannedTotal),
                    ),
                    borderColor: "#198754",
                    backgroundColor: "rgba(25, 135, 84, 0.15)",
                    tension: 0.3,
                },
                {
                    label: t("delivered", "Delivered"),
                    data: termHistoryData.map((item) =>
                        toNumeric(item?.DeliveredTotal ?? item?.deliveredTotal),
                    ),
                    borderColor: "#fd7e14",
                    backgroundColor: "rgba(253, 126, 20, 0.15)",
                    tension: 0.3,
                },
            ],
        };
    }, [termHistoryData, t]);

    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
            },
        },
    };

    return (
        <Modal show={show} onHide={onHide} size='xl' centered>
            <Modal.Header closeButton>
                <Modal.Title>{t("history", "History")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='fw-semibold mb-3'>{title}</div>
                <Row className='g-3 mb-3'>
                    <Col xs={12} md={6}>
                        <Form.Group>
                            <Form.Label>{t("year", "Year")}</Form.Label>
                            <Form.Control
                                type='number'
                                value={year}
                                min={2000}
                                max={2100}
                                onChange={(event) => setYear(event.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                        <Form.Group>
                            <Form.Label>{t("month", "Month")}</Form.Label>
                            <Form.Control
                                type='number'
                                value={month}
                                min={1}
                                max={12}
                                onChange={(event) => setMonth(event.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Card className='shadow-sm border-0 p-3' style={{ minHeight: "380px" }}>
                    {isLoading ? (
                        <div className='d-flex align-items-center gap-2 py-5 justify-content-center'>
                            <Spinner animation='border' size='sm' />
                            <span>{t("loading", "Loading")}...</span>
                        </div>
                    ) : error ? (
                        <div className='text-danger py-4'>{error}</div>
                    ) : termHistoryData.length === 0 ? (
                        <div className='text-muted py-4'>
                            {t("no_data_for_period", "No data for the selected month.")}
                        </div>
                    ) : (
                        <div style={{ height: "340px" }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    )}
                </Card>
            </Modal.Body>
        </Modal>
    );
}

function buildStockSnapshotsUrl({ werks, unitId, latestPerTerm, from, to, lgort }) {
    const url = new URL(`${process.env.REACT_APP_INFORMATORSAP}/api/stock/snapshots`);
    url.searchParams.set("werks", werks);
    url.searchParams.set("unitId", unitId);
    url.searchParams.set("latestPerTerm", String(Boolean(latestPerTerm)));

    if (!latestPerTerm) {
        if (from) url.searchParams.set("from", from);
        if (to) url.searchParams.set("to", to);
    }

    if (lgort) url.searchParams.set("lgort", lgort);

    return url.toString();
}

function toNumeric(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatValueWithUnit(value, unit) {
    const parsedValue = Number(value ?? 0);
    const formattedValue = Number.isFinite(parsedValue)
        ? parsedValue.toLocaleString("sl-SI", { maximumFractionDigits: 3 })
        : "-";
    const translatedUnit = unit ? translateUnit(unit) : "";

    return translatedUnit ? `${formattedValue} ${translatedUnit}` : formattedValue;
}
