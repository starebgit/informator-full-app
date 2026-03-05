import dayjs from "dayjs";
import { useQuery } from "react-query";
import { PulseLoader } from "react-spinners";
import client from "../../feathers/feathers";
import Indicator from "../Indicators/Indicator";
import _, { entries } from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import worker from "../../workers/workerFetcher";
import AggregateModal from "../AggregateModal/AggregateModal";
import { useMemo } from "react";

//* Gets data, wrangles it into Chart form and calls Indicators or Modals
function MachineGroupGraph({
    machines,
    indicator,
    category,
    valueType,
    machineGroupData,
    selectedMonth,
    machineGroup,
    goals = false,
    scrap,
    graphClick = null,
    option = {},
    machine = null,
    height,
    filterTooltip = false,
    isScrapGraph,
    ...props
}) {
    let startDay = selectedMonth.startOf("month");
    let endDay = selectedMonth.endOf("month");
    const { machineConditions: conditions } = machineGroup;
    const { t } = useTranslation("manual_input");
    const { labels, weeks } = useMemo(() => generateLabels(startDay, endDay), [startDay, endDay]);

    const allMachineGroupData = Array.isArray(machineGroupData)
        ? machineGroupData.map((entry) => ({
              ...entry,
              materialComponent: entry.materialComponent ?? entry.material_component ?? 0,
          }))
        : [];

    const filteredMachineGroupData = allMachineGroupData.filter(
        (entry) => !entry.materialComponent,
    );

    //* Fetches goals where startDay isBetween sDg and eDg or endDay is between sDg and eDg
    const goalsData = useQuery(
        ["goals", selectedMonth.format("MM-YYYY"), indicator, machineGroup.id],
        async () => {
            return client
                .service("goals")
                .find({
                    query: {
                        machineGroupId: machineGroup.id,
                        $or: [
                            {
                                $and: [
                                    { startDate: { $lte: startDay } },
                                    { endDate: { $gte: startDay } },
                                ],
                            },
                            {
                                startDate: {
                                    $lte: endDay,
                                },
                            },
                        ],
                    },
                })
                .then((result) => {
                    const { data } = result;
                    if (data.length === 0) {
                        return [];
                    }
                    const day = {};
                    let copyStartDay = startDay;
                    while (copyStartDay.isBefore(endDay)) {
                        day[copyStartDay.format("DD/MM/YYYY")] = undefined;
                        copyStartDay = copyStartDay.add(1, "day");
                    }

                    data.forEach((goal) => {
                        let goalStartDate = dayjs(goal.startDate);
                        let goalEndDate = dayjs(goal.endDate);
                        if (goalStartDate.isBefore(startDay))
                            goalStartDate = selectedMonth.startOf("month");
                        if (goalEndDate.isAfter(selectedMonth.endOf("month")))
                            goalEndDate = selectedMonth.endOf("month");
                        while (goalStartDate.isBefore(goalEndDate)) {
                            if (!(goalStartDate.day() === 0 || goalStartDate.day() === 6)) {
                                day[goalStartDate.format("DD/MM/YYYY")] =
                                    indicator === "quality"
                                        ? goal.qualityGoal
                                        : indicator == "oee"
                                        ? goal.oeeGoal
                                        : goal.realizationGoal;
                            }
                            goalStartDate = goalStartDate.add(1, "day");
                        }
                    });
                    const arre = [];
                    for (const [key, value] of Object.entries(day)) {
                        const i = dayjs(key, "DD/MM/YYYY").date();
                        arre.push({ x: key, y: value });
                    }
                    return arre;
                });
        },
        {
            enabled: !!goals && !scrap,
            staleTime: 5 * 60 * 1000,
        },
    );

    //* Generates datasets for Indicators
    const selectedDataset = useQuery(
        [
            "chart dataset",
            selectedMonth.format("MM-YYYY"),
            machineGroup.id,
            category,
            valueType,
            option,
            props.source,
            machine,
        ],
        () => {
            if (scrap) {
                const workerInst = worker();
                return workerInst
                    .scrapDatasetProvider(
                        filteredMachineGroupData, // <-- GRAF: samo 0 ali null
                        category,
                        selectedMonth.startOf("month").format("YYYY-MM-DD"),
                        selectedMonth.endOf("month").format("YYYY-MM-DD"),
                        option,
                        conditions,
                    )
                    .then((response) => {
                        workerInst.terminate();
                        return response;
                    })
                    .catch((e) => console.log(e));
            }
            const workerInst = worker();
            return workerInst
                .datasetProvider(filteredMachineGroupData, machines, {
                    indicator: indicator,
                    category: category,
                    valueType: valueType,
                    startDate: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    endDate: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    conditions: conditions,
                    mapping: machineGroup.static ? "static" : "sinapro",
                    norm: machineGroup.norm,
                })
                .then((response) => {
                    workerInst.terminate();
                    return response;
                })
                .catch((e) => console.log(e));
        },
        { enabled: !!machineGroupData, staleTime: !!scrap ? 0 : 5 * 60 * 1000 },
    );

    // TALE SCRAPDATASET NIMA PRAVIH PODATKOV, ALLMACHINEGROUPDATA IMA PRAVE PODATKE
    //* Used for scrap data
    const scrapDataset = useQuery(
        ["scrapByMaterial", selectedMonth.format("MM-YYYY"), machineGroup.id, "material", machine],
        () => {
            const workerInst = worker();
            return workerInst
                .scrapDatasetProvider(
                    allMachineGroupData, // <-- POŠLJI VSE, tudi tiste z 1!
                    "material",
                    selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    {},
                    conditions,
                )
                .then((response) => {
                    workerInst.terminate();
                    return response;
                });
        },
        {
            enabled: !!scrap,
            staleTime: 5 * 60 * 1000,
        },
    );

    //* Check if hooks are loading and display Loading component
    if (selectedDataset.isLoading || goalsData.isLoading || scrapDataset.isLoading) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );
    }

    //* Object for goal display on Quality chart
    const goalsDataset = [
        {
            label: t("goal"),
            id: "goal",
            type: "line",
            data: goalsData.data ? [...goalsData.data] : [],
            borderColor: indicator == "quality" ? "rgba(234,20,60, 0.5)" : "rgba(32,234,100, 0.5)",
            borderWidth: 3,
            borderDash: [5, 5],
            spanGaps: false,
            radius: 0,
            index: "goal",
        },
    ];

    if (selectedDataset.data == -1) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <h5>{t("parameter_no_data")}</h5>
            </div>
        );
    }

    const dataSet = {
        labels: labels,
        datasets: !!selectedDataset.data
            ? (category == "sum" || indicator == "oee") && goals
                ? [...selectedDataset.data, ...goalsDataset]
                : [...selectedDataset.data]
            : [{ label: "error", data: [{}] }],
    };
    if (selectedDataset.isError || goalsData.isError || scrapDataset.isError) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <FontAwesomeIcon icon='times-circle' size='2x' color='red' />
            </div>
        );
    }

    if (selectedDataset.isSuccess) {
        // Log scrap podatke pred uporabo v Indicator
        /*if (scrapDataset.data) {
            console.log("[MachineGroupGraph] scrapDataset.data:", scrapDataset.data);
        }*/
        return (
            <div style={{ height: "95%" }}>
                <div className='h-100'>
                    {category === "machine" || category === "shift" ? (
                        <Indicator
                            indicator={indicator}
                            type='bar'
                            datasets={dataSet}
                            annotation={selectedMonth.isSame(dayjs(), "month")}
                            hourly={machineGroup.hourly}
                            scrap={scrap}
                            filterTooltip={filterTooltip}
                            isScrapGraph={isScrapGraph}
                            category={category}
                        />
                    ) : (
                        <Indicator
                            graphClick={graphClick}
                            indicator={indicator}
                            type='line'
                            datasets={dataSet}
                            annotation={selectedMonth.isSame(dayjs(), "month")}
                            hourly={machineGroup.hourly}
                            scrap={scrapDataset.data} // <-- tu so vsi podatki!
                            height={height}
                            norm={machineGroup.norm}
                            filterTooltip={filterTooltip}
                            isScrapGraph={isScrapGraph}
                            category={category}
                        />
                    )}
                </div>
                {props.selectedMachineGroup?.id == machineGroup?.id ? (
                    <div>
                        <AggregateModal
                            weeks={weeks}
                            selectedMonth={selectedMonth}
                            labels={labels}
                            monthData={dataSet}
                            machineGroup={machineGroup}
                            indicator={indicator}
                            data={filteredMachineGroupData}
                            machines={machines}
                            showModal={props.showModal}
                            setShowModal={props.setShowModal}
                        />
                    </div>
                ) : null}
            </div>
        );
    }

    if (selectedDataset.isIdle || goalsData.isIdle || scrapDataset.isIdle) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );
    }
}
export default MachineGroupGraph;

function generateLabels(startDay, endDay) {
    const weeks = [];
    const labels = [];

    let copyStartDay = startDay;
    while (copyStartDay.isBefore(endDay)) {
        labels.push(copyStartDay.format("DD/MM/YYYY"));
        const week = copyStartDay.isoWeek();
        if (!weeks.includes(week)) weeks.push(week);
        copyStartDay = copyStartDay.add(1, "day");
    }
    return { labels, weeks };
}
