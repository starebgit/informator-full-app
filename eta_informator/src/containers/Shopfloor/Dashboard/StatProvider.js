import dayjs from "dayjs";
import { useQuery } from "react-query";
import Stat from "../../../components/Stats/Stat/Stat";
import client from "../../../feathers/feathers";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import worker from "../../../workers/workerFetcher";
import { useMemo } from "react";

function StatProvider({
    data = [],
    machineGroup,
    selectedDate,
    valueType,
    indicator,
    onClick,
    staticGroup,
    ...props
}) {
    const { t } = useTranslation(["shopfloor", "labels"]);
    // * fetch goals for given machine group
    const goals = useQuery(
        ["goals", machineGroup.id, selectedDate.format("DD-MM-YYYY")],
        async () => {
            return client
                .service("goals")
                .find({
                    query: {
                        machineGroupId: machineGroup.id,
                        $sort: {
                            updatedAt: 1,
                        },
                        $and: [
                            {
                                startDate: { $lte: selectedDate.toISOString() },
                            },
                            {
                                endDate: { $gte: selectedDate.toISOString() },
                            },
                        ],
                    },
                })
                .then((result) => {
                    const { data } = result;
                    return data;
                });
        },
    );

    const dataset = useQuery(
        ["grouped dataset", machineGroup.id, indicator],
        () => {
            let conditionedData = data;
            if (machineGroup.machineConditions.length > 0) {
                const regex = machineGroup.machineConditions.map((condition) => {
                    if (condition.exact) {
                        return new RegExp("^" + condition.value.replace(".", ".") + "$");
                    } else {
                        return new RegExp(condition.value.replace(".", "."));
                    }
                });
                conditionedData = data.filter((row) => {
                    return regex.some((rx) => rx.test(row.productF));
                });
            }
            const workerInst = worker();
            return workerInst
                .groupDataProvider(conditionedData, {
                    indicator: indicator,
                    category: "sum",
                    condense: false,
                    mapping: staticGroup ? "static" : "sinapro",
                })
                .then((response) => {
                    workerInst.terminate();
                    return response;
                })
                .catch((e) => console.log(e));
        },
        { enabled: !!data && data.length > 0 },
    );

    const dailySum = useMemo(() => {
        return dataset?.data?.[selectedDate.format("YYYY-MM-DD")] || null;
    }, [dataset, selectedDate]);
    const dailyGoals = useMemo(() => {
        return _.last(goals.data) || null;
    }, [goals]);

    const color = useMemo(() => {
        if (!dailyGoals || !dailySum) return "blue";
        if (dailyGoals && dailySum) {
            let goal = 0;
            let tolerance = 0;
            let goalTolerance = 0;
            switch (indicator) {
                case "quality":
                    goal = dailyGoals.qualityGoal;
                    tolerance = 1 + machineGroup.qualityTol * 0.01;
                    goalTolerance = goal * tolerance;
                    const value = ((dailySum["bad"] / dailySum["total"]) * 100).toFixed(2);
                    return value <= goalTolerance ? (value <= goal ? "green" : "orange") : "red";
                case "realization":
                    goal = dailyGoals.realizationGoal;
                    tolerance = 1 - machineGroup.realizationTol * 0.01;
                    goalTolerance = goal * tolerance;
                    return dailySum[valueType] >= goalTolerance
                        ? dailySum[valueType] >= goal
                            ? "green"
                            : "orange"
                        : "red";
                default:
                    break;
            }
        }
    }, [dailyGoals, dailySum, indicator, machineGroup, valueType]);

    const sparklineData = generateSparklineData(selectedDate, dataset?.data, valueType);
    return (
        <Stat
            onClick={onClick}
            selectedDate={selectedDate}
            value={
                dailySum
                    ? valueType == "percentage"
                        ? Intl.NumberFormat("sl", {
                              style: "percent",
                              minimumFractionDigits: 2,
                          }).format(dailySum["bad"] / dailySum["total"])
                        : Math.round(dailySum[valueType] * 10) / 10
                    : null
            }
            norm={
                isNaN(dailySum?.norm)
                    ? t("no_norm_data")
                    : valueType != "percentage"
                    ? Intl.NumberFormat("sl", { style: "percent" }).format(dailySum?.norm)
                    : ""
            }
            title={machineGroup.name}
            text={
                dailySum
                    ? valueType == "percentage"
                        ? t("scrap_percentage")
                        : machineGroup.hourly
                        ? t("labels:number_hours")
                        : t("number_of_produced")
                    : t("no_data")
            }
            color={color}
            data={sparklineData}
            isLoading={goals.isLoading || dataset.isLoading}
        />
    );
}
export default StatProvider;

function generateSparklineData(selectedDate, dailySums, valueType) {
    if (!dailySums) return [];
    let startOfMonth = selectedDate.startOf("month");
    const endOfMonth = selectedDate.endOf("month");
    const graphData = [];
    while (startOfMonth.isBefore(endOfMonth)) {
        const day = startOfMonth.format("YYYY-MM-DD");
        if (dailySums[day] && dailySums[day]["total"] != 0) {
            graphData.push({
                x: day + " GMT",
                y:
                    valueType == "percentage"
                        ? ((dailySums[day]["bad"] / dailySums[day]["total"]) * 100).toFixed(2)
                        : Math.round(dailySums[day][valueType] * 100) / 100,
            });
        } else {
            graphData.push({
                x: day + " GMT",
                y: 0,
            });
        }
        startOfMonth = startOfMonth.add(1, "day");
    }
    return graphData.length != 0 ? _.sortBy(graphData, (day) => day.x) : undefined;
}
