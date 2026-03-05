import dayjs from "dayjs";
import {
    Chart as ChartJS,
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import ToggleGroup from "../../ToggleGroup/ToggleGroup";
import { useMemo, useState } from "react";
import { Card, Row } from "react-bootstrap";
import DatePicker from "../../Forms/CustomInputs/DatePicker/DatePicker";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import randomColor from "randomcolor";
import ChartDataLabels from "chartjs-plugin-datalabels";
import _ from "lodash";
ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController,
);

const timeWindowButtons = [
    { name: "month", value: "month" },
    { name: "week", value: "week" },
    { name: "day", value: "day" },
];
const shiftButtons = [
    { name: "all", value: 0 },
    { name: "1", value: 1 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
];

function ParetoModal({
    repair,
    query,
    machineGroup,
    setSelectedMonth,
    selectedMonth,
    productionData,
    ...props
}) {
    const { t } = useTranslation("shopfloor");

    const [selectedTimewindow, setSelectedTimewindow] = useState(getDefaultTimewindow());
    const [selectedDate, setSelectedDate] = useState(getDefaultDate());
    const [selectedShift, setSelectedShift] = useState(0);
    const [selectedMachine, setSelectedMachine] = useState(0);

    const machineButtons = useMemo(() => {
        const machines = machineGroup?.machines
            .map((machine) => ({
                name: machine.name,
                value: machine.machineAltKey,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return [{ name: "all", value: 0 }, ...machines];
    }, [machineGroup]);

    const productionTotal = useMemo(
        () =>
            productionData.reduce(
                (acc, cur) => {
                    if (selectedShift != 0 && cur.shift != selectedShift) return acc;
                    const date = dayjs(cur.date);
                    const week = date.isoWeek();
                    const month = date.month();
                    const year = date.year();
                    const day = date.format("YYYY-MM-DD");

                    if (!acc[cur.machineKeyAlt]) {
                        acc[cur.machineKeyAlt] = { day: {}, week: {}, month: {}, year: {} };
                    }

                    if (!acc["0"]["day"][day]) {
                        acc["0"]["day"][day] = 0;
                    }

                    if (!acc["0"]["week"][week]) {
                        acc["0"]["week"][week] = 0;
                    }

                    if (!acc["0"]["month"][month]) {
                        acc["0"]["month"][month] = 0;
                    }

                    if (!acc["0"]["year"][year]) {
                        acc["0"]["year"][year] = 0;
                    }

                    if (!acc[cur.machineKeyAlt]["day"][day]) {
                        acc[cur.machineKeyAlt]["day"][day] = 0;
                    }

                    if (!acc[cur.machineKeyAlt]["week"][week]) {
                        acc[cur.machineKeyAlt]["week"][week] = 0;
                    }

                    if (!acc[cur.machineKeyAlt]["month"][month]) {
                        acc[cur.machineKeyAlt]["month"][month] = 0;
                    }

                    if (!acc[cur.machineKeyAlt]["year"][year]) {
                        acc[cur.machineKeyAlt]["year"][year] = 0;
                    }

                    acc[cur.machineKeyAlt]["day"][day] += +cur.quantity || 0;
                    acc[cur.machineKeyAlt]["week"][week] += +cur.quantity || 0;
                    acc[cur.machineKeyAlt]["month"][month] += +cur.quantity || 0;
                    acc[cur.machineKeyAlt]["year"][year] += +cur.quantity || 0;
                    acc["0"]["day"][day] += +cur.quantity || 0;
                    acc["0"]["week"][week] += +cur.quantity || 0;
                    acc["0"]["month"][month] += +cur.quantity || 0;
                    acc["0"]["year"][year] += +cur.quantity || 0;

                    return acc;
                },
                { 0: { day: {}, week: {}, month: {}, year: {} } },
            ),
        [productionData, selectedShift],
    );

    const allMachinesData = query?.data?.reduce((acc, entry) => {
        if (selectedShift != 0 && entry.shift != selectedShift) return acc;
        const date = dayjs(entry.date);
        const week = date.isoWeek();
        const month = date.month();
        const year = date.year();

        const flawId = entry.typeId;
        const flawLabel = entry.typeLabel;

        if (!acc[entry.machineIdAlt]) {
            acc[entry.machineIdAlt] = { day: {}, week: {}, month: {}, year: {}, total: {} };
        }

        if (!acc["0"]) {
            acc["0"] = { day: {}, week: {}, month: {}, year: {}, total: {} };
        }

        //Scraps per day
        if (!acc[entry.machineIdAlt].day[date.format("YYYY-MM-DD")]) {
            acc[entry.machineIdAlt].day[date.format("YYYY-MM-DD")] = {};
        }

        if (!acc[entry.machineIdAlt].day[date.format("YYYY-MM-DD")][flawId]) {
            acc[entry.machineIdAlt].day[date.format("YYYY-MM-DD")][flawId] = {
                value: 0,
                label: flawLabel,
            };
        }

        acc[entry.machineIdAlt].day[date.format("YYYY-MM-DD")][flawId].value += entry.quantity;

        if (!acc["0"].day[date.format("YYYY-MM-DD")]) {
            acc["0"].day[date.format("YYYY-MM-DD")] = {};
        }

        if (!acc["0"].day[date.format("YYYY-MM-DD")][flawId]) {
            acc["0"].day[date.format("YYYY-MM-DD")][flawId] = {
                value: 0,
                label: flawLabel,
            };
        }

        acc["0"].day[date.format("YYYY-MM-DD")][flawId].value += entry.quantity;

        // Scraps per week
        if (!acc[entry.machineIdAlt].week[week]) {
            acc[entry.machineIdAlt].week[week] = {};
        }

        if (!acc[entry.machineIdAlt].week[week][flawId]) {
            acc[entry.machineIdAlt].week[week][flawId] = { value: 0, label: flawLabel };
        }

        acc[entry.machineIdAlt].week[week][flawId].value += entry.quantity;

        if (!acc["0"].week[week]) {
            acc["0"].week[week] = {};
        }

        if (!acc["0"].week[week][flawId]) {
            acc["0"].week[week][flawId] = { value: 0, label: flawLabel };
        }

        acc["0"].week[week][flawId].value += entry.quantity;

        // Scraps per month
        if (!acc[entry.machineIdAlt].month[month]) {
            acc[entry.machineIdAlt].month[month] = {};
        }

        if (!acc[entry.machineIdAlt].month[month][flawId]) {
            acc[entry.machineIdAlt].month[month][flawId] = {
                value: 0,
                label: flawLabel,
            };
        }

        acc[entry.machineIdAlt].month[month][flawId].value += entry.quantity;

        if (!acc["0"].month[month]) {
            acc["0"].month[month] = {};
        }

        if (!acc["0"].month[month][flawId]) {
            acc["0"].month[month][flawId] = {
                value: 0,
                label: flawLabel,
            };
        }

        acc["0"].month[month][flawId].value += entry.quantity;

        // Scraps per year
        if (!acc[entry.machineIdAlt].year[year]) {
            acc[entry.machineIdAlt].year[year] = {};
        }

        if (!acc[entry.machineIdAlt].year[year][flawId]) {
            acc[entry.machineIdAlt].year[year][flawId] = { value: 0, label: flawLabel };
        }

        acc[entry.machineIdAlt].year[year][flawId].value += entry.quantity;

        if (!acc["0"].year[year]) {
            acc["0"].year[year] = {};
        }

        if (!acc["0"].year[year][flawId]) {
            acc["0"].year[year][flawId] = { value: 0, label: flawLabel };
        }

        acc["0"].year[year][flawId].value += entry.quantity;

        return acc;
    }, {});

    const selectedData = {
        day: allMachinesData[selectedMachine]?.day[dayjs(selectedDate).format("YYYY-MM-DD")],
        month: allMachinesData[selectedMachine]?.month[dayjs(selectedDate).month()],
        week: allMachinesData[selectedMachine]?.week[dayjs(selectedDate).isoWeek()],
        year: allMachinesData[selectedMachine]?.year[dayjs().year()],
    };

    const selectedTotal =
        productionTotal?.[selectedMachine][selectedTimewindow][
            selectedTimewindow == "day"
                ? dayjs(selectedDate).format("YYYY-MM-DD")
                : selectedTimewindow == "week"
                ? dayjs(selectedDate).isoWeek()
                : dayjs(selectedDate).month()
        ];

    const selectedScrapTotal = getScrapTotal(
        allMachinesData,
        selectedTimewindow,
        selectedDate,
        selectedMachine,
    );

    function getDefaultDate() {
        if (selectedMonth.month() !== dayjs().month()) return selectedMonth.toDate();
        return dayjs().day() == 1
            ? selectedMonth.subtract(3, "day").toDate()
            : selectedMonth.subtract(1, "day").toDate();
    }

    function getDefaultTimewindow() {
        if (selectedMonth.month() !== dayjs().month()) return "month";
        return "day";
    }

    function getTotal(machine = "0") {
        try {
            return productionTotal[machine][selectedTimewindow][
                selectedTimewindow == "day"
                    ? dayjs(selectedDate).format("YYYY-MM-DD")
                    : selectedTimewindow == "week"
                    ? dayjs(selectedDate).isoWeek()
                    : dayjs(selectedDate).month()
            ];
        } catch (e) {
            return 0;
        }
    }

    const chartData = {
        //Labels are all the different labels inside our data
        labels:
            selectedData[selectedTimewindow] &&
            Object.values(selectedData[selectedTimewindow])
                .sort((a, b) => b.value - a.value)
                .map((entry) => entry.label),
        datasets: [
            {
                type: "bar",
                label: repair ? t("repair") : t("scrap"),
                backgroundColor:
                    selectedData[selectedTimewindow] &&
                    Object.values(selectedData[selectedTimewindow])
                        .sort((a, b) => b.value - a.value)
                        .map((entry) => {
                            return randomColor({
                                format: "dark",
                                seed: entry.label + entry.label || "",
                                alpha: 0.75,
                            });
                        }),
                data:
                    selectedData[selectedTimewindow] &&
                    Object.values(selectedData[selectedTimewindow])
                        .sort((a, b) => b.value - a.value)
                        .map((entry) => {
                            return {
                                y: (entry.value / getTotal(selectedMachine)) * 100,
                                exactValue: entry.value,
                                x: entry.label,
                            };
                        }),
                borderColor: "white",
                borderWidth: 2,
            },
        ],
    };

    function getTotalScrap(selectedData) {
        if (!selectedData || !selectedData[selectedTimewindow]) return 0;
        const value = Object.values(selectedData[selectedTimewindow]).reduce(
            (acc, cur) => acc + cur.value,
            0,
        );
        return value || 0;
    }

    return (
        <>
            <div className='d-flex justify-content-between flex-wrap mb-2'>
                <div>
                    <label className='small mb-2'>{t("shift")}</label>
                    <ToggleGroup
                        title='pareto_chart_shift'
                        buttons={shiftButtons}
                        selectedButton={selectedShift}
                        onSelected={setSelectedShift}
                    />
                </div>
                <div>
                    <label className='small'>{t("time_window")}</label>
                    <div className='d-flex gap-2 align-items-center'>
                        <ToggleGroup
                            buttons={timeWindowButtons}
                            selectedButton={selectedTimewindow}
                            onSelected={setSelectedTimewindow}
                            title={"pareto_chart_timewindow"}
                        />
                        <DatePicker
                            maxDate={dayjs().toDate()}
                            selected={selectedDate}
                            onSelect={(date) => {
                                setSelectedMonth(date);
                                setSelectedDate(date);
                            }}
                            showWeekNumbers
                            showMonthYearPicker={selectedTimewindow == "month"}
                            dateFormat={
                                selectedTimewindow == "month"
                                    ? "MMMM"
                                    : selectedTimewindow == "week"
                                    ? "II"
                                    : "dd/MM/yyyy"
                            }
                            dayClassName={(date) =>
                                dayjs(date).isSame(dayjs(selectedDate), "week")
                                    ? "react-datepicker__week--selected"
                                    : ""
                            }
                        />
                    </div>
                </div>
            </div>
            <Card>
                <Card.Body>
                    <div className='d-flex gap-2 align-items-center justify-content-between'>
                        <div className='d-flex gap-4'>
                            {selectedTotal && selectedScrapTotal && (
                                <>
                                    <div className='d-flex flex-column align-items-end'>
                                        <label className='small'>{t("produced")}</label>
                                        {selectedTotal}
                                    </div>
                                    <div className='d-flex flex-column align-items-end'>
                                        <label className='small'>
                                            {repair ? t("repair") : t("scrap")}
                                        </label>
                                        {selectedScrapTotal}
                                    </div>
                                    <div className='d-flex flex-column align-items-end'>
                                        <label className='small'>
                                            {repair ? t("relative_repair") : t("relative_scrap")}
                                        </label>
                                        {new Intl.NumberFormat("sl", {
                                            style: "percent",
                                            minimumFractionDigits: "2",
                                        }).format(selectedScrapTotal / selectedTotal)}
                                    </div>
                                </>
                            )}
                        </div>
                        <div>
                            <label className='small'>{t("machine")}</label>
                            <ToggleGroup
                                title='pareto_chart_machine'
                                breakpoint='xs'
                                buttons={machineButtons}
                                selectedButton={selectedMachine}
                                onSelected={setSelectedMachine}
                            />
                        </div>
                    </div>
                    {query?.isLoading ? (
                        <div
                            style={{ minHeight: "512px" }}
                            className='d-flex h-100 justify-content-center align-items-center'
                        >
                            <PulseLoader color='#2c3e50' size={15} margin={10} />
                        </div>
                    ) : !!selectedData[selectedTimewindow] ? (
                        <Chart
                            type='bar'
                            data={chartData}
                            plugins={[ChartDataLabels]}
                            options={{
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        mode: "index",
                                        intersect: false,
                                        callbacks: {
                                            label: function (context) {
                                                const label = context.dataset.label;
                                                let value = context.formattedValue.replace(
                                                    ",",
                                                    ".",
                                                );
                                                value = new Intl.NumberFormat("sl-SI", {
                                                    style: "percent",
                                                    minimumFractionDigits: "2",
                                                }).format(+value / 100);
                                                return `${label}: ${value} (${context.raw.exactValue})`;
                                            },
                                        },
                                    },
                                    datalabels: {
                                        display: (context) => {
                                            const value = context.dataset.data[context.dataIndex];
                                            return value.y > 0.2;
                                        },
                                        backgroundColor: "#FFFFFFAA",
                                        color: "black",
                                        font: {
                                            weight: "bold",
                                        },
                                        textAlign: "center",
                                        formatter: function (value) {
                                            return (
                                                new Intl.NumberFormat("sl", {
                                                    style: "percent",
                                                    minimumFractionDigits: "2",
                                                }).format(+value.y / 100) +
                                                "\n(" +
                                                value.exactValue +
                                                ")"
                                            );
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        suggestedMax: 1,
                                    },
                                },
                                animations: false,
                                parsing: {
                                    key: {
                                        yAxisKey: "value",
                                        xAxisKey: "label",
                                    },
                                },
                            }}
                        />
                    ) : (
                        <div
                            className='w-100 d-flex justify-content-center align-items-center'
                            style={{ minHeight: "500px" }}
                        >
                            <div>{t("no_data")}</div>
                        </div>
                    )}
                    <Row>
                        {machineGroup?.machines
                            ?.sort((a, b) => Intl.Collator("sl").compare(a.name, b.name))
                            .map((machine) => {
                                const selectedData = {
                                    day: allMachinesData[machine.machineAltKey]?.day[
                                        dayjs(selectedDate).format("YYYY-MM-DD")
                                    ],
                                    month: allMachinesData[machine.machineAltKey]?.month[
                                        dayjs(selectedDate).month()
                                    ],
                                    week: allMachinesData[machine.machineAltKey]?.week[
                                        dayjs(selectedDate).isoWeek()
                                    ],
                                    year: allMachinesData[machine.machineAltKey]?.year[
                                        dayjs().year()
                                    ],
                                };

                                const parreto = {
                                    //Labels are all the different labels inside our data
                                    labels:
                                        selectedData[selectedTimewindow] &&
                                        Object.values(selectedData[selectedTimewindow])
                                            .sort((a, b) => b.value - a.value)
                                            .map((entry) => entry.label),
                                    datasets: [
                                        {
                                            type: "bar",
                                            label: "Izmet",
                                            backgroundColor:
                                                selectedData[selectedTimewindow] &&
                                                Object.values(selectedData[selectedTimewindow])
                                                    .sort((a, b) => b.value - a.value)
                                                    .map((entry) => {
                                                        return randomColor({
                                                            format: "dark",
                                                            seed: entry.label + entry.label || "",
                                                            alpha: 0.75,
                                                        });
                                                    }),
                                            data:
                                                selectedData[selectedTimewindow] &&
                                                Object.values(selectedData[selectedTimewindow])
                                                    .sort((a, b) => b.value - a.value)
                                                    .map((entry) => {
                                                        return {
                                                            y:
                                                                (entry.value /
                                                                    getTotal(
                                                                        machine.machineAltKey,
                                                                    )) *
                                                                100,
                                                            exactValue: entry.value,
                                                            x: entry.label,
                                                        };
                                                    }),
                                            borderColor: "white",
                                            borderWidth: 2,
                                        },
                                    ],
                                };

                                return (
                                    <div
                                        className='col-12 col-lg-6 p-4'
                                        key={"parreto_" + machine.machineAltKey}
                                    >
                                        <div className='d-flex justify-content-between'>
                                            <div>{machine.name}</div>
                                            <div className='d-flex gap-3'>
                                                <div>
                                                    <label className='me-1 text-muted'>
                                                        {t("produced")}
                                                    </label>
                                                    {getTotal(machine.machineAltKey)}
                                                </div>
                                                <div>
                                                    <label className='me-1 text-muted'>
                                                        {repair ? t("repair") : t("scrap")}
                                                    </label>
                                                    {getTotalScrap(selectedData)}
                                                </div>
                                            </div>
                                        </div>
                                        <Chart
                                            type='bar'
                                            data={parreto}
                                            plugins={[ChartDataLabels]}
                                            options={{
                                                plugins: {
                                                    legend: {
                                                        display: false,
                                                    },
                                                    tooltip: {
                                                        mode: "index",
                                                        intersect: false,
                                                        callbacks: {
                                                            label: function (context) {
                                                                const label = context.dataset.label;
                                                                let value =
                                                                    context.formattedValue.replace(
                                                                        ",",
                                                                        ".",
                                                                    );
                                                                value = new Intl.NumberFormat(
                                                                    "sl",
                                                                    {
                                                                        style: "percent",
                                                                        minimumFractionDigits: "2",
                                                                    },
                                                                ).format(+value / 100);

                                                                return `${label}: ${value} (${context.raw.exactValue})`;
                                                            },
                                                        },
                                                    },
                                                    datalabels: {
                                                        display: (context) => {
                                                            const value =
                                                                context.dataset.data[
                                                                    context.dataIndex
                                                                ];
                                                            return value.y > 0.2;
                                                        },
                                                        backgroundColor: "#FFFFFFAA",
                                                        color: "black",
                                                        font: {
                                                            weight: "bold",
                                                        },
                                                        textAlign: "center",
                                                        formatter: function (value) {
                                                            return (
                                                                new Intl.NumberFormat("sl", {
                                                                    style: "percent",
                                                                    minimumFractionDigits: "2",
                                                                }).format(+value.y / 100) +
                                                                "\n(" +
                                                                value.exactValue +
                                                                ")"
                                                            );
                                                        },
                                                    },
                                                },
                                                scales: {
                                                    y: {
                                                        suggestedMax: 1,
                                                    },
                                                    x: {
                                                        display: false,
                                                    },
                                                },
                                                animations: false,
                                                parsing: {
                                                    key: {
                                                        yAxisKey: "value",
                                                        xAxisKey: "label",
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                );
                            })}
                    </Row>
                </Card.Body>
            </Card>
        </>
    );
}

export default ParetoModal;

function getScrapTotal(data, selectedTimewindow, selectedDate, selectedMachine) {
    const dataObject =
        data?.[selectedMachine]?.[selectedTimewindow]?.[
            selectedTimewindow == "day"
                ? dayjs(selectedDate).format("YYYY-MM-DD")
                : selectedTimewindow == "week"
                ? dayjs(selectedDate).isoWeek()
                : dayjs(selectedDate).month()
        ];

    if (!dataObject) return null;
    return Object.values(dataObject)?.reduce((sum, entry) => {
        if (!isNaN(entry.value)) return sum + entry.value;
        return sum;
    }, 0);
}
