// src/views/Documentation/Plan/Plan.js
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, FormControl, Button } from "react-bootstrap";
import ReactSelect from "react-select";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import findSubunitByKeyword from "../../../utils/finders";
import { PulseLoader } from "react-spinners";
import { createPortal } from "react-dom";
import { useHistory } from "react-router-dom";

function Plan() {
    const { t } = useTranslation(["documentation", "labels"]);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const history = useHistory();

    const [selectedUnit, setSelectedUnit] = useState(undefined);
    const [query, setQuery] = useState("");
    const [pickedWC, setPickedWC] = useState(null); // { id, label }
    const [results, setResults] = useState([]);
    const [showList, setShowList] = useState(false);
    const [loading, setLoading] = useState(false);

    const abortRef = useRef(null);
    const latestQueryRef = useRef("");
    const anchorRef = useRef(null);

    const [menuPos, setMenuPos] = useState({ left: 0, top: 0, width: 0, maxHeight: 280 });

    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user?.id]);

    const theme = useMemo(
        () => (theme) => ({
            ...theme,
            colors: {
                ...theme.colors,
                primary25: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--p25"),
                primary50: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--p50"),
                primary75: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--p75"),
                primary: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--p100"),
                danger: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue("--danger"),
            },
        }),
        [],
    );

    const mappedUnitLabels = useMemo(
        () =>
            state?.user?.role?.role === "sfm"
                ? unitsLabels?.map((unit) => ({
                      ...unit,
                      options: unit.options.map((option) => ({
                          ...option,
                          isDisabled: selectedUnit?.unitId !== unit.id,
                      })),
                  }))
                : unitsLabels,
        [unitsLabels, selectedUnit?.unitId, state?.user?.role?.role],
    );

    useEffect(() => {
        if (!selectedUnit && unitsLabels && settings?.defaultSubunit?.value) {
            const label = findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            setSelectedUnit(label);
        }
    }, [unitsLabels, settings, selectedUnit]);

    // keep the floating menu aligned with the input
    const updateMenuPos = () => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const desired = Math.max(rect.width, 704);
        const width = Math.min(desired, window.innerWidth - 24);
        const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
        const top = rect.bottom + 4;
        const maxHeight = Math.max(160, Math.min(400, window.innerHeight - top - 16));
        setMenuPos({ left, top, width, maxHeight });
    };

    useEffect(() => {
        if (!showList) return;
        updateMenuPos();
        const onScroll = () => updateMenuPos();
        const onResize = () => updateMenuPos();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [showList]);

    // Protektor override → TED 209
    const getEffectiveTed = (unit) => {
        if (!unit) return undefined;
        const name = (unit.name || unit.label || "").toString();
        const keyword = (unit.keyword || "").toString();
        const looksLikeProtektor = /protektor/i.test(name) || /protektor/i.test(keyword);
        if (looksLikeProtektor) return 209;
        return unit.ted;
    };

    // search (debounced + cancellable)
    useEffect(() => {
        const q = query.trim();
        if (q.length < 5) {
            setShowList(false);
            setResults([]);
            setLoading(false);
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
            return;
        }

        setShowList(true);
        setLoading(true);
        setResults([]);
        latestQueryRef.current = q;

        const handle = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            const plant =
                selectedUnit?.plant || selectedUnit?.werks || selectedUnit?.plantId || "1061";

            // const ted = getEffectiveTed(selectedUnit);
            const take = 50;

            const params = new URLSearchParams();
            params.set("plant", String(plant));
            params.set("take", String(take));
            // if (ted !== undefined && ted !== null && ted !== "") params.set("ted", String(ted));
            params.set("term", q);

            const url = `${
                process.env.REACT_APP_INFORMATORSAP
            }/api/plan/workcenters?${params.toString()}`;

            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error("Failed to fetch work centers");
                const data = await res.json();

                if (latestQueryRef.current !== q) return;

                const mapped =
                    (data || []).map((wc) => ({
                        id: wc.DelovnoMesto,
                        label: `${wc.DelovnoMesto} — ${wc.Opis || ""}`.trim(),
                    })) ?? [];

                setResults(mapped);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err);
                    if (latestQueryRef.current === q) setResults([]);
                }
            } finally {
                if (latestQueryRef.current === q) setLoading(false);
            }
        }, 250);

        return () => clearTimeout(handle);
    }, [query, selectedUnit]);

    const pickResult = (item) => {
        setPickedWC(item); // { id: '2255V201', label: '2255V201 — …' }
        setQuery(item.label); // keep pretty label in the input
        setShowList(false);
    };

    // >>> Navigate to the new results page on submit
    const submitSearch = (e) => {
        e.preventDefault();
        const typed = (query || "").trim();
        console.log(pickedWC);
        const term = pickedWC?.id || typed; // pure WC code (npr. 2255V201)
        if (term.length < 5) return;

        const plant = selectedUnit?.plant || selectedUnit?.werks || selectedUnit?.plantId || "1061";

        // const ted = getEffectiveTed(selectedUnit);
        const params = new URLSearchParams();
        params.set("plant", String(plant));
        // if (ted !== undefined && ted !== null && ted !== "") params.set("ted", String(ted));
        params.set("term", term);
        if (pickedWC?.label) params.set("wcLabel", pickedWC.label); // full label for prikaz

        history.push(`/documentation/plan/results?${params.toString()}`);
    };

    // portal menu
    const menu = showList
        ? createPortal(
              <div
                  className='dropdown-menu show'
                  style={{
                      position: "fixed",
                      left: `${menuPos.left}px`,
                      top: `${menuPos.top}px`,
                      width: `${menuPos.width}px`,
                      maxHeight: `${menuPos.maxHeight}px`,
                      overflowY: "auto",
                      zIndex: 2000,
                      display: "block",
                  }}
                  role='listbox'
              >
                  {loading && (
                      <div className='dropdown-item text-muted d-flex align-items-center gap-2'>
                          <PulseLoader size={6} margin={2} />
                          <span>Nalaganje…</span>
                      </div>
                  )}

                  {!loading && results.length === 0 && (
                      <div className='dropdown-item text-muted'>Ni zadetkov</div>
                  )}

                  {!loading &&
                      results.map((item) => (
                          <button
                              type='button'
                              key={item.id}
                              className='dropdown-item text-truncate'
                              role='option'
                              onMouseDown={() => pickResult(item)}
                              title={item.label}
                          >
                              {item.label}
                          </button>
                      ))}
              </div>,
              document.body,
          )
        : null;

    return (
        <>
            <Row className='mb-0'>
                <Col>
                    <h2>PLAN</h2>
                </Col>
                <Col xs={12} md={4} lg={3} xl={2}>
                    <ReactSelect
                        styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                        components={{
                            DropdownIndicator: () => null,
                            IndicatorSeparator: () => null,
                        }}
                        options={mappedUnitLabels}
                        value={selectedUnit}
                        placeholder={t("section")}
                        onChange={(selected) => {
                            setSelectedUnit(selected);
                            if (selected?.ted !== undefined) {
                                console.log(
                                    "PLAN selected subunit TED (raw):",
                                    selected.ted,
                                    "effective:",
                                    getEffectiveTed(selected),
                                );
                            }
                            setResults([]);
                            setShowList(false);
                        }}
                        theme={theme}
                    />
                </Col>
            </Row>

            <Row className='mt-0 align-items-start'>
                <Col>
                    <p>
                        <strong>Plan</strong> lahko iščete po <strong>številki operacije</strong>{" "}
                        ali <strong>delovnem mestu</strong>. Za pravilne rezultate prosim izberite
                        primerni oddelek na desni.
                    </p>
                </Col>
                <Col xs={12} md={4} lg={3} xl={2} style={{ marginTop: "-0.50rem" }}>
                    <label>{t("section")}</label>
                </Col>
            </Row>

            <div className='border border-1 rounded p-5 d-flex flex-column align-items-center justify-content-center gap-4 mt-3'>
                <div className='mx-auto' style={{ width: "100%", maxWidth: 520 }}>
                    <form className='d-flex align-items-stretch gap-2' onSubmit={submitSearch}>
                        <div className='position-relative flex-grow-1' ref={anchorRef}>
                            <FormControl
                                autoComplete='off'
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if (pickedWC) setPickedWC(null);
                                }}
                                placeholder='Vpišite ime operacije ali delovnega mesta.'
                                aria-label='Iskanje operacij ali delovnih mest'
                                type='text'
                                onFocus={(e) => {
                                    const q = (e.target.value || "").trim();
                                    if (q.length >= 5 && results.length > 0) {
                                        setShowList(true);
                                        updateMenuPos();
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowList(false), 150);
                                }}
                            />
                            {loading && (
                                <div className='position-absolute' style={{ right: 10, top: 8 }}>
                                    <PulseLoader size={6} margin={2} />
                                </div>
                            )}
                            <small className='text-muted d-block mt-1'>
                                Vnesi vsaj 5 znakov za iskanje.
                            </small>
                        </div>

                        <Button
                            type='submit'
                            aria-label='Išči'
                            className='d-flex align-items-center justify-content-center'
                            style={{ minWidth: 44, height: 38, marginTop: 0 }}
                        >
                            Iskanje
                        </Button>
                    </form>
                </div>
            </div>

            {menu}
        </>
    );
}

export default Plan;
