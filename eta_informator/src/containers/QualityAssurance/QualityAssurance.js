import styled from "styled-components";
import { Row, Col, Container, Button, Form, Popover } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
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

function QualityAssurance(props) {
    const queryClient = useQueryClient();
    const { state, dispatch } = useContext(AuthContext);
    const setNavigationContext = useContext(SetNavigationContext);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const { path } = useRouteMatch();
    const { t } = useTranslation("labels");
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

    // * TOPBAR NAVIGATION
    const trendsNav = {
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
    };

    // * USE EFFECTS
    useEffect(() => {
        setNavigationContext.setNavigationHandler(trendsNav);
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
        setNavigationContext.setSubunitHandler(selectedSubunit?.label);
    }, [selectedSubunit, setNavigationContext]);

    // * HANDLERS
    const selectSubunitHandler = (selected, indicator) => {
        setSelectedSubunit(selected);
    };

    return (
        <StyledContainer>
            <StyledRow>
                <Col xs={12} md={3}>
                    <h2>{t(location.pathname.split("/").pop())}</h2>
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
                                isDisabled={state.user.roleId == "1" || locationUrl != undefined}
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
                </Switch>
            ) : null}
        </StyledContainer>
    );
}

export default QualityAssurance;
