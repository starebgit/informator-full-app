import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import CategoryPane from "../Attachments/CategoryPane";
import LineChart from "../../../components/Charts/Time/Time";
import Table from "../../../components/Tables/Table";

function FiveSTab({
    attachments,
    selectedAttachment,
    onClickHandler,
    selectedMonth,
    selectedUnit,
}) {
    const { t } = useTranslation(["shopfloor", "labels"]);
    const filteredAttachments = attachments?.filter((doc) => {
        if (dayjs(selectedMonth).isSame(dayjs(), "month")) {
            return (
                doc.category.category === "5S" &&
                dayjs(doc.startDate).isSameOrBefore(dayjs(), "day") &&
                dayjs(doc.endDate).isSameOrAfter(dayjs(), "day")
            );
        }

        return doc.category.category === "5S";
    });

    const [audits, setAudits] = useState([]);
    const [loadingAudits, setLoadingAudits] = useState(false);
    const [auditsError, setAuditsError] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [answersError, setAnswersError] = useState(null);

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
    }, [selectedMonth]);

    useEffect(() => {
        setLoadingAnswers(true);
        setAnswersError(null);

        const from = dayjs(selectedMonth || dayjs())
            .startOf("month")
            .format("YYYY-MM-DD");
        const to = dayjs(selectedMonth || dayjs())
            .endOf("month")
            .format("YYYY-MM-DD");

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
    }, [selectedMonth]);

    const termoregulatorKeywords = ["termo_d1", "termo_d2", "termo_d3", "termo_55"];
    const ploscaKeywords = ["plosca_montaza", "plosca_keramika", "protektor"];
    const livarnaKeywords = [
        "livarna_obdelovalnica",
        "livarna_brusilnica",
        "livarna_robotske_celice",
        "foundry",
    ];
    const izdelavaPolizdelkovKeywords = ["automation", "tubes", "toolshop"];

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

    const getAnswerLocationValue = (answer) => {
        if (!answer) return "";
        const location = answer.Location;
        if (!location) return "";
        if (typeof location === "object") {
            return String(location.Name || location.name || location.value || location.label || "");
        }
        return String(location);
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

    const getAuditStatusName = (audit) =>
        String(audit?.Status?.Name || audit?.Status?.name || audit?.Status || audit?.status || "");

    const getAuditRelevantDate = (audit) => {
        if (audit?.CompletedDate) return dayjs(audit.CompletedDate);
        if (audit?.DueDate) return dayjs(audit.DueDate);
        if (audit?.AuditDueDate) return dayjs(audit.AuditDueDate);
        return null;
    };

    const locationFilteredAudits = useMemo(() => {
        const source = Array.isArray(audits) ? audits : [];
        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        if (!order) return source;

        const allowedLocations = new Set(order);
        return source.filter((audit) => allowedLocations.has(getAuditLocationValue(audit)));
    }, [audits, selectedUnit?.keyword]);

    const fiveSAudits = useMemo(() => {
        const needle = "5s";
        return locationFilteredAudits.filter((audit) =>
            getAuditProgramName(audit).toLowerCase().includes(needle),
        );
    }, [locationFilteredAudits]);

    const completionSeries = useMemo(() => {
        const base = selectedMonth ? dayjs(selectedMonth) : dayjs();
        if (!base.isValid()) return [];

        const year = base.year();
        const months = Array.from({ length: 12 }, (_, i) =>
            dayjs().year(year).month(i).startOf("month"),
        );

        return months.map((month) => {
            const monthAudits = fiveSAudits.filter((audit) => {
                const relevantDate = getAuditRelevantDate(audit);
                return relevantDate?.isValid() && relevantDate.isSame(month, "month");
            });

            const total = monthAudits.length;
            const completed = monthAudits.filter((audit) =>
                getAuditStatusName(audit).toLowerCase().includes("completed"),
            ).length;

            const pct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

            return {
                x: month.toDate(),
                y: pct,
            };
        });
    }, [fiveSAudits, selectedMonth]);

    const filteredAnswers = useMemo(() => {
        const allowed = new Set(["5S tedensko ocenjevanje", "5S Audit"]);
        const base = Array.isArray(answers) ? answers.filter((a) => allowed.has(a?.AuditName)) : [];

        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        if (!order) return base;

        const allowedLocations = new Set(order);
        return base.filter((a) => allowedLocations.has(getAnswerLocationValue(a)));
    }, [answers, selectedUnit?.keyword]);

    const sortedAnswers = useMemo(() => {
        if (!Array.isArray(filteredAnswers)) return [];

        const category = getLocationCategory(selectedUnit?.keyword);
        const order = category ? locationSortOrders[category] : null;
        const items = filteredAnswers.slice();

        if (!order) {
            return items.sort((a, b) => {
                const aLoc = getAnswerLocationValue(a);
                const bLoc = getAnswerLocationValue(b);
                return aLoc.localeCompare(bLoc, "sl", { sensitivity: "base" });
            });
        }

        const rank = new Map(order.map((name, idx) => [name, idx]));

        return items.sort((a, b) => {
            const aLoc = getAnswerLocationValue(a);
            const bLoc = getAnswerLocationValue(b);
            const aRank = rank.has(aLoc) ? rank.get(aLoc) : Number.POSITIVE_INFINITY;
            const bRank = rank.has(bLoc) ? rank.get(bLoc) : Number.POSITIVE_INFINITY;

            if (aRank !== bRank) return aRank - bRank;

            return aLoc.localeCompare(bLoc, "sl", { sensitivity: "base" });
        });
    }, [filteredAnswers, selectedUnit?.keyword]);

    const answersColumns = useMemo(
        () => [
            {
                name: t("shopfloor:audit_name"),
                selector: (row) => row.AuditName ?? "-",
                sortable: true,
                wrap: true,
            },
            {
                name: t("shopfloor:auditor"),
                selector: (row) => row.Auditor?.Name ?? "-",
                sortable: true,
                wrap: true,
            },
            {
                name: t("shopfloor:location"),
                selector: (row) => row.Location?.Name ?? "-",
                sortable: true,
                wrap: true,
            },
            {
                name: t("shopfloor:question_title"),
                selector: (row) => row.QuestionTitle ?? "-",
                wrap: true,
            },
            {
                name: t("shopfloor:question_text"),
                cell: (row) => (
                    <div style={{ maxWidth: 420, whiteSpace: "normal" }}>
                        {row.QuestionText ?? "-"}
                    </div>
                ),
                grow: 2,
            },
            {
                name: t("shopfloor:response"),
                selector: (row) => row.Response ?? "-",
                wrap: true,
            },
            {
                name: t("shopfloor:answer_date"),
                selector: (row) =>
                    row.AnswerDate ? dayjs(row.AnswerDate).format("DD.MM.YYYY HH:mm") : "-",
                sortable: true,
                wrap: true,
            },
            {
                name: t("shopfloor:tags"),
                selector: (row) =>
                    Array.isArray(row.Tags) && row.Tags.length
                        ? row.Tags.map((tag) => tag.Name)
                              .filter(Boolean)
                              .join(", ")
                        : "-",
                wrap: true,
            },
            {
                name: t("shopfloor:auditor_comments"),
                cell: (row) => (
                    <div style={{ maxWidth: 320, whiteSpace: "normal" }}>
                        {row.AuditorComment ?? "-"}
                    </div>
                ),
                grow: 2,
            },
        ],
        [t],
    );

    const isLoading = loadingAudits || loadingAnswers;
    const combinedErrors = [auditsError, answersError].filter(Boolean);

    return (
        <Row>
            <Col>
                <CategoryPane
                    attachments={filteredAttachments}
                    selectedAttachment={selectedAttachment}
                    onClickHandler={onClickHandler}
                />
                <hr
                    style={{
                        margin: "32px 0",
                        borderTop: "2px solid #e0e0e0",
                    }}
                />
                <div className='mt-5' style={{ marginTop: "5rem" }}>
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
                            <div style={{ height: 640 }}>
                                <h5 className='mb-3 px-2'>
                                    {t("shopfloor:percent_completed_audits_5s")}
                                </h5>
                                <LineChart
                                    type='line'
                                    timeUnit='month'
                                    displayFormats={{ month: "MMMM" }}
                                    tooltip='MMMM'
                                    yTitle={t("shopfloor:percent_completed_audits_5s")}
                                    title={t("shopfloor:percent_completed_audits_5s")}
                                    beginAtZero={true}
                                    suggestedMax={100}
                                    step={10}
                                    indicator='bad'
                                    datasets={{
                                        datasets: [
                                            {
                                                label: t("shopfloor:percent_completed"),
                                                data: completionSeries,
                                                backgroundColor: "rgba(40, 167, 69, 1)",
                                                borderColor: "rgba(40, 167, 69, 1)",
                                                pointBackgroundColor: "rgba(40, 167, 69, 1)",
                                                pointBorderColor: "rgba(40, 167, 69, 1)",
                                            },
                                        ],
                                    }}
                                />
                            </div>
                            <hr
                                style={{
                                    margin: "32px 0",
                                    borderTop: "2px solid #e0e0e0",
                                }}
                            />
                            <div className='mt-5 px-2'>
                                <h5 className='mb-3'>{t("answers")}</h5>
                                <Table
                                    data={sortedAnswers}
                                    columns={answersColumns}
                                    dense
                                    highlightOnHover
                                    pointerOnHover
                                    pagination
                                    paginationPerPage={10}
                                />
                            </div>
                        </>
                    )}
                </div>
            </Col>
        </Row>
    );
}

export default FiveSTab;
