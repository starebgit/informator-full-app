import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, ChartWrap, GridItem } from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import { useTranslation } from "react-i18next";
import { Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import LineChart from "../../../components/Charts/Time/Time";
import DynamicGrid from "../../../components/DynamicGrid/DynamicGrid";

function LPA({
    selectedUnit,
    layouts,
    initLayoutsHandler,
    setTempLayoutsHandler,
    saveLayoutsHandler,
}) {
    const { t } = useTranslation(["shopfloor", "labels"]);
    const [audits, setAudits] = useState([]);
    const [loadingAudits, setLoadingAudits] = useState(false);
    const [auditsError, setAuditsError] = useState(null);
    const [findings, setFindings] = useState([]);
    const [loadingFindings, setLoadingFindings] = useState(false);
    const [findingsError, setFindingsError] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [answersError, setAnswersError] = useState(null);
    const [save, setSave] = useState(false);
    const [reset, setReset] = useState(false);
    const [editable, setEditable] = useState(false);
    const [showAllUnits, setShowAllUnits] = useState(false);

    const termoregulatorKeywords = ["termo_d1", "termo_d2", "termo_d3", "termo_55"];
    const ploscaKeywords = ["plosca_montaza", "plosca_keramika", "protektor"];
    const livarnaKeywords = [
        "livarna_obdelovalnica",
        "livarna_brusilnica",
        "livarna_robotske_celice",
        "foundry",
    ];
    const izdelavaPolizdelkovKeywords = ["automation", "tubes", "toolshop"];

    const locationSortOrders = {
        Livarna: [
            "Peči za pripravo taline",
            "Formarska linija",
            "Peskanje",
            "Izdelava obročev",
            "Struženje ročno",
            "Stružne linije 145, 180",
            "Peči in odprema",
            "Ročno brušenje",
            "Skladišče polizdelki, končani izdelki",
            "Obdelava CHP",
            "Obdelovalni centri",
            "Celice z roboti",
            "Skladišče obdelovancev",
        ],
        Plošča: [
            "Špiralnica - navijanje špiral",
            "ŠMAT 1",
            "Sušilne peči in lakiranje roba plošče",
            "ŠMAT 2 velike plošče",
            "Modelar, ŠMAT 6",
            "Transportne poti",
            "Špiralnica - avt. točkanje špiral",
            "ŠMAT 4",
            "ŠMAT 5, 8",
            "ŠMAT 3 velike plošče",
            "Žarjenje špiral velike plošče",
            "Plat 1",
            "Plat 4, 5",
            "Plat 6",
            "Lakirnica in mešanje laka",
            "Wafios in rezanje žice",
            "Sestav faston in navadnih sponk",
            "Plat 7 velike grelne plošča",
            "Izdelava veznih elementov velike plošče",
            "Pakiranje plošč in tiskanje rdečih pik",
            "Celica za izdelavo pokrova",
            "Avt. za kovičenje kontaktov",
            "Stroj za sestav in varjenje nosilca protektorja",
            "Peči",
            "Palični protektor",
            "Linija za sestav protektorja",
            "Umerjanje in točkanje sestava protektorja",
        ],
        Termoregulator: [
            "Reduciranje",
            "Sestavljanje čutil in kapilare",
            "Tunelske peči",
            "VF",
            "Diastat linija",
            "Avtomatsko polnenje",
            "Ročno polnenje",
            "Lasersko varjenje SECA",
            "Peči za staranje",
            "Montažne linije",
            "Izdelava podnožij",
            "Merilnica",
            "Skladišče supermarket",
            "Statistična kontrola",
            "Pakiranje",
            "Navijanje diastatov",
        ],
        "Izdelava polizdelkov / Tehnične službe": [
            "Štance ob vodi",
            "Bihlerji",
            "Stružni avtomati",
            "Razmaščevalni stroj",
            "Varjenje in vlek cevi",
            "Sekanje, pakiranje",
            "Žaganje cevi",
            "Izdelava polizdelkov za veliko grelno ploščo",
            "Membrane - uporovno varjenje",
            "Membrane - laserji",
            "Membrane - avtomati",
            "Skladišče materiala za cevi",
            "Linija za cinkanje",
            "Skladišče kemikalij",
            "Raziglanje, čistilna naprava",
            "Elektro delavnica",
            "Mehanska delavnica",
            "Strojna delavnica",
            "Skladišče vzdrževanja",
            "Montaža in vzdrževanje orodij",
            "Strojna obdelava",
            "Kleparska delavnica",
            "Ročni oddelek",
            "Elektro oddelek",
            "Montaža",
            "CNC obdelava",
            "Brusilnica",
            "Žična erozija",
            "VRS notranje površine",
            "VRS zunanje površine",
        ],
    };

    const getLocationCategory = (keyword) => {
        if (!keyword) return null;

        if (termoregulatorKeywords.includes(keyword)) return "Termoregulator";
        if (ploscaKeywords.includes(keyword)) return "Plošča";
        if (livarnaKeywords.includes(keyword)) return "Livarna";
        if (izdelavaPolizdelkovKeywords.includes(keyword)) {
            return "Izdelava polizdelkov / Tehnične službe";
        }

        return null;
    };

    const getAuditLocationValue = (audit) => {
        if (!audit) return "";
        const location = audit.Location;
        if (!location) return "";
        if (typeof location === "object") {
            return String(location.Name || location.name || location.value || location.label || "");
        }
        return String(location);
    };

    const getFindingLocationValue = (finding) => {
        if (!finding) return "";
        const location = finding.Location;
        if (!location) return "";
        if (typeof location === "object") {
            return String(location.Name || location.name || location.value || location.label || "");
        }
        return String(location);
    };

    const getAnswerLocationValue = (answer) => {
        if (!answer) return "";
        const location = answer.Location;
        if (!location) return "";
        if (typeof location === "object") {
            return String(location.Name || location.name || location.value || location.label || "");
        }
        return String(location);
    };

    useEffect(() => {
        setLoadingAudits(true);
        setAuditsError(null);

        fetch("http://172.20.1.40:3020/api/audits/filter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        })
            .then((res) => res.json())
            .then((data) => {
                setAudits(data.Items || data.items || []);
                setLoadingAudits(false);
            })
            .catch(() => {
                setAuditsError("Napaka pri pridobivanju presoj.");
                setLoadingAudits(false);
            });
    }, []);

    useEffect(() => {
        setLoadingFindings(true);
        setFindingsError(null);

        fetch("http://172.20.1.40:3020/api/findings", {
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => {
                setFindings(data.Items || data.items || []);
                setLoadingFindings(false);
            })
            .catch(() => {
                setFindingsError("Napaka pri pridobivanju findings.");
                setLoadingFindings(false);
            });
    }, []);

    const getAuditProgramName = (audit) =>
        String(
            audit?.Program?.Name ||
                audit?.Program?.name ||
                audit?.program?.Name ||
                audit?.program?.name ||
                audit?.Program ||
                audit?.program ||
                "",
        );

    const getFindingProgramName = (finding) =>
        String(
            finding?.Program?.Name ||
                finding?.Program?.name ||
                finding?.program?.Name ||
                finding?.program?.name ||
                finding?.Program ||
                finding?.program ||
                "",
        );

    const getAuditStatusName = (audit) =>
        String(audit?.Status?.Name || audit?.Status?.name || audit?.Status || audit?.status || "");

    const getFindingStatusName = (finding) =>
        String(
            finding?.Status?.Name ||
                finding?.Status?.name ||
                finding?.Status ||
                finding?.status ||
                "",
        );

    const getFindingResponsiblePartyName = (finding) => {
        if (!finding) return "";
        const responsibleParty = finding.ResponsibleParty || finding.responsibleParty;
        if (!responsibleParty) return "";
        if (typeof responsibleParty === "object") {
            return String(
                responsibleParty.Name ||
                    responsibleParty.name ||
                    responsibleParty.value ||
                    responsibleParty.label ||
                    "",
            );
        }
        return String(responsibleParty);
    };

    const getFindingCategoryName = (finding) => {
        if (!finding) return "";
        const category = finding.Category || finding.category;
        if (!category) return "";
        if (typeof category === "object") {
            return String(category.Name || category.name || category.value || category.label || "");
        }
        return String(category);
    };

    const getFindingCountermeasureValue = (finding) => {
        if (!finding) return "";
        const countermeasure = finding.Countermeasure || finding.countermeasure;
        if (!countermeasure) return "";
        if (typeof countermeasure === "object") {
            return String(
                countermeasure.Name ||
                    countermeasure.name ||
                    countermeasure.value ||
                    countermeasure.label ||
                    "",
            );
        }
        return String(countermeasure);
    };

    const getAuditRelevantDate = (audit) => {
        if (audit?.CompletedDate) return dayjs(audit.CompletedDate);
        if (audit?.DueDate) return dayjs(audit.DueDate);
        if (audit?.AuditDueDate) return dayjs(audit.AuditDueDate);
        return null;
    };

    const getFindingRelevantDate = (finding) => {
        if (finding?.ClosedDate) return dayjs(finding.ClosedDate);
        if (finding?.DueDate) return dayjs(finding.DueDate);
        return null;
    };

    const locationFilteredAudits = useMemo(() => {
        const source = Array.isArray(audits) ? audits : [];
        if (showAllUnits) return source;
        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        if (!order) return source;

        const allowedLocations = new Set(order);
        return source.filter((audit) => allowedLocations.has(getAuditLocationValue(audit)));
    }, [audits, selectedUnit?.keyword, showAllUnits]);

    const locationFilteredFindings = useMemo(() => {
        const source = Array.isArray(findings) ? findings : [];
        if (showAllUnits) return source;
        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        if (!order) return source;

        const allowedLocations = new Set(order);
        return source.filter((finding) => allowedLocations.has(getFindingLocationValue(finding)));
    }, [findings, selectedUnit?.keyword, showAllUnits]);

    const filteredAnswers = useMemo(() => {
        const source = Array.isArray(answers) ? answers : [];
        const base = source.filter((answer) =>
            String(answer?.AuditName || "")
                .toLowerCase()
                .includes("lpa"),
        );
        if (showAllUnits) return base;

        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        if (!order) return base;

        const allowedLocations = new Set(order);
        return base.filter((answer) => allowedLocations.has(getAnswerLocationValue(answer)));
    }, [answers, selectedUnit?.keyword, showAllUnits]);

    const lpaAudits = useMemo(() => {
        const needle = "lpa";
        return locationFilteredAudits.filter((audit) =>
            getAuditProgramName(audit).toLowerCase().includes(needle),
        );
    }, [locationFilteredAudits]);

    const lpaFindings = useMemo(() => {
        const needle = "lpa";
        return locationFilteredFindings.filter((finding) =>
            getFindingProgramName(finding).toLowerCase().includes(needle),
        );
    }, [locationFilteredFindings]);

    const weekAnchors = useMemo(() => {
        const base = dayjs();
        if (!base.isValid()) return [];

        const currentWeekSunday = base.day(0);
        const nextSunday = currentWeekSunday.isBefore(base, "day")
            ? base.day(7)
            : currentWeekSunday;
        const endDate = nextSunday.endOf("day");
        const startDate = endDate.subtract(1, "month").startOf("day");
        const weeks = [];
        let cursor = startDate.day(0);

        if (cursor.isBefore(startDate, "day")) {
            cursor = cursor.add(7, "day");
        }

        while (cursor.isSameOrBefore(endDate, "day")) {
            weeks.push(cursor);
            cursor = cursor.add(7, "day");
        }

        return weeks;
    }, []);

    const answersRange = useMemo(() => {
        if (!weekAnchors.length) {
            const fallbackEnd = dayjs().endOf("day");
            const fallbackStart = fallbackEnd.subtract(1, "month").startOf("day");
            return { from: fallbackStart, to: fallbackEnd };
        }
        const firstWeekEnd = weekAnchors[0];
        const lastWeekEnd = weekAnchors[weekAnchors.length - 1];
        return {
            from: firstWeekEnd.subtract(6, "day").startOf("day"),
            to: lastWeekEnd.endOf("day"),
        };
    }, [weekAnchors]);

    useEffect(() => {
        setLoadingAnswers(true);
        setAnswersError(null);

        const from = answersRange.from.format("YYYY-MM-DD");
        const to = answersRange.to.format("YYYY-MM-DD");

        fetch("http://172.20.1.40:3020/api/answers/filter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ AuditDueDateFrom: from, AuditDueDateTo: to }),
        })
            .then(async (res) => {
                const text = await res.text();
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
                return JSON.parse(text);
            })
            .then((data) => {
                setAnswers(data.Items || data.items || []);
                setLoadingAnswers(false);
            })
            .catch((err) => {
                setAnswersError(`Napaka pri pridobivanju odgovorov: ${err.message}`);
                setLoadingAnswers(false);
            });
    }, [answersRange]);

    const completionSeries = useMemo(() => {
        return weekAnchors.map((weekEndAnchor) => {
            const weekEnd = weekEndAnchor.endOf("day");
            const weekStart = weekEndAnchor.subtract(6, "day").startOf("day");
            const weekAudits = lpaAudits.filter((audit) => {
                const relevantDate = getAuditRelevantDate(audit);
                if (!relevantDate?.isValid()) return false;

                return (
                    relevantDate.isSameOrAfter(weekStart, "day") &&
                    relevantDate.isSameOrBefore(weekEnd, "day")
                );
            });

            const total = weekAudits.length;
            const completed = weekAudits.filter((audit) =>
                getAuditStatusName(audit).toLowerCase().includes("completed"),
            ).length;

            const pct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

            return {
                x: weekEndAnchor.toDate(),
                y: pct,
            };
        });
    }, [lpaAudits, weekAnchors]);

    const statusSeries = useMemo(() => {
        const statuses = [
            "In Progress - On Time",
            "Completed - On Time",
            "Not Started - On Time",
            "In Progress - Past Due",
            "Completed - Past Due",
            "Missed",
        ];

        return statuses.map((status) => ({
            status,
            data: weekAnchors.map((weekEndAnchor) => {
                const weekEnd = weekEndAnchor.endOf("day");
                const weekStart = weekEndAnchor.subtract(6, "day").startOf("day");

                const count = lpaAudits.filter((audit) => {
                    const relevantDate = getAuditRelevantDate(audit);
                    if (!relevantDate?.isValid()) return false;

                    const inWeek =
                        relevantDate.isSameOrAfter(weekStart, "day") &&
                        relevantDate.isSameOrBefore(weekEnd, "day");
                    if (!inWeek) return false;

                    return getAuditStatusName(audit) === status;
                }).length;

                return {
                    x: weekEndAnchor.toDate(),
                    y: count,
                };
            }),
        }));
    }, [lpaAudits, weekAnchors]);

    const findingStatusSeries = useMemo(() => {
        const statuses = [
            "Completed - On Time",
            "Completed - Past Due",
            "In Progress - On Time",
            "In Progress - Past Due",
            "Pending - On Time",
            "Pending - Past Due",
        ];

        return statuses.map((status) => ({
            status,
            data: weekAnchors.map((weekEndAnchor) => {
                const weekEnd = weekEndAnchor.endOf("day");
                const weekStart = weekEndAnchor.subtract(6, "day").startOf("day");

                const count = lpaFindings.filter((finding) => {
                    const relevantDate = getFindingRelevantDate(finding);
                    if (!relevantDate?.isValid()) return false;

                    const inWeek =
                        relevantDate.isSameOrAfter(weekStart, "day") &&
                        relevantDate.isSameOrBefore(weekEnd, "day");
                    if (!inWeek) return false;

                    return getFindingStatusName(finding) === status;
                }).length;

                return {
                    x: weekEndAnchor.toDate(),
                    y: count,
                };
            }),
        }));
    }, [lpaFindings, weekAnchors]);

    const findingStatusTotals = useMemo(() => {
        const statuses = [
            "Completed - On Time",
            "Completed - Past Due",
            "In Progress - On Time",
            "In Progress - Past Due",
            "Pending - On Time",
            "Pending - Past Due",
        ];

        const colors = {
            "In Progress - On Time": "rgba(0, 123, 255, 1)",
            "Completed - On Time": "rgba(40, 167, 69, 1)",
            "Pending - Past Due": "rgba(158, 158, 158, 1)",
            "In Progress - Past Due": "#ff9800",
            "Completed - Past Due": "#8e24aa",
            "Pending - On Time": "#e53935",
        };

        if (!weekAnchors.length) {
            return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
        }

        const firstWeekEnd = weekAnchors[0];
        const lastWeekEnd = weekAnchors[weekAnchors.length - 1];
        const rangeStart = firstWeekEnd.subtract(6, "day").startOf("day");
        const rangeEnd = lastWeekEnd.endOf("day");

        const data = statuses.map(
            (status) =>
                lpaFindings.filter((finding) => {
                    const relevantDate = getFindingRelevantDate(finding);
                    if (!relevantDate?.isValid()) return false;

                    const inRange =
                        relevantDate.isSameOrAfter(rangeStart, "day") &&
                        relevantDate.isSameOrBefore(rangeEnd, "day");
                    if (!inRange) return false;

                    return getFindingStatusName(finding) === status;
                }).length,
        );

        return {
            labels: statuses,
            datasets: [
                {
                    data,
                    backgroundColor: statuses.map(
                        (status) => colors[status] || "rgba(0, 0, 0, 0.6)",
                    ),
                    borderColor: statuses.map((status) => colors[status] || "rgba(0, 0, 0, 0.6)"),
                },
            ],
        };
    }, [lpaFindings, weekAnchors]);

    const findingStatusByResponsibleParty = useMemo(() => {
        const statuses = [
            "Completed - On Time",
            "Completed - Past Due",
            "In Progress - On Time",
            "In Progress - Past Due",
            "Pending - On Time",
            "Pending - Past Due",
        ];

        const colors = {
            "In Progress - On Time": "rgba(0, 123, 255, 1)",
            "Completed - On Time": "rgba(40, 167, 69, 1)",
            "Pending - Past Due": "rgba(158, 158, 158, 1)",
            "In Progress - Past Due": "#ff9800",
            "Completed - Past Due": "#8e24aa",
            "Pending - On Time": "#e53935",
        };

        if (!weekAnchors.length) {
            return { labels: [], datasets: [] };
        }

        const firstWeekEnd = weekAnchors[0];
        const lastWeekEnd = weekAnchors[weekAnchors.length - 1];
        const rangeStart = firstWeekEnd.subtract(6, "day").startOf("day");
        const rangeEnd = lastWeekEnd.endOf("day");

        const counts = new Map();
        lpaFindings.forEach((finding) => {
            const relevantDate = getFindingRelevantDate(finding);
            if (!relevantDate?.isValid()) return;
            const inRange =
                relevantDate.isSameOrAfter(rangeStart, "day") &&
                relevantDate.isSameOrBefore(rangeEnd, "day");
            if (!inRange) return;
            const status = getFindingStatusName(finding);
            if (!statuses.includes(status)) return;
            const responsibleParty = getFindingResponsiblePartyName(finding) || "N/A";
            if (!counts.has(responsibleParty)) {
                counts.set(
                    responsibleParty,
                    statuses.reduce((acc, statusName) => {
                        acc[statusName] = 0;
                        return acc;
                    }, {}),
                );
            }
            counts.get(responsibleParty)[status] += 1;
        });

        const labels = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));

        return {
            labels,
            datasets: statuses.map((status) => {
                const color = colors[status] || "rgba(0, 0, 0, 0.6)";
                return {
                    label: status,
                    data: labels.map((label) => counts.get(label)?.[status] || 0),
                    backgroundColor: color,
                    borderColor: color,
                };
            }),
        };
    }, [lpaFindings, weekAnchors]);

    const topFailuresByCategory = useMemo(() => {
        if (!weekAnchors.length) {
            return { labels: [], datasets: [] };
        }

        const firstWeekEnd = weekAnchors[0];
        const lastWeekEnd = weekAnchors[weekAnchors.length - 1];
        const rangeStart = firstWeekEnd.subtract(6, "day").startOf("day");
        const rangeEnd = lastWeekEnd.endOf("day");

        const counts = new Map();
        lpaFindings.forEach((finding) => {
            const relevantDate = getFindingRelevantDate(finding);
            if (!relevantDate?.isValid()) return;
            const inRange =
                relevantDate.isSameOrAfter(rangeStart, "day") &&
                relevantDate.isSameOrBefore(rangeEnd, "day");
            if (!inRange) return;
            const category = getFindingCategoryName(finding);
            if (!category) return;
            counts.set(category, (counts.get(category) || 0) + 1);
        });

        const sorted = Array.from(counts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

        const top = sorted.slice(0, 3);
        const labels = top.map(([label]) => label);
        const data = top.map(([, value]) => value);
        const total = data.reduce((acc, value) => acc + value, 0);
        let running = 0;
        const cumulativePct = data.map((value) => {
            running += value;
            if (!total) return 0;
            return Math.round((running / total) * 1000) / 10;
        });

        return {
            labels,
            datasets: [
                {
                    label: "Napake",
                    data,
                    backgroundColor: "rgba(0, 123, 255, 0.8)",
                    borderColor: "rgba(0, 123, 255, 1)",
                    order: 1,
                },
                {
                    label: "Kumulativno %",
                    type: "line",
                    data: cumulativePct,
                    borderColor: "#2e7d32",
                    backgroundColor: "rgba(46, 125, 50, 0.2)",
                    pointBackgroundColor: "#2e7d32",
                    pointBorderColor: "#2e7d32",
                    pointRadius: 4,
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: "yPercent",
                    order: 10,
                    datalabels: {
                        z: 100,
                        align: "bottom",
                        anchor: "start",
                        offset: 6,
                        color: "#000000",
                        textStrokeColor: "#ffffff",
                        textStrokeWidth: 3,
                        font: { weight: "bold", size: 14 },
                        formatter: (value) => `${value}%`,
                    },
                },
            ],
        };
    }, [lpaFindings, weekAnchors]);

    const topFindingCountermeasures = useMemo(() => {
        if (!weekAnchors.length) {
            return { labels: [], datasets: [] };
        }

        const firstWeekEnd = weekAnchors[0];
        const lastWeekEnd = weekAnchors[weekAnchors.length - 1];
        const rangeStart = firstWeekEnd.subtract(6, "day").startOf("day");
        const rangeEnd = lastWeekEnd.endOf("day");

        const counts = new Map();
        lpaFindings.forEach((finding) => {
            const relevantDate = getFindingRelevantDate(finding);
            if (!relevantDate?.isValid()) return;
            const inRange =
                relevantDate.isSameOrAfter(rangeStart, "day") &&
                relevantDate.isSameOrBefore(rangeEnd, "day");
            if (!inRange) return;
            const countermeasure = getFindingCountermeasureValue(finding);
            if (!countermeasure) return;
            counts.set(countermeasure, (counts.get(countermeasure) || 0) + 1);
        });

        const sorted = Array.from(counts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

        const top = sorted.slice(0, 3);
        const labels = top.map(([label]) => label);
        const data = top.map(([, value]) => value);
        const total = data.reduce((acc, value) => acc + value, 0);
        let running = 0;
        const cumulativePct = data.map((value) => {
            running += value;
            if (!total) return 0;
            return Math.round((running / total) * 1000) / 10;
        });

        return {
            labels,
            datasets: [
                {
                    label: t("shopfloor:countermeasure"),
                    data,
                    backgroundColor: "rgba(0, 123, 255, 0.8)",
                    borderColor: "rgba(0, 123, 255, 1)",
                    order: 1,
                },
                {
                    label: "Kumulativno %",
                    type: "line",
                    data: cumulativePct,
                    borderColor: "#2e7d32",
                    backgroundColor: "rgba(46, 125, 50, 0.2)",
                    pointBackgroundColor: "#2e7d32",
                    pointBorderColor: "#2e7d32",
                    pointRadius: 4,
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: "yPercent",
                    order: 10,
                    datalabels: {
                        z: 100,
                        align: "bottom",
                        anchor: "start",
                        offset: 6,
                        color: "#000000",
                        textStrokeColor: "#ffffff",
                        textStrokeWidth: 3,
                        font: { weight: "bold", size: 14 },
                        formatter: (value) => `${value}%`,
                    },
                },
            ],
        };
    }, [lpaFindings, t, weekAnchors]);

    const questionComplianceData = useMemo(() => {
        if (!filteredAnswers.length) {
            return { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: [] }] };
        }

        const counts = new Map();
        filteredAnswers.forEach((answer) => {
            const rawValue = answer?.Response ?? answer?.response;
            const label = String(rawValue ?? "N/A").trim() || "N/A";
            counts.set(label, (counts.get(label) || 0) + 1);
        });

        const sorted = Array.from(counts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

        const labels = sorted.map(([label]) => label);
        const total = sorted.reduce((acc, [, value]) => acc + value, 0);
        const data = sorted.map(([, value]) =>
            total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
        );
        const colors = ["#4caf50", "#2196f3", "#9c27b0", "#607d8b", "#795548", "#009688"];
        const colorOverrides = {
            fail: "#f44336",
            "n/a": "#ffb300",
            na: "#ffb300",
        };

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: labels.map((label, idx) => {
                        const key = String(label).trim().toLowerCase();
                        return colorOverrides[key] || colors[idx % colors.length];
                    }),
                    borderColor: labels.map((label, idx) => {
                        const key = String(label).trim().toLowerCase();
                        return colorOverrides[key] || colors[idx % colors.length];
                    }),
                },
            ],
        };
    }, [filteredAnswers]);

    const doughnutOptions = useMemo(
        () => ({
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            legend: {
                labels: {
                    fontStyle: "bold",
                },
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 0,
                    bottom: 10,
                },
            },
            plugins: {
                labels: {
                    showZero: false,
                    fontSize: 15,
                },
            },
        }),
        [],
    );

    const questionComplianceOptions = useMemo(
        () => ({
            ...doughnutOptions,
            plugins: {
                ...(doughnutOptions?.plugins || {}),
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.formattedValue}%`,
                    },
                },
            },
        }),
        [doughnutOptions],
    );

    const targetSeries = useMemo(
        () => completionSeries.map((point) => ({ x: point.x, y: 90 })),
        [completionSeries],
    );

    const findingStatusByResponsiblePartyOptions = useMemo(
        () => ({
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 16 },
                },
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 15,
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                },
            },
        }),
        [],
    );

    const topFailuresByCategoryOptions = useMemo(
        () => ({
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            datasets: {
                bar: { order: 1 },
                line: { order: 2 },
            },
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    drawTime: "afterDatasetsDraw",
                    display: (context) => context.dataset.type === "line",
                    align: "bottom",
                    anchor: "start",
                    offset: 6,
                    color: "#000000",
                    textStrokeColor: "#ffffff",
                    textStrokeWidth: 3,
                    font: { weight: "bold", size: 14 },
                    formatter: (value) => `${value}%`,
                },
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 15,
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                },
                yPercent: {
                    beginAtZero: true,
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: (value) => `${value}%`,
                    },
                    suggestedMax: 100,
                },
            },
        }),
        [],
    );

    const topFindingCountermeasuresOptions = useMemo(
        () => ({
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            datasets: {
                bar: { order: 1 },
                line: { order: 2 },
            },
            plugins: {
                legend: { position: "bottom" },
                datalabels: {
                    drawTime: "afterDatasetsDraw",
                    display: (context) => context.dataset.type === "line",
                    align: "bottom",
                    anchor: "start",
                    offset: 6,
                    color: "#000000",
                    textStrokeColor: "#ffffff",
                    textStrokeWidth: 3,
                    font: { weight: "bold", size: 14 },
                    formatter: (value) => `${value}%`,
                },
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 15,
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                },
                yPercent: {
                    beginAtZero: true,
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: (value) => `${value}%`,
                    },
                    suggestedMax: 100,
                },
            },
        }),
        [],
    );

    const isEditableHandler = (bool) => {
        setEditable(bool);
    };

    const onSavedLayout = () => {
        saveLayoutsHandler?.("lean_lpa");
        isEditableHandler(false);
    };

    const resetHandler = () => {
        setReset(true);
        setEditable(false);
    };

    const drawLineLastPlugin = useMemo(
        () => ({
            id: "drawLineLast",
            afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                chart.data.datasets.forEach((dataset, index) => {
                    if (dataset.type !== "line") return;
                    const meta = chart.getDatasetMeta(index);
                    if (!meta || meta.hidden) return;
                    meta.dataset.draw(ctx);
                    meta.data.forEach((element) => {
                        if (element && element.draw) {
                            element.draw(ctx);
                        }
                    });
                });
            },
        }),
        [],
    );

    const isLoading = loadingAudits || loadingFindings || loadingAnswers;
    const combinedErrors = [auditsError, findingsError, answersError].filter(Boolean);

    return (
        <Row>
            <Col>
                {isLoading ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            minHeight: 360,
                            color: "#6c757d",
                            fontSize: "1.15rem",
                            fontWeight: 500,
                        }}
                    >
                        <Spinner
                            animation='border'
                            style={{ width: 56, height: 56, borderWidth: 4 }}
                        />
                        <div>{t("loading_data")}</div>
                    </div>
                ) : combinedErrors.length ? (
                    <div className='text-danger'>
                        {combinedErrors.map((err, idx) => (
                            <div key={`${err}-${idx}`}>{err}</div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className='d-flex align-items-center mb-2 mt-3'>
                            <Form.Check
                                className='ms-3'
                                label={t("shopfloor:all_units")}
                                type='switch'
                                id='lpa-show-all-units'
                                checked={showAllUnits}
                                onChange={(event) => setShowAllUnits(event.target.checked)}
                            />
                            {editable ? (
                                <div className='ms-auto me-3 my-auto text-muted'>
                                    <FontAwesomeIcon
                                        className='mx-2'
                                        icon='check'
                                        onClick={() => onSavedLayout()}
                                        size='lg'
                                    />
                                    <FontAwesomeIcon
                                        className='ms-2'
                                        icon='times'
                                        onClick={() => resetHandler()}
                                        size='lg'
                                    />
                                </div>
                            ) : (
                                <FontAwesomeIcon
                                    className='my-auto ms-auto me-3 text-muted'
                                    onClick={() => isEditableHandler(true)}
                                    icon='bars'
                                    size='lg'
                                />
                            )}
                        </div>
                        <Row>
                            <Col>
                                <DynamicGrid
                                    source='lean_lpa'
                                    isEditable={editable}
                                    save={save}
                                    reset={reset}
                                    setReset={setReset}
                                    setTempLayoutsHandler={setTempLayoutsHandler}
                                    layouts={layouts?.lean_lpa}
                                    initLayoutsHandler={initLayoutsHandler}
                                >
                                    <GridItem
                                        key='lpa_0'
                                        data-grid={{ w: 6, h: 10, x: 0, y: 0, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA - {t("shopfloor:percent_completed")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <LineChart
                                                        type='line'
                                                        timeUnit='week'
                                                        displayFormats={{ week: "MMM d" }}
                                                        tooltip='MMM d'
                                                        yTitle={t("shopfloor:percent_completed")}
                                                        title={t("shopfloor:percent_completed")}
                                                        beginAtZero={true}
                                                        suggestedMax={100}
                                                        step={10}
                                                        indicator='bad'
                                                        datasets={{
                                                            datasets: [
                                                                {
                                                                    label: t(
                                                                        "shopfloor:percent_completed",
                                                                    ),
                                                                    data: completionSeries,
                                                                    backgroundColor:
                                                                        "rgba(40, 167, 69, 1)",
                                                                    borderColor:
                                                                        "rgba(40, 167, 69, 1)",
                                                                    pointBackgroundColor:
                                                                        "rgba(40, 167, 69, 1)",
                                                                    pointBorderColor:
                                                                        "rgba(40, 167, 69, 1)",
                                                                },
                                                                {
                                                                    label: t("shopfloor:goal"),
                                                                    data: targetSeries,
                                                                    borderColor:
                                                                        "rgba(128, 0, 128, 0.9)",
                                                                    borderWidth: 1,
                                                                    borderDash: [6, 6],
                                                                    pointRadius: 0,
                                                                    pointHoverRadius: 0,
                                                                    fill: false,
                                                                },
                                                            ],
                                                        }}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_1'
                                        data-grid={{ w: 6, h: 10, x: 6, y: 0, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA - {t("shopfloor:lpa_audits_by_status")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <LineChart
                                                        type='line'
                                                        timeUnit='week'
                                                        displayFormats={{ week: "MMM d" }}
                                                        tooltip='MMM d'
                                                        yTitle={t("shopfloor:lpa_audits_by_status")}
                                                        title={t("shopfloor:lpa_audits_by_status")}
                                                        beginAtZero={true}
                                                        step={1}
                                                        datasets={{
                                                            datasets: statusSeries.map((series) => {
                                                                const colors = {
                                                                    "In Progress - On Time":
                                                                        "rgba(0, 123, 255, 1)",
                                                                    "Completed - On Time":
                                                                        "rgba(40, 167, 69, 1)",
                                                                    "Not Started - On Time":
                                                                        "rgba(158, 158, 158, 1)",
                                                                    "In Progress - Past Due":
                                                                        "#ff9800",
                                                                    "Completed - Past Due":
                                                                        "#8e24aa",
                                                                    Missed: "#e53935",
                                                                };

                                                                const color =
                                                                    colors[series.status] ||
                                                                    "rgba(0, 0, 0, 0.6)";

                                                                return {
                                                                    label: series.status,
                                                                    data: series.data,
                                                                    backgroundColor: color,
                                                                    borderColor: color,
                                                                    pointBackgroundColor: color,
                                                                    pointBorderColor: color,
                                                                };
                                                            }),
                                                        }}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_2'
                                        data-grid={{ w: 6, h: 10, x: 0, y: 10, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA - {t("shopfloor:lpa_findings_by_status")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <LineChart
                                                        type='bar'
                                                        timeUnit='week'
                                                        displayFormats={{ week: "MMM d" }}
                                                        tooltip='MMM d'
                                                        yTitle={t(
                                                            "shopfloor:lpa_findings_by_status",
                                                        )}
                                                        title={t(
                                                            "shopfloor:lpa_findings_by_status",
                                                        )}
                                                        beginAtZero={true}
                                                        step={1}
                                                        stacked={true}
                                                        datasets={{
                                                            datasets: findingStatusSeries.map(
                                                                (series) => {
                                                                    const colors = {
                                                                        "In Progress - On Time":
                                                                            "rgba(0, 123, 255, 1)",
                                                                        "Completed - On Time":
                                                                            "rgba(40, 167, 69, 1)",
                                                                        "Pending - Past Due":
                                                                            "rgba(158, 158, 158, 1)",
                                                                        "In Progress - Past Due":
                                                                            "#ff9800",
                                                                        "Completed - Past Due":
                                                                            "#8e24aa",
                                                                        "Pending - On Time":
                                                                            "#e53935",
                                                                    };

                                                                    const color =
                                                                        colors[series.status] ||
                                                                        "rgba(0, 0, 0, 0.6)";

                                                                    return {
                                                                        label: series.status,
                                                                        data: series.data,
                                                                        backgroundColor: color,
                                                                        borderColor: color,
                                                                    };
                                                                },
                                                            ),
                                                        }}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_3'
                                        data-grid={{ w: 6, h: 10, x: 6, y: 10, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA -{" "}
                                                    {t("shopfloor:lpa_findings_by_status_pie")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <Pie
                                                        data={findingStatusTotals}
                                                        options={doughnutOptions}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_4'
                                        data-grid={{ w: 6, h: 10, x: 0, y: 20, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA -{" "}
                                                    {t(
                                                        "shopfloor:lpa_findings_status_by_responsible_party",
                                                    )}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <Bar
                                                        data={findingStatusByResponsibleParty}
                                                        options={
                                                            findingStatusByResponsiblePartyOptions
                                                        }
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_5'
                                        data-grid={{ w: 6, h: 10, x: 6, y: 20, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA -{" "}
                                                    {t("shopfloor:lpa_top_failures_by_category")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <Bar
                                                        plugins={[
                                                            drawLineLastPlugin,
                                                            ChartDataLabels,
                                                        ]}
                                                        data={topFailuresByCategory}
                                                        options={topFailuresByCategoryOptions}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_6'
                                        data-grid={{ w: 6, h: 10, x: 0, y: 30, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA - {t("shopfloor:question_compliance")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <Pie
                                                        data={questionComplianceData}
                                                        options={questionComplianceOptions}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                    <GridItem
                                        key='lpa_7'
                                        data-grid={{ w: 6, h: 10, x: 6, y: 30, minW: 4, minH: 8 }}
                                    >
                                        <Card>
                                            <Card.Header>
                                                <h5 className='mb-0'>
                                                    LPA -{" "}
                                                    {t("shopfloor:top_finding_countermeasures")}
                                                </h5>
                                            </Card.Header>
                                            <Card.Body className='p-3 h-100'>
                                                <ChartWrap className='h-100'>
                                                    <Bar
                                                        plugins={[
                                                            drawLineLastPlugin,
                                                            ChartDataLabels,
                                                        ]}
                                                        data={topFindingCountermeasures}
                                                        options={topFindingCountermeasuresOptions}
                                                    />
                                                </ChartWrap>
                                            </Card.Body>
                                        </Card>
                                    </GridItem>
                                </DynamicGrid>
                            </Col>
                        </Row>
                    </>
                )}
            </Col>
        </Row>
    );
}

export default LPA;
