import React, { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { Col, Modal, Toast, ToastContainer } from "react-bootstrap";
import { StyledContainer, StyledRow } from "../../components/Layout/StyledContainer";
import { getAllEmployees } from "../../data/API/Spica/SpicaAPI";
import dayjs from "dayjs";
import { useQueryClient } from "react-query";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import getNavigation from "../../routes/navigationRoutes";
import { useRouteMatch, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

const COLUMNS_AM = [
    { id: "am_present", titleKey: "columns.am_present" },
    { id: "am_electric", titleKey: "columns.am_electric" },
    { id: "am_energy", titleKey: "columns.am_energy" },
];

const COLUMNS_PM = [
    { id: "pm_present", titleKey: "columns.pm_present" },
    { id: "pm_electric", titleKey: "columns.pm_electric" },
    { id: "pm_energy", titleKey: "columns.pm_energy" },
];

const COLUMNS_SIDE = [
    { id: "absent", titleKey: "columns.absent" },
    { id: "pool", titleKey: "columns.pool" }, // rightmost
];

// --- persisted slot mapping (0 = Iskanje zaposlenih / pool) ---
const SLOT_BY_COL = {
    pool: 0,
    absent: 1,
    am_present: 2,
    am_electric: 3,
    am_energy: 4,
    pm_present: 5,
    pm_electric: 6,
    pm_energy: 7,
};

// Reverse map so we can turn a saved slot back into a column id
const COL_BY_SLOT = Object.fromEntries(
    Object.entries(SLOT_BY_COL).map(([col, slot]) => [slot, col]),
);

// pass { isFuture: true } when the selected date is in the future
const statusColorFromEvents = (events, { isFuture = false } = {}) => {
    const GREEN = "#16a34a";
    const YELLOW = "#eab308";
    const RED = "#dc2626";

    const codes = Array.isArray(events) ? [...new Set(events)] : [];
    const has = (set) => codes.some((c) => set.has(c));

    // On-site presence signals (no 67 "Odhod" on purpose)
    const PRESENCE = new Set([27, 48, 58, 66, 73, 75]);

    // Partial availability (remote / by-hours / waiting / on-call)
    const PARTIAL = new Set([
        10, 14, 22, 29, 30, 43, 54, 56, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 94, 92, 93,
        96, 97, 101, 102, 103, 57, 107, 108,
    ]);

    // Full unavailability
    const FULL = new Set([
        8, 21, 26, 31, 36, 37, 38, 39, 40, 41, 52, 55, 60, 61, 62, 63, 64, 65, 70, 71, 91, 98, 99,
        100, 104, 105, 109,
    ]);

    // ── FUTURE (simple plan-based colors) ───────────────────────────────
    if (isFuture) {
        if (has(FULL)) return RED; // scheduled not available
        if (has(PARTIAL)) return YELLOW; // scheduled partially available
        return GREEN; // no events => assume coming
    }

    // ── TODAY (keep existing behavior) ─────────────────────────────────
    if (codes.length === 0) return RED;
    if (has(FULL)) return RED;

    const present = has(PRESENCE);
    const partial = has(PARTIAL);

    if (present && partial) return YELLOW;
    if (present) return GREEN;
    return RED;
};

function EmployeeCard({ emp, colId, onDragStart, styles, isFuture, canEdit, dragTitle }) {
    const dotColor = statusColorFromEvents(emp.raw?.events, { isFuture });
    return (
        <div
            draggable={canEdit}
            style={{
                ...styles.card(colId),
                cursor: canEdit ? "grab" : "default",
                opacity: canEdit ? (colId === "absent" ? 0.7 : 1) : 0.9,
            }}
            onDragStart={(e) => canEdit && onDragStart(e, emp.id)}
            title={dragTitle}
        >
            <span style={styles.dot(dotColor)} />
            {emp.name || emp.id}
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.3 }}>
                {(emp.raw?.phone || emp.raw?.mobilePhone) && (
                    <div>{emp.raw.phone || emp.raw.mobilePhone}</div>
                )}
            </div>
        </div>
    );
}

export default function Maintenance() {
    const { t } = useTranslation("maintenance");
    const history = useHistory();

    const openVNDezurstvo = () => {
        const base = shopfloorMatch?.path || "/shopfloor";
        const keyword = kindToKeyword(kind); // "toolshop" | "foundry"
        const attachmentsPath = getNavigation(base, { keyword }).attachments.path;

        history.push({
            pathname: attachmentsPath,
            state: { tab: "dezurstvo_vn" }, // <— also pass via route state
        });
    };

    const queryClient = useQueryClient();
    const [items, setItems] = useState([]);
    const [dragId, setDragId] = useState(null);
    const [poolQuery, setPoolQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const baseUrl = process.env.REACT_APP_OTD_API;
    const isFuture = selectedDate.isAfter(dayjs(), "day");
    const { state } = useContext(AuthContext);

    //copy funct
    const [toast, setToast] = useState({ show: false, text: "", variant: "info" }); // variant: success|warning|danger|info
    const notify = (text, variant = "info") => setToast({ show: true, text, variant });

    const [showCopy, setShowCopy] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copyUntil, setCopyUntil] = useState(""); // YYYY-MM-DD

    const copyCurrentDayToRange = async () => {
        if (!copyUntil) return;

        const from = selectedDate.startOf("day");
        const end = dayjs(copyUntil);
        if (!end.isValid() || end.isBefore(from, "day")) {
            notify(t("messages.invalid_target_date"), "danger");
            return;
        }

        // Dates: tomorrow .. end (inclusive)
        const targetDates = [];
        let d = from.add(1, "day");
        while (d.isBefore(end, "day") || d.isSame(end, "day")) {
            targetDates.push(d.format("YYYY-MM-DD"));
            d = d.add(1, "day");
        }
        if (targetDates.length === 0) {
            notify(t("messages.no_target_days"), "warning");
            return;
        }

        // Current screen state (only non-pool)
        const rows = items
            .filter((it) => it.col && it.col !== "pool")
            .map((it) => ({ id: String(it.id), col: it.col, slot: SLOT_BY_COL[it.col] ?? 0 }));

        if (rows.length === 0) {
            notify(t("messages.nothing_to_copy"), "warning");
            return;
        }

        // Try BULK endpoint
        try {
            const res = await fetch(`${baseUrl}/api/MaintenanceAssignments/copy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromDate: selectedDate.format("YYYY-MM-DD"),
                    dates: targetDates,
                    kind,
                    overwrite: true,
                    includePool: false,
                }),
            });

            if (res.ok) {
                notify(t("messages.copy_success", { count: targetDates.length }), "success");
                return;
            }

            const errText = await res.text().catch(() => "");
            notify(
                t("messages.copy_failed", { status: res.status, errText: errText || "" }),
                "danger",
            );
        } catch (e) {
            notify(t("messages.copy_network_failed"), "danger");
        }
    };
    // copy funct end

    const [kind, setKind] = useState(() => {
        const settings = queryClient.getQueryData(["userSettings", state?.user?.id]);
        const sub = (settings?.defaultSubunit?.value ?? "").toLowerCase();
        return sub.startsWith("livarna") ? "Livarna" : "Orodjarna";
    });

    //routing
    const setNavigationContext = useContext(SetNavigationContext);

    // If your base is always /shopfloor you can hardcode it.
    // This keeps it generic in case the base changes.
    const shopfloorMatch = useRouteMatch("/shopfloor");

    // Map your UI kind -> the keywords getNavigation expects
    const kindToKeyword = (k) => (k === "Livarna" ? "foundry" : "toolshop");

    // Set the top header nav on mount and whenever `kind` changes
    useEffect(() => {
        const base = shopfloorMatch?.path || "/shopfloor";
        const keyword = kindToKeyword(kind);

        setNavigationContext.setNavigationHandler(
            getNavigation(base, { keyword }), // same shape used elsewhere
        );
        setNavigationContext.setSubunitHandler(kind);

        // depend ONLY on `kind` so we don't bounce the effect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kind]);

    const ALLOWED_USERNAMES_BASE = ["danib", "celikd", "bratuzm", "razpeta", "mocniks", "razpetm"];
    const normalizeUser = (s) =>
        (s ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // strip diacritics

    const ALLOWED_SET = new Set(ALLOWED_USERNAMES_BASE.map(normalizeUser));

    const isAdmin = state?.user?.role?.role === "admin";
    const canEdit = isAdmin || ALLOWED_SET.has(normalizeUser(state?.user?.username));

    useEffect(() => {
        (async () => {
            try {
                // 1) Load employees for the day
                const employees = await getAllEmployees(selectedDate, selectedDate, false);
                const normalized = (employees || []).map((e) => ({
                    id: String(e.id),
                    name: String((e.firstname ?? "") + " " + (e.lastname ?? "")).trim(),
                    raw: e,
                    col: "pool", // default until we apply saved assignments
                }));

                // 2) Load saved assignments for that day
                const dateStr = selectedDate.format("YYYY-MM-DD");
                const res = await fetch(
                    `${baseUrl}/api/MaintenanceAssignments?date=${dateStr}&kind=${encodeURIComponent(
                        kind,
                    )}`,
                );
                const rows = res.ok ? await res.json() : [];

                // rows look like: [{ date: "2025-09-23", employeeId: "123", slot: 5 }, ...]
                // Build a quick lookup: employeeId -> columnId
                const colByEmployee = new Map(
                    rows.map((r) => [String(r.employeeId), COL_BY_SLOT[r.slot] ?? "pool"]),
                );

                // 3) Apply columns
                const hydrated = normalized.map((emp) => {
                    const savedCol = colByEmployee.get(emp.id);
                    return savedCol ? { ...emp, col: savedCol } : emp;
                });

                setItems(hydrated);
            } catch (err) {
                console.error("Error fetching employees/assignments:", err);
            }
        })();
    }, [selectedDate, baseUrl, kind]);

    // put this near the top of Maintenance(), after selectedDate state
    const saveAssignment = async (empId, toCol) => {
        const slot = SLOT_BY_COL[toCol] ?? 0; // pool=0 if unknown
        const payload = {
            date: selectedDate.format("YYYY-MM-DD"),
            employeeId: String(empId),
            slot,
            kind,
        };

        const res = await fetch(`${baseUrl}/api/MaintenanceAssignments/upsert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Upsert failed (${res.status}): ${text}`);
        }
    };

    // DnD
    const onDragStart = (e, itemId) => {
        setDragId(String(itemId));
        try {
            e.dataTransfer.setData("text/plain", String(itemId));
        } catch {}
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e, toCol) => {
        e.preventDefault();
        const itemId = dragId || e.dataTransfer.getData("text/plain");
        if (!itemId) return;

        // find current column to allow revert + skip no-op drops
        const prevItem = items.find((it) => String(it.id) === String(itemId));
        const prevCol = prevItem?.col;
        if (prevCol === toCol) return;

        // optimistic UI update
        setItems((prev) =>
            prev.map((it) => (String(it.id) === String(itemId) ? { ...it, col: toCol } : it)),
        );
        setDragId(null);

        // persist
        saveAssignment(itemId, toCol).catch((err) => {
            console.error("Saving assignment failed:", err);
            // revert UI
            setItems((prev) =>
                prev.map((it) =>
                    String(it.id) === String(itemId) ? { ...it, col: prevCol || "pool" } : it,
                ),
            );
            // optional: toast/alert
            // alert("Shranjevanje ni uspelo (poskusi znova).");
        });
    };

    const styles = useMemo(() => {
        const PALETTE = {
            pool: { bg: "#f0f7ff", border: "#cfe3ff", header: "#0b5ed7", chip: "#dceaff" },
            am: { bg: "#f4fbf6", border: "#cfe9d7", header: "#1b7a39", chip: "#e6f6ea" },
            pm: { bg: "#f7f3ff", border: "#e0d6ff", header: "#5a35b5", chip: "#ece6ff" },
            absent: { bg: "#fafafa", border: "#e5e7eb", header: "#6b7280", chip: "#f0f0f0" },
            side: { header: "#334155" },
        };

        const baseCol = {
            borderRadius: 12,
            minHeight: 280,
            height: "70vh",
            padding: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "box-shadow .15s ease, transform .08s ease",
            overflowY: "auto",
        };

        const col = (colId, section) => {
            const isPool = colId === "pool";
            const isAbsent = colId === "absent";
            const theme = isPool
                ? PALETTE.pool
                : isAbsent
                ? PALETTE.absent
                : section === "am"
                ? PALETTE.am
                : PALETTE.pm;

            return {
                ...baseCol,
                background: theme.bg,
                border: `1px ${isAbsent ? "dashed" : "solid"} ${theme.border}`,
            };
        };

        const colHeader = (colId, section) => {
            const isPool = colId === "pool";
            const isAbsent = colId === "absent";
            const theme = isPool
                ? PALETTE.pool
                : isAbsent
                ? PALETTE.absent
                : section === "am"
                ? PALETTE.am
                : PALETTE.pm;

            return {
                fontWeight: 800,
                letterSpacing: ".02em",
                fontSize: "0.95rem",
                marginBottom: 8,
                color: theme.header,
                textTransform: "uppercase",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: theme.bg,
                paddingBottom: 6,
            };
        };

        const card = (colId) => ({
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 8,
            cursor: "grab",
            userSelect: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            fontWeight: 500,
            opacity: colId === "absent" ? 0.7 : 1,
        });

        const chip = (colId, section) => {
            const isPool = colId === "pool";
            const isAbsent = colId === "absent";
            const theme = isPool
                ? PALETTE.pool
                : isAbsent
                ? PALETTE.absent
                : section === "am"
                ? PALETTE.am
                : PALETTE.pm;

            return {
                display: "inline-block",
                background: theme.chip,
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 600,
                color: theme.header,
                marginLeft: 6,
            };
        };

        const board = (cols) => ({
            display: "grid",
            gap: 12,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
        });

        return {
            dot: (bg) => ({
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: bg,
                marginRight: 8,
                verticalAlign: "middle",
                border: "1px solid #e5e7eb",
            }),
            boardsWrap: { display: "grid", gap: 16, gridTemplateColumns: "2fr 2fr 1.4fr" },
            board,
            col,
            colHeader,
            card,
            chip,
            emptyHint: { color: "#9ca3af", fontStyle: "italic", marginTop: 6 },
            groupTitle: (section) => ({
                marginBottom: 8,
                fontWeight: 800,
                letterSpacing: ".02em",
                color:
                    section === "am"
                        ? PALETTE.am.header
                        : section === "pm"
                        ? PALETTE.pm.header
                        : PALETTE.side.header,
            }),
            searchInput: {
                width: "100%",
                marginTop: 6,
                padding: "6px 8px",
                border: "1px solid #cfd5dc",
                borderRadius: 8,
                outline: "none",
            },
        };
    }, []);

    return (
        <StyledContainer fluid>
            <StyledRow className='my-2'>
                <Col xs={12}>
                    <div className='d-flex align-items-center justify-content-between'>
                        <h2 className='m-0'>{t("title")}</h2>
                        <button
                            className='btn btn-outline-secondary btn-sm'
                            onClick={() => setShowCopy(true)}
                            disabled={items.length === 0 || !canEdit}
                            title={t("copy")}
                            style={{ padding: "2px 8px" }}
                        >
                            <span aria-hidden='true'>📋</span> {t("copy_assignment")}
                        </button>
                    </div>
                    <p className='text-muted'>{t("drag_drop_hint")}</p>

                    {/* Controls: left pills | right stack (kind above date) */}
                    <div
                        className='d-flex align-items-start mb-3 justify-content-between flex-wrap'
                        style={{ gap: 8 }}
                    >
                        {/* LEFT: contacts only for orodjarna (pills) OR just the button for livarna */}
                        <div
                            className='d-flex align-items-center'
                            style={{ gap: 8, flexWrap: "wrap" }}
                        >
                            {kind === "Orodjarna" && (
                                <>
                                    <span
                                        style={{
                                            fontSize: "0.9rem",
                                            background: "#f3f4f6",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 999,
                                            padding: "6px 10px",
                                            color: "#374151",
                                        }}
                                    >
                                        {t("electrician_contact")} — <strong>433</strong>
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.9rem",
                                            background: "#f3f4f6",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 999,
                                            padding: "6px 10px",
                                            color: "#374151",
                                        }}
                                    >
                                        {t("energy_contact")} — <strong>193</strong>
                                    </span>
                                </>
                            )}

                            {/* Button for both kinds; for Livarna it shows "instead of" the pills */}
                            <button
                                type='button'
                                className='btn btn-outline-primary btn-sm'
                                onClick={openVNDezurstvo}
                                title={t("open_vn_duty")}
                                style={{ borderRadius: 999, padding: "6px 12px" }}
                            >
                                {t("duty")}
                            </button>
                        </div>

                        {/* RIGHT: kind above date (same width), little gap */}
                        <div
                            className='d-flex flex-column align-items-end ms-auto'
                            style={{ width: 210 }}
                        >
                            <select
                                className='form-select form-select-sm'
                                style={{ width: "100%", borderRadius: 8, marginBottom: 6 }}
                                value={kind}
                                onChange={(e) => setKind(e.target.value)}
                            >
                                <option value='Orodjarna'>{t("toolshop_maintenance")}</option>
                                <option value='Livarna'>{t("foundry_maintenance")}</option>
                            </select>

                            <input
                                type='date'
                                lang='sl-SI'
                                className='form-control form-control-sm'
                                style={{ width: "100%", borderRadius: 8 }}
                                value={selectedDate.format("YYYY-MM-DD")}
                                min={dayjs().format("YYYY-MM-DD")}
                                onChange={(e) =>
                                    e.target.value && setSelectedDate(dayjs(e.target.value))
                                }
                            />
                        </div>

                        <Modal
                            show={showCopy}
                            onHide={() => !isCopying && setShowCopy(false)}
                            size='sm'
                            centered
                        >
                            <Modal.Header closeButton={!isCopying}>
                                <Modal.Title style={{ fontSize: "1rem" }}>
                                    {t("copy_assignment")}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className='mb-2' style={{ fontSize: ".9rem" }}>
                                    {t("copy_until_date")}
                                </div>
                                <input
                                    type='date'
                                    className='form-control form-control-sm'
                                    value={copyUntil}
                                    min={selectedDate.format("YYYY-MM-DD")}
                                    onChange={(e) => setCopyUntil(e.target.value)}
                                    disabled={isCopying}
                                />
                                <div className='form-text'>
                                    {t("copy_for")} <strong>{kind}</strong>.
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <button
                                    className='btn btn-link btn-sm'
                                    onClick={() => setShowCopy(false)}
                                    disabled={isCopying}
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    className='btn btn-primary btn-sm'
                                    onClick={async () => {
                                        setIsCopying(true);
                                        try {
                                            await copyCurrentDayToRange();
                                            setShowCopy(false);
                                            setCopyUntil("");
                                        } finally {
                                            setIsCopying(false);
                                        }
                                    }}
                                    disabled={!copyUntil || isCopying || items.length === 0}
                                >
                                    {isCopying ? t("copying") : t("confirm")}
                                </button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                    {/* ---- render two boards side by side ---- */}
                    <div style={styles.boardsWrap}>
                        {/* DOPOLDAN */}
                        <div>
                            <h5 className='mb-2' style={styles.groupTitle("am")}>
                                {t("groups.am")}
                            </h5>
                            <div style={styles.board(3)}>
                                {COLUMNS_AM.map((c) => {
                                    const colItems = items.filter((it) => it.col === c.id);
                                    return (
                                        <div
                                            key={c.id}
                                            style={styles.col(c.id, "am")}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => onDrop(e, c.id)}
                                        >
                                            <div style={styles.colHeader(c.id, "am")}>
                                                {t(c.titleKey)}{" "}
                                                <span style={styles.chip(c.id, "am")}>
                                                    {colItems.length}
                                                </span>
                                            </div>
                                            {colItems.length === 0 && (
                                                <div style={styles.emptyHint}>{t("empty")}</div>
                                            )}
                                            {colItems.map((emp) => (
                                                <EmployeeCard
                                                    key={emp.id}
                                                    emp={emp}
                                                    colId={c.id}
                                                    onDragStart={onDragStart}
                                                    styles={styles}
                                                    isFuture={isFuture}
                                                    canEdit={canEdit}
                                                    dragTitle={t("drag_to_move")}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* POPOLDAN */}
                        <div>
                            <h5 className='mb-2' style={styles.groupTitle("pm")}>
                                {t("groups.pm")}
                            </h5>
                            <div style={styles.board(3)}>
                                {COLUMNS_PM.map((c) => {
                                    const colItems = items.filter((it) => it.col === c.id);
                                    return (
                                        <div
                                            key={c.id}
                                            style={styles.col(c.id, "pm")}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => onDrop(e, c.id)}
                                        >
                                            <div style={styles.colHeader(c.id, "pm")}>
                                                {t(c.titleKey)}{" "}
                                                <span style={styles.chip(c.id, "pm")}>
                                                    {colItems.length}
                                                </span>
                                            </div>
                                            {colItems.length === 0 && (
                                                <div style={styles.emptyHint}>{t("empty")}</div>
                                            )}
                                            {colItems.map((emp) => (
                                                <EmployeeCard
                                                    key={emp.id}
                                                    emp={emp}
                                                    colId={c.id}
                                                    onDragStart={onDragStart}
                                                    styles={styles}
                                                    isFuture={isFuture}
                                                    canEdit={canEdit}
                                                    dragTitle={t("drag_to_move")}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <h5 className='mb-2' style={styles.groupTitle("side")}>
                                {t("groups.other")}
                            </h5>
                            <div style={styles.board(2)}>
                                {COLUMNS_SIDE.map((c) => {
                                    const colItems = items.filter((it) => it.col === c.id);
                                    const q = poolQuery.trim().toLowerCase();
                                    const shown =
                                        c.id === "pool"
                                            ? q
                                                ? colItems.filter((emp) =>
                                                      (emp.name || "").toLowerCase().includes(q),
                                                  )
                                                : []
                                            : colItems;
                                    return (
                                        <div
                                            key={c.id}
                                            style={styles.col(c.id, c.id === "pool" ? "am" : "pm")}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => onDrop(e, c.id)}
                                        >
                                            <div
                                                style={styles.colHeader(
                                                    c.id,
                                                    c.id === "pool" ? "am" : "pm",
                                                )}
                                            >
                                                {t(c.titleKey)}{" "}
                                                <span
                                                    style={styles.chip(
                                                        c.id,
                                                        c.id === "pool" ? "am" : "pm",
                                                    )}
                                                >
                                                    {shown.length}
                                                </span>
                                                {c.id === "pool" && (
                                                    <input
                                                        type='text'
                                                        placeholder={t("search")}
                                                        value={poolQuery}
                                                        onChange={(e) =>
                                                            setPoolQuery(e.target.value)
                                                        }
                                                        style={styles.searchInput}
                                                    />
                                                )}
                                            </div>

                                            {shown.length === 0 && (
                                                <div style={styles.emptyHint}>
                                                    {c.id === "pool" ? t("pool_hint") : t("empty")}
                                                </div>
                                            )}
                                            {shown.map((emp) => (
                                                <EmployeeCard
                                                    key={emp.id}
                                                    emp={emp}
                                                    colId={c.id}
                                                    onDragStart={onDragStart}
                                                    styles={styles}
                                                    isFuture={isFuture}
                                                    canEdit={canEdit}
                                                    dragTitle={t("drag_to_move")}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Col>
            </StyledRow>
            <ToastContainer position='bottom-center' className='p-3'>
                <Toast
                    bg={toast.variant}
                    onClose={() => setToast((t) => ({ ...t, show: false }))}
                    show={toast.show}
                    delay={3500}
                    autohide
                >
                    <Toast.Body className={toast.variant === "light" ? "" : "text-white"}>
                        {toast.text}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </StyledContainer>
    );
}
