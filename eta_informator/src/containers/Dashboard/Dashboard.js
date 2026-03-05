import styled from "styled-components";
import { Row, Col, Container, Popover, OverlayTrigger, Button, Form } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import findSubunitByKeyword from "../../utils/finders";
import DatePicker from "../../components/Forms/CustomInputs/DatePicker/DatePicker";
import PrivateRoute from "../../routes/PrivateRoute";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import ReactSelect from "react-select";
import Trends from "./Trends/Trends";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Overview from "./Overview/Overview";
import Staff from "./Staff/Staff";

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

function Dashboard(props) {
    const queryClient = useQueryClient();
    const { state, dispatch } = useContext(AuthContext);
    const setNavigationContext = useContext(SetNavigationContext);
    const unitsLabels = queryClient.getQueryData("onlyUnitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const { path } = useRouteMatch();
    const { t } = useTranslation("labels");
    const location = useLocation();

    // * STATE
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [startDate, setStartDate] = useState(dayjs().subtract(1, "year").toDate());
    const [endDate, setEndDate] = useState(dayjs().subtract(1, "day").toDate());
    const [selectedTimeUnit, setSelectedTimeUnit] = useState("month");
    const [selectedSubunit, setSelectedSubunit] = useState(null);
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [open, setOpen] = useState(false);

    // * TOPBAR NAVIGATION
    const trendsNav = {
        overview: {
            title: "overview",
            path: `${path}/overview`,
            notification: 0,
        },
        staff: {
            title: "staff",
            path: `${path}/staff`,
            notification: 0,
        },
    };

    // * USE EFFECTS
    useEffect(() => {
        setNavigationContext.setNavigationHandler(trendsNav);
        if (selectedUnit === null) {
            const label = findSubunitByKeyword(unitsLabels, settings?.defaultUnit?.value);
            if (label == undefined) {
                setSelectedUnit(unitsLabels[0]);
            } else {
                setSelectedUnit(label);
            }
        }
    }, []);

    useEffect(() => {
        setNavigationContext.setSubunitHandler(selectedUnit?.label);
    }, [selectedUnit]);

    // * HANDLERS
    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };

    const selectSubunitHandler = (selected, indicator) => {
        setSelectedIndicator(indicator);
        setSelectedSubunit(selected);
        setOpen(true);
    };

    const popover = (
        <Popover style={{ maxWidth: "425px !important", width: "425px" }} id='dateframe-popover'>
            <Popover.Body>
                <div>
                    <div className='d-flex justify-content-center'>
                        <Form.Check
                            checked={selectedTimeUnit == "year"}
                            onClick={() => setSelectedTimeUnit("year")}
                            custom
                            inline
                            label={t("year")}
                            name='dateframe'
                            type='radio'
                            id='year-radio'
                        />
                        <Form.Check
                            checked={selectedTimeUnit == "quarter"}
                            onClick={() => setSelectedTimeUnit("quarter")}
                            custom
                            inline
                            label={t("quarter")}
                            name='dateframe'
                            type='radio'
                            id='quarter-radio'
                        />
                        <Form.Check
                            checked={selectedTimeUnit == "month"}
                            onClick={() => setSelectedTimeUnit("month")}
                            custom
                            inline
                            label={t("month")}
                            name='dateframe'
                            type='radio'
                            id='month-radio'
                        />
                    </div>
                    <label>{t("dataframe")}</label>
                    <div>
                        <DatePicker
                            selected={startDate}
                            onSelect={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            dateFormat={
                                selectedTimeUnit == "month"
                                    ? "MMM yyyy"
                                    : selectedTimeUnit == "quarter"
                                    ? "yyyy, QQQ"
                                    : "yyyy"
                            }
                            showMonthYearPicker={selectedTimeUnit == "month"}
                            showQuarterYearPicker={selectedTimeUnit == "quarter"}
                            showYearPicker={selectedTimeUnit == "year"}
                            maxDate={dayjs().toDate()}
                            minDate={dayjs("01/01/2021").toDate()}
                        />
                        <label>{t("range_start")}</label>
                    </div>
                    <div>
                        <DatePicker
                            selected={endDate}
                            onSelect={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            dateFormat={
                                selectedTimeUnit == "month"
                                    ? "MMM yyyy"
                                    : selectedTimeUnit == "quarter"
                                    ? "yyyy, QQQ"
                                    : "yyyy"
                            }
                            showMonthYearPicker={selectedTimeUnit == "month"}
                            showQuarterYearPicker={selectedTimeUnit == "quarter"}
                            showYearPicker={selectedTimeUnit == "year"}
                            maxDate={dayjs().toDate()}
                        />
                        <label>{t("range_end")}</label>
                    </div>
                    {/* 					<div>
						<Button  size="sm">{t('set')}</Button>
					</div> */}
                </div>
            </Popover.Body>
        </Popover>
    );

    return (
        <StyledContainer>
            <StyledRow>
                <Col xs={12} md={3}>
                    <h2>
                        {location.pathname.split("/").pop() !== "trends"
                            ? t(location.pathname.split("/").pop())
                            : null}
                    </h2>
                </Col>
                <Col></Col>
                <Switch>
                    <PrivateRoute path={`${path}/trends`}>
                        <Col xs={12} md={4} lg={4} xl={3}>
                            <OverlayTrigger
                                trigger='click'
                                placement='bottom'
                                overlay={popover}
                                rootClose
                            >
                                <Dateframe>
                                    <div className='d-flex justify-content-between'>
                                        <div>
                                            <FontAwesomeIcon
                                                className='me-2'
                                                icon='layer-group'
                                                color='gray'
                                            />
                                            {t(selectedTimeUnit)}
                                        </div>
                                        <div className='ms-3'>
                                            <FontAwesomeIcon
                                                className='me-2'
                                                icon='calendar-alt'
                                                color='gray'
                                            />
                                            {dayjs(startDate).format(
                                                selectedTimeUnit == "month"
                                                    ? "MMM YYYY"
                                                    : selectedTimeUnit == "quarter"
                                                    ? "YYYY, Q"
                                                    : "YYYY",
                                            ) +
                                                " - " +
                                                dayjs(endDate).format(
                                                    selectedTimeUnit == "month"
                                                        ? "MMM YYYY"
                                                        : selectedTimeUnit == "quarter"
                                                        ? "YYYY, Q"
                                                        : "YYYY",
                                                )}
                                        </div>
                                    </div>
                                </Dateframe>
                            </OverlayTrigger>
                            <label>{t("date_window")}</label>
                        </Col>
                    </PrivateRoute>
                    <PrivateRoute path={[`${path}/overview`, `${path}/staff`]}>
                        <Col xs={12} md={12} lg={6} xl={3}>
                            <DatePicker
                                selected={endDate}
                                onSelect={(date) => setEndDate(date)}
                                dateFormat={"PPPP"}
                                maxDate={dayjs().subtract(1, "day").toDate()}
                            />
                            <label>{t("date")}</label>
                        </Col>
                    </PrivateRoute>
                </Switch>

                <Switch>
                    <PrivateRoute path={`${path}/trends`}>
                        <Col xs={12} md={12} lg={6} xl={2}>
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
                                isDisabled={state.user.roleId == "1"}
                                options={unitsLabels.filter((unit) => unit.sfm)}
                                value={selectedUnit}
                                placeholder={t("unit")}
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
                            <label>{t("unit")}</label>
                        </Col>
                    </PrivateRoute>
                </Switch>
            </StyledRow>
            {selectedUnit ? (
                <Switch>
                    <Route exact path={path}>
                        <Redirect from={path} to={`${path}/overview`} />
                    </Route>
                    <PrivateRoute path={`${path}/trends`}>
                        <Trends
                            selectedUnit={selectedUnit}
                            startDate={startDate}
                            endDate={endDate}
                            selectedTimeUnit={selectedTimeUnit}
                            selectedSubunit={selectedSubunit}
                            selectedIndicator={selectedIndicator}
                            setSelectedIndicator={setSelectedIndicator}
                            setSelectedSubunit={setSelectedSubunit}
                            selectSubunitHandler={selectSubunitHandler}
                            open={open}
                            setOpen={setOpen}
                        />
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/overview`}>
                        <Overview
                            selectedUnit={selectedUnit}
                            selectedDate={dayjs(endDate)}
                            selectedSubunit={selectedSubunit}
                            selectedIndicator={selectedIndicator}
                            setSelectedIndicator={setSelectedIndicator}
                            setSelectedSubunit={setSelectedSubunit}
                            selectSubunitHandler={selectSubunitHandler}
                            open={open}
                            setOpen={setOpen}
                            settings={settings}
                        />
                    </PrivateRoute>
                    <PrivateRoute path={`${path}/staff`}>
                        <Staff
                            selectedUnit={selectedUnit}
                            selectedDate={dayjs(endDate)}
                            selectedSubunit={selectedSubunit}
                            selectedIndicator={selectedIndicator}
                            setSelectedIndicator={setSelectedIndicator}
                            setSelectedSubunit={setSelectedSubunit}
                            selectSubunitHandler={selectSubunitHandler}
                            open={open}
                            setOpen={setOpen}
                        />
                    </PrivateRoute>
                </Switch>
            ) : null}
        </StyledContainer>
    );
}

export default Dashboard;
