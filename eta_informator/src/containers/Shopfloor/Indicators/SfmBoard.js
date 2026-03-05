// src/components/Indicators/SfmBoard.jsx
import React from "react";

const headerDark = "#003b5c";
const headerMid = "#3d6580";
const panelHeader = "#2b4b62";
const panelFill = "#e9f1f7";
const border = "#1e2f3b";

const API = process.env.REACT_APP_OTD_API;

/* autosize textarea (no scrollbars) */
function AutoTextarea({ value, onChange, onBlur, style }) {
    const ref = React.useRef(null);

    const resize = React.useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = Math.max(el.scrollHeight, 28) + "px";
    }, []);

    React.useEffect(resize, [value, resize]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
                onChange?.(e);
                requestAnimationFrame(resize);
            }}
            onBlur={onBlur}
            style={{
                overflow: "hidden",
                resize: "none",
                border: "1px solid #8aa8bd",
                background: "white",
                padding: "6px 8px",
                fontSize: 13,
                width: "100%",
                boxSizing: "border-box",
                ...style,
            }}
        />
    );
}

/* label on the left, aligned to top so multiline looks clean */
function Field({ label, value, onChange, onBlur, multiline }) {
    return (
        <div style={{ marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div
                style={{
                    width: 120,
                    minWidth: 120,
                    fontSize: 12,
                    color: "#1b2a36",
                    fontWeight: 600,
                    paddingTop: 6,
                    lineHeight: 1.2,
                }}
            >
                {label}
            </div>
            {multiline ? (
                <AutoTextarea value={value} onChange={onChange} onBlur={onBlur} />
            ) : (
                <input
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    style={{
                        flex: 1,
                        border: "1px solid #8aa8bd",
                        background: "white",
                        padding: "6px 8px",
                        fontSize: 13,
                        height: 28,
                        boxSizing: "border-box",
                    }}
                />
            )}
        </div>
    );
}

/* box sizes to content */
function Box({ title, children }) {
    return (
        <div
            style={{
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${border}`,
                background: panelFill,
            }}
        >
            <div
                style={{
                    background: panelHeader,
                    color: "white",
                    padding: "6px 10px",
                    fontWeight: 700,
                    fontSize: 13,
                }}
            >
                {title}
            </div>
            <div style={{ padding: 10, boxSizing: "border-box" }}>{children}</div>
        </div>
    );
}

export default function SfmBoard({ subunit }) {
    const [values, setValues] = React.useState({});
    const [saving, setSaving] = React.useState({});

    const get = (key) => values[key] ?? "";
    const setLocal = (key, val) => setValues((p) => ({ ...p, [key]: val }));

    const save = async (key) => {
        if (!subunit) return;
        const payload = { subunit, fieldKey: key, value: values[key] ?? "" };
        try {
            setSaving((p) => ({ ...p, [key]: true }));
            await fetch(`${API}/api/WeeklyPerformanceState/board-field/upsert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.error("save failed", key, e);
        } finally {
            setSaving((p) => ({ ...p, [key]: false }));
        }
    };

    React.useEffect(() => {
        if (!subunit) return;
        (async () => {
            try {
                const res = await fetch(
                    `${API}/api/WeeklyPerformanceState/board-fields?subunit=${encodeURIComponent(
                        subunit,
                    )}`,
                );
                const data = await res.json();
                const map = {};
                data.forEach((x) => (map[x.fieldKey] = x.value ?? ""));
                setValues(map);
            } catch (e) {
                console.error("load board fields failed", e);
            }
        })();
    }, [subunit]);

    const sfmBoxes = [
        {
            title: "Dnevni pregled",
            fields: [
                { key: "sfm.daily.ritem", label: "Ritem" },
                { key: "sfm.daily.time", label: "Čas" },
                { key: "sfm.daily.moderator", label: "Moderator" },
                { key: "sfm.daily.participants", label: "Udeleženci", multiline: true },
            ],
        },
        {
            title: "Idea Management",
            fields: [
                { key: "sfm.idea.ritem", label: "Ritem" },
                { key: "sfm.idea.time", label: "Čas" },
                { key: "sfm.idea.moderator", label: "Moderator" },
                { key: "sfm.idea.participants", label: "Udeleženci", multiline: true },
            ],
        },
        {
            title: "Vzdrževanje in TPM",
            fields: [
                { key: "sfm.tpm.ritem", label: "Ritem" },
                { key: "sfm.tpm.time", label: "Čas" },
                { key: "sfm.tpm.moderator", label: "Moderator" },
                { key: "sfm.tpm.participants", label: "Udeleženci", multiline: true },
            ],
        },
    ];

    const dnevniRedBoxes = [
        { key: "agenda.start", title: "Začetek" },
        { key: "agenda.currentStatus", title: "Aktualno stanje" },
        { key: "agenda.kpis", title: "KPI - kazalniki" },
        { key: "agenda.issues", title: "Problemi aktivnosti" },
        { key: "agenda.next", title: "Naslednje teme/zaključek" },
    ];

    return (
        <div style={{ border: `1px solid ${border}`, background: "#f4f8fb", marginBottom: 16 }}>
            <div
                style={{
                    background: headerDark,
                    color: "white",
                    padding: "10px 14px",
                    fontWeight: 800,
                    fontSize: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                Organizacija
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    padding: 12,
                    alignItems: "start",
                }}
            >
                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                        style={{
                            background: headerMid,
                            color: "white",
                            padding: "6px 10px",
                            fontWeight: 800,
                            border: `1px solid ${border}`,
                        }}
                    >
                        SFM sestanki
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {sfmBoxes.map((b) => (
                            <Box key={b.title} title={b.title}>
                                {b.fields.map((f) => (
                                    <Field
                                        key={f.key}
                                        label={f.label}
                                        multiline={f.multiline}
                                        value={get(f.key)}
                                        onChange={(e) => setLocal(f.key, e.target.value)}
                                        onBlur={() => save(f.key)}
                                    />
                                ))}
                            </Box>
                        ))}
                    </div>
                </div>

                {/* Middle column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                        style={{
                            background: headerMid,
                            color: "white",
                            padding: "6px 10px",
                            fontWeight: 800,
                            border: `1px solid ${border}`,
                        }}
                    >
                        Dnevni red
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {dnevniRedBoxes.map((b) => (
                            <Box key={b.key} title={b.title}>
                                <AutoTextarea
                                    value={get(b.key)}
                                    onChange={(e) => setLocal(b.key, e.target.value)}
                                    onBlur={() => save(b.key)}
                                />
                            </Box>
                        ))}
                    </div>
                </div>

                {/* Right column (Pravila) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                        style={{
                            background: headerMid,
                            color: "white",
                            padding: "6px 10px",
                            fontWeight: 800,
                            border: `1px solid ${border}`,
                        }}
                    >
                        Pravila
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Editable Pravila text (autosize + save on blur) */}
                        <Box title='Pravila'>
                            <AutoTextarea
                                value={get("rules.main")}
                                onChange={(e) => setLocal("rules.main", e.target.value)}
                                onBlur={() => save("rules.main")}
                            />
                        </Box>

                        {/* Dodatne informacije (also autosize + save on blur) */}
                        <Box title='Dodatne informacije'>
                            <AutoTextarea
                                value={get("info.extra")}
                                onChange={(e) => setLocal("info.extra", e.target.value)}
                                onBlur={() => save("info.extra")}
                            />
                        </Box>
                    </div>
                </div>
            </div>
        </div>
    );
}
