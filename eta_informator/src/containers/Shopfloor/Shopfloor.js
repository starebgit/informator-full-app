import React, { useContext, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Popover } from "react-bootstrap";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { matchPath, Redirect, Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import PrivateRoute from "../../routes/PrivateRoute";
import Dashboard from "./Dashboard/Dashboard";
import Realization from "./Realization/Realization";
import ReactSelect from "react-select";
import Quality from "./Quality/Quality";
import Staff from "./Staff/Staff";
import Oee from "./Oee/Oee";
import { useQueryClient } from "react-query";
import {
    useFoundryForms,
    useMachineGroups,
    useMachines,
    useOrders,
    usePatchSettings,
    useReports,
} from "../../data/ReactQuery";
import Safety from "./Safety/Safety";
import DatePicker from "../../components/Forms/CustomInputs/DatePicker/DatePicker";
import _ from "lodash";
import Attachments from "./Attachments/Attachments";
import dayjs from "dayjs";
import findSubunitByKeyword from "../../utils/finders";
import Indicators from "./Indicators/Indicators";
import Distribution from "./Distribution/Distribution";
import ToolshopDashboard from "./Dashboard/ToolshopDashboard/ToolshopDashboard";
import getNavigation from "../../routes/navigationRoutes";
import Orders from "../Orders/Orders";
import FoundryDashboard from "./Dashboard/FoundryDashboard/FoundryDashboard";
import Lean from "./Lean/Lean";
import ToggleGroup from "../../components/ToggleGroup/ToggleGroup";
import CastingProgram from "./CastingProgram/CastingProgram";
import Stock from "./Stock/Stock";
import Organisation from "./Organisation/Organisation";

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

function Shopfloor() {
    const [dnSearchTerm, setDnSearchTerm] = useState("");

    // * CONTEXT
    const queryClient = useQueryClient();
    const { state } = useContext(AuthContext);
    const setNavigationContext = useContext(SetNavigationContext);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const patchLayout = usePatchSettings();

    // * STATE
    const [selectedYear, setSelectedYear] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(
        dayjs().day() == 1
            ? dayjs().subtract(3, "day").toDate()
            : dayjs().subtract(1, "day").toDate(),
    );
    const [selectedDateDist, setSelectedDateDist] = useState(dayjs().toDate());
    const [selectedDateStart, setSelectedDateStart] = useState(dayjs().startOf("week").toDate());
    const [selectedDateEnd, setSelectedDateEnd] = useState(dayjs().endOf("week").toDate());
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [tempLayouts, setTempLayouts] = useState({});
    const [timewindow, setTimewindow] = useState("late");
    const [status, setStatus] = useState("all");

    // * QUERIES
    const machineGroups = useMachineGroups(selectedUnit?.subunitId);
    const machines = useMachines(selectedUnit?.ted);

    const toolshopOrders = useOrders(false, {
        enabled: selectedUnit?.keyword == "toolshop",
    });

    const finishedToolshopOrders = useOrders(true, {
        enabled: selectedUnit?.keyword == "toolshop",
    });

    const toolshopReports = useReports({
        enabled: selectedUnit?.keyword == "toolshop",
    });

    const foundryForms = useFoundryForms(
        dayjs(selectedMonth).startOf("month"),
        dayjs(selectedMonth).endOf("month"),
    );

    // * ROUTING
    const { path } = useRouteMatch();
    const { t } = useTranslation("shopfloor");
    const history = useHistory();
    const match = matchPath(history.location.pathname, {
        path: path + "/:unit/:subpage",
    });

    // * TOPBAR NAVIGATION
    const shopfloorNav = getNavigation(path, selectedUnit);

    // * USE EFFECTS
    useEffect(() => {
        setNavigationContext.setNavigationHandler(shopfloorNav);
        if (selectedUnit === null) {
            const match = matchPath(history.location.pathname, {
                path: path + "/:unit",
            });
            const urlUnit = match?.params?.unit;
            const label =
                findSubunitByKeyword(unitsLabels, urlUnit) != undefined
                    ? findSubunitByKeyword(unitsLabels, urlUnit)
                    : findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            setSelectedUnit(label);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedUnit != undefined) {
            setNavigationContext.setNavigationHandler(shopfloorNav);
            setNavigationContext.setSubunitHandler(selectedUnit?.label);
            const match = matchPath(history.location.pathname, {
                path: path + "/:unit/:site",
            });
            history.push(`${path}/${selectedUnit?.keyword}/${match?.params?.site}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit]);

    // * HANDLERS
    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };

    const setTempLayoutsHandler = (newLayout, key) => {
        setTempLayouts(() => {
            const layouts = { [key]: { ...newLayout } };
            return layouts;
        });
    };

    const saveLayoutsHandler = () => {
        const oldLayouts = { ...userLayout[selectedUnit.subunitId] };
        const newLayouts = {
            ...userLayout,
            [selectedUnit.subunitId]: { ...oldLayouts, ...tempLayouts },
        };
        patchLayout.mutate(
            {
                userSettingId: settings?.layout.id,
                layouts: newLayouts,
            },
            {
                onSettled: () => {
                    queryClient.invalidateQueries(["userSettings", state.user.id]);
                },
            },
        );
    };

    const initLayoutsHandler = (layouts, key) => {
        const oldLayouts = { ...userLayout[selectedUnit.subunitId] };
        const newLayouts = {
            ...userLayout,
            [selectedUnit.subunitId]: { ...oldLayouts, [key]: { ...layouts } },
        };

        patchLayout.mutate(
            {
                userSettingId: settings?.layout.id,
                layouts: newLayouts,
            },
            {
                onSettled: () => {
                    queryClient.invalidateQueries(["userSettings", state.user.id]);
                },
            },
        );
    };

    const userLayout = JSON.parse(settings?.layout?.value);

    // * POPOVERS
    const popover = (
        <Popover className='border-0 shadow' id='popover-basic'>
            <Popover.Header className='bg-white' as='h3'>
                {t("select_date_range")}
            </Popover.Header>
            <Popover.Body>
                <div>
                    <div>
                        <DatePicker
                            selected={selectedDateStart}
                            onSelect={(date) => setSelectedDateStart(date)}
                            selectsStart
                            startDate={selectedDateStart}
                            endDate={selectedDateEnd}
                            showWeekNumbers
                            dateFormat={"PP"}
                        />
                        <label>{t("range_start")}</label>
                    </div>
                    <DatePicker
                        selected={selectedDateEnd}
                        onSelect={(date) => setSelectedDateEnd(date)}
                        selectsEnd
                        startDate={selectedDateStart}
                        endDate={selectedDateEnd}
                        minDate={selectedDateStart}
                        showWeekNumbers
                        dateFormat={"PP"}
                    />
                    <label>{t("range_end")}</label>
                </div>
            </Popover.Body>
        </Popover>
    );

    const timeframeButtons = [
        { name: "all_time", value: "all_time" },
        { name: "current_month", value: "current_month" },
        { name: "current_week", value: "current_week" },
        { name: "late", value: "late" },
        {
            name: "custom_range",
            value: "custom_range",
            type: "popover",
            popover: popover,
            placement: "bottom",
        },
    ];

    const statusButtons = [
        { name: "all", value: "all" },
        { name: "standard", value: "standardno" },
        { name: "urgent", value: "urgentno" },
        { name: "priority", value: "prednostno" },
    ];

    const mappedUnitLabels = useMemo(
        () =>
            state?.user?.role?.role == "sfm"
                ? unitsLabels.map((unit) => {
                      return {
                          ...unit,
                          options: unit.options.map((option) => {
                              return { ...option, isDisabled: selectedUnit?.unitId !== unit.id };
                          }),
                      };
                  })
                : unitsLabels,
        [unitsLabels, selectedUnit?.unitId, state?.user?.role?.role],
    );

    const dashboard = () => {
        switch (selectedUnit?.keyword) {
            case "toolshop":
                return (
                    <ToolshopDashboard
                        timewindow={timewindow}
                        status={status}
                        startDate={selectedDateStart}
                        endDate={selectedDateEnd}
                        orders={toolshopOrders}
                        finishedOrders={finishedToolshopOrders}
                        reports={toolshopReports}
                        selectedUnit={selectedUnit}
                        dnSearchTerm={dnSearchTerm}
                    />
                );
            case "foundry":
                return (
                    <FoundryDashboard
                        foundryForms={foundryForms}
                        selectedMonth={dayjs(selectedMonth)}
                        selectedUnit={selectedUnit}
                    />
                );
            default:
                return machineGroups.isSuccess && machines.isSuccess ? (
                    <Dashboard
                        setSelectedDate={setSelectedDate}
                        selectedUnit={selectedUnit}
                        machines={machines.data}
                        selectedDate={dayjs(selectedDate)}
                        machineGroups={machineGroups.data}
                    />
                ) : (
                    <div
                        className='d-flex align-items-center justify-content-center'
                        style={{ minHeight: "600px" }}
                    >
                        {t("missing_unit_data")}
                    </div>
                );
        }
    };

    return (
        <StyledContainer fluid>
            <StyledRow className='my-2'>
                <Col xs={12} md={2}>
                    <h2>{match != null ? t(match.params.subpage) : null}</h2>
                </Col>
                <Col></Col>
                <Switch>
                    <PrivateRoute path={`${path}/toolshop/dashboard`}>
                        <Col xs={12} md={6} lg={7} className='d-flex justify-content-end'>
                            <div className='d-flex gap-1'>
                                <div className='d-flex flex-column me-1'>
                                    <input
                                        type='text'
                                        className='form-control'
                                        placeholder='Išči po DN'
                                        style={{ maxWidth: "200px" }}
                                        value={dnSearchTerm}
                                        onChange={(e) => setDnSearchTerm(e.target.value)}
                                    />
                                    <label className='ms-1'>Delovni nalog</label>
                                </div>
                                <div className='d-flex flex-column me-3'>
                                    <ToggleGroup
                                        buttons={statusButtons}
                                        selectedButton={status}
                                        onSelected={setStatus}
                                        title={"status"}
                                        size='md'
                                        align='left'
                                        breakpoint='xs'
                                    />
                                    <label className='ms-1'>{t("weight")}</label>
                                </div>
                                <div className='d-flex flex-column'>
                                    <ToggleGroup
                                        buttons={timeframeButtons}
                                        selectedButton={timewindow}
                                        onSelected={setTimewindow}
                                        title={"timewindow"}
                                        size='md'
                                        align='left'
                                    />
                                    <label className='ms-1'>{t("timewindow")}</label>
                                </div>
                            </div>
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute
                        path={[
                            `${path}/:unit/(realization|quality|lean|attachments|oee)`,
                            `${path}/foundry/dashboard`,
                        ]}
                    >
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <DatePicker
                                selected={selectedMonth}
                                onSelect={(date) => setSelectedMonth(date)}
                                dateFormat='LLLL'
                                showMonthYearPicker
                                maxDate={dayjs().toDate()}
                            />
                            <label>{t("month")}</label>
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/dashboard`}>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <DatePicker
                                selected={selectedDate}
                                onSelect={(date) => setSelectedDate(date)}
                                dateFormat='PPP'
                                maxDate={dayjs().toDate()}
                            />
                            <label>{t("day")}</label>
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/staff`}>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <DatePicker
                                selected={selectedMonth}
                                onSelect={(date) => setSelectedMonth(date)}
                                dateFormat='LLLL'
                                showMonthYearPicker
                            />
                            <label>{t("month")}</label>
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/safety`}>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <DatePicker
                                selected={selectedYear}
                                onSelect={(date) => setSelectedYear(date)}
                                dateFormat='yyyy'
                                showYearPicker
                                maxDate={dayjs().toDate()}
                            />
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/distribution`}>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <DatePicker
                                selected={selectedDateDist}
                                onSelect={(date) => setSelectedDateDist(date)}
                                dateFormat='PPP'
                                default
                            />
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/orders/:status`}>
                        <Col xs={12} md={4} lg={3} xl={2}>
                            <div className='d-flex' style={{ gap: "1rem" }}>
                                <Button
                                    variant={
                                        match?.params?.subpage == "overview"
                                            ? "primary"
                                            : "outline-primary"
                                    }
                                    onClick={() => history.push(`${path}/orders/overview`)}
                                >
                                    {t("active")}
                                </Button>
                                <Button
                                    variant={
                                        match?.params?.subpage == "archive"
                                            ? "primary"
                                            : "outline-primary"
                                    }
                                    onClick={() => history.push(`${path}/orders/archive`)}
                                >
                                    {t("archive")}
                                </Button>
                            </div>
                        </Col>
                    </PrivateRoute>
                </Switch>
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
                    <label>{t("section")}</label>
                </Col>
            </StyledRow>
            {selectedUnit ? (
                <Switch>
                    {selectedUnit?.keyword === "toolshop" && (
                        <PrivateRoute path={`${path}/:unit/organisation`}>
                            <Organisation selectedUnit={selectedUnit} />
                        </PrivateRoute>
                    )}
                    {selectedUnit.keyword == "toolshop" ? (
                        <Route exact path={path}>
                            <Redirect
                                from={path}
                                to={`${path}/${selectedUnit.keyword}/dashboard`}
                            />
                        </Route>
                    ) : (
                        <Route exact path={path}>
                            <Redirect
                                from={path}
                                to={`${path}/${selectedUnit.keyword}/indicators`}
                            />
                        </Route>
                    )}
                    {selectedUnit.keyword != "toolshop" && (
                        <PrivateRoute path={`${path}/:unit/indicators`}>
                            <Indicators selectedUnit={selectedUnit} />
                        </PrivateRoute>
                    )}
                    <PrivateRoute path={`${path}/:unit/dashboard`}>
                        {selectedUnit ? (
                            dashboard()
                        ) : (
                            <div
                                className='d-flex align-items-center justify-content-center'
                                style={{ minHeight: "600px" }}
                            >
                                {t("missing_unit_data")}
                            </div>
                        )}
                    </PrivateRoute>
                    {selectedUnit.keyword != "toolshop" && (
                        <PrivateRoute path={`${path}/:unit/realization`}>
                            {selectedUnit && machineGroups.isSuccess && machines.isSuccess ? (
                                <Realization
                                    selectedUnit={selectedUnit}
                                    layouts={userLayout[selectedUnit?.subunitId]}
                                    machineGroups={machineGroups.data}
                                    machines={machines.data}
                                    initLayoutsHandler={initLayoutsHandler}
                                    setTempLayoutsHandler={setTempLayoutsHandler}
                                    saveLayoutsHandler={saveLayoutsHandler}
                                    selectedMonth={dayjs(selectedMonth)}
                                />
                            ) : (
                                <div
                                    className='d-flex align-items-center justify-content-center'
                                    style={{ minHeight: "600px" }}
                                >
                                    {t("missing_unit_data")}
                                </div>
                            )}
                        </PrivateRoute>
                    )}
                    {selectedUnit.keyword && (
                        <PrivateRoute path={`${path}/:unit/quality`}>
                            {selectedUnit ? (
                                <Quality
                                    selectedUnit={selectedUnit}
                                    layouts={userLayout[selectedUnit?.subunitId]}
                                    machineGroups={machineGroups.data}
                                    machines={machines.data}
                                    initLayoutsHandler={initLayoutsHandler}
                                    setTempLayoutsHandler={setTempLayoutsHandler}
                                    saveLayoutsHandler={saveLayoutsHandler}
                                    selectedMonth={dayjs(selectedMonth)}
                                    setSelectedMonth={setSelectedMonth}
                                />
                            ) : (
                                <div
                                    className='d-flex align-items-center justify-content-center'
                                    style={{ minHeight: "600px" }}
                                >
                                    {t("missing_unit_data")}
                                </div>
                            )}
                        </PrivateRoute>
                    )}
                    <PrivateRoute path={`${path}/:unit/stock`}>
                        {selectedUnit ? (
                            <Stock selectedUnit={selectedUnit} />
                        ) : (
                            <div
                                className='d-flex align-items-center justify-content-center'
                                style={{ minHeight: "600px" }}
                            >
                                {t("missing_unit_data")}
                            </div>
                        )}
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/staff`}>
                        <Staff
                            selectedUnit={selectedUnit}
                            layouts={userLayout[selectedUnit?.subunitId]}
                            initLayoutsHandler={initLayoutsHandler}
                            setTempLayoutsHandler={setTempLayoutsHandler}
                            saveLayoutsHandler={saveLayoutsHandler}
                            selectedMonth={dayjs(selectedMonth)}
                        />
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/safety`}>
                        <Safety selectedUnit={selectedUnit} selectedYear={dayjs(selectedYear)} />
                    </PrivateRoute>
                    {selectedUnit.keyword != "toolshop" && (
                        <PrivateRoute path={`${path}/:unit/distribution`}>
                            <Distribution
                                selectedUnit={selectedUnit}
                                selectedDate={dayjs(selectedDateDist)}
                                setSelectedDate={setSelectedDateDist}
                            />
                        </PrivateRoute>
                    )}
                    {selectedUnit.keyword != "toolshop" && (
                        <PrivateRoute path={`${path}/:unit/oee`}>
                            {selectedUnit && machineGroups.isSuccess && machines.isSuccess ? (
                                <Oee
                                    layouts={userLayout[selectedUnit?.subunitId]}
                                    machineGroups={machineGroups.data}
                                    machines={machines.data}
                                    selectedUnit={selectedUnit}
                                    initLayoutsHandler={initLayoutsHandler}
                                    setTempLayoutsHandler={setTempLayoutsHandler}
                                    saveLayoutsHandler={saveLayoutsHandler}
                                    selectedMonth={dayjs(selectedMonth)}
                                />
                            ) : (
                                <div
                                    className='d-flex align-items-center justify-content-center'
                                    style={{ minHeight: "600px" }}
                                >
                                    {t("missing_unit_data")}
                                </div>
                            )}
                        </PrivateRoute>
                    )}
                    {selectedUnit?.keyword == "toolshop" && (
                        <PrivateRoute
                            path={`${path}/orders`}
                            allowRoles={[
                                "admin",
                                "toolshop",
                                "head_of_work_unit",
                                "sfm",
                                "process_leader",
                            ]}
                        >
                            <Orders />
                        </PrivateRoute>
                    )}
                    <PrivateRoute path={`${path}/:unit/lean`}>
                        <Lean selectedUnit={selectedUnit} selectedMonth={dayjs(selectedMonth)} />
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/:unit/attachments`}>
                        <Attachments
                            selectedUnit={selectedUnit}
                            selectedMonth={dayjs(selectedMonth)}
                        />
                    </PrivateRoute>
                    {selectedUnit?.keyword == "foundry" && (
                        <PrivateRoute path={`${path}/foundry/casting-program`}>
                            <CastingProgram />
                        </PrivateRoute>
                    )}

                    <PrivateRoute>
                        {selectedUnit.keyword == "toolshop" ? (
                            <Redirect
                                from={path}
                                to={`${path}/${selectedUnit.keyword}/dashboard`}
                            />
                        ) : (
                            <Redirect
                                from={path}
                                to={`${path}/${selectedUnit.keyword}/indicators`}
                            />
                        )}
                    </PrivateRoute>
                </Switch>
            ) : (
                <div
                    className='d-flex align-items-center justify-content-center'
                    style={{ minHeight: "600px" }}
                >
                    {t("missing_unit_data")}
                </div>
            )}
        </StyledContainer>
    );
}

export default Shopfloor;
