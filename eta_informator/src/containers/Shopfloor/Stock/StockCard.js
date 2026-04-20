import {
    useCasts,
    useClips,
    useFireclays,
    useProtectors,
    useRings,
    useSpirals,
} from "../../../data/ReactQuery";
import { Card, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";

const DataSource = {
    casts: useCasts,
    rings: useRings,
    clips: useClips,
    protectors: useProtectors,
    fireclays: useFireclays,
    spirals: useSpirals,
};

const conditionalRowStyles = [
    {
        when: (row) => row.category === "Σ" || row.diameter === "Σ",
        style: {
            fontWeight: "bold",
        },
    },
];

export default function StockCard({ stockCategory }) {
    const { t } = useTranslation("shopfloor");
    const { data, isLoading, isError, status } = DataSource[stockCategory]();
    const searchMeta = resolveSearchMeta(data);
    const cardHeader = buildCardHeader(stockCategory, searchMeta, t);

    const columns = [
        {
            name: t("category"),
            selector: (row) => row.category,
            omit: stockCategory !== "clips" && stockCategory !== "casts",
        },
        {
            name: t("diameter"),
            selector: (row) => row.diameter,
            omit:
                stockCategory !== "protectors" &&
                stockCategory !== "fireclays" &&
                stockCategory !== "spirals" &&
                stockCategory !== "rings",
        },
        {
            name: t("stock"),
            selector: (row) => row.stock,
            right: true,
        },
        {
            name: t("plan"),
            selector: (row) => row.plan,
            right: true,
        },
        {
            name: t("furnace"),
            selector: (row) => row.furnace,
            omit: stockCategory !== "fireclays",
            right: true,
        },
        {
            name: t("difference"),
            selector: (row) => row.difference,
            right: true,
        },
        {
            name: t("differenceFurnace"),
            selector: (row) => row.differenceFurnace,
            omit: stockCategory !== "fireclays",
            right: true,
        },
    ];

    const transformedData = DataTransform(stockCategory, data, t);

    const sortedData =
        transformedData &&
        Object.values(transformedData)?.sort((a, b) => {
            if (a[Object.keys(a)[0]] === "Σ") return 1;
            if (b[Object.keys(b)[0]] === "Σ") return -1;
            return 0;
        });

    return (
        <Col xs={12} sm={6}>
            <Card
                className='shadow border-0 p-4 flex flex-column h-100'
                style={{
                    background: "linear-gradient(30deg, #cedeeb, #eef2f3)",
                }}
            >
                <h3 className='mb-2'>
                    {cardHeader.label}
                    {cardHeader.mode ? (
                        <span className='ms-2 fs-6 fw-normal text-muted'>({cardHeader.mode})</span>
                    ) : null}
                </h3>
                <div className='rounded'>
                    <DataTable
                        className=''
                        columns={columns}
                        data={sortedData ?? []}
                        noHeader
                        dense
                        conditionalRowStyles={conditionalRowStyles}
                    />
                </div>
            </Card>
        </Col>
    );
}

function resolveSearchMeta(data) {
    if (!Array.isArray(data) || !data.length) return null;

    const firstEntryWithSearchMode = data.find((entry) => {
        const mode = entry?.searchMode || entry?.SearchMode;
        return typeof mode === "string" && mode.length > 0;
    });

    if (!firstEntryWithSearchMode) return null;

    return {
        mode: (firstEntryWithSearchMode.searchMode || firstEntryWithSearchMode.SearchMode || "")
            .toLowerCase()
            .trim(),
        query: firstEntryWithSearchMode.query || firstEntryWithSearchMode.Query || "",
        exactText: firstEntryWithSearchMode.exactText || firstEntryWithSearchMode.ExactText || "",
    };
}

function buildCardHeader(stockCategory, searchMeta, t) {
    const fallbackLabel = t(stockCategory);
    if (!searchMeta) return { label: fallbackLabel, mode: null };

    if (searchMeta.mode === "exact") {
        return {
            label: searchMeta.exactText || searchMeta.query || fallbackLabel,
            mode: t("exact_mode", "exact"),
        };
    }

    if (searchMeta.mode === "contains") {
        const containsLabel = searchMeta.query
            ? `${fallbackLabel}: "${searchMeta.query}"`
            : searchMeta.exactText || fallbackLabel;

        return {
            label: containsLabel,
            mode: t("contains_mode", "contains"),
        };
    }

    return {
        label: searchMeta.query || searchMeta.exactText || fallbackLabel,
        mode: searchMeta.mode,
    };
}

function DataTransform(stockCategory, data, t) {
    if (!data) return null;
    if (isSnapshotPayload(data)) {
        return transformSnapshotData(stockCategory, data, t);
    }
    switch (stockCategory) {
        case "protectors":
            return data
                .filter((entry) => entry?.title?.includes("PROTEKTOR"))
                .reduce(
                    (acc, cur) => {
                        const { title, code, stock, plan, difference } = cur;
                        const diameter = productCategories[stockCategory].includes(
                            title.split(" ")[1],
                        )
                            ? title.split(" ")[1]
                            : t("other");

                        if (!acc[diameter]) {
                            acc[diameter] = {
                                diameter,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                            };
                        }
                        acc[diameter].stock += stock;
                        acc[diameter].plan += plan;
                        acc[diameter].difference += difference;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;

                        return acc;
                    },
                    { sum: { diameter: "Σ", stock: 0, plan: 0, difference: 0 } },
                );
        case "spirals":
            return data
                .filter((entry) => entry?.title?.includes("SPIRALA"))
                .reduce(
                    (acc, cur) => {
                        const { title, code, stock, plan, difference } = cur;
                        const diameter = productCategories[stockCategory].includes(
                            code.split(".")[1].substr(0, 3),
                        )
                            ? code.split(".")[1].substr(0, 3)
                            : t("other");

                        if (!acc[diameter]) {
                            acc[diameter] = {
                                diameter,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                            };
                        }
                        acc[diameter].stock += stock;
                        acc[diameter].plan += plan;
                        acc[diameter].difference += difference;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;

                        return acc;
                    },
                    {
                        sum: { diameter: "Σ", stock: 0, plan: 0, difference: 0 },
                    },
                );

        case "clips":
            return data
                .filter((entry) => entry?.title?.includes("SPONKA SESTAV"))
                .reduce(
                    (acc, cur) => {
                        const { title, code, stock, plan, difference } = cur;
                        const category = title.split("SPONKA SESTAV ")[1];

                        if (!acc[category]) {
                            acc[category] = {
                                category,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                            };
                        }
                        acc[category].stock += stock;
                        acc[category].plan += plan;
                        acc[category].difference += difference;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;

                        return acc;
                    },
                    { sum: { category: "Σ", stock: 0, plan: 0, difference: 0 } },
                );
        case "casts":
            return data
                .filter((entry) => {
                    return entry?.title?.includes("ULITEK");
                })
                .reduce(
                    (acc, cur) => {
                        const { title, code, stock, plan, difference } = cur;
                        const category = productCategories[stockCategory]?.includes(
                            title.split("ULITEK ")[1],
                        )
                            ? title.split("ULITEK ")[1]
                            : t("other");

                        if (!acc[category]) {
                            acc[category] = {
                                category,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                            };
                        }
                        acc[category].stock += stock;
                        acc[category].plan += plan;
                        acc[category].difference += difference;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;

                        return acc;
                    },
                    {
                        sum: { category: "Σ", stock: 0, plan: 0, difference: 0 },
                    },
                );
        case "rings":
            return data
                .filter((entry) => entry?.title?.includes("OBROČ"))
                .reduce(
                    (acc, cur) => {
                        const { title, code, stock, plan, difference } = cur;
                        const diameter = title.split("OBROČ ")[1];

                        if (!acc[diameter]) {
                            acc[diameter] = {
                                diameter,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                            };
                        }
                        acc[diameter].stock += stock;
                        acc[diameter].plan += plan;
                        acc[diameter].difference += difference;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;

                        return acc;
                    },
                    {
                        sum: { diameter: "Σ", stock: 0, plan: 0, difference: 0 },
                    },
                );
        case "fireclays":
            return data
                .filter((entry) => entry?.title?.includes("EGO"))
                .reduce(
                    (acc, cur) => {
                        const { title, furnace, stock, plan, difference, differenceFurnace } = cur;
                        const diameter = productCategories[stockCategory].includes(
                            title.split(" ")[3],
                        )
                            ? title.split(" ")[3]
                            : t("other");

                        if (!acc[diameter]) {
                            acc[diameter] = {
                                diameter,
                                furnace: 0,
                                stock: 0,
                                plan: 0,
                                difference: 0,
                                differenceFurnace: 0,
                            };
                        }

                        acc[diameter].furnace += furnace;
                        acc[diameter].stock += stock;
                        acc[diameter].plan += plan;
                        acc[diameter].difference += difference;
                        acc[diameter].differenceFurnace += differenceFurnace;

                        acc.sum.stock += stock;
                        acc.sum.plan += plan;
                        acc.sum.difference += difference;
                        acc.sum.furnace += furnace;
                        acc.sum.differenceFurnace += differenceFurnace;

                        return acc;
                    },
                    {
                        sum: {
                            diameter: "Σ",
                            stock: 0,
                            plan: 0,
                            difference: 0,
                            furnace: 0,
                            differenceFurnace: 0,
                        },
                    },
                );
        default:
            return null;
    }
}

function isSnapshotPayload(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.some(
        (entry) =>
            entry?.Total !== undefined ||
            entry?.total !== undefined ||
            entry?.PlannedTotal !== undefined ||
            entry?.plannedTotal !== undefined,
    );
}

function transformSnapshotData(stockCategory, data, t) {
    const rows = data.map((entry) => {
        const query = entry?.query || entry?.Query || "";
        const exactText = entry?.exactText || entry?.ExactText || "";
        const label = exactText || query || t(stockCategory);
        const stock = Number(entry?.total ?? entry?.Total ?? 0);
        const plan = Number(entry?.plannedTotal ?? entry?.PlannedTotal ?? 0);
        const difference = Number(
            entry?.plannedMinusDeliveredTotal ?? entry?.PlannedMinusDeliveredTotal ?? 0,
        );
        const furnace = Number(entry?.deliveredTotal ?? entry?.DeliveredTotal ?? 0);

        return {
            category: label,
            diameter: label,
            stock,
            plan,
            difference,
            furnace,
            differenceFurnace: difference - stock,
        };
    });

    const sumRow = rows.reduce(
        (acc, cur) => ({
            category: "Σ",
            diameter: "Σ",
            stock: acc.stock + cur.stock,
            plan: acc.plan + cur.plan,
            difference: acc.difference + cur.difference,
            furnace: acc.furnace + cur.furnace,
            differenceFurnace: acc.differenceFurnace + cur.differenceFurnace,
        }),
        {
            category: "Σ",
            diameter: "Σ",
            stock: 0,
            plan: 0,
            difference: 0,
            furnace: 0,
            differenceFurnace: 0,
        },
    );

    return [...rows, sumRow];
}

const productCategories = {
    protectors: ["145", "180", "220"],
    spirals: ["145", "180", "220"],
    fireclays: ["145", "180", "220"],
    casts: ["145", "180", "220"],
};
