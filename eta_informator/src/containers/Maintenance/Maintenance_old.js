import { useContext, useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useLocation, useRouteMatch } from "react-router";

import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import styled from "styled-components";
import { Col, Container, Row } from "react-bootstrap";
import ReactSelect from "react-select";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useTranslation } from "react-i18next";
import PrivateRoute from "../../routes/PrivateRoute";
import Dashboard from "./Dashboard/Dashboard";
import { useMachines } from "../../data/ReactQuery";
import { StyledContainer, StyledRow } from "../../components/Layout/StyledContainer";
import findSubunitByKeyword from "../../utils/finders";

function Maintenance(props) {
    const { t } = useTranslation("maintenance");
    const { state } = useContext(AuthContext);
    const { path } = useRouteMatch();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const queryClient = useQueryClient();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const location = useLocation();
    const machines = useMachines(selectedUnit?.ted);
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const maintenanceNav = {
        dashboard: {
            title: "dashboard",
            path: `${path}/dashboard`,
            notification: 0,
        },
    };
    const setNavigationContext = useContext(SetNavigationContext);
    useEffect(() => {
        setNavigationContext.setNavigationHandler(maintenanceNav);
        if (selectedUnit === null) {
            const label = findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            setSelectedUnit(label);
        }
    }, []);

    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };
    return (
        <StyledContainer fluid>
            <StyledRow className='my-2'>
                <Col xs={12} md={3}>
                    <h2>
                        {location.pathname.split("/").pop() !== "shopfloor"
                            ? t(location.pathname.split("/").pop())
                            : null}
                    </h2>
                </Col>
                <Col xs={12} md={4} lg={3} xl={2} className='ms-auto'>
                    <ReactSelect
                        styles={{
                            // Fixes the overlapping problem of the component
                            menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                        components={{
                            DropdownIndicator: () => null,
                            IndicatorSeparator: () => null,
                        }}
                        isDisabled={state.user.role.role == "sfm"}
                        options={unitsLabels}
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
                    <label>{t("section")}</label>
                </Col>
            </StyledRow>
            <Switch>
                <Route exact path={path}>
                    <Redirect from={path} to={`${path}/dashboard`} />
                </Route>
                <PrivateRoute path={`${path}/dashboard`}>
                    <Dashboard selectedUnit={selectedUnit} machines={machines.data} />
                </PrivateRoute>
            </Switch>
        </StyledContainer>
    );
}

export default Maintenance;
