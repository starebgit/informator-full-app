import Modal from "react-bootstrap/Modal";
import dayjs from "dayjs";
import { Fragment, useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Row, Col, Form } from "react-bootstrap";
import Table from "../../../components/Tables/Table";
import LineChart from "../../../components/Charts/Time/Time";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Spinner from "react-bootstrap/Spinner";

const StyledConfirmModal = styled(Modal)`
    .modal-content {
        border: none;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        border-radius: 18px;
        background: #f8f9fa;
    }
    .lean-graph-modal__title {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
    }
    .lean-graph-modal__title-sub {
        font-size: 0.85em;
        color: var(--bs-secondary-color);
        font-weight: normal;
    }
    .modal-dialog.lean-graph-modal {
        max-width: 96vw;
        width: 96vw;
    }
    .modal-dialog.lean-graph-modal .modal-content,
    .modal-dialog.lean-graph-modal .modal-header,
    .modal-dialog.lean-graph-modal .modal-body,
    .modal-dialog.lean-graph-modal .modal-footer {
        background: #fff;
    }
    .modal-header {
        border-bottom: none;
        border-radius: 18px 18px 0 0;
        background: #f8f9fa;
        padding-bottom: 0.5rem;
    }
    .modal-footer {
        border-top: none;
        border-radius: 0 0 18px 18px;
        background: #f8f9fa;
        padding-top: 0.5rem;
    }
`;

const locationOptions = [
    { value: "Livarna", label: "Livarna" },
    { value: "Plošča", label: "Plošča" },
    { value: "Termoregulator", label: "Termoregulator" },
    {
        value: "Izdelava polizdelkov / Tehnične službe",
        label: "Izdelava polizdelkov / Tehnične službe",
    },
];

const statusOptions = [
    {
        key: "inprogress_on",
        label: "In Progress - On Time",
        status: "In Progress - On Time",
    },
    {
        key: "inprogress_past",
        label: "In Progress - Past Due",
        status: "In Progress - Past Due",
    },
    {
        key: "completed_on",
        label: "Completed - On Time",
        status: "Completed - On Time",
    },
    {
        key: "completed_past",
        label: "Completed - Past Due",
        status: "Completed - Past Due",
    },
    {
        key: "pending_on",
        label: "Pending - On Time",
        status: "Pending - On Time",
    },
    {
        key: "pending_past",
        label: "Pending - Past Due",
        status: "Pending - Past Due",
    },
];

const allColumns = [
    "ApprovingPartyComments",
    "AuditDescription",
    "AuditDueDate",
    "Auditor",
    "AuditorComments",
    "Category",
    "ClosedDate",
    "ClosedInAudit",
    "Countermeasure",
    "DaysOpen",
    "DaysPastDue",
    "Department",
    "Description",
    "DueDate",
    "FindingClosingComments",
    "FindingComments",
    "FindingType",
    "HasActionPlan",
    "HasAttachment",
    "HasFindingsFiles",
    "HasResponseFiles",
    "Layer",
    "Location",
    "OpenDate",
    "Personnel",
    "Program",
    "QuestionText",
    "QuestionTitle",
    "ResponsibleParty",
    "ResponsiblePartyDepartment",
    "Shift",
    "Status",
    "SubCategory",
    "Tags",
    "Urgency",
];

const defaultColumnKeys = [
    "ResponsibleParty",
    "DueDate",
    "Status",
    "Location",
    "AuditorComments",
    "HasAttachment",
];

function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
        .replace(/\s+/g, "_")
        .toLowerCase();
}

function renderCell(value, colKey) {
    if (value == null) return "";
    if (typeof value === "boolean") return value ? "Da" : "Ne";
    if (typeof value === "object") {
        if ("Name" in value) return value.Name;
        return JSON.stringify(value);
    }
    if ((/date/i.test(colKey) || /date/i.test(value)) && dayjs(value).isValid()) {
        return dayjs(value).format("DD.MM.YYYY");
    }
    return value.toString();
}

function EaseTab({ selectedUnit, selectedMonth }) {
    const { t, i18n } = useTranslation(["shopfloor", "labels"]);

    const [selectedYear, setSelectedYear] = useState(
        selectedMonth ? dayjs(selectedMonth).toDate() : new Date(),
    );
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [closingFindingId, setClosingFindingId] = useState(null);
    const [confirmCloseModal, setConfirmCloseModal] = useState(false);
    const [findingToClose, setFindingToClose] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [graphModalFindings, setGraphModalFindings] = useState([]);
    const [graphModalAudits, setGraphModalAudits] = useState([]);
    const [graphModalTitle, setGraphModalTitle] = useState("");
    const [graphModalKind, setGraphModalKind] = useState("findings");
    const [graphInterval, setGraphInterval] = useState("month");

    const [statusFilter, setStatusFilter] = useState(["inprogress_on", "inprogress_past"]);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
    const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    const intervalDropdownRef = useRef(null);
    const statusDropdownRef = useRef(null);
    const locationDropdownRef = useRef(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [showList, setShowList] = useState(false);
    const [easeFindings, setEaseFindings] = useState([]);
    const [loadingFindings, setLoadingFindings] = useState(false);
    const [findingsError, setFindingsError] = useState(null);
    const [audits, setAudits] = useState([]);
    const [loadingAudits, setLoadingAudits] = useState(false);
    const [auditsError, setAuditsError] = useState(null);

    const [visibleColumns, setVisibleColumns] = useState(defaultColumnKeys);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedGraphLocation, setSelectedGraphLocation] = useState(null);

    useEffect(() => {
        if (!showIntervalDropdown && !showStatusDropdown && !showLocationDropdown) return;

        const onPointerDown = (event) => {
            const intervalEl = intervalDropdownRef.current;
            const statusEl = statusDropdownRef.current;
            const locationEl = locationDropdownRef.current;

            if (showIntervalDropdown && intervalEl && intervalEl.contains(event.target)) return;
            if (showStatusDropdown && statusEl && statusEl.contains(event.target)) return;
            if (showLocationDropdown && locationEl && locationEl.contains(event.target)) return;

            if (showIntervalDropdown) setShowIntervalDropdown(false);
            if (showStatusDropdown) setShowStatusDropdown(false);
            if (showLocationDropdown) setShowLocationDropdown(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [showIntervalDropdown, showStatusDropdown, showLocationDropdown]);

    useEffect(() => {
        setSelectedYear(selectedMonth ? dayjs(selectedMonth).toDate() : new Date());
    }, [selectedMonth]);

    useEffect(() => {
        setLoadingFindings(true);
        setFindingsError(null);

        fetch("http://172.20.1.40:3020/api/findings", {
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => {
                setEaseFindings(data.Items || []);
                setLoadingFindings(false);
            })
            .catch(() => {
                setFindingsError("Napaka pri pridobivanju findings.");
                setLoadingFindings(false);
            });
    }, [selectedUnit, selectedMonth]);

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
                setAuditsError("Napaka pri pridobivanju audits.");
                setLoadingAudits(false);
            });
    }, [selectedUnit, selectedMonth]);

    useEffect(() => {
        const keyword = selectedUnit?.keyword;
        if (!keyword) return;

        const termoregulatorKeywords = ["termo_d1", "termo_d2", "termo_d3", "termo_55"];
        const ploscaKeywords = ["plosca_montaza", "plosca_keramika", "protektor"];
        const livarnaKeywords = [
            "livarna_obdelovalnica",
            "livarna_brusilnica",
            "livarna_robotske_celice",
            "foundry",
        ];
        const izdelavaPolizdelkovKeywords = ["automation", "tubes", "toolshop"];

        const autoLocationValue = termoregulatorKeywords.includes(keyword)
            ? "Termoregulator"
            : ploscaKeywords.includes(keyword)
            ? "Plošča"
            : livarnaKeywords.includes(keyword)
            ? "Livarna"
            : izdelavaPolizdelkovKeywords.includes(keyword)
            ? "Izdelava polizdelkov / Tehnične službe"
            : null;

        if (!autoLocationValue) return;

        const autoLocationOption = locationOptions.find((opt) => opt.value === autoLocationValue);
        if (!autoLocationOption) return;

        setSelectedLocation(autoLocationOption);
        setSelectedGraphLocation(autoLocationOption);
    }, [selectedUnit?.keyword]);

    const handleStatusFilterChange = (key) => {
        setStatusFilter((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const handleColumnToggle = (key) => {
        setVisibleColumns((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const onRowClicked = (row) => {
        setSelectedFinding(row);
        setModalOpen(true);
    };

    async function handleCloseFinding(finding) {
        setClosingFindingId(finding.Id);
        try {
            const response = await fetch(
                (process.env.REACT_APP_EASE || "") + `/api/findings/${finding.Id}/close`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ closingComments: "Closed from UI" }),
                },
            );

            let errorText = "";
            if (!response.ok) {
                errorText = await response.text();

                try {
                    const errObj = JSON.parse(errorText);
                    if (
                        errObj?.details?.Errors?.some((e) => e.PropertyName === "CountermeasureId")
                    ) {
                        alert(
                            "Protiukrep (Countermeasure) ni izbran. Najprej izberi protiukrep, nato lahko zapreš presojo.",
                        );
                        return;
                    }
                } catch (jsonErr) {
                    /* ignore */
                }

                throw new Error("Failed to close finding");
            }

            setEaseFindings((prev) => prev.filter((f) => f.Id !== finding.Id));
            setConfirmCloseModal(false);
            setFindingToClose(null);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
        } catch (e) {
            console.error("Napaka pri zapiranju findinga:", e);
            if (!String(e).includes("Protiukrep")) {
                alert("Napaka pri zapiranju findinga!");
            }
        } finally {
            setClosingFindingId(null);
        }
    }

    const getLocationValue = (item) => {
        if (!item) return null;
        let loc = item.Location;
        if (typeof item.Location === "object" && item.Location !== null) {
            loc =
                item.Location.Name ||
                item.Location.name ||
                item.Location.value ||
                item.Location.label;
        }
        return loc;
    };

    const matchesSelectedLocation = (item, location) => {
        if (!location) return true;
        const loc = getLocationValue(item);

        if (location.value === "Livarna") {
            const livarnaLocations = [
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
            ];
            return livarnaLocations.includes(loc);
        }

        if (location.value === "Plošča") {
            const ploscaLocations = [
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
            ];
            return ploscaLocations.includes(loc);
        }

        if (location.value === "Termoregulator") {
            const termoregulatorLocations = [
                "Reduciranje",
                "Sestavljanje čutil in kapilare",
                "Tunelske peči",
                "VF",
                "Diastat linija",
                "Avtomatsko polnjenje",
                "Ročno polnjenje",
                "Lasersko varjenje SECA",
                "Peči za staranje",
                "Montažne linije",
                "Izdelava podnožij",
                "Merilnica",
                "Skladišče supermarket",
                "Statistična kontrola",
                "Pakiranje",
                "Navijanje diastatov",
            ];
            return termoregulatorLocations.includes(loc);
        }

        if (location.value === "Izdelava polizdelkov / Tehnične službe") {
            const izdelavaPolizdelkovLocations = [
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
            ];
            return izdelavaPolizdelkovLocations.includes(loc);
        }

        return loc === location.value || loc === location.label;
    };

    const renderConfirmCloseModal = () => (
        <StyledConfirmModal
            show={confirmCloseModal}
            onHide={() => {
                setConfirmCloseModal(false);
                setFindingToClose(null);
            }}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title style={{ fontWeight: 600 }}>
                    {t("labels:confirm_close_finding") || "Potrditev zapiranja findinga"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body
                style={{
                    fontSize: "1.1rem",
                    textAlign: "center",
                    padding: "2rem 1.5rem",
                }}
            >
                <FontAwesomeIcon
                    icon='exclamation-triangle'
                    color='#dc3545'
                    size='2x'
                    style={{ marginBottom: 12 }}
                />
                <div>
                    {t("labels:are_you_sure_close_finding") || "Ali res želite zapreti ta finding?"}
                </div>
            </Modal.Body>

            <Modal.Footer>
                <button
                    className='btn btn-secondary'
                    style={{ minWidth: 100 }}
                    onClick={() => {
                        setConfirmCloseModal(false);
                        setFindingToClose(null);
                    }}
                >
                    {t("labels:cancel") || "Prekliči"}
                </button>

                <button
                    className='btn btn-danger'
                    style={{ minWidth: 100 }}
                    onClick={() => findingToClose && handleCloseFinding(findingToClose)}
                    disabled={!findingToClose}
                >
                    {t("labels:close") || "Zapri"}
                </button>
            </Modal.Footer>
        </StyledConfirmModal>
    );

    const renderSuccessModal = () => (
        <StyledConfirmModal
            show={showSuccessModal}
            onHide={() => setShowSuccessModal(false)}
            centered
        >
            <Modal.Body
                style={{
                    fontSize: "1.1rem",
                    textAlign: "center",
                    padding: "2rem 1.5rem",
                }}
            >
                <FontAwesomeIcon
                    icon='check-circle'
                    color='#28a745'
                    size='2x'
                    style={{ marginBottom: 12 }}
                />
                <div>
                    {t("labels:finding_closed_success") || "Odstrel je bil uspešno odstranjen!"}
                </div>
            </Modal.Body>
        </StyledConfirmModal>
    );

    const locationFilteredFindings = Array.isArray(easeFindings)
        ? easeFindings.filter((item) => matchesSelectedLocation(item, selectedLocation))
        : [];

    const graphLocationFilteredFindings = Array.isArray(easeFindings)
        ? easeFindings.filter((item) => matchesSelectedLocation(item, selectedGraphLocation))
        : [];

    const graphLocationFilteredAudits = Array.isArray(audits)
        ? audits.filter((item) => matchesSelectedLocation(item, selectedGraphLocation))
        : [];

    const formatMonthName = (date) => {
        if (!date) return "";
        const locale = String(i18n?.language || "sl").replace("_", "-");
        try {
            const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
            return month ? month.charAt(0).toUpperCase() + month.slice(1) : "";
        } catch (e) {
            const fallback = dayjs(date).format("MMMM");
            return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : "";
        }
    };

    const getWeekStartDates = (year) => {
        const weeksInYear = dayjs(`${year}-12-28`).isoWeek();
        const base = dayjs(`${year}-01-04`);

        return Array.from({ length: weeksInYear }, (_, idx) =>
            base
                .isoWeek(idx + 1)
                .isoWeekday(7)
                .startOf("day"),
        );
    };

    const getWeekEndDatesForMonth = (monthDate) => {
        const month = dayjs(monthDate);
        if (!month.isValid()) return [];

        const start = month.startOf("month");
        const end = month.endOf("month");

        const unique = new Map();
        let cursor = start;

        while (cursor.isBefore(end, "day") || cursor.isSame(end, "day")) {
            const weekEnd = cursor.isoWeekday(7).startOf("day");
            unique.set(weekEnd.valueOf(), weekEnd);
            cursor = cursor.add(1, "day");
        }

        return Array.from(unique.values()).sort((a, b) => a.valueOf() - b.valueOf());
    };

    const getMonthStartDates = (year) =>
        Array.from({ length: 12 }, (_, i) =>
            dayjs(`${year}-${(i + 1).toString().padStart(2, "0")}-01`),
        );

    const getFindingRelevantDate = (finding) => {
        if (finding?.ClosedDate) return dayjs(finding.ClosedDate);
        if (finding?.DueDate) return dayjs(finding.DueDate);
        return null;
    };

    const getAuditRelevantDate = (audit) => {
        if (audit?.CompletedDate) return dayjs(audit.CompletedDate);
        if (audit?.DueDate) return dayjs(audit.DueDate);
        if (audit?.AuditDueDate) return dayjs(audit.AuditDueDate);
        return null;
    };

    const getFindingStatusName = (finding) => String(finding?.Status?.Name || "");

    const getAuditStatusName = (audit) =>
        String(audit?.Status?.Name || audit?.Status?.name || audit?.Status || "");

    const buildSeries = (items, statusName, getRelevantDate, getStatusName, points, interval) => {
        if (!Array.isArray(items)) return [];

        const selectedMonthDate = selectedMonth ? dayjs(selectedMonth) : null;
        const hasSelectedMonth = Boolean(selectedMonthDate && selectedMonthDate.isValid());

        return points.map((point) => {
            const count = items.filter((item) => {
                const relevantDate = getRelevantDate(item);
                if (!relevantDate || !relevantDate.isValid()) return false;

                if (interval === "week" && hasSelectedMonth) {
                    if (!relevantDate.isSame(selectedMonthDate, "month")) return false;
                }

                const matchesStatus = getStatusName(item) === statusName;
                if (!matchesStatus) return false;

                if (interval === "week") {
                    const weekStart = relevantDate.isoWeekday(7).startOf("day");
                    return weekStart.isSame(point, "day");
                }

                return (
                    relevantDate.year() === point.year() && relevantDate.month() === point.month()
                );
            }).length;

            return {
                x: point.toDate(),
                y: count,
            };
        });
    };

    const resetGraphModal = () => {
        setShowGraphModal(false);
        setGraphModalFindings([]);
        setGraphModalAudits([]);
        setGraphModalTitle("");
        setGraphModalKind("findings");
    };

    const onGraphPointClick = (pointData) => {
        const pointDate = dayjs(pointData?.x);
        const legendStatus = String(pointData?.legendLabel || "");
        const legendStatusNormalized = legendStatus.toLowerCase();

        const selectedMonthDate = selectedMonth ? dayjs(selectedMonth) : null;
        const hasSelectedMonth = Boolean(selectedMonthDate && selectedMonthDate.isValid());

        const intervalLabel = pointDate.isValid()
            ? graphInterval === "week"
                ? `${pointDate.subtract(6, "day").format("DD.MM.YYYY")} - ${pointDate.format(
                      "DD.MM.YYYY",
                  )}`
                : formatMonthName(pointDate.toDate())
            : "";
        setGraphModalTitle(
            `${legendStatus || t("shopfloor:status")}${intervalLabel ? `\n${intervalLabel}` : ""}`,
        );

        const relatedFindings = Array.isArray(graphLocationFilteredFindings)
            ? graphLocationFilteredFindings.filter((finding) => {
                  const relevantDate = finding?.ClosedDate
                      ? dayjs(finding.ClosedDate)
                      : dayjs(finding?.DueDate);

                  if (!relevantDate.isValid() || !pointDate.isValid()) return false;

                  if (graphInterval === "week" && hasSelectedMonth) {
                      if (!relevantDate.isSame(selectedMonthDate, "month")) return false;
                  }

                  const matchesDate =
                      graphInterval === "week"
                          ? relevantDate
                                .isoWeekday(7)
                                .startOf("day")
                                .isSame(pointDate.startOf("day"), "day")
                          : relevantDate.year() === pointDate.year() &&
                            relevantDate.month() === pointDate.month();

                  const findingStatus = String(finding?.Status?.Name || "");
                  const matchesStatus =
                      legendStatusNormalized.length === 0
                          ? true
                          : findingStatus.toLowerCase() === legendStatusNormalized;

                  return matchesDate && matchesStatus;
              })
            : [];

        setGraphModalFindings(relatedFindings);
        setGraphModalAudits([]);
        setGraphModalKind("findings");
        setShowGraphModal(true);
    };

    const onAuditGraphPointClick = (pointData) => {
        const pointDate = dayjs(pointData?.x);
        const legendStatus = String(pointData?.legendLabel || "");
        const legendStatusNormalized = legendStatus.toLowerCase();

        const selectedMonthDate = selectedMonth ? dayjs(selectedMonth) : null;
        const hasSelectedMonth = Boolean(selectedMonthDate && selectedMonthDate.isValid());

        const intervalLabel = pointDate.isValid()
            ? graphInterval === "week"
                ? `${pointDate.subtract(6, "day").format("DD.MM.YYYY")} - ${pointDate.format(
                      "DD.MM.YYYY",
                  )}`
                : formatMonthName(pointDate.toDate())
            : "";
        setGraphModalTitle(
            `${legendStatus || t("shopfloor:status")}${intervalLabel ? `\n${intervalLabel}` : ""}`,
        );

        const relatedAudits = Array.isArray(graphLocationFilteredAudits)
            ? graphLocationFilteredAudits.filter((audit) => {
                  const relevantDate = audit?.CompletedDate
                      ? dayjs(audit.CompletedDate)
                      : audit?.DueDate
                      ? dayjs(audit.DueDate)
                      : dayjs(audit?.AuditDueDate);

                  if (!relevantDate.isValid() || !pointDate.isValid()) return false;

                  if (graphInterval === "week" && hasSelectedMonth) {
                      if (!relevantDate.isSame(selectedMonthDate, "month")) return false;
                  }

                  const matchesDate =
                      graphInterval === "week"
                          ? relevantDate
                                .isoWeekday(7)
                                .startOf("day")
                                .isSame(pointDate.startOf("day"), "day")
                          : relevantDate.year() === pointDate.year() &&
                            relevantDate.month() === pointDate.month();

                  const auditStatus = String(
                      audit?.Status?.Name || audit?.Status?.name || audit?.Status || "",
                  );

                  const matchesStatus =
                      legendStatusNormalized.length === 0
                          ? true
                          : auditStatus.toLowerCase() === legendStatusNormalized;

                  return matchesDate && matchesStatus;
              })
            : [];

        setGraphModalAudits(relatedAudits);
        setGraphModalFindings([]);
        setGraphModalKind("audits");
        setShowGraphModal(true);
    };

    const tableColumns = [
        ...visibleColumns
            .filter((colKey) => colKey !== "Site")
            .map((colKey) => {
                const snakeKey = toSnakeCase(colKey);
                let label = t(`shopfloor:${snakeKey}`);
                if (label === `shopfloor:${snakeKey}`) label = t(`labels:${snakeKey}`);
                if (label === `labels:${snakeKey}`) label = colKey;

                if (colKey === "Description") {
                    return {
                        name: label,
                        selector: (row) => renderCell(row[colKey], colKey),
                        sortable: true,
                        wrap: true,
                        grow: 3,
                        minWidth: "320px",
                    };
                }

                if (colKey === "Location") {
                    return {
                        name: label,
                        selector: (row) => {
                            if (!row) return "";
                            const location = renderCell(row["Location"], "Location");
                            const site = renderCell(row["Site"], "Site");
                            if (location && site) return `${location} (${site})`;
                            if (location) return location;
                            if (site) return site;
                            return "";
                        },
                        sortable: true,
                        wrap: true,
                    };
                }

                return {
                    name: label,
                    selector: (row) => renderCell(row[colKey], colKey),
                    sortable: true,
                    wrap: true,
                };
            }),
    ];

    const graphModalTitleParts = String(graphModalTitle || "").split("\n");
    const graphModalTitleMain = (graphModalTitleParts[0] || "").trim();
    const graphModalTitleSub = graphModalTitleParts.slice(1).join("\n").trim();

    const selectedYearValue = dayjs(selectedYear).year();
    const selectedMonthDate = selectedMonth ? dayjs(selectedMonth) : null;
    const hasSelectedMonth = Boolean(selectedMonthDate && selectedMonthDate.isValid());
    const graphPoints =
        graphInterval === "week"
            ? hasSelectedMonth
                ? getWeekEndDatesForMonth(selectedMonthDate)
                : getWeekStartDates(selectedYearValue)
            : getMonthStartDates(selectedYearValue);
    const graphTimeUnit = graphInterval === "week" ? "week" : "month";
    const graphTooltip = graphInterval === "week" ? "dd.MM.yyyy" : "MMMM";
    const graphDisplayFormats = graphInterval === "week" ? { week: "dd.MM" } : { month: "MMMM" };
    const graphTitleSuffix = graphInterval === "week" ? "tednih" : "mesecih";
    const graphTooltipTitle = (tooltipItems) => {
        const item = tooltipItems[0];
        if (item && item.label) {
            if (graphInterval === "month") {
                return item.label.charAt(0).toUpperCase() + item.label.slice(1);
            }
            return item.label;
        }
        return "";
    };

    return (
        <Row>
            <Col>
                {loadingFindings && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: 250,
                            height: "100%",
                        }}
                    >
                        <Spinner animation='border' role='status' style={{ width: 48, height: 48 }}>
                            <span className='visually-hidden'>Loading...</span>
                        </Spinner>
                    </div>
                )}

                {findingsError && <div style={{ color: "red" }}>{findingsError}</div>}

                {!loadingFindings && !findingsError && (
                    <>
                        <div
                            style={{
                                marginTop: 20,
                                marginBottom: 40,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 12,
                            }}
                        >
                            <div
                                ref={locationDropdownRef}
                                style={{ position: "relative", paddingLeft: 16 }}
                            >
                                <button
                                    className='btn btn-primary'
                                    style={{ whiteSpace: "nowrap" }}
                                    onClick={() => setShowLocationDropdown((v) => !v)}
                                >
                                    Lokacija
                                </button>

                                {showLocationDropdown && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: "110%",
                                            background: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: 6,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            zIndex: 20,
                                            padding: 16,
                                            minWidth: 220,
                                            maxHeight: "370px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        {locationOptions.map((opt) => (
                                            <Form.Check
                                                key={opt.value}
                                                type='radio'
                                                id={`location-check-${opt.value}`}
                                                label={opt.label}
                                                checked={
                                                    selectedLocation &&
                                                    selectedLocation.value === opt.value
                                                }
                                                onChange={() => {
                                                    setSelectedLocation(opt);
                                                    setSelectedGraphLocation(opt);
                                                }}
                                                style={{ marginBottom: 4 }}
                                            />
                                        ))}

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                marginTop: 12,
                                                gap: 8,
                                            }}
                                        >
                                            <button
                                                className='btn btn-sm btn-secondary'
                                                onClick={() => {
                                                    setSelectedLocation(null);
                                                    setSelectedGraphLocation(null);
                                                    setShowLocationDropdown(false);
                                                }}
                                            >
                                                Počisti
                                            </button>

                                            <button
                                                className='btn btn-sm btn-primary'
                                                onClick={() => setShowLocationDropdown(false)}
                                            >
                                                Zapri
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    justifyContent: "flex-end",
                                    width: "100%",
                                    paddingRight: 16,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ fontWeight: 600 }}>Prikaz:</label>
                                    <button
                                        className={`btn btn-sm btn-${
                                            graphInterval === "month"
                                                ? "primary"
                                                : "outline-primary"
                                        }`}
                                        onClick={() => setGraphInterval("month")}
                                    >
                                        Mesečno
                                    </button>
                                    <button
                                        className={`btn btn-sm btn-${
                                            graphInterval === "week" ? "primary" : "outline-primary"
                                        }`}
                                        onClick={() => setGraphInterval("week")}
                                    >
                                        Tedensko
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                marginBottom: 20,
                                display: "flex",
                                gap: 24,
                            }}
                        >
                            <div style={{ flex: 1, height: 400 }}>
                                <LineChart
                                    type='line'
                                    timeUnit={graphTimeUnit}
                                    yTitle='Število findingov po stanju'
                                    title={`Število findingov po stanju in ${graphTitleSuffix}`}
                                    tooltip={graphTooltip}
                                    beginAtZero={true}
                                    step={1}
                                    displayFormats={graphDisplayFormats}
                                    datasets={{
                                        datasets: [
                                            {
                                                label: "In progress - On Time",
                                                data: buildSeries(
                                                    graphLocationFilteredFindings,
                                                    "In Progress - On Time",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(0, 123, 255, 1)",
                                                borderColor: "rgba(0, 123, 255, 1)",
                                                pointBackgroundColor: "rgba(0, 123, 255, 1)",
                                                pointBorderColor: "rgba(0, 123, 255, 1)",
                                            },
                                            {
                                                label: "Completed - On Time",
                                                data: buildSeries(
                                                    graphLocationFilteredFindings,
                                                    "Completed - On Time",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(40, 167, 69, 1)",
                                                borderColor: "rgba(40, 167, 69, 1)",
                                                pointBackgroundColor: "rgba(40, 167, 69, 1)",
                                                pointBorderColor: "rgba(40, 167, 69, 1)",
                                            },
                                            {
                                                label: "Pending - Past Due",
                                                data: buildSeries(
                                                    graphLocationFilteredFindings,
                                                    "Pending - Past Due",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(158, 158, 158, 1)",
                                                borderColor: "rgba(158, 158, 158, 1)",
                                                pointBackgroundColor: "rgba(158, 158, 158, 1)",
                                                pointBorderColor: "rgba(158, 158, 158, 1)",
                                            },
                                            {
                                                label: "In Progress - Past Due",
                                                data: buildSeries(
                                                    graphLocationFilteredFindings,
                                                    "In Progress - Past Due",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#ff9800",
                                                borderColor: "#ff9800",
                                                pointBackgroundColor: "#ff9800",
                                                pointBorderColor: "#ff9800",
                                            },
                                            {
                                                label: "Completed - Past Due",
                                                data: buildSeries(
                                                    graphLocationFilteredFindings,
                                                    "Completed - Past Due",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#8e24aa",
                                                borderColor: "#8e24aa",
                                                pointBackgroundColor: "#8e24aa",
                                                pointBorderColor: "#8e24aa",
                                            },
                                            {
                                                label: "Pending - On Time",
                                                data: buildSeries(
                                                    locationFilteredFindings,
                                                    "Pending - On Time",
                                                    getFindingRelevantDate,
                                                    getFindingStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#e53935",
                                                borderColor: "#e53935",
                                                pointBackgroundColor: "#e53935",
                                                pointBorderColor: "#e53935",
                                            },
                                        ],
                                    }}
                                    tooltipCallbacks={{ title: graphTooltipTitle }}
                                    enableLineClick={true}
                                    onPointClick={onGraphPointClick}
                                />
                            </div>

                            <div style={{ flex: 1, height: 400 }}>
                                <LineChart
                                    type='line'
                                    timeUnit={graphTimeUnit}
                                    yTitle='Število presoj po stanju'
                                    title={`Število presoj po stanju in ${graphTitleSuffix}`}
                                    tooltip={graphTooltip}
                                    beginAtZero={true}
                                    step={1}
                                    displayFormats={graphDisplayFormats}
                                    datasets={{
                                        datasets: [
                                            {
                                                label: "In progress - On Time",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "In Progress - On Time",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(0, 123, 255, 1)",
                                                borderColor: "rgba(0, 123, 255, 1)",
                                                pointBackgroundColor: "rgba(0, 123, 255, 1)",
                                                pointBorderColor: "rgba(0, 123, 255, 1)",
                                            },
                                            {
                                                label: "Completed - On Time",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "Completed - On Time",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(40, 167, 69, 1)",
                                                borderColor: "rgba(40, 167, 69, 1)",
                                                pointBackgroundColor: "rgba(40, 167, 69, 1)",
                                                pointBorderColor: "rgba(40, 167, 69, 1)",
                                            },
                                            {
                                                label: "Not Started - On Time",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "Not Started - On Time",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "rgba(158, 158, 158, 1)",
                                                borderColor: "rgba(158, 158, 158, 1)",
                                                pointBackgroundColor: "rgba(158, 158, 158, 1)",
                                                pointBorderColor: "rgba(158, 158, 158, 1)",
                                            },
                                            {
                                                label: "In Progress - Past Due",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "In Progress - Past Due",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#ff9800",
                                                borderColor: "#ff9800",
                                                pointBackgroundColor: "#ff9800",
                                                pointBorderColor: "#ff9800",
                                            },
                                            {
                                                label: "Completed - Past Due",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "Completed - Past Due",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#8e24aa",
                                                borderColor: "#8e24aa",
                                                pointBackgroundColor: "#8e24aa",
                                                pointBorderColor: "#8e24aa",
                                            },
                                            {
                                                label: "Missed",
                                                data: buildSeries(
                                                    graphLocationFilteredAudits,
                                                    "Missed",
                                                    getAuditRelevantDate,
                                                    getAuditStatusName,
                                                    graphPoints,
                                                    graphInterval,
                                                ),
                                                backgroundColor: "#e53935",
                                                borderColor: "#e53935",
                                                pointBackgroundColor: "#e53935",
                                                pointBorderColor: "#e53935",
                                            },
                                        ],
                                    }}
                                    tooltipCallbacks={{ title: graphTooltipTitle }}
                                    enableLineClick={true}
                                    onPointClick={onAuditGraphPointClick}
                                />
                            </div>
                        </div>

                        <hr
                            style={{
                                margin: "32px 0",
                                borderTop: "2px solid #e0e0e0",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                justifyContent: "flex-end",
                                marginTop: 6,
                                marginRight: 16,
                            }}
                        >
                            <div ref={intervalDropdownRef} style={{ position: "relative" }}>
                                <button
                                    className='btn btn-primary'
                                    style={{
                                        marginLeft: 0,
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={() => setShowIntervalDropdown((v) => !v)}
                                >
                                    Časovni interval
                                </button>

                                {showIntervalDropdown && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: "110%",
                                            background: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: 6,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            zIndex: 20,
                                            padding: 16,
                                            minWidth: 220,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <label style={{ minWidth: 30 }}>Od:</label>
                                            <input
                                                type='date'
                                                value={dateFilter.start || ""}
                                                onChange={(e) =>
                                                    setDateFilter((df) => ({
                                                        ...df,
                                                        start: e.target.value,
                                                    }))
                                                }
                                                style={{
                                                    border: "1px solid #ccc",
                                                    borderRadius: 4,
                                                    padding: "2px 6px",
                                                }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <label style={{ minWidth: 30 }}>Do:</label>
                                            <input
                                                type='date'
                                                value={dateFilter.end || ""}
                                                onChange={(e) =>
                                                    setDateFilter((df) => ({
                                                        ...df,
                                                        end: e.target.value,
                                                    }))
                                                }
                                                style={{
                                                    border: "1px solid #ccc",
                                                    borderRadius: 4,
                                                    padding: "2px 6px",
                                                }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                marginTop: 12,
                                                gap: 8,
                                            }}
                                        >
                                            <button
                                                className='btn btn-sm btn-secondary'
                                                onClick={() => {
                                                    setDateFilter({ start: "", end: "" });
                                                    setShowIntervalDropdown(false);
                                                }}
                                            >
                                                Počisti
                                            </button>

                                            <button
                                                className='btn btn-sm btn-primary'
                                                onClick={() => setShowIntervalDropdown(false)}
                                            >
                                                Zapri
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div ref={statusDropdownRef} style={{ position: "relative" }}>
                                <button
                                    className='btn btn-primary'
                                    style={{ whiteSpace: "nowrap" }}
                                    onClick={() => setShowStatusDropdown((v) => !v)}
                                >
                                    Stanja
                                </button>

                                {showStatusDropdown && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            bottom: "110%",
                                            background: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: 6,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            zIndex: 20,
                                            padding: 16,
                                            minWidth: 220,
                                            maxHeight: "370px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        {statusOptions.map((opt) => (
                                            <Form.Check
                                                key={opt.key}
                                                type='checkbox'
                                                id={`status-check-${opt.key}`}
                                                label={opt.label}
                                                checked={statusFilter.includes(opt.key)}
                                                onChange={() => handleStatusFilterChange(opt.key)}
                                                style={{ marginBottom: 4 }}
                                            />
                                        ))}

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                marginTop: 12,
                                                gap: 8,
                                            }}
                                        >
                                            <button
                                                className='btn btn-sm btn-secondary'
                                                onClick={() =>
                                                    setStatusFilter([
                                                        "inprogress_on",
                                                        "inprogress_past",
                                                    ])
                                                }
                                            >
                                                Privzeto
                                            </button>

                                            <button
                                                className='btn btn-sm btn-primary'
                                                onClick={() => setShowStatusDropdown(false)}
                                            >
                                                Zapri
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: "relative" }}>
                                <FontAwesomeIcon
                                    icon='bars'
                                    size='lg'
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setShowList((prev) => !prev)}
                                    title={t("labels:show_hide_columns") || "Prikaži/skrij stolpce"}
                                />

                                {showList && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            bottom: "calc(120% + 6px)",
                                            background: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: 4,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            zIndex: 10,
                                            minWidth: 220,
                                            maxHeight: 340,
                                            overflowY: "auto",
                                            padding: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                marginBottom: 8,
                                            }}
                                        >
                                            {t("labels:show_hide_columns") ||
                                                "Prikaži/skrij stolpce"}
                                        </div>

                                        {allColumns.map((colKey) => {
                                            const snakeKey = toSnakeCase(colKey);
                                            let label = t(`shopfloor:${snakeKey}`);
                                            if (label === `shopfloor:${snakeKey}`) {
                                                label = t(`labels:${snakeKey}`);
                                            }
                                            if (label === `labels:${snakeKey}`) {
                                                label = colKey;
                                            }

                                            return (
                                                <Form.Check
                                                    key={colKey}
                                                    type='checkbox'
                                                    id={`col-check-${colKey}`}
                                                    label={label}
                                                    checked={visibleColumns.includes(colKey)}
                                                    onChange={() => handleColumnToggle(colKey)}
                                                    disabled={defaultColumnKeys.includes(colKey)}
                                                    style={{ marginBottom: 4 }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                                marginRight: 12,
                                marginLeft: 12,
                            }}
                        >
                            <Table
                                data={locationFilteredFindings
                                    .filter((f) => {
                                        if (!statusFilter.length) return true;

                                        return statusOptions
                                            .filter((opt) => statusFilter.includes(opt.key))
                                            .some((opt) => f.Status?.Name === opt.status);
                                    })
                                    .filter((f) => {
                                        if (!dateFilter.start && !dateFilter.end) return true;

                                        const openDate = f.OpenDate
                                            ? dayjs(f.OpenDate).format("YYYY-MM-DD")
                                            : null;

                                        const DueDate = f.DueDate
                                            ? dayjs(f.DueDate).format("YYYY-MM-DD")
                                            : null;

                                        const start = dateFilter.start || null;
                                        const end = dateFilter.end || null;

                                        if (start && !end) {
                                            return openDate && openDate >= start;
                                        }

                                        if (!start && end) {
                                            return DueDate && DueDate <= end;
                                        }

                                        if (start && end) {
                                            return (
                                                openDate &&
                                                DueDate &&
                                                openDate >= start &&
                                                DueDate <= end
                                            );
                                        }

                                        return true;
                                    })}
                                columns={tableColumns}
                                dense
                                highlightOnHover
                                pointerOnHover
                                paginationPerPage={10}
                                pagination
                                onRowClicked={onRowClicked}
                                onRowMouseEnter={(row) => setHoveredRowId(row.Id)}
                                onRowMouseLeave={() => setHoveredRowId(null)}
                            />
                        </div>

                        {renderConfirmCloseModal()}
                        {renderSuccessModal()}

                        <Modal
                            show={modalOpen}
                            onHide={() => setModalOpen(false)}
                            size='lg'
                            centered
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>
                                    {t("labels:detailed_view") || "Detailed view"}
                                </Modal.Title>
                            </Modal.Header>

                            <Modal.Body>
                                {selectedFinding && (
                                    <div
                                        style={{
                                            maxHeight: 500,
                                            overflowY: "auto",
                                        }}
                                    >
                                        <table className='table table-sm table-bordered'>
                                            <tbody>
                                                {Object.entries(selectedFinding)
                                                    .filter(
                                                        ([key]) =>
                                                            key !== "Id" && key !== "AuditId",
                                                    )
                                                    .map(([key, value]) => {
                                                        const snakeKey = toSnakeCase(key);
                                                        let label = t(`shopfloor:${snakeKey}`);

                                                        if (label === `shopfloor:${snakeKey}`) {
                                                            label = t(`labels:${snakeKey}`);
                                                        }

                                                        if (label === `labels:${snakeKey}`) {
                                                            label = key;
                                                        }

                                                        return (
                                                            <tr key={key}>
                                                                <th
                                                                    style={{
                                                                        width: "35%",
                                                                        background: "#f8f9fa",
                                                                    }}
                                                                >
                                                                    {label}
                                                                </th>
                                                                <td>{renderCell(value, key)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Modal.Body>
                        </Modal>

                        {showGraphModal && (
                            <StyledConfirmModal
                                show={showGraphModal}
                                size='xl'
                                dialogClassName='lean-graph-modal'
                                onHide={resetGraphModal}
                                centered
                            >
                                <Modal.Header>
                                    <Modal.Title className='lean-graph-modal__title'>
                                        <span>
                                            {graphModalTitleMain ||
                                                graphModalTitle ||
                                                "Graph Point Clicked"}
                                        </span>

                                        {graphModalTitleSub && (
                                            <span className='lean-graph-modal__title-sub'>
                                                {graphModalTitleSub}
                                            </span>
                                        )}
                                    </Modal.Title>
                                </Modal.Header>

                                <Modal.Body>
                                    <div
                                        style={{
                                            overflowX: "auto",
                                            maxHeight: "70vh",
                                        }}
                                    >
                                        {graphModalKind === "audits" ? (
                                            <table className='table' style={{ width: "100%" }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ minWidth: 220 }}>
                                                            {t("shopfloor:name")}
                                                        </th>
                                                        <th style={{ minWidth: 130 }}>
                                                            {t("shopfloor:due_date")}
                                                        </th>
                                                        <th style={{ minWidth: 200 }}>
                                                            {t("shopfloor:auditor")}
                                                        </th>
                                                        <th style={{ minWidth: 180 }}>
                                                            {t("shopfloor:status")}
                                                        </th>
                                                        <th style={{ minWidth: 220 }}>
                                                            {t("shopfloor:location")}
                                                        </th>
                                                        <th style={{ minWidth: 180 }}>
                                                            {t("shopfloor:program")}
                                                        </th>
                                                        <th style={{ minWidth: 120 }}>
                                                            {t("shopfloor:time_spent")}
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {graphModalAudits.map((audit) => {
                                                        const location = renderCell(
                                                            audit?.Location,
                                                            "Location",
                                                        );
                                                        const site = renderCell(
                                                            audit?.Site,
                                                            "Site",
                                                        );
                                                        const locationWithSite =
                                                            location && site
                                                                ? `${location} (${site})`
                                                                : location || site || "";

                                                        const name =
                                                            audit?.Name ||
                                                            audit?.name ||
                                                            audit?.AuditName ||
                                                            audit?.Title ||
                                                            audit?.AuditTitle ||
                                                            "";

                                                        const dueDate =
                                                            audit?.DueDate ||
                                                            audit?.dueDate ||
                                                            audit?.AuditDueDate ||
                                                            audit?.auditDueDate ||
                                                            "";

                                                        const assessor =
                                                            audit?.Assessor ||
                                                            audit?.assessor ||
                                                            audit?.Auditor ||
                                                            audit?.auditor ||
                                                            "";

                                                        const status =
                                                            audit?.Status || audit?.status || "";

                                                        const program =
                                                            audit?.Program || audit?.program || "";

                                                        const timeSpent =
                                                            audit?.TimeSpent ||
                                                            audit?.timeSpent ||
                                                            audit?.TimeSpentMinutes ||
                                                            audit?.timeSpentMinutes ||
                                                            audit?.TimeSpentInMinutes ||
                                                            "";

                                                        return (
                                                            <tr
                                                                key={
                                                                    audit?.Id ||
                                                                    audit?.id ||
                                                                    JSON.stringify(audit)
                                                                }
                                                            >
                                                                <td>
                                                                    {renderCell(name, "Name") ||
                                                                        "N/A"}
                                                                </td>
                                                                <td>
                                                                    {renderCell(
                                                                        dueDate,
                                                                        "DueDate",
                                                                    ) || "N/A"}
                                                                </td>
                                                                <td>
                                                                    {renderCell(
                                                                        assessor,
                                                                        "Assessor",
                                                                    ) || "N/A"}
                                                                </td>
                                                                <td>
                                                                    {renderCell(status, "Status") ||
                                                                        "N/A"}
                                                                </td>
                                                                <td>{locationWithSite || "N/A"}</td>
                                                                <td>
                                                                    {renderCell(
                                                                        program,
                                                                        "Program",
                                                                    ) || "N/A"}
                                                                </td>
                                                                <td>
                                                                    {renderCell(
                                                                        timeSpent,
                                                                        "TimeSpent",
                                                                    ) || "-"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {graphModalAudits.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={7}
                                                                style={{ textAlign: "center" }}
                                                            >
                                                                No audits for this point.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <table className='table' style={{ width: "100%" }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ minWidth: 180 }}>
                                                            {t("shopfloor:responsible_party")}
                                                        </th>
                                                        <th style={{ minWidth: 120 }}>
                                                            {t("shopfloor:due_date")}
                                                        </th>
                                                        <th style={{ minWidth: 200 }}>
                                                            {t("shopfloor:status")}
                                                        </th>
                                                        <th style={{ minWidth: 220 }}>
                                                            {t("shopfloor:location")}
                                                        </th>
                                                        <th style={{ minWidth: 320 }}>
                                                            {t("shopfloor:auditor_comments")}
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {graphModalFindings.map((finding) => {
                                                        const location = renderCell(
                                                            finding?.Location,
                                                            "Location",
                                                        );
                                                        const site = renderCell(
                                                            finding?.Site,
                                                            "Site",
                                                        );

                                                        const locationWithSite =
                                                            location && site
                                                                ? `${location} (${site})`
                                                                : location || site || "";

                                                        return (
                                                            <tr
                                                                key={
                                                                    finding?.Id ||
                                                                    JSON.stringify(finding)
                                                                }
                                                            >
                                                                <td>
                                                                    {renderCell(
                                                                        finding?.ResponsibleParty,
                                                                        "ResponsibleParty",
                                                                    ) || "N/A"}
                                                                </td>
                                                                <td>
                                                                    {finding?.DueDate &&
                                                                    dayjs(finding.DueDate).isValid()
                                                                        ? dayjs(
                                                                              finding.DueDate,
                                                                          ).format("YYYY-MM-DD")
                                                                        : "N/A"}
                                                                </td>
                                                                <td>
                                                                    {renderCell(
                                                                        finding?.Status,
                                                                        "Status",
                                                                    ) || "N/A"}
                                                                </td>
                                                                <td>{locationWithSite || "N/A"}</td>
                                                                <td>
                                                                    {renderCell(
                                                                        finding?.AuditorComments,
                                                                        "AuditorComments",
                                                                    ) || "N/A"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {graphModalFindings.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                style={{ textAlign: "center" }}
                                                            >
                                                                No findings for this point.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </Modal.Body>

                                <Modal.Footer>
                                    <button
                                        className='btn btn-secondary'
                                        onClick={() => {
                                            resetGraphModal();
                                        }}
                                    >
                                        {t("labels:close") || "Close"}
                                    </button>
                                </Modal.Footer>
                            </StyledConfirmModal>
                        )}
                    </>
                )}
            </Col>
        </Row>
    );
}

export default EaseTab;
