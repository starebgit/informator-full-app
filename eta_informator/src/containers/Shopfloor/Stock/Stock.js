import { useEffect, useMemo, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import StockCard from "./StockCard";
import { useLastSync } from "../../../data/ReactQuery";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import { translateUnit } from "../../../utils/utils";

const stockCategories = {
    default: ["casts", "protectors", "fireclays", "spirals", "clips", "rings"],
    livarna_obdelovalnica: ["casts", "rings"],
};

export default function Stock({ selectedUnit }) {
    const categories = stockCategories[selectedUnit?.keyword] || stockCategories["default"];
    const lastSync = useLastSync();
    const { t } = useTranslation("labels");
    const [snapshotData, setSnapshotData] = useState([]);

    useEffect(() => {
        const unitId = selectedUnit?.unitId;

        if (!unitId) return;

        const date = dayjs().format("YYYY-MM-DD");
        const url = `${process.env.REACT_APP_INFORMATORSAP}/api/stock/snapshots/by-date?date=${date}&unitId=${unitId}`;

        console.log("[Zaloga API] request params", { unitId, date });

        fetch(url)
            .then((response) => response.json())
            .then((result) => {
                console.log("[Zaloga API] response", result);
                setSnapshotData(Array.isArray(result) ? result : []);
            })
            .catch((error) => {
                console.error("[Zaloga API] request failed", error);
                setSnapshotData([]);
            });
    }, [selectedUnit?.unitId]);

    const newestByQuery = useMemo(() => {
        const map = {};

        snapshotData.forEach((entry) => {
            const query = entry.Query || entry.query || "";
            const retrievedAtUtc = entry.RetrievedAtUtc || entry.retrieved_at_utc || null;

            if (!query || !retrievedAtUtc) return;

            const current = map[query];
            if (!current) {
                map[query] = entry;
                return;
            }

            const currentTs = dayjs.utc(current.RetrievedAtUtc || current.retrieved_at_utc || null);
            const nextTs = dayjs.utc(retrievedAtUtc);

            if (nextTs.isAfter(currentTs)) {
                map[query] = entry;
            }
        });

        return Object.values(map);
    }, [snapshotData]);

    const latestRetrievedAtUtc = useMemo(() => {
        const allDates = snapshotData
            .map((entry) => entry.RetrievedAtUtc || entry.retrieved_at_utc)
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
                    <div>Zadnja posodobitev:</div>
                    <div>
                        {latestRetrievedAtUtc
                            ? dayjs.utc(latestRetrievedAtUtc).format("D. MMMM YYYY H:mm [UTC]")
                            : "-"}
                    </div>
                </div>
            </Row>
            <Row className='gy-4 pb-4'>
                {newestByQuery.map((entry) => (
                    <SnapshotCard key={entry.Query || entry.query} entry={entry} />
                ))}
            </Row>
            {showOldStockCards && (
                <>
                    <Row className='gy-4 pb-4'>
                        <div className='d-flex gap-2'>
                            <div>{t("last_updated")}:</div>
                            <div>{lastSync.isSuccess && dayjs(lastSync.data[0].date).format("LLL")}</div>
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

function SnapshotCard({ entry }) {
    const query = entry.Query || entry.query || "";
    const title = query ? query.charAt(0).toUpperCase() + query.slice(1).toLowerCase() : "-";

    const row = {
        stock: formatValueWithUnit(entry.Total ?? entry.total, entry.Unit ?? entry.unit),
        plan: formatValueWithUnit(
            entry.PlannedTotal ?? entry.planned_total,
            entry.PlannedUnit ?? entry.planned_unit,
        ),
        delivered: formatValueWithUnit(
            entry.DeliveredTotal ?? entry.delivered_total,
            entry.DeliveredUnit ?? entry.delivered_unit,
        ),
        difference: formatValueWithUnit(
            entry.PlannedMinusDeliveredTotal ?? entry.planned_minus_delivered_total,
            entry.PlannedMinusDeliveredUnit ?? entry.planned_minus_delivered_unit,
        ),
    };

    const columns = [
        { name: "Zaloga", selector: (r) => r.stock },
        { name: "Plan", selector: (r) => r.plan },
        { name: "Dostavljeno", selector: (r) => r.delivered },
        { name: "Razlika", selector: (r) => r.difference },
    ];

    return (
        <Col xs={12} sm={6}>
            <Card
                className='shadow border-0 p-4 flex flex-column h-100'
                style={{
                    background: "linear-gradient(30deg, #cedeeb, #eef2f3)",
                }}
            >
                <h3>{title}</h3>
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
