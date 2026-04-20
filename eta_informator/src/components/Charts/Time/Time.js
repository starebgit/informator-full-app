import dayjs from "dayjs";
import Chartjs from "chart.js/auto";
import { Line as RcLine, Bar as RcBar, getElementAtEvent } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { sl } from "date-fns/locale";
import { useRef } from "react";
import ChartColors, { lightChartColors } from "../../../theme/ChartColors";
import { useTranslation } from "react-i18next";

Chartjs.register(annotationPlugin);

function Line({ legend = true, ...props }) {
    const { t } = useTranslation("shopfloor");

    const chartRef = useRef(null);
    const todayAnnotation = {
        today: {
            type: "line",
            mode: "vertical",
            scaleID: "x",
            value: dayjs().startOf("day").toDate(),
            borderColor: "rgba(254, 95, 85,0.4)",
            borderWidth: 4,
        },
    };

    const format = (value) => {
        return props.indicator == "bad"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 1,
              }).format(value / 100)
            : props.indicator == "oee"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
              }).format(value / 100)
            : new Intl.NumberFormat("sl").format(value);
    };

    const labeledData = props.datasets
        ? props.datasets
        : {
              datasets: [
                  {
                      label: props.label,
                      data: props.data,
                      fill: false,
                      backgroundColor: props.color ? ChartColors[props.color] : "rgb(255, 99, 132)",
                      borderColor: props.color
                          ? lightChartColors[props.color]
                          : "rgb(255, 99, 132, 0.2)",
                  },
              ],
          };

    if (
        props?.maxAccidents &&
        !labeledData?.datasets?.some((ds) => ds.label === t("accicent_limit")) // ← guard: no duplicates
    ) {
        const ref = labeledData?.datasets[0]?.data; // reuse X values
        const monthsTotal = ref?.length || 12;
        const start = 0.83;
        const end = 10;
        const slope = (end - start) / (monthsTotal - 1 || 1);

        const limit = ref.map((pt, i) => ({
            x: typeof pt === "object" ? pt.x : i,
            y: Math.round((start + i * slope) * 100) / 100, // round to 1 decimal
        }));

        labeledData.datasets.push({
            label: t("accicent_limit"), // polite Slovene wording
            data: limit,
            fill: false,
            borderDash: [6, 6],
            borderColor: "rgba(234,20,60,0.7)",
            borderWidth: 4,
            pointRadius: 0,
            tension: 0, // straight line
        });
    }

    const onClickedHandler = (event) => {
        if (props.onPointClick) {
            const elements = getElementAtEvent(chartRef.current, event);
            if (elements.length > 0) {
                const { datasetIndex, index } = elements[0];
                const pointData = labeledData.datasets[datasetIndex].data[index];
                const legendLabel = labeledData.datasets[datasetIndex].label; // Include the dataset label
                props.onPointClick({ ...pointData, legendLabel });
            }
        }

        // Existing logic for setSelectedAccidents
        if (!props.setSelectedAccidents) return;
        const elements = getElementAtEvent(chartRef.current, event);
        if (props?.maxAccidents) {
            const useful = elements.filter(
                (el) => labeledData?.datasets[el.datasetIndex]?.label !== t("accicent_limit"),
            );
            if (!useful?.length) return;
        }
        const { datasets } = { ...labeledData };
        const indexes = elements.map((element) => {
            if (props?.showAllAccidentsUpToMonth) {
                const targetElement = datasets[element.datasetIndex].data[element.index];
                const aggregatedAccidents = [];
                for (let i = 0; i <= element.index; i++) {
                    aggregatedAccidents.push(...datasets[element.datasetIndex].data[i].accidents);
                }
                targetElement.accidents = aggregatedAccidents;
                return targetElement;
            } else {
                return datasets[element.datasetIndex].data[element.index];
            }
        });
        const [accident] = [...indexes];
        props.setSelectedAccidents(accident);
    };
    const displayFormats = {
        day: "d",
        ...(props.displayFormats || {}),
    };

    let options = {
        animation: false,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            labels: false,
            annotation: {
                annotations: {
                    ...(props.annotation ? { ...todayAnnotation } : {}),
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) {
                            label += ": ";
                        }
                        if (context.parsed.y !== null) {
                            label += format(context.parsed.y);
                        }
                        return label;
                    },
                    ...(props.tooltipCallbacks || {}),
                },
            },
            legend: {
                display: legend,
                labels: {
                    boxWidth: 30,
                },
            },
        },
        layout: {
            padding: {
                left: 20,
                right: 20,
                top: legend == false ? 20 : 0,
                bottom: 10,
            },
        },
        interaction: {
            mode: "index",
        },
        title: {
            display: props.title !== undefined,
            padding: 5,
            fontStye: "bold",
            fontSize: 12,
            text: props.title,
        },
        scales: {
            x: {
                stacked: props.stacked ? props.stacked : false,
                offset: props.type == "bar" ? true : false,
                type: "time",
                adapters: {
                    date: {
                        locale: sl,
                    },
                },
                time: {
                    displayFormats,
                    parser:
                        props.timeUnit === "quarter"
                            ? "Q/yyyy"
                            : props.timeUnit === "month"
                            ? "MM/yyyy"
                            : "dd/MM/yyyy",
                    unit: props.timeUnit,
                    tooltipFormat: props.tooltip || "PPPP",
                    stepSize: 1,
                    minUnit:
                        props.timeUnit === "quarter"
                            ? "quarter"
                            : props.timeUnit === "month"
                            ? "month"
                            : "millisecond",
                },
            },
            y: {
                stacked: props.stacked ? props.stacked : false,
                beginAtZero: props?.beginAtZero,
                suggestedMin: props.suggestedMin ? props.suggestedMin : 0,
                suggestedMax: props?.suggestedMax || null,
                ticks: {
                    maxTicksLimit: 10,
                    stepSize: props.step || null,
                },
                title: {
                    display: !!props.yTitle,
                    text: props.yTitle,
                    padding: 0,
                },
            },
        },
    };

    // transform data to non cumulative data
    let nonCumulativeLabeledData;
    if (props?.nonCumulative) {
        nonCumulativeLabeledData = transformToNonCumulative(labeledData);
    }
    useRef();

    const barData =
        props?.nonCumulative && nonCumulativeLabeledData ? nonCumulativeLabeledData : labeledData;
    const lineClick = props?.enableLineClick ? onClickedHandler : null;

    return props.type == "bar" ? (
        <RcBar ref={chartRef} onClick={onClickedHandler} data={barData} options={options} />
    ) : (
        <RcLine ref={chartRef} onClick={lineClick} data={labeledData} options={options} />
    );
}
export default Line;

function transformToNonCumulative(dataObj) {
    if (!dataObj || !Array.isArray(dataObj.datasets) || dataObj.datasets.length === 0) {
        return dataObj;
    }

    const result = JSON.parse(JSON.stringify(dataObj));

    const dataset = result.datasets[0];
    if (!dataset.data || !Array.isArray(dataset.data) || dataset.data.length === 0) {
        return result;
    }

    for (let i = result.datasets[0].data.length - 1; i > 0; i--) {
        let diff = result.datasets[0].data[i].y - result.datasets[0].data[i - 1].y;
        result.datasets[0].data[i].y = Math.max(0, diff);
    }

    return result;
}
