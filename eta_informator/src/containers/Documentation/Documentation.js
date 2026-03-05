import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Row, FormControl, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { matchPath, Redirect, Switch, useRouteMatch, withRouter } from "react-router-dom";
import PrivateRoute from "../../routes/PrivateRoute";
import Order from "./PLM/Order/Order";
import Notices from "./Notices/Notices";
import { ToastContext } from "../../context/ToastContext/ToastContext";
import Material from "./PLM/Material/Material";
import Digitalization from "./Digitalization/Digitalization";
import ReactSelect from "react-select";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useQueryClient } from "react-query";
import findSubunitByKeyword from "../../utils/finders";
import { fetchMaterials } from "../../data/API/Informator/InformatorAPI";
import { useOrderNavigator } from "../../utils/utils";
import Plan from "./PLAN/Plan";
import PlanResults from "./PLAN/PlanResults";
import { getUnitKeyFromSubunitKeyword } from "../../utils/utils";

const StyledContainer = styled(Container)`
    overflow: hidden;
    max-width: 95%;
    padding-top: 1rem;
    min-height: 50vh;
`;

function Documentation(props) {
    const [now] = useState(Date.now());

    // --- Contexts & Hooks ---
    const { path, url } = useRouteMatch();
    const { showToast } = useContext(ToastContext);
    const setNavigationContext = useContext(SetNavigationContext);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const { history } = props;
    const { t } = useTranslation(["documentation", "labels"]);
    const goToOrderIfExists = useOrderNavigator({ history, showToast, t });

    // --- Data from QueryClient ---
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const unitsLabels = queryClient.getQueryData("unitsLabels");

    // --- State ---
    const [selectedUnit, setSelectedUnit] = useState(null);
    // const [useNewSapFlow, setUseNewSapFlow] = useState(() => {
    //     if (typeof window === "undefined") return false;
    //     return localStorage.getItem("useNewSapFlow") === "true";
    // }); // NEW

    const unitKey = getUnitKeyFromSubunitKeyword(selectedUnit?.keyword);

    // --- Routing ---
    const match = matchPath(history.location.pathname, {
        path: path + "/:unit/:subpage",
    });

    // --- Materials ---
    const [materialOptions, setMaterialOptions] = useState([]);
    const materialBoxRef = useRef(null);

    // --- Navigation Tabs ---
    // Digitalization tab is only shown if selectedUnit?.subunitId === 2
    const documentationNav = useMemo(
        () => ({
            plan: { title: "plan", path: `${path}/plan`, notification: 0 },
            PLM: { title: "PLM", path: `${path}/plm`, notification: 0 },
            notices: { title: "notices", path: `${path}/notices`, notification: 0 },
            ...(selectedUnit?.subunitId === 3 && {
                digitalization: {
                    title: "pictorial_instructions",
                    path: `${path}/digitalization`,
                    notification: 0,
                },
            }),
            //rewo: {title: 'rewo', path: `${path}/rewo`, notification: 0 }
        }),
        [selectedUnit, path],
    );

    // --- Set navigation and default selected unit on mount or change ---
    useEffect(() => {
        setNavigationContext.setNavigationHandler(documentationNav);

        // Set default selected unit if not set
        if (selectedUnit === null && unitsLabels && settings) {
            const match = matchPath(history.location.pathname, {
                path: path + "/:unit",
            });
            const urlUnit = match?.params?.unit;
            const label =
                findSubunitByKeyword(unitsLabels, urlUnit) !== undefined
                    ? findSubunitByKeyword(unitsLabels, urlUnit)
                    : findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            setSelectedUnit(label);
        }
    }, [
        documentationNav,
        selectedUnit,
        unitsLabels,
        settings,
        history.location.pathname,
        path,
        setNavigationContext,
    ]);

    // --- Handler for unit selection ---
    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };

    // --- Prepare options for ReactSelect ---
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

    return (
        <StyledContainer>
            <Switch>
                <PrivateRoute exact path='/documentation/plan/results'>
                    <PlanResults />
                </PrivateRoute>
                <PrivateRoute exact path='/documentation/plan'>
                    <Plan />
                </PrivateRoute>
                <PrivateRoute path='/documentation/plm/:id'>
                    <Order selectedUnit={selectedUnit} unitKey={unitKey} />
                </PrivateRoute>
                <PrivateRoute path='/documentation/material/:id'>
                    <Material />
                </PrivateRoute>
                <PrivateRoute exact path='/documentation/digitalization'>
                    <Digitalization
                        {...props}
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        unitsLabels={unitsLabels}
                    />
                </PrivateRoute>
                <PrivateRoute exact path='/documentation/plm'>
                    <Row className='mb-0'>
                        <Col>
                            <h2>{t("navigation:documentation")}</h2>
                        </Col>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <ReactSelect
                                styles={{
                                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                                }}
                                components={{
                                    DropdownIndicator: () => null,
                                    IndicatorSeparator: () => null,
                                }}
                                options={mappedUnitLabels}
                                value={selectedUnit}
                                placeholder={t("section")}
                                onChange={(selected) => selectUnitHandler(selected)}
                                theme={(theme) => ({
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
                                })}
                            />
                        </Col>
                    </Row>
                    <Row className='mt-0 align-items-start'>
                        <Col>
                            <p>{t("documentation_page_text")}</p>
                        </Col>
                        <Col xs={12} md={4} lg={3} xl={2} style={{ marginTop: "-0.50rem" }}>
                            <label>{t("section")}</label>
                        </Col>
                    </Row>
                    <div className='border border-1 rounded p-5 d-flex flex-column align-items-center justify-content-center gap-4'>
                        <div className={"mx-auto"}>
                            <Formik
                                initialValues={{ order: "", material: "" }}
                                validationSchema={Yup.object({
                                    order: Yup.string().max(
                                        10,
                                        t("labels:must_be_shorter_than_chars", { length: 10 }),
                                    ),
                                    material: Yup.string().max(
                                        18,
                                        t("labels:must_be_shorter_than_chars", { length: 18 }),
                                    ),
                                })}
                                onSubmit={(values, { setSubmitting }) => {
                                    if (!values.order && !values.material) {
                                        showToast(
                                            t("warning"),
                                            t("labels:at_least_one_search_parameter"),
                                            "warning",
                                        );
                                        setSubmitting(false);
                                        return;
                                    }
                                    if (values.order && values.material) {
                                        showToast(
                                            t("warning"),
                                            t("labels:only_one_search_parameter"),
                                            "warning",
                                        );
                                        setSubmitting(false);
                                        return;
                                    }

                                    if (values.order) {
                                        goToOrderIfExists(values.order).finally(() =>
                                            setSubmitting(false),
                                        );
                                        return;
                                    }
                                    if (values.material) {
                                        axios
                                            .get(
                                                `https://plmordersearch-0004.bfits.com//data-sap-part/${values.material}/${values.material}.json`,
                                            )
                                            .then((res) => {
                                                if (res.data.dokumente.length > 0) {
                                                    history.push(
                                                        "/documentation/material/" +
                                                            values.material,
                                                    );
                                                }

                                                setSubmitting(false);
                                            })
                                            .catch((err) => {
                                                console.log(err);
                                                showToast(
                                                    t("warning"),
                                                    t("labels:material_not_found", {
                                                        number: values.material,
                                                    }),
                                                    "warning",
                                                );
                                                setSubmitting(false);
                                            });
                                    }
                                }}
                            >
                                {({ values, setFieldValue }) => (
                                    <Form className='d-flex flex-column align-items-center justify-content-center gap-2'>
                                        <div>
                                            <Field
                                                as={FormControl}
                                                autoComplete='off'
                                                name='order'
                                                placeholder={t("delovni_nalog")}
                                                type='text'
                                            />
                                            <label>{t("labels:search_by_work_order_number")}</label>
                                            <ErrorMessage
                                                component='div'
                                                className='small text-danger'
                                                name='order'
                                            />
                                        </div>
                                        <div className='text-muted py-2'>{t("labels:or")}</div>
                                        <div
                                            className='d-flex flex-column w-100 position-relative'
                                            ref={materialBoxRef}
                                        >
                                            <Field
                                                as={FormControl}
                                                autoComplete='off'
                                                name='material'
                                                placeholder={t("material_code")}
                                                type='text'
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setFieldValue("material", v);
                                                    const q = v.trim();
                                                    if (q.length >= 5) {
                                                        fetchMaterials(q)
                                                            .then((results) =>
                                                                setMaterialOptions(results || []),
                                                            )
                                                            .catch(() => setMaterialOptions([]));
                                                    } else {
                                                        setMaterialOptions([]);
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    const q = (e.target.value || "").trim();
                                                    if (
                                                        q.length >= 5 &&
                                                        materialOptions.length === 0
                                                    ) {
                                                        fetchMaterials(q)
                                                            .then((results) =>
                                                                setMaterialOptions(results || []),
                                                            )
                                                            .catch(() => setMaterialOptions([]));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Give click a moment to register before closing
                                                    setTimeout(() => setMaterialOptions([]), 150);
                                                }}
                                            />

                                            {materialOptions.length > 0 && (
                                                <div
                                                    className='dropdown-menu show'
                                                    style={{
                                                        position: "absolute",
                                                        top: "100%",
                                                        left: 0,
                                                        right: "auto", // don't constrain to the input's right edge
                                                        minWidth: "44rem", // make it wider (~704px). Tweak as you like.
                                                        zIndex: 1050,
                                                        maxHeight: "240px",
                                                        overflowY: "auto",
                                                    }}
                                                >
                                                    {materialOptions.map((item, idx) => (
                                                        <button
                                                            type='button'
                                                            key={idx}
                                                            className='dropdown-item'
                                                            style={{
                                                                display: "flex",
                                                                gap: "0.5rem",
                                                                alignItems: "center",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // don't let the input lose focus yet
                                                                setFieldValue(
                                                                    "material",
                                                                    item.Code,
                                                                );
                                                                setMaterialOptions([]);
                                                            }}
                                                            title={`${item.Code} — ${
                                                                item.Description || ""
                                                            }`}
                                                        >
                                                            {item.Code} — {item.Description}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <label>{t("labels:search_by_material_code")}</label>
                                            <ErrorMessage
                                                component='div'
                                                className='small text-danger'
                                                name='material'
                                            />
                                        </div>
                                        <button type='submit' className='btn btn-primary w-100'>
                                            {t("search")}
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                    <div
                        className='text-center mt-3'
                        style={{ fontSize: "0.85rem", color: "gray" }}
                    >
                        <span style={{ marginRight: "0.5rem" }}>
                            {t("labels:plm_order_search_hint")}
                        </span>
                        <button
                            className='btn btn-outline-secondary btn-sm'
                            style={{
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                color: "gray",
                                borderColor: "lightgray",
                            }}
                            onClick={() =>
                                window.open("https://plmordersearch-0004.bfits.com/", "_blank")
                            }
                        >
                            {t("labels:plm_order_search")}
                            <FontAwesomeIcon
                                icon='external-link-alt'
                                style={{ marginLeft: "0.3rem" }}
                            />
                        </button>
                    </div>
                    {/* NEW: toggle for new SAP flow, at the very bottom
                    <div className='d-flex justify-content-center mt-3'>
                        <button
                            type='button'
                            className={`btn btn-sm ${
                                useNewSapFlow ? "btn-success" : "btn-outline-secondary"
                            }`}
                            onClick={() =>
                                setUseNewSapFlow((prev) => {
                                const next = !prev;
                                try {
                                localStorage.setItem("useNewSapFlow", String(next));
                                } catch (e) {
                                
                                console.error(e);
                                }
                                return next;
                                })
                            }
                        >
                            {useNewSapFlow ? "SAP (vključen)" : "Pridobi podatke neposredno iz SAP-a"}
                        </button>
                    </div> */}
                </PrivateRoute>
                <PrivateRoute exact path='/documentation/notices'>
                    <Notices />
                </PrivateRoute>
                <PrivateRoute exact path='/documentation/rewo' allowRoles={["admin"]}>
                    <iframe
                        title='rewo_frame'
                        style={{ width: "100%", height: "85vh" }}
                        src={`https://etacerkno.rewo.io/en/guides/playStep/1D802BDF-6AB1-20E0-EB96-F585931272A7/EA119594-B1DC-1504-53D9-F7F10257CE34/1?ts=${now}`}
                    ></iframe>
                </PrivateRoute>
                <Redirect to='/documentation/plm' />
            </Switch>
        </StyledContainer>
    );
}

export default withRouter(Documentation);
