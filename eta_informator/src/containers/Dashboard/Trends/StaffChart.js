import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { sl } from "date-fns/locale";
import { lightEventsColors, eventsColors } from "../../../theme/ChartColors";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const allowedIds = [8, 10, 14, 29, 31, 37, 65, 91, 104];

function StaffChart({ data, timeUnit, ...props }) {
    const { t } = useTranslation("labels");
    const categories = {
        8: t("maternity"),
        10: t("hour_use"),
        14: t("home_office"),
        29: t("leave"),
        31: t("special_leave"),
        37: t("sick"),
        65: t("isolation"),
        91: t("higher_force"),
        95: t("iso"),
        104: t("quarantine"),
    };
    const ids = new Set(
        Object.values(data?.data)?.reduce((acc, cur) => {
            Object.keys(cur?.events)?.forEach((event) => {
                acc.push(event);
            });
            return acc;
        }, []),
    );

    const datas = Array.from(ids)
        .filter((id) => allowedIds.includes(+id))
        .sort()
        .map((id) => {
            const entries = Object.values(data?.data);
            const sortedEntries = entries != undefined ? _.sortBy(entries, ["year", timeUnit]) : [];
            return {
                label: categories[+id] ? categories[+id] : id,
                data: sortedEntries?.map((entry) => {
                    return {
                        x:
                            timeUnit == "quarter"
                                ? dayjs().year(entry.year).quarter(entry.quarter).format("Q/YYYY")
                                : dayjs()
                                      .year(entry.year)
                                      .month(entry.month - 1)
                                      .format("MM/YYYY"),
                        y:
                            isNaN(entry.events[+id]) || entry.events[+id] == undefined
                                ? null
                                : entry.events[+id],
                    };
                }),
                backgroundColor: eventsColors[+id],
                borderColor: eventsColors[+id],
                fill: true,
            };
        });

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: "index",
            },
        },
        interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
        },
        scales: {
            x: {
                stacked: true,
                type: "time",
                adapters: {
                    date: {
                        locale: sl,
                    },
                },
                time: {
                    parser:
                        timeUnit === "quarter"
                            ? "Q/yyyy"
                            : timeUnit === "month"
                            ? "MM/yyyy"
                            : "dd/MM/yyyy",
                    unit: timeUnit,
                    tooltipFormat: props.tooltip || "PPPP",
                    stepSize: 1,
                    minUnit:
                        timeUnit === "quarter"
                            ? "quarter"
                            : timeUnit === "month"
                            ? "month"
                            : "millisecond",
                },
                title: {
                    display: true,
                    text: t("month"),
                },
            },
            y: {
                stacked: true,
                suggestedMin: 0,
                title: {
                    display: true,
                    text: t("number"),
                },
            },
        },
        elements: {
            bar: {
                tension: 0.4,
            },
        },
    };

    return (
        <div
            style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: "6px",
                height: "250px",
            }}
        >
            <Bar data={{ datasets: datas }} options={options} />
        </div>
    );
}

export default StaffChart;
