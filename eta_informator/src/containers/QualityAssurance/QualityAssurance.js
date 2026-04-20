import styled from "styled-components";
import { Row, Col, Container, Button, Form, Popover } from "react-bootstrap";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import findSubunitByKeyword, { findSubunitById } from "../../utils/finders";
import DatePicker from "../../components/Forms/CustomInputs/DatePicker/DatePicker";
import PrivateRoute from "../../routes/PrivateRoute";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import ReactSelect from "react-select";
import ScrapInput from "./ScrapInput/ScrapInput";
import useURL from "../../routes/useURL";
import { useInputLocation } from "../../data/ReactQuery";
import DataOverview from "./DataOverview/DataOverview";
import ToggleGroup from "../../components/ToggleGroup/ToggleGroup";
import Delays from "./Delays/Delays.js";
import DelayInput from "./Delays/DelayInput/DelayInput";

const StyledRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;
const StyledContainer = styled(Container)`
    max-width: 95%;
    padding-top: 1rem;
    overflow: hidden;
    min-height: 850px;
    height: 100%;
`;

const Dateframe = styled(Button)`
    width: 100%;
    background: none;
    transition: border 0.2s ease;
    border: 1px solid lightgray;
    color: black;
    &:hover,
    &:active,
    &:focus {
        color: black !important;
        background: none !important;
        box-shadow: unset !important;
        border: 1px solid #afafaf;
    }
`;

const qaSubunitOverrideUsernames = new Set(["D1", "D2", "D3", "55.17"]);
const delaySubunitIds = new Set([1, 2, 3, 4]);

function QualityAssurance(props) {
    const queryClient = useQueryClient();
    const { state, dispatch } = useContext(AuthContext);
    const setNavigationContext = useContext(SetNavigationContext);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const { path } = useRouteMatch();
    const { t } = useTranslation("labels");
    const history = useHistory();
    const location = useLocation();
    const locationUrl = useURL().get("location");
    const inputLocation = useInputLocation(locationUrl, {
        onSuccess: (res) => {
            const label = findSubunitById(unitsLabels, res?.subunitId);
            setSelectedSubunit(label);
        },
        enabled: !!locationUrl && locationUrl !== null,
    });

    // * STATE
    const [selectedDate, setSelectedDate] = useState(dayjs().toDate());
    const [selectedSubunit, setSelectedSubunit] = useState(null);

    const canShowDelaysTab = useMemo(() => {
        const rawId = selectedSubunit?.subunitId ?? selectedSubunit?.id ?? selectedSubunit?.value;
        const numericId = Number(rawId);

        return Number.isFinite(numericId) && delaySubunitIds.has(numericId);
    }, [selectedSubunit]);

    // * TOPBAR NAVIGATION
    const trendsNav = useMemo(
        () => ({
            input: {
                title: "scrap_input",
                path: `${path}/scrap-input`,
                notification: 0,
            },
            overview: {
                title: "data_overview",
                path: `${path}/data-overview`,
                notification: 0,
            },
            ...(canShowDelaysTab
                ? {
                      delay: {
                          title: "delays",
                          path: `${path}/delays`,
                          notification: 0,
                      },
                  }
                : {}),
        }),
        [path, canShowDelaysTab],
    );

    // * USE EFFECTS
    useEffect(() => {
        if (selectedSubunit === null) {
            const label = findSubunitByKeyword(unitsLabels, settings?.defaultUnit?.value);
            if (label == undefined) {
                setSelectedSubunit(unitsLabels[0]?.options?.[0]);
            } else {
                setSelectedSubunit(label);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setNavigationContext.setNavigationHandler(trendsNav);
    }, [setNavigationContext, trendsNav]);

    useEffect(() => {
        setNavigationContext.setSubunitHandler(selectedSubunit?.label);
    }, [selectedSubunit, setNavigationContext]);

    useEffect(() => {
        if (!canShowDelaysTab && location.pathname.startsWith(`${path}/delays`)) {
            history.replace(`${path}/scrap-input`);
        }
    }, [canShowDelaysTab, history, location.pathname, path]);

    const isDelayInputRoute = location.pathname.endsWith("/delay-input");
    const delayInputParams = new URLSearchParams(location.search);
    const isDelayEditMode =
        isDelayInputRoute &&
        (Boolean(delayInputParams.get("editId")) ||
            location?.state?.mode === "edit" ||
            Boolean(location?.state?.delay));

    const currentPageKey = location.pathname.split("/").pop();
    const pageTitle = isDelayInputRoute
        ? isDelayEditMode
            ? t("delay_edit_title", { defaultValue: "Ureditev zastoja" })
            : t("delay-input")
        : t(currentPageKey);

    // * HANDLERS
    const selectSubunitHandler = (selected, indicator) => {
        setSelectedSubunit(selected);
    };

    return (
        <StyledContainer>
            <StyledRow>
                <Col xs={12} md={3}>
                    <h2>{pageTitle}</h2>
                </Col>
                <Col></Col>
                <Col xs={12} md={12} lg={6} xl={2}>
                    <Switch>
                        <PrivateRoute path={[`${path}/scrap-input`, `${path}/data-overview`]}>
                            <ReactSelect
                                styles={{
                                    // Fixes the overlapping problem of the component
                                    menu: (provided) => ({
                                        ...provided,
                                        zIndex: 9999,
                                    }),
                                }}
                                components={{
                                    DropdownIndicator: () => null,
                                    IndicatorSeparator: () => null,
                                }}
                                isDisabled={
                                    (state.user.roleId == "1" &&
                                        !qaSubunitOverrideUsernames.has(state.user?.username)) ||
                                    locationUrl != undefined
                                }
                                options={unitsLabels}
                                value={selectedSubunit}
                                placeholder={t("subunit")}
                                onChange={(selected) => selectSubunitHandler(selected)}
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
                            <label>{t("subunit")}</label>
                        </PrivateRoute>
                        <PrivateRoute exact path={`${path}/delays`}>
                            <ReactSelect
                                styles={{
                                    // Fixes the overlapping problem of the component
                                    menu: (provided) => ({
                                        ...provided,
                                        zIndex: 9999,
                                    }),
                                }}
                                components={{
                                    DropdownIndicator: () => null,
                                    IndicatorSeparator: () => null,
                                }}
                                isDisabled={
                                    (state.user.roleId == "1" &&
                                        !qaSubunitOverrideUsernames.has(state.user?.username)) ||
                                    locationUrl != undefined
                                }
                                options={unitsLabels}
                                value={selectedSubunit}
                                placeholder={t("subunit")}
                                onChange={(selected) => selectSubunitHandler(selected)}
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
                            <label>{t("subunit")}</label>
                        </PrivateRoute>
                    </Switch>
                </Col>
            </StyledRow>
            {selectedSubunit ? (
                <Switch>
                    <Route exact path={path}>
                        <Redirect from={path} to={`${path}/scrap-input`} />
                    </Route>
                    <PrivateRoute path={`${path}/scrap-input`}>
                        <ScrapInput selectedSubunit={selectedSubunit} />
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/data-overview`}>
                        <DataOverview selectedSubunit={selectedSubunit} />
                    </PrivateRoute>
                    {canShowDelaysTab ? (
                        <>
                            <PrivateRoute path={`${path}/delays/delay-input`}>
                                <DelayInput selectedSubunit={selectedSubunit} />
                            </PrivateRoute>
                            <PrivateRoute exact path={`${path}/delays`}>
                                <Delays selectedSubunit={selectedSubunit} />
                            </PrivateRoute>
                        </>
                    ) : null}
                </Switch>
            ) : null}
        </StyledContainer>
    );
}

export default QualityAssurance;
