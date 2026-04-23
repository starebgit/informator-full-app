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
    const [goalsByTerm, setGoalsByTerm] = useState({});
    const [goalsLoadingByTerm, setGoalsLoadingByTerm] = useState({});
    const [goalsErrorByTerm, setGoalsErrorByTerm] = useState({});

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
                    if (response.status === 404 || response.status === 400) {
                        const fallbackUrl = `${
                            process.env.REACT_APP_INFORMATORSAP
                        }/api/stock/snapshots/latest?werks=${encodeURIComponent(
                            werks,
                        )}&unitId=${encodeURIComponent(unitId)}`;
                        return fetch(fallbackUrl).then((fallbackResponse) => {
                            if (!fallbackResponse.ok) {
                                throw new Error(
                                    `Fallback request failed with status ${fallbackResponse.status}`,
                                );
                            }
                            return fallbackResponse.json();
                        });
                    }
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

    const filteredSnapshotData = useMemo(
        () =>
            filterSnapshotRowsByUnitAndSubunit(snapshotData, {
                selectedUnitId: selectedUnit?.unitId,
                selectedSubunitId: selectedUnit?.subunitId,
            }),
        [snapshotData, selectedUnit?.unitId, selectedUnit?.subunitId],
    );

    const newestByTerm = useMemo(() => {
        const map = {};

        filteredSnapshotData.forEach((entry) => {
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
    }, [filteredSnapshotData]);

    const latestRetrievedAtUtc = useMemo(() => {
        const allDates = filteredSnapshotData
            .map((entry) => entry?.RetrievedAtUtc || entry?.retrieved_at_utc)
            .filter(Boolean);

        if (!allDates.length) return null;
        return allDates.reduce((latest, current) =>
            dayjs.utc(current).isAfter(dayjs.utc(latest)) ? current : latest,
        );
    }, [filteredSnapshotData]);

    const showOldStockCards = selectedUnit?.unitId === 2;

    const loadGoalsForTerm = async (termId) => {
        if (!termId) return [];

        setGoalsLoadingByTerm((previous) => ({ ...previous, [termId]: true }));
        setGoalsErrorByTerm((previous) => ({ ...previous, [termId]: "" }));
        try {
            const response = await fetch(
                `${process.env.REACT_APP_INFORMATORSAP}/api/stock/goals?termId=${encodeURIComponent(
                    termId,
                )}`,
            );
            if (!response.ok) {
                throw new Error(`Goals GET failed: ${response.status}`);
            }
            const result = await response.json();
            const normalizedGoals = normalizeGoals(result);
            setGoalsByTerm((previous) => ({ ...previous, [termId]: normalizedGoals }));
            return normalizedGoals;
        } catch (error) {
            console.error("[Zaloga API] goals request failed", error);
            setGoalsErrorByTerm((previous) => ({
                ...previous,
                [termId]: tShopfloor("history_load_failed"),
            }));
            setGoalsByTerm((previous) => ({ ...previous, [termId]: [] }));
            return [];
        } finally {
            setGoalsLoadingByTerm((previous) => ({ ...previous, [termId]: false }));
        }
    };

    useEffect(() => {
        const termIds = newestByTerm
            .map((entry) => resolveTermId(entry))
            .filter((termId) => termId !== null && termId !== undefined && termId !== "");

        if (!termIds.length) return;
        const uniqueTermIds = [...new Set(termIds)];
        uniqueTermIds.forEach((termId) => {
            loadGoalsForTerm(termId);
        });
    }, [newestByTerm]);

    const handleSaveGoal = async (termId, goalConfig) => {
        if (!termId) return { success: false };

        setGoalsLoadingByTerm((previous) => ({ ...previous, [termId]: true }));
        setGoalsErrorByTerm((previous) => ({ ...previous, [termId]: "" }));

        try {
            const response = await fetch(`${process.env.REACT_APP_INFORMATORSAP}/api/stock/goals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    termId,
                    goalValue: Number(goalConfig.value),
                    validFrom: goalConfig.from,
                    validTo: goalConfig.to,
                }),
            });
            if (!response.ok) {
                throw new Error(`Goals POST failed: ${response.status}`);
            }

            await loadGoalsForTerm(termId);
            return { success: true };
        } catch (error) {
            console.error("[Zaloga API] goals save failed", error);
            setGoalsErrorByTerm((previous) => ({
                ...previous,
                [termId]: tShopfloor("goal_save_failed"),
            }));
            setGoalsLoadingByTerm((previous) => ({ ...previous, [termId]: false }));
            return { success: false };
        }
    };

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
                            goals={goalsByTerm[resolveTermId(entry)] || []}
                            goalsLoading={Boolean(goalsLoadingByTerm[resolveTermId(entry)])}
                            goalsError={goalsErrorByTerm[resolveTermId(entry)]}
                            onSaveGoal={handleSaveGoal}
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

function SnapshotCard({ entry, selectedUnit, goals, goalsLoading, goalsError, onSaveGoal }) {
    const { t } = useTranslation("shopfloor");
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [goalValue, setGoalValue] = useState("");
    const [goalFrom, setGoalFrom] = useState("");
    const [goalTo, setGoalTo] = useState("");
    const [saveError, setSaveError] = useState("");
    const termId = resolveTermId(entry);
    const searchMode = (entry?.SearchMode || entry?.searchMode || "").toLowerCase();
    const translatedSearchMode =
        searchMode === "exact"
            ? t("exact_mode")
            : searchMode === "contains"
            ? t("contains_mode")
            : searchMode;
    const title = buildSnapshotTermLabel(entry, translatedSearchMode);

    const activeGoal = useMemo(() => selectGoalForDate(goals, dayjs()), [goals]);

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
        goal: formatGoalValue(activeGoal?.goalValue, entry?.Unit ?? entry?.unit),
        goalMinusDelivered: formatGoalMinusDeliveredValue(
            activeGoal?.goalValue,
            entry?.DeliveredTotal ?? entry?.deliveredTotal,
            entry?.Unit ?? entry?.unit,
        ),
    };

    const columns = [
        { name: t("stock"), selector: (r) => r.stock },
        { name: t("plan"), selector: (r) => r.plan, omit: true, hidden: true },
        { name: t("delivered"), selector: (r) => r.delivered, omit: true, hidden: true },
        { name: t("plan_minus_delivered"), selector: (r) => r.difference },
        { name: t("goal"), selector: (r) => r.goal },
        { name: t("goal_minus_delivered"), selector: (r) => r.goalMinusDelivered },
    ];

    const handleGoalSave = async () => {
        if (!goalValue || !goalFrom || !goalTo || dayjs(goalFrom).isAfter(dayjs(goalTo))) {
            setSaveError(t("invalid_goal_range"));
            return;
        }
        setSaveError("");
        const saveResult = await onSaveGoal(termId, {
            value: goalValue,
            from: goalFrom,
            to: goalTo,
        });
        if (saveResult.success) {
            setShowGoalForm(false);
            setGoalValue("");
            setGoalFrom("");
            setGoalTo("");
        } else {
            setSaveError(t("goal_save_failed"));
        }
    };

    return (
        <Col xs={12} sm={6}>
            <Card
                className='shadow border-0 p-4 flex flex-column h-100'
                style={{ background: "linear-gradient(30deg, #8cc5ff, #d9eeff)" }}
            >
                <h3 className='mb-2'>
                    <div className='d-flex align-items-start justify-content-between gap-2'>
                        <div>{title}</div>
                        <div className='d-flex gap-2'>
                            <Button
                                variant='outline-dark'
                                size='sm'
                                title={t("add_goal")}
                                onClick={() => setShowGoalForm((previous) => !previous)}
                            >
                                {t("add_goal")}
                            </Button>
                            <Button
                                variant='outline-dark'
                                size='sm'
                                title={t("history")}
                                onClick={() => setShowHistoryModal(true)}
                            >
                                <FiClock />
                            </Button>
                        </div>
                    </div>
                </h3>
                {showGoalForm ? (
                    <Row className='g-2 mb-3'>
                        <Col xs={12} md={4}>
                            <Form.Control
                                type='number'
                                placeholder={t("goal")}
                                value={goalValue}
                                onChange={(event) => setGoalValue(event.target.value)}
                            />
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Control
                                type='date'
                                value={goalFrom}
                                onChange={(event) => setGoalFrom(event.target.value)}
                            />
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Control
                                type='date'
                                value={goalTo}
                                min={goalFrom || undefined}
                                onChange={(event) => setGoalTo(event.target.value)}
                            />
                        </Col>
                        <Col xs={12} md={2}>
                            <Button
                                variant='primary'
                                className='w-100'
                                onClick={handleGoalSave}
                                disabled={!goalValue || !goalFrom || !goalTo || goalsLoading}
                            >
                                {goalsLoading ? t("loading") : t("add")}
                            </Button>
                        </Col>
                    </Row>
                ) : null}
                {saveError ? <div className='text-danger mb-2'>{saveError}</div> : null}
                {goalsError ? <div className='text-danger mb-2'>{goalsError}</div> : null}
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
                goals={goals}
            />
        </Col>
    );
}

function SnapshotHistoryModal({ show, onHide, entry, selectedUnit, title, goals }) {
    const { t } = useTranslation("shopfloor");
    const { t: tLabels } = useTranslation("labels");
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
            setError(t("invalid_month_year"));
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
                setError(t("history_load_failed"));
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
                    label: t("stock"),
                    data: termHistoryData.map((item) => toNumeric(item?.Total ?? item?.total)),
                    borderColor: "#0d6efd",
                    backgroundColor: "rgba(13, 110, 253, 0.15)",
                    tension: 0.3,
                },
                {
                    label: t("plan"),
                    data: termHistoryData.map((item) =>
                        toNumeric(item?.PlannedTotal ?? item?.plannedTotal),
                    ),
                    borderColor: "#198754",
                    backgroundColor: "rgba(25, 135, 84, 0.15)",
                    tension: 0.3,
                    hidden: true,
                },
                {
                    label: t("delivered"),
                    data: termHistoryData.map((item) =>
                        toNumeric(item?.DeliveredTotal ?? item?.deliveredTotal),
                    ),
                    borderColor: "#fd7e14",
                    backgroundColor: "rgba(253, 126, 20, 0.15)",
                    tension: 0.3,
                    hidden: true,
                },
                {
                    label: t("goal"),
                    data: termHistoryData.map((item) => {
                        const itemDate = dayjs
                            .utc(item?.RetrievedAtUtc || item?.retrieved_at_utc)
                            .local();
                        const selectedGoal = selectGoalForDate(goals, itemDate);
                        return selectedGoal ? toNumeric(selectedGoal.goalValue) : null;
                    }),
                    borderColor: "#6f42c1",
                    borderDash: [8, 6],
                    pointRadius: 0,
                    spanGaps: false,
                },
            ],
        };
    }, [termHistoryData, t, goals]);

    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    filter: (legendItem, data) => {
                        const label = legendItem.text;
                        if (label === t("plan") || label === t("delivered")) return false;

                        const firstDatasetWithLabel = data.datasets.findIndex(
                            (dataset) => dataset.label === label,
                        );

                        return firstDatasetWithLabel === legendItem.datasetIndex;
                    },
                },
            },
        },
    };

    return (
        <Modal show={show} onHide={onHide} size='xl' centered>
            <Modal.Header closeButton>
                <Modal.Title>{t("history")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='fw-semibold mb-3'>{title}</div>
                <Row className='g-3 mb-3'>
                    <Col xs={12} md={6}>
                        <Form.Group>
                            <Form.Label>{tLabels("year")}</Form.Label>
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
                            <Form.Label>{tLabels("month")}</Form.Label>
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
                            <span>{t("loading")}...</span>
                        </div>
                    ) : error ? (
                        <div className='text-danger py-4'>{error}</div>
                    ) : termHistoryData.length === 0 ? (
                        <div className='text-muted py-4'>{t("no_data_for_period")}</div>
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

function formatGoalValue(value, unit) {
    if (value === null || value === undefined || value === "") return "-";
    const translatedUnit = unit ? translateUnit(unit) : "";
    return translatedUnit ? `${value} ${translatedUnit}` : value;
}

function formatGoalMinusDeliveredValue(goalValue, deliveredValue, unit) {
    if (goalValue === null || goalValue === undefined || goalValue === "") return "-";
    const goalNumeric = Number(goalValue);
    const deliveredNumeric = Number(deliveredValue ?? 0);
    if (!Number.isFinite(goalNumeric) || !Number.isFinite(deliveredNumeric)) return "-";

    return formatValueWithUnit(goalNumeric - deliveredNumeric, unit);
}

function resolveTermId(entry) {
    return entry?.TermId || entry?.termId || null;
}

function normalizeSubunitId(value) {
    if (value === null || value === undefined || value === "") return null;
    return String(value);
}

function normalizeUnitId(value) {
    if (value === null || value === undefined || value === "") return null;
    return String(value);
}

function filterSnapshotRowsByUnitAndSubunit(rows, { selectedUnitId, selectedSubunitId } = {}) {
    if (!Array.isArray(rows)) return [];

    const normalizedSelectedUnitId = normalizeUnitId(selectedUnitId);
    const normalizedSelectedSubunitId = normalizeSubunitId(selectedSubunitId);
    const hasSelectedSubunit = normalizedSelectedSubunitId !== null;

    return rows.filter((row) => {
        const rowSubunitId = normalizeSubunitId(row?.SubunitId ?? row?.subunitId);
        const rowUnitId = normalizeUnitId(row?.UnitId ?? row?.unitId);

        if (!hasSelectedSubunit) {
            if (normalizedSelectedUnitId === null) return true;
            if (rowUnitId === null) return true;
            return rowUnitId === normalizedSelectedUnitId;
        }

        if (rowSubunitId !== null) {
            return rowSubunitId === normalizedSelectedSubunitId;
        }

        if (normalizedSelectedUnitId === null) return true;
        if (rowUnitId === null) return true;
        return rowUnitId === normalizedSelectedUnitId;
    });
}

function buildSnapshotTermLabel(entry, translatedSearchMode) {
    const title = entry?.Title || entry?.title || "";
    const query = entry?.Query || entry?.query || "";
    const exactText = entry?.ExactText || entry?.exactText || "";
    const searchMode = (entry?.SearchMode || entry?.searchMode || "").toLowerCase();
    const termText = searchMode === "exact" && exactText ? exactText : query || exactText || "-";
    const modeText = translatedSearchMode || searchMode || "-";
    return title ? `${title} — ${termText} (${modeText})` : `${termText} (${modeText})`;
}

function normalizeGoals(payload) {
    if (!Array.isArray(payload)) return [];
    return payload
        .map((goal) => ({
            id: goal?.Id || goal?.id,
            termId: goal?.TermId || goal?.termId,
            goalValue: goal?.GoalValue ?? goal?.goalValue,
            validFrom: goal?.ValidFrom || goal?.validFrom,
            validTo: goal?.ValidTo || goal?.validTo,
            updatedAt: goal?.UpdatedAt || goal?.updatedAt || goal?.CreatedAt || goal?.createdAt,
        }))
        .filter((goal) => goal.termId !== null && goal.termId !== undefined && goal.termId !== "")
        .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf());
}

function selectGoalForDate(goals, date) {
    if (!Array.isArray(goals) || !goals.length) return null;
    return goals.find((goal) => {
        if (!goal?.validFrom || !goal?.validTo) return false;
        const from = dayjs(goal.validFrom).startOf("day");
        const to = dayjs(goal.validTo).endOf("day");
        return !date.isBefore(from) && !date.isAfter(to);
    });
}
