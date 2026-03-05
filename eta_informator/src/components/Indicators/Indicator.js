import ChartJS from "chart.js/auto";
import { Chart, getElementAtEvent } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import "chartjs-adapter-date-fns";
import { sl } from "date-fns/locale";
import React from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { useRef } from "react";
ChartJS.register(annotationPlugin);

function Indicator({
    datasets = { labels: [], datasets: [] },
    type,
    annotation = null,
    indicator,
    hourly,
    scrap = false,
    height = false,
    graphClick,
    norm = false,
    filterTooltip = false,
    isScrapGraph,
    category,
    ...props
}) {
    const averagePlugin = {
        id: "averagePlugin",
        afterDraw: (chart) => {
            const isScrapGraph = chart.options.plugins.averagePlugin.isScrapGraph;
            const category = chart.options.plugins.averagePlugin.category;
            if (category != "sum") {
                return;
            }

            const datasets = chart.config.data.datasets;
            if (!datasets?.length) return;

            const mainData = isScrapGraph
                ? datasets.find((d) => d.label === "Skupaj")?.data || []
                : datasets[0].data || [];

            const validPoints = mainData.filter((pt) => pt.y != null);
            if (!validPoints.length) return;

            const sum = validPoints.reduce((acc, pt) => acc + pt.y, 0);
            const monthlyAverage = sum / validPoints.length;
            if (isNaN(monthlyAverage)) return;
            if (monthlyAverage == 0) return;

            // Get chart area
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const centerX = (chartArea.left + chartArea.right) / 2 - 90;
            const centerY = chartArea.top + 20;

            if (!chartArea) return;
            ctx.save();
            ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
            ctx.font = "12px sans-serif";
            ctx.fillText(`Mesečno povprečje: ${monthlyAverage.toFixed(2)}`, centerX, centerY);
            ctx.restore();
        },
    };
    ChartJS.register(averagePlugin);

    const ref = useRef(null);
    const { t } = useTranslation("labels");
    let options = {
        locale: "sl",
        maintainAspectRatio: false,
        responsive: true,
        animation: false,
        plugins: {
            labels: false,
            tooltip: {
                mode: "index",
                callbacks: {
                    footer: (items) => {
                        const goal = _.find(items, (item) => {
                            return item?.dataset?.id == "goal";
                        });
                        const total = _.find(items, (item) => {
                            return item?.dataset?.id == "total";
                        });
                        if (goal && total) {
                            let diff = 0;
                            diff = total.parsed.y - goal.parsed.y;

                            return (
                                (diff < 0 ? "Doseganje: " : "Doseganje: +") +
                                new Intl.NumberFormat("sl").format(diff) +
                                " v kosih"
                            );
                        }
                        return "";
                    },
                    label: (context) => {
                        if (filterTooltip && context.raw.y == 0) return "";
                        const label = context.dataset.label;
                        const id = context.dataset.id;
                        let value = context.formattedValue;
                        const rawDate = datasets?.labels?.[context.dataIndex];
                        const date = rawDate
                            ? dayjs(rawDate, "DD/MM/YYYY").format("YYYY-MM-DD")
                            : "unknown";

                        const scrapByDay = Object.values(scrap[date] || {});
                        if (indicator == "quality" || indicator == "oee" || scrap) {
                            value = value.replace(",", ".");
                            value = new Intl.NumberFormat("sl", {
                                style: "percent",
                                minimumFractionDigits: indicator != "oee" ? "2" : "0",
                            }).format(+value / 100);
                        }
                        if (id == "norm") {
                            value = new Intl.NumberFormat("sl", {
                                style: "percent",
                                minimumFractionDigits: 0,
                            }).format(+value / 100);
                        }
                        const totalQuantity = scrapByDay.reduce((sum, material) => {
                            return (
                                sum +
                                +Object.values(material)
                                    .filter((scrap) => scrap.label == context.dataset.label)
                                    .reduce((sum, scrap) => sum + +scrap.quantity, 0)
                            );
                        }, 0);
                        return `${label}: ${value} ${totalQuantity ? `(${totalQuantity})` : ""}`;
                    },
                },
                itemSort: (a, b) => {
                    return b.raw.y - a.raw.y;
                },
            },
            legend: {
                display: true,
                labels: {
                    boxWidth: 20,
                },
            },
            averagePlugin: {
                isScrapGraph: isScrapGraph,
                category: category,
            },
            annotation: {
                annotations: {
                    ...annotation,
                    today:
                        annotation == true
                            ? {
                                  type: "line",
                                  mode: "vertical",
                                  scaleID: "x",
                                  value: dayjs().startOf("day").toDate(),
                                  borderColor: "rgba(254, 95, 85,0.4)",
                                  borderWidth: 4,
                              }
                            : null,
                },
            },
        },
        layout: {
            padding: {
                left: 30,
                right: 30,
                top: 0,
                bottom: 20,
            },
        },

        elements: {
            point: {
                hitRadius: 5,
            },
            line: {
                tension: 0.1,
            },
        },
        scales: {
            x: {
                stacked: false,
                offset: type == "bar" ? true : false,
                type: "time",
                adapters: {
                    date: {
                        locale: sl,
                    },
                },
                time: {
                    displayFormats: {
                        day: "d",
                    },
                    parser: "dd/MM/yyyy",
                    unit: "day",
                    tooltipFormat: "PPPP",
                    stepSize: 1,
                },
            },

            value: {
                stacked: type == "bar" ? false : false,
                min: 0,
                suggestedMax: indicator == "quality" ? 1.5 : indicator == "oee" ? 100 : null,
                stepSize: indicator == "quality" ? 0.5 : indicator == "oee" ? 10 : null,
                ticks: {
                    maxTicksLimit: 10,
                    precision: 0,
                },
                title: {
                    display: true,
                    text:
                        hourly && indicator != "oee"
                            ? t("number_hours")
                            : indicator == "quality"
                            ? t("percentage")
                            : indicator == "oee"
                            ? t("percentage_oee")
                            : scrap
                            ? t("percentage")
                            : t("number_parts"),
                },
                position: "left",
            },
            norm: {
                min: 0,
                type: "linear",
                position: "right",
                display: norm && type != "bar" && indicator != "static",
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    const chartType =
        type == "line" ? (
            <Chart
                type='line'
                ref={ref}
                data={datasets}
                datasetIdKey={_.random(0, 10000)}
                onClick={
                    graphClick
                        ? (event) => {
                              const [element] = getElementAtEvent(ref.current, event);
                              if (element) {
                                  const date = dayjs(
                                      datasets?.labels[element?.index],
                                      "DD/MM/YYYY",
                                  ).format("YYYY-MM-DD");
                                  const scrapByDay = scrap[date];
                                  graphClick(scrapByDay);
                              }
                          }
                        : null
                }
                //datasetKeyId={(datasets) => `${datasets?.label+_.random(0,1000)}`}
                options={options}
            ></Chart>
        ) : type == "bar" ? (
            <Chart
                type='bar'
                data={datasets}
                //datasetKeyId={(datasets) => `${datasets?.label+_.random(0,1000)}`}
                options={options}
            ></Chart>
        ) : null;
    return (
        <div
            style={
                height
                    ? {
                          position: "relative",
                          height: "100%",
                          minHeight: `${height}`,
                      }
                    : { position: "relative", height: "100%" }
            }
        >
            {chartType}
        </div>
    );
}
export default Indicator;
