import { useEffect, useMemo, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
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
        const url = `${process.env.REACT_APP_INFORMATORSAP}/api/stock/snapshots/latest?werks=${encodeURIComponent(werks)}&unitId=${encodeURIComponent(unitId)}`;

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

    return (
        <Container className='g-0'>
            <Row className='gy-4 pb-4'>
                <div className='d-flex gap-2'>
                    <div>{t("last_updated")}:</div>
                    <div>
                        {latestRetrievedAtUtc
                            ? dayjs.utc(latestRetrievedAtUtc).format("LLL")
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

            <Row className='gy-4 pb-4'>
                {categories.map((category) => (
                    <StockCard key={category} stockCategory={category} />
                ))}
            </Row>
        </Container>
    );
}

function SnapshotCard({ entry }) {
    const { t } = useTranslation("shopfloor");
    const query = entry?.Query || entry?.query || "";
    const exactText = entry?.ExactText || entry?.exactText || "";
    const searchMode = (entry?.SearchMode || entry?.searchMode || "").toLowerCase();
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
                    {title}
                    {searchMode ? (
                        <span className='ms-2 fs-6 fw-normal text-muted'>({searchMode})</span>
                    ) : null}
                </h3>
                <div className='rounded'>
                    <DataTable columns={columns} data={[row]} noHeader dense />
                </div>
            </Card>
        </Col>
    );
}

function formatValueWithUnit(value, unit) {
    const parsedValue = Number(value ?? 0);
    const formattedValue = Number.isFinite(parsedValue)
        ? parsedValue.toLocaleString("sl-SI", { maximumFractionDigits: 3 })
        : "-";
    const translatedUnit = unit ? translateUnit(unit) : "";

    return translatedUnit ? `${formattedValue} ${translatedUnit}` : formattedValue;
}
