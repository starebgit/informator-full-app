import dayjs from "dayjs";
import {
    Modal,
    Row,
    Col,
    Container,
    Card,
    ProgressBar,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Scrollbars } from "react-custom-scrollbars-2";
import styled from "styled-components";
import { useHistory, useParams, useRouteMatch } from "react-router-dom";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FaClock, FaInfoCircle } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa";
import STATUS from "../OrderStatus";

const BigModal = styled(Modal)`
    .modal-dialog {
        min-width: 70vw;
        height: 90vh;
    }
`;

const OrderItem = styled.div`
    padding: 0.1rem 1rem;
    padding-bottom: 0.5rem;
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.1s;

    &:not(:only-child) {
        border-bottom: 1px solid lightgray;
    }

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: #f5f5f5;
    }
`;

const QueueModal = ({
    orders,
    timewindow,
    status,
    startDate = null,
    endDate = null,
    reports,
    base,
    ...props
}) => {
    const { t } = useTranslation("shopfloor");
    const history = useHistory();
    const { operation } = useParams();
    const includeLate = useURLQuery()?.get("late") || false;

    const queue = useMemo(() => {
        return orders.data
            .filter((order) => {
                const checks = [];
                const deadlineDate = dayjs(order.potrjenRok, "YYYYMMDD");
                if (order.status == STATUS.submited) return false;
                switch (timewindow) {
                    case "all_time":
                        if (!order.potrjenRok || !deadlineDate.isValid()) return false;
                        checks.push(true);
                        break;
                    case "late":
                        checks.push(deadlineDate.isBefore(dayjs(), "day"));
                        break;
                    case "current_week": {
                        if (includeLate)
                            checks.push(
                                deadlineDate.isBefore(dayjs(), "day") ||
                                    deadlineDate.isSame(dayjs(), "week"),
                            );
                        else checks.push(deadlineDate.isSame(dayjs(), "week"));
                        break;
                    }

                    case "current_month":
                        if (includeLate)
                            checks.push(
                                deadlineDate.isBefore(dayjs(), "day") ||
                                    deadlineDate.isSame(dayjs(), "month"),
                            );
                        else checks.push(deadlineDate.isSame(dayjs(), "month"));
                        break;
                    case "custom_range":
                        if (includeLate)
                            checks.push(
                                deadlineDate.isBefore(dayjs(), "day") ||
                                    (deadlineDate.isSameOrAfter(startDate, "day") &&
                                        deadlineDate.isSameOrBefore(endDate, "day")),
                            );
                        else
                            checks.push(
                                deadlineDate.isSameOrAfter(startDate, "day") &&
                                    deadlineDate.isSameOrBefore(endDate, "day"),
                            );
                        break;
                    default:
                        checks.push(false);
                }
                if (status !== "all") checks.push(order.utez.toLowerCase() === status);
                return checks.every((check) => check);
            })
            .reduce((acc, order) => {
                order.pozicije.forEach((position, positionIndex) => {
                    position.tehnoloskiListi.forEach((tl, tlIndex) => {
                        let nazivToSkip = "900 Ure delavec";
                        let startIndex = tl.aktivnosti[0]?.naziv === nazivToSkip ? 1 : 0;
                        for (let i = startIndex; i < tl.aktivnosti.length; i++) {
                            const previousActivity = tl.aktivnosti[i - 1];
                            const currentActivity = tl.aktivnosti[i];
                            if (currentActivity.naziv == operation) {
                                switch (currentActivity.status) {
                                    case STATUS.active: {
                                        const lastReport =
                                            reports?.data?.find(
                                                (report) =>
                                                    report.activityKey === currentActivity.id,
                                            ) || null;
                                        const lastReportDate = dayjs(lastReport?.date, "YYYYMMDD");
                                        acc.push({
                                            status: "active",
                                            lastReport: lastReportDate
                                                ? lastReportDate.diff(dayjs(), "days")
                                                : 0,
                                            hours: {
                                                planned: currentActivity.planUr,
                                                finished: currentActivity.realUr,
                                            },
                                            techsheet: { ...tl },
                                            url: `/${order.stNarocila}/${positionIndex}/${tlIndex}`,
                                            activityOrder: i,
                                            activityNumber: tl.aktivnosti.length - 2,
                                        });
                                        break;
                                    }
                                    case STATUS.planned: {
                                        if (
                                            !previousActivity ||
                                            previousActivity.status === STATUS.finished
                                        ) {
                                            const lastReport =
                                                reports?.data?.find(
                                                    (report) =>
                                                        report.activityKey === previousActivity?.id,
                                                ) || null;
                                            const lastReportDate = dayjs(
                                                lastReport?.date,
                                                "YYYYMMDD",
                                            );

                                            acc.push({
                                                status: "due",
                                                lastReport: lastReportDate
                                                    ? lastReportDate.diff(dayjs(), "days")
                                                    : 0,
                                                lastReportObj: { ...lastReport },
                                                techsheet: { ...tl },
                                                url: `/${order.stNarocila}/${positionIndex}/${tlIndex}`,
                                                order: { ...order },
                                                hours: {
                                                    planned: currentActivity.planUr || 0,
                                                    finished: currentActivity.realUr || 0,
                                                },
                                                activityOrder: i,
                                                activityNumber: tl.aktivnosti.length - 2,
                                            });
                                        } else {
                                            acc.push({
                                                status: "potentially_available",
                                                techsheet: { ...tl },
                                                url: `/${order.stNarocila}/${positionIndex}/${tlIndex}`,
                                                hours: {
                                                    planned: currentActivity.planUr || 0,
                                                    finished: currentActivity.realUr || 0,
                                                },
                                                activityOrder: i,
                                                activityNumber: tl.aktivnosti.length - 2,
                                            });
                                        }
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                    });
                });
                return acc;
            }, []);
    }, [orders.data, timewindow, status, startDate, endDate, operation, reports.data, includeLate]);

    const potentially_availabile = queue
        .filter((techsheet) => techsheet.status == "potentially_available")
        .map((techsheet, i) => {
            return (
                <OrderItem
                    key={"pa_" + i}
                    onClick={() =>
                        history.push(`/shopfloor/toolshop/dashboard/detail${techsheet.url}`)
                    }
                >
                    <div className='d-flex flex-column'>
                        <div className='font-monospace'>{techsheet.techsheet.TL}</div>
                        <div className='d-flex gap-2'>
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{ minWidth: "50px" }}
                            >
                                <FaRegClock />
                                {techsheet.hours.planned}h
                            </div>
                            <div className='vr' />
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{ minWidth: "50px" }}
                            >
                                {techsheet.activityOrder} / {techsheet.activityNumber}
                            </div>
                        </div>
                    </div>
                </OrderItem>
            );
        });

    const due = queue
        .filter((techsheet) => techsheet.status == "due")
        .sort((a, b) => {
            return isNaN(a.lastReport) ? -1000 : b.lastReport - a.lastReport;
        })
        .map((techsheet, i) => {
            const lastReport = isNaN(techsheet.lastReport) ? "" : Math.abs(techsheet.lastReport);
            return (
                <OrderItem
                    key={"due_" + i}
                    onClick={() =>
                        history.push(`/shopfloor/toolshop/dashboard/detail${techsheet.url}`)
                    }
                >
                    <div className='d-flex flex-column'>
                        <div className='font-monospace'>{techsheet.techsheet.TL}</div>
                        <div className='d-flex gap-2'>
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{ minWidth: "50px" }}
                            >
                                <FaRegClock />
                                {techsheet.hours.planned}h
                            </div>
                            <div className='vr' />
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{ minWidth: "50px" }}
                            >
                                {techsheet.activityOrder} / {techsheet.activityNumber}
                            </div>
                        </div>
                    </div>
                    <div className='fw-semibold text-warning'>
                        {lastReport > 1
                            ? `${lastReport} ${t("days_ago")}`
                            : lastReport > 0
                            ? t("yesterday")
                            : lastReport === 0
                            ? t("today")
                            : "/"}
                    </div>
                </OrderItem>
            );
        });

    const active = queue
        .filter((techsheet) => techsheet.status == "active")
        .sort((a, b) => {
            return isNaN(a.lastReport) ? -1000 : b.lastReport - a.lastReport;
        })
        .map((techsheet, i) => {
            const lastReport = isNaN(techsheet.lastReport) ? 0 : Math.abs(techsheet.lastReport);
            const finishedHours = +techsheet.hours.finished;
            const plannedHours = +techsheet.hours.planned;
            const progress =
                plannedHours < finishedHours ? 100 : (finishedHours / plannedHours) * 100;
            return (
                <OrderItem
                    key={"active" + i}
                    onClick={() =>
                        history.push(`/shopfloor/toolshop/dashboard/detail${techsheet.url}`)
                    }
                >
                    <div className='d-flex flex-column w-100'>
                        <div className='d-flex gap-2 align-items-center justify-content-between'>
                            <div className='font-monospace'>{techsheet.techsheet.TL}</div>
                            <div
                                className='fw-semibold text-warning text-end'
                                style={{ minWidth: "75px" }}
                            >
                                {lastReport > 1
                                    ? `${lastReport} ${t("days_ago")}`
                                    : lastReport > 0
                                    ? t("yesterday")
                                    : t("today")}
                            </div>
                        </div>
                        <div className='d-flex gap-2 align-items-center'>
                            <div
                                className='d-flex align-items-center justify-content-center gap-1'
                                style={{ minWidth: "60px" }}
                            >
                                <FaRegClock />
                                {techsheet.hours.planned}h
                            </div>
                            <div class='vr' />
                            <div
                                className='d-flex align-items-center gap-1'
                                style={{ minWidth: "40px" }}
                            >
                                {techsheet.activityOrder} / {techsheet.activityNumber}
                            </div>
                            <div class='vr' />
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        <div>
                                            {t("finished_hours")}: {finishedHours}h
                                        </div>
                                        <div>
                                            {t("planned_hours")}: {plannedHours}h
                                        </div>
                                    </Tooltip>
                                }
                            >
                                <ProgressBar className='w-100'>
                                    <ProgressBar
                                        variant={
                                            plannedHours < finishedHours ? "warning" : "success"
                                        }
                                        now={progress}
                                        label={`${techsheet.hours.finished}h`}
                                    />
                                    {plannedHours >= finishedHours && (
                                        <ProgressBar
                                            className='shadow-sm'
                                            striped
                                            variant='dark'
                                            now={100 - progress}
                                            label={`${plannedHours - finishedHours}h`}
                                        />
                                    )}
                                </ProgressBar>
                            </OverlayTrigger>
                        </div>
                    </div>
                </OrderItem>
            );
        });

    const statusCounts = queue.reduce(
        (acc, cur) => {
            acc[cur?.status] += +cur.hours.planned;
            return acc;
        },
        {
            active: 0,
            due: 0,
            potentially_available: 0,
        },
    );
    return (
        <BigModal show size='xl' onHide={() => history.push(base)}>
            <Container className='py-4'>
                <Row>
                    <Col>
                        <h3>{t("overview_by_operation")}</h3>
                    </Col>
                    {timewindow !== "late" && timewindow !== "all_time" && (
                        <Col>
                            <h4 className='d-flex gap-1 justify-content-end'>
                                {t("availiable_hours_in_timewindow")}:
                                <div>
                                    {getWorkDays(timewindow, endDate) * operationHours[operation]}h
                                </div>
                            </h4>
                        </Col>
                    )}
                </Row>
                <Row className='mx-3 mt-4'>
                    <Col>
                        {/* <Card body>
						</Card> */}
                        <h5 className='mb-2'>{operation}</h5>
                    </Col>
                </Row>
                <Row className='mx-3 mt-2'>
                    <Col className='mb-2'>
                        <Card body className='tile' style={{ backgroundColor: "" }}>
                            <div className='d-flex justify-content-between'>
                                <h4>{t("potentially_availabile")}</h4>
                                <h4>{statusCounts.potentially_available}h</h4>
                            </div>
                            <div
                                className='d-flex justify-content-start px-3'
                                style={{ borderBottom: "1px solid lightgray" }}
                            >
                                <div className='fs-6'>{t("techsheet")}</div>
                            </div>
                            <div className='d-flex flex-column my-2'>{potentially_availabile}</div>
                        </Card>
                    </Col>
                    <Col className='mb-2'>
                        <Card body className='tile' style={{ backgroundColor: "" }}>
                            <div className='d-flex justify-content-between'>
                                <h4>{t("due")}</h4>
                                <h4>{statusCounts.due}h</h4>
                            </div>
                            <div
                                className='d-flex justify-content-between px-3'
                                style={{ borderBottom: "1px solid lightgray" }}
                            >
                                <div>{t("techsheet")}</div>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>{t("previous_operation_description")}</Tooltip>
                                    }
                                >
                                    <div className='d-flex gap-1 align-items-center'>
                                        <div>{t("previous_operation")}</div>
                                        <FaInfoCircle />
                                    </div>
                                </OverlayTrigger>
                            </div>
                            <Scrollbars autoHeight={true} autoHeightMax='600px'>
                                <div className='d-flex flex-column my-2 me-3'>{due}</div>
                            </Scrollbars>
                        </Card>
                    </Col>
                    <Col className='mb-2'>
                        <Card body className='tile' style={{ backgroundColor: "" }}>
                            <h4>{t("active")}</h4>
                            <div
                                className='d-flex justify-content-between px-3'
                                style={{ borderBottom: "1px solid lightgray" }}
                            >
                                <div>{t("techsheet")}</div>

                                <OverlayTrigger
                                    overlay={<Tooltip>{t("last_activity_description")}</Tooltip>}
                                >
                                    <div className='d-flex gap-1 align-items-center'>
                                        <div>{t("last_activity")}</div>
                                        <FaInfoCircle />
                                    </div>
                                </OverlayTrigger>
                            </div>
                            <Scrollbars autoHeight={true} autoHeightMax='600px'>
                                <div className='d-flex flex-column my-2 me-3'>{active}</div>
                            </Scrollbars>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </BigModal>
    );
};

export default QueueModal;

function useURLQuery() {
    const { search } = useLocation();

    return useMemo(() => new URLSearchParams(search), [search]);
}

function getWorkDays(timewindow, endDate) {
    var workDays = 0;
    var sDate,
        eDate = dayjs();
    if (timewindow == "current_week") {
        eDate = dayjs().endOf("week");
    } else if (timewindow == "current_month") {
        eDate = dayjs().endOf("month");
    } else if (timewindow == "custom_range") {
        eDate = endDate;
    } else {
        return 0;
    }

    for (var i = dayjs(sDate); i.isBefore(eDate); i = i.add(1, "day")) {
        const weekDay = i.day();
        if (weekDay > 0 && weekDay < 6) workDays++;
    }
    return workDays;
}

const operationHours = {
    "010 Priprava materiala": 3.75,
    "020 Struženje univerzalno": 7.5,
    "021 Struženje CNC": 7.5,
    "040 Rezkanje univerzalno": 15,
    "041 Rezkanje CNC": 21,
    "060 Vrtanje koordinatno": 1.5,
    "070 Brušenje ploščinsko": 15,
    "080 Brušenje okroglo": 7.5,
    "101 Ročna obdelava": 7.5,
    "111 Kleparska dela": 7.5,
    "170 Termična obdelava": 7.5,
    "180 Erozija elektrodna": 3.75,
    "183 Erozija žična": 11.25,
    "190 Vrtanje radialno": 3.75,
};
