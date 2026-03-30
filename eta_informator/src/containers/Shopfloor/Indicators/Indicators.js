import React, { useContext } from "react";
import { Row, Button } from "react-bootstrap";
import { useLastIndicator } from "../../../data/ReactQuery";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useAccidentsByYear } from "../../../data/ReactQuery";
import { useQuery } from "react-query";
import client from "../../../feathers/feathers";
import { getEvents } from "../../../data/API/Spica/SpicaAPI";
import { useEffect } from "react";
import { sinaproClient } from "../../../feathers/feathers";
import worker from "../../../workers/workerFetcher";
import { useMachineGroups } from "../../../data/ReactQuery";
import { useFoundryForms } from "../../../data/ReactQuery";
import SfmBoard from "./SfmBoard";
import { getTedQueryList } from "../../../utils/shopfloor/ted";

// const imageSource = new URL(`http://${process.env.REACT_APP_INFORMATOR}/`);

function Indicators(props) {
    const [foundryWeekColors, setFoundryWeekColors] = React.useState({});

    const foundryForms = useFoundryForms(dayjs().startOf("year"), dayjs());
    useEffect(() => {
        if (props.selectedUnit?.subunitId !== 11) return;

        if (!foundryForms?.data?.length) return;

        const GOAL_PER_DAY = 970 * 2; // 2 shifts
        const WEEK_DAYS = 5;
        const WEEKLY_GOAL = GOAL_PER_DAY * WEEK_DAYS;

        const dailyMap = {};

        foundryForms.data.forEach((entry) => {
            const dateStr = dayjs(entry.date).format("YYYY-MM-DD");
            dailyMap[dateStr] ??= 0;
            dailyMap[dateStr] += entry.quantity || 0;
        });

        const weeklyMap = {};

        Object.entries(dailyMap).forEach(([dateStr, value]) => {
            const date = dayjs(dateStr);
            const week = date.isoWeek();
            const day = date.day(); // 0 = Sunday, 6 = Saturday

            if (day >= 1 && day <= 5) {
                weeklyMap[week] ??= { days: {}, total: 0 };
                weeklyMap[week].days[dateStr] = value;
                weeklyMap[week].total += value;
            }
        });

        const finalColors = {};

        Object.entries(weeklyMap).forEach(([week, { days, total }]) => {
            if (Object.keys(days).length !== 5) return;

            finalColors[week] = total >= WEEKLY_GOAL ? "#3aaa35" : "#e03c31"; // green or red
        });

        // console.log("====== 💥 LIVARNA COSTS KPI (C) ======");
        // Object.entries(weeklyMap).forEach(([week, { days, total }]) => {
        //     if (Object.keys(days).length !== 5) return;

        //     const color = total >= WEEKLY_GOAL ? "#3aaa35" : "#e03c31";
        //     finalColors[week] = color;

        //     // 🔍 Debug log for chart comparison
        //     const percent = (total / WEEKLY_GOAL) * 100;
        //     console.log(`\n📅 Week ${week}: ${color === "#3aaa35" ? "🟢 green" : "🔴 red"}`);
        //     Object.entries(days).forEach(([d, v]) => {
        //         console.log(`   ${d}: ${Math.round(v)} pcs`);
        //     });
        //     console.log(
        //         `   ➤ Total: ${Math.round(total)} | Goal: ${WEEKLY_GOAL} | ${percent.toFixed(1)}%`,
        //     );
        // });

        setFoundryWeekColors(finalColors);
    }, [foundryForms?.data, props.selectedUnit?.subunitId]);

    const startDay = dayjs().startOf("year");
    const endDay = dayjs();

    const [costWeekColors, setCostWeekColors] = React.useState({});

    const realizationMachineGroups = useMachineGroups(props.selectedUnit?.subunitId);
    const selectedMonth = dayjs();

    const sinaproData = useQuery(
        ["production", "YTD", props.selectedUnit.ted],
        async () => {
            const tedIds = getTedQueryList(props.selectedUnit.ted);
            const responses = await Promise.all(
                tedIds.map((tedId) =>
                    sinaproClient.service("machine-production").find({
                        query: {
                            start: startDay.format("YYYY-MM-DD"),
                            end: endDay.format("YYYY-MM-DD"),
                            ted: tedId + "",
                            $limit: 10000,
                        },
                    }),
                ),
            );

            return {
                data: responses.flatMap((response) => response.data),
            };
        },
        { enabled: !!props.selectedUnit?.ted },
    );

    const staticData = useQuery(
        ["static", "YTD", props.selectedUnit.subunitId],
        () => {
            return client
                .service("production-data-static")
                .find({
                    query: {
                        date: {
                            $gte: startDay.format("YYYY-MM-DD"),
                            $lte: endDay.format("YYYY-MM-DD"),
                        },
                    },
                })
                .then((res) => res.data);
        },
        { enabled: !!props.selectedUnit?.subunitId },
    );

    const relevantGroups = realizationMachineGroups.data?.filter((g) => g.realization);

    const { data: realizationGoals } = useQuery(
        ["realization-goals", "YTD", props.selectedUnit?.subunitId],
        async () => {
            if (!relevantGroups?.length) return [];

            const allGoals = [];

            for (const group of relevantGroups) {
                const result = await client.service("goals").find({
                    query: {
                        machineGroupId: group.id,
                        $or: [
                            {
                                $and: [
                                    { startDate: { $lte: endDay.toISOString() } },
                                    { endDate: { $gte: startDay.toISOString() } },
                                ],
                            },
                        ],
                        $limit: 1000,
                    },
                });

                allGoals.push({
                    machineGroupId: group.id,
                    goals: result.data,
                });
            }

            return allGoals;
        },
        { enabled: !!props.selectedUnit?.subunitId && !!relevantGroups?.length },
    );

    const dailyTotals = {};

    useEffect(() => {
        if (!sinaproData.data || !staticData.data || !relevantGroups) return;

        const currentYear = dayjs().year();
        const groupMap = {};

        // Map both static and non-static keys to group names
        relevantGroups.forEach((group) => {
            if (group.static && group.machineGroupsGroups?.length) {
                group.machineGroupsGroups.forEach((gr) => {
                    groupMap[`static-${gr.groupId}`] = `static-${gr.groupId}`;
                });
            } else {
                group.machines?.forEach((machine) => {
                    const key = `sinapro-${machine.machineAltKey}`;
                    groupMap[key] ??= [];
                    groupMap[key].push(group.id);
                });
            }
        });

        // Process STATIC data
        staticData.data.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupName = groupMap[`static-${item.groupsStaticId}`];

            if (!groupName) return;

            const dateStr = date.format("YYYY-MM-DD");

            const groupKey = `static-${item.groupsStaticId}`;
            const groupId = groupMap[groupKey];

            dailyTotals[groupId] ??= {};
            dailyTotals[groupId][dateStr] ??= 0;
            dailyTotals[groupId][dateStr] += item.total || 0;
        });

        // Process SINAPRO data
        sinaproData.data.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupIds = groupMap[`sinapro-${item.machineKeyAlt}`];
            if (!groupIds) return;

            const dateStr = date.format("YYYY-MM-DD");

            const valueToAdd = (item.good || 0) + (item.scrap || 0);
            const sharedCount = groupIds.length;

            groupIds.forEach((groupId) => {
                dailyTotals[groupId] ??= {};
                dailyTotals[groupId][dateStr] ??= 0;
                dailyTotals[groupId][dateStr] += valueToAdd / sharedCount;
            });
        });
    }, [sinaproData.data, staticData.data, relevantGroups]);

    function computeWeeklyAverages(dailyTotals, realizationGoals, currentYear) {
        const result = [];

        // Build map: groupId -> { date: {goal, updatedAt} }
        const goalMap = {};

        realizationGoals?.forEach((groupEntry) => {
            const groupId = groupEntry.machineGroupId;
            groupEntry.goals.forEach((goal) => {
                const start = dayjs(goal.startDate);
                const end = dayjs(goal.endDate);
                const updated = dayjs(goal.updatedAt);
                const realizationGoal = parseFloat(goal.realizationGoal || "0");

                for (let d = start.clone(); d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
                    if (d.year() !== currentYear || d.day() === 0 || d.day() === 6) continue;
                    const dateStr = d.format("YYYY-MM-DD");

                    goalMap[groupId] ??= {};
                    const existing = goalMap[groupId][dateStr];

                    if (!existing || updated.isAfter(existing.updatedAt)) {
                        goalMap[groupId][dateStr] = {
                            goal: realizationGoal,
                            updatedAt: updated,
                        };
                    }
                }
            });
        });
        // Process dailyTotals
        Object.entries(dailyTotals).forEach(([groupId, days]) => {
            const weeklyTotalMap = {};
            const weeklyGoalMap = {};

            Object.entries(days).forEach(([dateStr, value]) => {
                const date = dayjs(dateStr);
                if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

                const week = date.isoWeek();

                weeklyTotalMap[week] ??= [];
                weeklyGoalMap[week] ??= [];

                weeklyTotalMap[week].push(value);

                let groupGoals = goalMap[groupId];
                if (!groupGoals) {
                    // fallback: try to match staticId
                    const staticMatch = relevantGroups?.find((g) =>
                        g.machineGroupsGroups?.some((gr) => `static-${gr.groupId}` === groupId),
                    );
                    if (staticMatch) {
                        groupGoals = goalMap[staticMatch.id];
                    }
                }
                const goalForDate = groupGoals?.[dateStr]?.goal;
                if (goalForDate !== undefined) {
                    weeklyGoalMap[week].push(goalForDate);
                }
            });

            Object.keys(weeklyTotalMap).forEach((week) => {
                const totalAvg =
                    weeklyTotalMap[week].reduce((a, b) => a + b, 0) / weeklyTotalMap[week].length;
                const goalAvg =
                    weeklyGoalMap[week].reduce((a, b) => a + b, 0) / weeklyGoalMap[week].length ||
                    null;

                result.push({
                    groupId,
                    week: parseInt(week),
                    avgTotal: Math.round(totalAvg * 100) / 100,
                    avgGoal: goalAvg ? Math.round(goalAvg * 100) / 100 : null,
                });
            });
        });

        // console.table(result);
        return result;
    }
    useEffect(() => {
        if (!dailyTotals || !realizationGoals) return;

        const weeklyAverages = computeWeeklyAverages(dailyTotals, realizationGoals, dayjs().year());

        const weekResults = {};

        for (const entry of weeklyAverages) {
            const { week, avgTotal, avgGoal } = entry;

            if (avgGoal == null) continue;

            weekResults[week] ??= [];
            weekResults[week].push(avgTotal >= avgGoal);
        }

        const finalColors = {};

        Object.entries(weekResults).forEach(([week, checks]) => {
            if (checks.length === 0) {
                finalColors[week] = "#6e6e6e"; // gray
            } else if (checks.every(Boolean)) {
                finalColors[week] = "#3aaa35"; // green
            } else {
                finalColors[week] = "#e03c31"; // red
            }
        });

        // ✅ Only update state if changed
        setCostWeekColors((prev) => {
            const same =
                Object.keys(finalColors).length === Object.keys(prev).length &&
                Object.entries(finalColors).every(([key, val]) => prev[key] === val);

            return same ? prev : finalColors;
        });
    }, [dailyTotals, realizationGoals]);

    useEffect(() => {
        if (dailyTotals && realizationGoals) {
            computeWeeklyAverages(dailyTotals, realizationGoals, dayjs().year());
        }
    }, [dailyTotals, realizationGoals]);

    useEffect(() => {
        if (!props.selectedUnit?.label) return;

        const year = new Date().getFullYear();
        const baseUrl = process.env.REACT_APP_OTD_API;
        const subunit = encodeURIComponent(props.selectedUnit.label);

        const fetchKpi = async (kpiType) => {
            const response = await fetch(
                `${baseUrl}/api/WeeklyPerformanceState/for-subunit?year=${year}&subunit=${subunit}&kpiType=${kpiType}`,
            );
            if (!response.ok) throw new Error(`Failed to fetch KPI: ${kpiType}`);
            return await response.json();
        };

        const fetchAllKpis = async () => {
            try {
                // Always fetch Delivery
                const delivery = await fetchKpi("D");
                const deliveryMap = {};
                delivery.forEach((entry) => {
                    deliveryMap[entry.week] = entry.state;
                });
                setDeliveryStates(deliveryMap);

                // Fetch Quality only for Livarna
                if (props.selectedUnit?.subunitId === 11) {
                    const quality = await fetchKpi("Q");
                    const qualityMap = {};
                    quality.forEach((entry) => {
                        qualityMap[entry.week] = entry.state;
                    });
                    setQualityWeekColors(qualityMap);
                }
            } catch (error) {
                console.error("Error fetching KPI data:", error);
            }
        };

        fetchAllKpis();
    }, [props.selectedUnit?.label, props.selectedUnit?.subunitId]);

    //quality data
    const [deliveryStates, setDeliveryStates] = React.useState({});

    const [qualityWeekColors, setQualityWeekColors] = React.useState({});

    const sendStateToBackend = async (week, state, kpiType) => {
        const payload = [
            {
                year: new Date().getFullYear(),
                week,
                subunit: props.selectedUnit?.label,
                state,
                kpiType,
            },
        ];

        try {
            await fetch(`${process.env.REACT_APP_OTD_API}/api/WeeklyPerformanceState/upsert-bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("Failed to send state", err);
        }
    };

    const {
        data: machineGroups,
        isLoading: machineGroupsLoading,
        isError: machineGroupsError,
    } = useQuery(
        ["machine-groups", props.selectedUnit?.subunitId],
        () =>
            client.service("machine-groups").find({
                query: {
                    subunitId: props.selectedUnit?.subunitId,
                    quality: true,
                    $limit: 1000,
                },
            }),
        { enabled: !!props.selectedUnit?.subunitId },
    );

    const { data: goalsData } = useQuery(
        ["goals", "YTD", props.selectedUnit?.subunitId],
        async () => {
            if (!machineGroups?.data) return [];

            const allGoals = [];

            for (const group of machineGroups.data) {
                const result = await client.service("goals").find({
                    query: {
                        machineGroupId: group.id,
                        $or: [
                            {
                                $and: [
                                    { startDate: { $lte: endDay.toISOString() } },
                                    { endDate: { $gte: startDay.toISOString() } },
                                ],
                            },
                        ],
                        $limit: 1000,
                    },
                });

                allGoals.push({
                    machineGroupId: group.id,
                    goals: result.data,
                });
            }

            return allGoals;
        },
        { enabled: !!props.selectedUnit?.subunitId && !!machineGroups?.data },
    );

    const { data: qualityData } = useQuery(
        ["sinapro-quality", "YTD", props.selectedUnit?.ted],
        async () => {
            const tedIds = getTedQueryList(props.selectedUnit?.ted);
            const responses = await Promise.all(
                tedIds.map((tedId) =>
                    sinaproClient.service("machine-production").find({
                        query: {
                            ted: tedId + "",
                            start: startDay.format("YYYY-MM-DD"),
                            end: endDay.format("YYYY-MM-DD"),
                            $limit: 10000,
                        },
                    }),
                ),
            );

            return responses.flatMap((response) => response.data);
        },
        {
            enabled: !!props.selectedUnit?.ted && props.selectedUnit?.subunitId !== 11, // ⛔ Disable for Livarna
        },
    );

    useEffect(() => {
        if (!props.selectedUnit?.subunitId || props.selectedUnit.subunitId === 11) return;

        if (!qualityData || !staticData.data || !goalsData || !machineGroups?.data) return;

        const currentYear = dayjs().year();
        const dailyTotals = {};

        const groupMap = {};
        machineGroups.data.forEach((group) => {
            if (group.static && group.machineGroupsGroups?.length) {
                group.machineGroupsGroups.forEach((gr) => {
                    groupMap[`static-${gr.groupId}`] = group.id;
                });
            } else {
                group.machines?.forEach((machine) => {
                    const key = `sinapro-${machine.machineAltKey}`;
                    groupMap[key] ??= [];
                    groupMap[key].push(group.id);
                });
            }
        });

        // 1. Process static quality data
        staticData.data.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupId = groupMap[`static-${item.groupsStaticId}`];
            if (!groupId) return;

            const dateStr = date.format("YYYY-MM-DD");
            const good = Number(item.good || 0);
            const bad = Number(item.bad || 0);
            const total = Number(item.total || 0);
            const scrap = total ? total - good : bad;

            dailyTotals[groupId] ??= {};
            dailyTotals[groupId][dateStr] ??= { good: 0, scrap: 0 };
            dailyTotals[groupId][dateStr].good += good;
            dailyTotals[groupId][dateStr].scrap += scrap;
        });

        // 2. Process sinapro quality data
        qualityData.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupIds = groupMap[`sinapro-${item.machineKeyAlt}`];
            if (!groupIds) return;

            const value = {
                scrap: Number(item.scrap || 0),
                good: Number(item.good || 0),
            };
            const shared = groupIds.length;
            const dateStr = date.format("YYYY-MM-DD");

            groupIds.forEach((groupId) => {
                dailyTotals[groupId] ??= {};
                dailyTotals[groupId][dateStr] ??= { good: 0, scrap: 0 };
                dailyTotals[groupId][dateStr].good += value.good / shared;
                dailyTotals[groupId][dateStr].scrap += value.scrap / shared;
            });
        });

        // 3. Compute weekly evaluations vs. goals
        const goalMap = {};
        goalsData.forEach(({ machineGroupId, goals }) => {
            goals.forEach((goal) => {
                const start = dayjs(goal.startDate);
                const end = dayjs(goal.endDate);
                const updated = dayjs(goal.updatedAt);
                const qualityGoal = parseFloat(goal.qualityGoal || "0");

                for (let d = start.clone(); d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
                    if (d.year() !== currentYear || d.day() === 0 || d.day() === 6) continue;
                    const dateStr = d.format("YYYY-MM-DD");

                    goalMap[machineGroupId] ??= {};
                    const existing = goalMap[machineGroupId][dateStr];
                    if (!existing || updated.isAfter(existing.updatedAt)) {
                        goalMap[machineGroupId][dateStr] = {
                            goal: qualityGoal,
                            updatedAt: updated,
                        };
                    }
                }
            });
        });

        const weekResults = {};

        Object.entries(dailyTotals).forEach(([groupId, days]) => {
            const weeklyData = {};

            Object.entries(days).forEach(([dateStr, values]) => {
                const date = dayjs(dateStr);
                const week = date.isoWeek();

                weeklyData[week] ??= { scrap: 0, good: 0, goal: [] };

                weeklyData[week].scrap += values.scrap;
                weeklyData[week].good += values.good;

                const groupGoals = goalMap[groupId];
                const goalEntry = groupGoals?.[dateStr]?.goal;
                if (goalEntry != null) {
                    weeklyData[week].goal.push(goalEntry);
                }
            });

            Object.entries(weeklyData).forEach(([week, { scrap, good, goal }]) => {
                const total = scrap + good;
                if (!total || !goal.length) return;

                const scrapPct = (scrap / total) * 100;
                const avgGoal = goal.reduce((a, b) => a + b, 0) / goal.length;

                weekResults[week] ??= [];
                weekResults[week].push(scrapPct <= avgGoal);
            });
        });

        const finalColors = {};
        for (const [week, checks] of Object.entries(weekResults)) {
            if (checks.length === 0) {
                finalColors[week] = "#6e6e6e"; // gray
            } else if (checks.every(Boolean)) {
                finalColors[week] = "#3aaa35"; // green
            } else {
                finalColors[week] = "#e03c31"; // red
            }
        }

        setQualityWeekColors(finalColors);
    }, [qualityData, staticData.data, goalsData, machineGroups]);

    useEffect(() => {
        if (!qualityData || !staticData.data || !machineGroups?.data) return;

        const currentYear = dayjs().year();
        const dailyQualityTotals = {};

        const groupMap = {};

        machineGroups.data.forEach((group) => {
            if (group.static && group.machineGroupsGroups?.length) {
                group.machineGroupsGroups.forEach((gr) => {
                    groupMap[`static-${gr.groupId}`] = group.id;
                });
            } else {
                group.machines?.forEach((machine) => {
                    const key = `sinapro-${machine.machineAltKey}`;
                    groupMap[key] ??= [];
                    groupMap[key].push(group.id);
                });
            }
        });

        // 1. Process STATIC QUALITY DATA
        staticData.data.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupId = groupMap[`static-${item.groupsStaticId}`];
            if (!groupId) return;

            const dateStr = date.format("YYYY-MM-DD");
            const good = Number(item.good || 0);
            const bad = Number(item.bad || 0);
            const total = Number(item.total || 0);
            const scrap = total ? total - good : bad; // prefer total-good, fallback to bad

            dailyQualityTotals[groupId] ??= {};
            dailyQualityTotals[groupId][dateStr] ??= { good: 0, scrap: 0 };
            dailyQualityTotals[groupId][dateStr].good += good;
            dailyQualityTotals[groupId][dateStr].scrap += scrap;
        });

        // 2. Process SINAPRO QUALITY DATA
        qualityData.forEach((item) => {
            const date = dayjs(item.date);
            if (date.year() !== currentYear || date.day() === 0 || date.day() === 6) return;

            const groupIds = groupMap[`sinapro-${item.machineKeyAlt}`];
            if (!groupIds) return;

            const value = {
                scrap: Number(item.scrap || 0),
                good: Number(item.good || 0),
            };
            const shared = groupIds.length;
            const dateStr = date.format("YYYY-MM-DD");

            groupIds.forEach((groupId) => {
                dailyQualityTotals[groupId] ??= {};
                dailyQualityTotals[groupId][dateStr] ??= { good: 0, scrap: 0 };
                dailyQualityTotals[groupId][dateStr].good += value.good / shared;
                dailyQualityTotals[groupId][dateStr].scrap += value.scrap / shared;
            });
        });
    }, [qualityData, staticData.data, machineGroups]);

    const currentYearStart = dayjs().startOf("year");
    const currentYearEnd = dayjs().endOf("year");

    const personnelEvents = useQuery(
        ["personnel-events", props.selectedUnit?.subunitId],
        () => getEvents(props.selectedUnit?.subunitId, currentYearStart, currentYearEnd, "all"),
        { enabled: !!props.selectedUnit?.subunitId },
    );

    const selectedYear = dayjs();
    const {
        data: accidents,
        isLoading: accidentsLoading,
        isError: accidentsError,
    } = useAccidentsByYear(props.selectedUnit?.subunitId, selectedYear);

    function getWeeksInYear(year) {
        const d = new Date(year, 11, 31); // Dec 31
        const day = d.getDay(); // 0 (Sun) - 6 (Sat)

        // If Dec 31 is a Thursday (day === 4), or a leap year ending on Wednesday (day === 3)
        if (day === 4 || (day === 3 && isLeapYear(year))) {
            return 53;
        }
        return 52;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
        const oneWeek = 604800000; // ms
        return Math.ceil(diff / oneWeek);
    }

    function getKpiTitle(label) {
        switch (label) {
            case "S":
                return "Safety";
            case "Q":
                return "Quality";
            case "C":
                return "Costs";
            case "D":
                return "Delivery";
            case "P":
                return "Personal";
            default:
                return "";
        }
    }

    function getColorForCell(index, label) {
        const cellWeek = index + 1;
        const currentDate = dayjs();
        const currentWeek = currentDate.isoWeek();
        const currentYear = currentDate.year();

        if (cellWeek >= currentWeek) return "#ffffff";

        if (label === "S") {
            const accidentInWeek = accidents?.some((accident) => {
                const accDate = dayjs(accident.accidentDate);
                return accDate.isoWeek() === cellWeek && accDate.year() === currentYear;
            });

            return accidentInWeek ? "#e03c31" : "#3aaa35"; // red or green
        }

        if (label === "P") {
            if (cellWeek >= currentWeek) return "#ffffff";

            const weeklyAbsences = personnelEvents?.data?.filter((event) => {
                const eventDate = dayjs(event.date);
                const weekday = eventDate.isoWeekday(); // 1 = Monday, 7 = Sunday
                return (
                    eventDate.isoWeek() === cellWeek &&
                    eventDate.year() === currentYear &&
                    weekday >= 1 &&
                    weekday <= 5 // Exclude weekends
                );
            });

            if (!weeklyAbsences?.length) return "#6e6e6e";

            let totalAbsence = 0;
            let totalPlan = 0;

            for (const event of weeklyAbsences) {
                const hourUse = Number(event.hourUse || 0);
                const leave = Number(event.leave || 0);
                const sick = Number(event.sick || 0);
                const higherForce = Number(event.higherForce || 0);
                const quarantine = Number(event.quarantine || 0);
                const plan = Number(event.plan || 0);

                const dailyTotal = hourUse + leave + sick + higherForce + quarantine;
                totalAbsence += dailyTotal;
                totalPlan += plan;
            }

            if (totalPlan === 0) return "#6e6e6e";

            const percentage = (totalAbsence / totalPlan) * 100;

            return percentage >= 20 ? "#e03c31" : "#3aaa35";
        }
        if (label === "Q") {
            const week = index + 1;
            const currentWeek = dayjs().isoWeek();
            if (props.selectedUnit?.subunitId !== 11 && week >= currentWeek) return "#ffffff";

            if (props.selectedUnit?.subunitId === 11) {
                // LIVARNA: Use backend states
                const state = qualityWeekColors?.[week];
                if (state === 2) return "#3aaa35";
                if (state === 1) return "#e03c31";
                if (state === 0) return "#ffffff";
                return "#ffffff";
            } else {
                // OTHER: Use computed hex directly
                return qualityWeekColors?.[week] ?? "#6e6e6e";
            }
        }
        if (label === "D") {
            return deliveryStates[index + 1] === 2
                ? "#3aaa35"
                : deliveryStates[index + 1] === 1
                ? "#e03c31"
                : "#ffffff";
        }
        if (label === "C") {
            const week = index + 1;
            const currentWeek = dayjs().isoWeek();

            // Livarna: override with foundry logic
            if (props.selectedUnit?.subunitId === 11) {
                if (week >= currentWeek) return "#ffffff";
                return foundryWeekColors?.[week] ?? "#6e6e6e";
            }

            if (week >= currentWeek) return "#ffffff"; // future = white

            return costWeekColors?.[week] ?? "#6e6e6e"; // past without data = gray
        }

        return "#ffffff";
    }

    const kpiHeaders = [
        { label: "S", title: "Varnost", description: "0 poškodb" },
        { label: "Q", title: "Kakovost", description: "Izmet pod mejo cilja" },
        { label: "C", title: "Stroški", description: "> 100% plana" },
        { label: "D", title: "Zanesljivost dobave", description: "OTD > 92%" },
        { label: "P", title: "Osebje", description: "< 20% odsotnosti" },
    ];

    return (
        <React.Fragment>
            <div style={{ padding: "1rem" }}>
                <div
                    style={{
                        backgroundColor: "#003b5c",
                        color: "white",
                        padding: "0.75rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Center title */}
                    <div
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: "bold",
                            textAlign: "center",
                            flex: 1,
                        }}
                    >
                        SHOP FLOOR MANAGEMENT: {props.selectedUnit?.label || "Oddelek"}
                    </div>

                    {/* Right side logo recreation */}
                    <div style={{ textAlign: "right", lineHeight: "1rem" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "0.95rem",
                                color: "white",
                                fontFamily: "Segoe UI, sans-serif",
                                letterSpacing: "0.5px",
                            }}
                        >
                            BLANC & FISCHER
                        </div>
                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "#9cd2f4",
                                fontFamily: "Segoe UI, sans-serif",
                            }}
                        >
                            <span style={{ fontWeight: "300" }}>LEAN </span>
                            <span style={{ fontWeight: "bold" }}>SYSTEM</span>
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        backgroundColor: "#3d6580",
                        color: "white",
                        padding: "0.5rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontFamily: "Segoe UI, sans-serif",
                        marginBottom: "1rem",
                        marginTop: "0.5rem",
                    }}
                >
                    {/* Placeholder left section if needed */}
                    <div style={{ width: "3rem" }}></div>
                    {/* Centered title */}
                    <div
                        style={{
                            flex: 1,
                            textAlign: "center",
                            fontSize: "1.3rem",
                            fontWeight: "bold",
                            letterSpacing: "0.5px",
                        }}
                    >
                        KPI - kazalniki
                    </div>

                    {/* Right: Date and CW */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                            CW: {getCurrentWeek()}
                        </div>
                    </div>
                </div>

                {/* KPI SECTION */}
                <div style={{ marginTop: "2rem" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-around",
                            marginTop: "1rem",
                            flexWrap: "wrap",
                        }}
                    >
                        {kpiHeaders.map(({ label, title, description }) => (
                            <div key={label} style={{ textAlign: "center", margin: "0.5rem" }}>
                                <div
                                    style={{
                                        backgroundColor: "#bcd6e9",
                                        padding: "0.25rem",
                                        fontWeight: "bold",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    {title}
                                </div>
                                <div
                                    style={{
                                        fontSize: "6rem",
                                        fontWeight: "bold",
                                        color: "#3aaa35",
                                        marginBottom: "0.2rem",
                                    }}
                                >
                                    {label}
                                </div>
                                <div>{getKpiTitle(label)}</div>
                                <div
                                    style={{
                                        fontSize: "0.85rem",
                                        fontWeight: "500",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    {description}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(8, 1fr)",
                                        gap: "0px",
                                        marginTop: "0.5rem",
                                    }}
                                >
                                    {Array.from(
                                        { length: getWeeksInYear(new Date().getFullYear()) },
                                        (_, i) => {
                                            const week = i + 1;
                                            const color = getColorForCell(i, label);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={
                                                        label === "D"
                                                            ? () => {
                                                                  const current =
                                                                      deliveryStates[week] ?? 0;
                                                                  const next = (current + 1) % 3;
                                                                  setDeliveryStates((prev) => ({
                                                                      ...prev,
                                                                      [week]: next,
                                                                  }));
                                                                  sendStateToBackend(
                                                                      week,
                                                                      next,
                                                                      "D",
                                                                  );
                                                              }
                                                            : label === "Q" &&
                                                              props.selectedUnit?.subunitId === 11
                                                            ? () => {
                                                                  const current =
                                                                      qualityWeekColors[week] ?? 0;
                                                                  const next = (current + 1) % 3;
                                                                  setQualityWeekColors((prev) => ({
                                                                      ...prev,
                                                                      [week]: next,
                                                                  }));
                                                                  sendStateToBackend(
                                                                      week,
                                                                      next,
                                                                      "Q",
                                                                  );
                                                              }
                                                            : undefined
                                                    }
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        fontSize: "0.9rem",
                                                        lineHeight: "30px",
                                                        backgroundColor: color,
                                                        color: "#000",
                                                        textAlign: "center",
                                                        border: "1px solid black",
                                                        padding: "0",
                                                        margin: "0",
                                                        cursor:
                                                            label === "D" ||
                                                            (label === "Q" &&
                                                                props.selectedUnit?.subunitId ===
                                                                    11)
                                                                ? "pointer"
                                                                : "default",
                                                    }}
                                                >
                                                    {week}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <SfmBoard subunit={props.selectedUnit?.label} />
        </React.Fragment>
    );
}

export default Indicators;

/**
 *
 * @param {integer} subunitId
 * 1 - 55.17
 * 2 - D1
 * 3 - D2
 * 4 - D3
 * 5 - Montaža
 * 6 - Keramika
 * 7 - Obdelovalnica
 * 8 - Brusilnica
 * 9 - Robotske celice
 * 10 - Ptc
 * 11 - Livarna
 * 12 - Cevi
 *
 */
