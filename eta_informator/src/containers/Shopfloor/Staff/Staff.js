import { Row, Col, Tab, Nav } from "react-bootstrap";
import dayjs from "dayjs";
import Time from "../../../components/Charts/Time/Time";

import { Pie } from "react-chartjs-2";
//import "chartjs-plugin-labels";
import styled from "styled-components";
import jsonata from "jsonata";
import randomColor from "randomcolor";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DynamicGrid from "../../../components/DynamicGrid/DynamicGrid";
import { GridItem, Card, ChartWrap } from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import { getEvents } from "../../../data/API/Spica/SpicaAPI";
import { useQuery } from "react-query";
import Badge from "../../../components/UI/Badge/Badge";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from "chart.js";
import { getForemans } from "../../../data/API/Informator/InformatorAPI";
import { PulseLoader } from "react-spinners";
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
);

const StyledNav = styled(Nav)`
    font-size: var(--body) !important;

    *.active {
        color: white !important;
        background-color: var(--bs-primary) !important;
        font-weight: bold;
    }
    .nav-tabs .nav-link.active,
    .nav-tabs .nav-item.show .nav-link {
        color: green;
        background-color: #fff;
        minheight: 48px !important;
        padding: 12px 0px !important;
    }
`;

const StyledContainer = styled.div`
    margin-bottom: var(--s1);
`;

const ForemanSelector = styled(Nav.Link)`
    border-radius: 15px !important;
    padding: 0.25rem 1rem !important;
    border: 1px solid var(--bs-primary) !important;
    margin-right: 0.5rem;
    &:hover {
        color: black;
    }
`;

function Staff({ selectedUnit, selectedMonth, ...props }) {
    const [save, setSave] = useState(false);
    const [reset, setReset] = useState(false);
    const [editable, setEditable] = useState(false);
    const [lastWorkDay, setLastWorkDay] = useState(null);
    const [selectedForeman, setSelectedForeman] = useState("all");
    const { t } = useTranslation("shopfloor");
    const safeNumber = (value) => Number(value || 0);
    const foremans = useQuery(["foremans", selectedUnit.subunitId], () =>
        getForemans(selectedUnit.subunitId),
    );

    const events = useQuery(
        ["events", selectedUnit.subunitId, selectedMonth.format("MM-YYYY"), selectedForeman],
        () =>
            getEvents(
                selectedUnit.subunitId,
                selectedMonth.startOf("month"),
                selectedMonth.endOf("month"),
                selectedForeman,
            ).then((data) => data),
        { enabled: !foremans.isLoading },
    );

    const isEditableHandler = (bool) => {
        setEditable(bool);
    };

    const onSavedLayout = () => {
        props.saveLayoutsHandler("realization");
        isEditableHandler(false);
    };

    const resetHandler = () => {
        setReset(true);
        setEditable(false);
    };

    useEffect(() => {
        if (selectedMonth.isSame(dayjs(), "month")) {
            setLastWorkDay(
                dayjs().day() == 1 ? dayjs().subtract(3, "day") : dayjs().subtract(1, "day"),
            );
        } else {
            setLastWorkDay(null);
        }
    }, [selectedMonth]);

    const data = events?.data?.map((daily) => {
        const day = dayjs(daily.date).format("DD/MM/YYYY");
        return { x: day, y: daily.absence };
    });

    const absentData = {
        datasets: [
            {
                label: t("present"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.presence };
                }),
                backgroundColor: "rgba(30,200,30,0.7)",
            },
            {
                label: t("absent"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    if (dayjs(daily.date).isAfter(dayjs())) {
                        return { x: day, y: null };
                    }
                    return { x: day, y: daily.absence };
                }),
                backgroundColor: "rgba(200,30,30,0.7)",
            },
        ],
    };

    const exp = jsonata(
        "{'hourUse': $sum(hourUse.$number()),'partialHourUse': $sum(partialHourUse.$number()),'sick': $sum(sick.$number()),'partialSick': $sum(partialSick.$number()),'higherForce': $sum(higherForce.$number()),'leave': $sum(leave.$number()),'quarantine': $sum(quarantine.$number())}",
    );
    const res = exp.evaluate(events?.data);

    const pieData = {
        datasets: [
            {
                data: Object.values(res),
                backgroundColor: Object.values(res).map((v, i) => {
                    return randomColor({
                        format: "rgb",
                        luminosity: "light",
                        seed: i * 45,
                    });
                }),
                hoverOffset: 25,
            },
        ],
        labels: [t("use_of_hours"), t("partial_use_of_hours"), t("sick"), t("partial_sick"), t("higher_force"), t("leave"), t("special_leave")],
    };

    const categoryData = {
        datasets: [
            {
                label: t("use_of_hours"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.hourUse };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 0 * 45,
                }),
            },
            {
                label: t("partial_use_of_hours"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.partialHourUse };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 5 * 45,
                }),
            },
            {
                label: t("leave"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.leave };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 3 * 45,
                }),
            },
            {
                label: t("higher_force"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.higherForce };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 2 * 45,
                }),
            },
            {
                label: t("sick"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.sick };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 1 * 45,
                }),
            },

            {
                label: t("partial_sick"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.partialSick };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 6 * 45,
                }),
            },

            {
                label: t("special_leave"),
                data: events?.data?.map((daily) => {
                    const day = dayjs(daily.date).format("DD/MM/YYYY");
                    return { x: day, y: daily.quarantine };
                }),
                backgroundColor: randomColor({
                    format: "rgb",
                    luminosity: "light",
                    seed: 4 * 45,
                }),
            },
        ],
    };

    const yesterday = !!lastWorkDay
        ? events?.data?.find((daily) => dayjs(daily.date).isSame(lastWorkDay, "day"))
        : null;

    const today = events?.data?.find((daily) => dayjs(daily.date).isSame(dayjs(), "day"));

    const options = {
        animation: false,
        maintainAspectRatio: false,
        responsive: true,
        legend: {
            labels: {
                fontStyle: "bold",
            },
        },
        layout: {
            padding: {
                left: 20,
                right: 20,
                top: 0,
                bottom: 10,
            },
        },
        plugins: {
            labels: {
                showZero: false,
                fontSize: 15,
            },
        },
    };

    if (foremans.isLoading)
        return (
            <div
                className='d-flex justify-content-center align-items-center flex-column'
                style={{
                    zIndex: 100,
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%",
                }}
            >
                <PulseLoader loading={foremans.isLoading} color='gray' />
                <p className='lead' style={{ color: "white", fontWeight: "500" }}>
                    {t("data_is_loading")}
                </p>
            </div>
        );

    const foremanPills = (
        <>
            <Nav
                className='mt-4'
                variant='pills'
                defaultActiveKey={foremans?.data?.length > 1 ? "all" : foremans?.data?.[0]?.id}
                onSelect={(item) => setSelectedForeman(item)}
            >
                {foremans?.data?.length > 1 ? (
                    <Nav.Item>
                        <ForemanSelector eventKey='all'>{t("total")}</ForemanSelector>
                    </Nav.Item>
                ) : null}
                {foremans?.data?.map((entry) => {
                    return (
                        <Nav.Item key={entry.id + "foreman"}>
                            <ForemanSelector eventKey={entry.id}>{entry.name}</ForemanSelector>
                        </Nav.Item>
                    );
                })}
            </Nav>
            <label className='ms-2'>{t("select_foreman")}</label>
        </>
    );
    return (
        <Fragment>
            <Tab.Container id='tabs' defaultActiveKey='absence'>
                <StyledContainer>
                    <StyledNav variant='tabs'>
                        <Nav.Item>
                            <Nav.Link eventKey='absence'>{t("absence")}</Nav.Link>
                        </Nav.Item>
                        {editable ? (
                            <div className='ms-auto me-3 my-auto text-muted'>
                                <FontAwesomeIcon
                                    className='mx-2'
                                    icon='check'
                                    onClick={() => onSavedLayout()}
                                    size='lg'
                                />
                                <FontAwesomeIcon
                                    className='ms-2'
                                    icon='times'
                                    onClick={() => resetHandler()}
                                    size='lg'
                                />
                            </div>
                        ) : (
                            <FontAwesomeIcon
                                className='my-auto me-3 ms-auto text-muted'
                                onClick={() => isEditableHandler(true)}
                                icon='bars'
                                size='lg'
                            />
                        )}
                    </StyledNav>
                    <Tab.Content style={{ boxShadow: "2px 2px 10px -2px #cccccc" }}>
                        <Tab.Pane eventKey='absence'>
                            <Row className='pt-1 ps-5 g-0'>
                                <Col>{foremanPills}</Col>
                            </Row>
                            <Row>
                                <Col>
                                    <DynamicGrid
                                        source='staff'
                                        isEditable={editable}
                                        save={save}
                                        reset={reset}
                                        setReset={setReset}
                                        setTempLayoutsHandler={props.setTempLayoutsHandler}
                                        layouts={props.layouts?.staff}
                                        initLayoutsHandler={props.initLayoutsHandler}
                                    >
                                        <GridItem
                                            key='0'
                                            data-grid={{
                                                w: 6,
                                                h: 10,
                                                x: 0,
                                                y: 0,
                                                minW: 4,
                                                minH: 8,
                                            }}
                                        >
                                            <Card>
                                                <Card.Header>
                                                    <h3>{t("daily_absence")}</h3>
                                                </Card.Header>
                                                <Card.Body>
                                                    <ChartWrap>
                                                        <Time
                                                            stacked={true}
                                                            type='bar'
                                                            label={t("absent")}
                                                            datasets={absentData}
                                                            timeUnit='day'
                                                            annotation={selectedMonth.isSame(
                                                                dayjs(),
                                                                "month",
                                                            )}
                                                        />
                                                    </ChartWrap>
                                                </Card.Body>
                                            </Card>
                                        </GridItem>
                                        <GridItem
                                            key='1'
                                            data-grid={{
                                                w: 6,
                                                h: 10,
                                                x: 0,
                                                y: 10,
                                                minW: 4,
                                                minH: 8,
                                            }}
                                        >
                                            <Card>
                                                <Card.Header>
                                                    <h3>{t("monthly_absence_category")}</h3>
                                                </Card.Header>
                                                <Card.Body>
                                                    <ChartWrap>
                                                        <Time
                                                            stacked={true}
                                                            type='bar'
                                                            label={t("absent")}
                                                            datasets={categoryData}
                                                            timeUnit='day'
                                                            annotation={selectedMonth.isSame(
                                                                dayjs(),
                                                                "month",
                                                            )}
                                                        ></Time>
                                                    </ChartWrap>
                                                </Card.Body>
                                            </Card>
                                        </GridItem>
                                        <GridItem
                                            key='2'
                                            data-grid={{
                                                w: 6,
                                                h: 10,
                                                x: 6,
                                                y: 10,
                                                minW: 4,
                                                minH: 8,
                                            }}
                                        >
                                            <Card>
                                                <Card.Header as='h4'>
                                                    {t("monthly_absence_category")}
                                                </Card.Header>
                                                <Card.Body>
                                                    <ChartWrap>
                                                        <Pie data={pieData} options={options}></Pie>
                                                    </ChartWrap>
                                                </Card.Body>
                                            </Card>
                                        </GridItem>
                                        <GridItem
                                            key='staff_3'
                                            data-grid={{
                                                w: 6,
                                                h: 10,
                                                x: 6,
                                                y: 10,
                                                minW: 4,
                                                minH: 8,
                                            }}
                                        >
                                            <Card>
                                                <Card.Header as='h4'>
                                                    {t("current_status")}
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className='p-4 d-flex justify-content-center gap-3'>
                                                        {!!lastWorkDay && (
                                                            <div className='d-none d-sm-block'>
                                                                <div className='fw-bolder mb-1'>
                                                                    {t("yesterday")}
                                                                </div>
                                                                <div className='shadow-sm px-2 py-1 align-items-center rounded bg-secondary text-white px-4'>
                                                                    <Badge
                                                                        text={t("use_of_hours")}
                                                                        value={safeNumber(yesterday?.hourUse)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("leave")}
                                                                        value={safeNumber(yesterday?.leave)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("higher_force")}
                                                                        value={safeNumber(yesterday?.higherForce)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("sick")}
                                                                        value={safeNumber(yesterday?.sick)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("partial_sick")}
                                                                        value={safeNumber(yesterday?.partialSick)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("partial_use_of_hours")}
                                                                        value={safeNumber(yesterday?.partialHourUse)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("special_leave")}
                                                                        value={safeNumber(yesterday?.quarantine)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={
                                                                            <span
                                                                                style={{
                                                                                    fontWeight:
                                                                                        "bold",
                                                                                    fontSize:
                                                                                        "115%",
                                                                                }}
                                                                            >
                                                                                {t("together")}
                                                                            </span>
                                                                        }
                                                                        value={
                                                                            safeNumber(yesterday?.quarantine) +
                                                                            safeNumber(yesterday?.sick) +
                                                                            safeNumber(yesterday?.higherForce) +
                                                                            safeNumber(yesterday?.leave) +
                                                                            safeNumber(yesterday?.hourUse) +
                                                                            safeNumber(yesterday?.partialSick) +
                                                                            safeNumber(
                                                                                yesterday?.partialHourUse,
                                                                            )
                                                                        }
                                                                        plan={today?.plan}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!!today && (
                                                            <div>
                                                                <div className='fw-bolder mb-1'>
                                                                    {t("today")}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        borderRadius: "8px",
                                                                        backgroundColor:
                                                                            "var(--bs-info)",
                                                                        color: "white",
                                                                    }}
                                                                    className='shadow-sm px-2 py-1 align-items-center rounded bg-info text-white px-4'
                                                                >
                                                                    <Badge
                                                                        text={t("use_of_hours")}
                                                                        value={safeNumber(today?.hourUse)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("leave")}
                                                                        value={safeNumber(today?.leave)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("higher_force")}
                                                                        value={safeNumber(today?.higherForce)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("sick")}
                                                                        value={safeNumber(today?.sick)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("partial_sick")}
                                                                        value={safeNumber(today?.partialSick)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("partial_use_of_hours")}
                                                                        value={safeNumber(today?.partialHourUse)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={t("special_leave")}
                                                                        value={safeNumber(today?.quarantine)}
                                                                        plan={today?.plan}
                                                                    />
                                                                    <Badge
                                                                        text={
                                                                            <span
                                                                                style={{
                                                                                    fontWeight:
                                                                                        "bold",
                                                                                    fontSize:
                                                                                        "115%",
                                                                                }}
                                                                            >
                                                                                {t("together")}
                                                                            </span>
                                                                        }
                                                                        value={
                                                                            safeNumber(today?.quarantine) +
                                                                            safeNumber(today?.sick) +
                                                                            safeNumber(today?.higherForce) +
                                                                            safeNumber(today?.leave) +
                                                                            safeNumber(today?.hourUse) +
                                                                            safeNumber(today?.partialSick) +
                                                                            safeNumber(today?.partialHourUse)
                                                                        }
                                                                        plan={today?.plan}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!lastWorkDay && !today && (
                                                            <div>{t("no_data")}</div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </GridItem>
                                    </DynamicGrid>
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </Fragment>
    );
}

export default Staff;
