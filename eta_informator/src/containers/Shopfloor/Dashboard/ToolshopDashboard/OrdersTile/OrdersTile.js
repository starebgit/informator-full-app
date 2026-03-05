import dayjs from "dayjs";
import { Button, Card, Col, OverlayTrigger, Row, Tooltip, Badge as BsBadge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import DataTable from "react-data-table-component";
import { useMemo } from "react";
import { FcSynchronize, FcCheckmark, FcSettings } from "react-icons/fc";
import STATUS from "../OrderStatus";

const Table = styled(DataTable)`
    .rdt_Table {
        padding: 1rem;
        border-radius: 1rem;
    }
`;

const OperationBadge = styled(BsBadge)`
    background-color: white !important;
    font-size: 13px;
`;

const StatusBadge = styled(BsBadge)`
    background-color: white !important;
    min-width: 100px;
    font-size: 13px;
`;

const OrdersTile = ({
    orders,
    status,
    timewindow,
    reports,
    startDate = null,
    endDate = null,
    ...props
}) => {
    const location = useLocation();
    const history = useHistory();

    const { t } = useTranslation(["shopfloor", "labels"]);
    const columns = useMemo(() => {
        return [
            {
                name: t("order"),
                selector: (row) => row.name,
                cell: (row) => {
                    return <div className='font-monospace'>{row.name}</div>;
                },
                grow: 2,
            },
            {
                name: t("deadline"),
                selector: (row) => row.deadline,
                format: (row) => row.deadline.format("LL"),
                grow: 3,
            },
            {
                name: t("status"),
                selector: (row) => row.techSheetStatus.active,
                cell: (row) => {
                    return (
                        <StatusBadge className='my-1' text='black'>
                            <div className='d-flex justify-content-around gap-2 fw-normal'>
                                <div className='d-flex align-items-center gap-1'>
                                    <FcSynchronize size='18px' />
                                    {row.techSheetStatus.active}
                                </div>
                                <div className='d-flex align-items-center gap-1'>
                                    <FcCheckmark size='18px' />
                                    {row.techSheetStatus.finished}
                                </div>
                            </div>
                        </StatusBadge>
                    );
                },
                center: true,
            },
            {
                name: timewindow == "exposed" ? t("days_since") : t("days_left"),
                selector: (row) => row.daysLeft,
                sortable: true,
                right: true,
                grow: 2,
                wrap: true,
                cell: (row) => {
                    return (
                        <div className='d-flex gap-2 align-items-center justify-content-between'>
                            {row.daysLeft}
                        </div>
                    );
                },
                conditionalCellStyles: [
                    {
                        when: (row) => row.daysLeft < -5,
                        style: {
                            fontWeight: 700,
                            color: "var(--bs-danger)",
                        },
                    },
                    {
                        when: (row) => row.daysLeft < 0 && row.daysLeft >= -5,
                        style: {
                            fontWeight: 700,
                            color: "var(--bs-warning)",
                        },
                    },
                    {
                        when: (row) => row.daysLeft < 8 && row.daysLeft >= 0,
                        style: {
                            fontWeight: 700,
                            color: "var(--bs-green)",
                        },
                    },
                    {
                        when: (row) => row.daysLeft >= 0,
                        style: {
                            fontWeight: 700,
                            color: "var(--bs-warning)",
                        },
                    },
                ],
            },
            {
                name: t("operation"),
                selector: (row) => row.staleActivity,
                sortable: true,
                omit: timewindow !== "exposed",
                grow: 2,
                cell: (row) => {
                    return (
                        <OverlayTrigger
                            key={"top"}
                            placement={"top"}
                            overlay={<Tooltip id={`tooltip-top`}>{row.staleActivity}</Tooltip>}
                        >
                            <OperationBadge
                                className='d-flex gap-1 align-items-center text-nowrap overflow-hidden fw-normal font-monospace'
                                text='black'
                            >
                                <FcSettings size='18px' />
                                {row.staleActivity.split(" ").shift()}
                            </OperationBadge>
                        </OverlayTrigger>
                    );
                },
            },
        ];
    }, [t, timewindow]);

    const filteredOrders = filterOrders(timewindow, status, orders, startDate, endDate);

    return (
        <Card className='tile' body>
            <Row>
                <Col>
                    <h4 className='fw-bold mb-0'>
                        {timewindow == "exposed" ? t("exposed_orders") : t("orders")}
                    </h4>
                    <h6>
                        {timewindow == "late"
                            ? t("late_orders")
                            : timewindow == "current_week"
                            ? t("due_this_week")
                            : timewindow == "current_month"
                            ? t("due_this_month")
                            : timewindow == "custom_range"
                            ? `${dayjs(startDate).format("LL")} - ${dayjs(endDate).format("LL")}`
                            : t("stale_for_14_days")}
                    </h6>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        noHeader
                        columns={columns}
                        data={filteredOrders}
                        dense
                        highlightOnHover
                        pointerOnHover
                        responsive
                        onRowClicked={(row) =>
                            history.push(
                                `${location.pathname}/detail/${encodeURIComponent(
                                    row.name?.trim(),
                                )}`,
                            )
                        }
                        pagination
                        paginationComponentOptions={{
                            noRowsPerPage: true,
                            rangeSeparatorText: t("of"),
                        }}
                        defaultSortFieldId={4}
                        defaultSortAsc={timewindow !== "exposed"}
                        noDataComponent={t("labels:no_data")}
                    />
                </Col>
            </Row>
        </Card>
    );
};

const filterOrders = (timewindow, status, orders, startDate = null, endDate = null) => {
    if (!timewindow) return [];
    let data;
    if (timewindow == "exposed") {
        data = orders.data.reduce((acc, order) => {
            const stale = checkIfStale(order);
            if (status !== "all") {
                if (order.utez.toLowerCase() === status && stale) {
                    acc.push(stale);
                }
                return acc;
            }
            if (stale) acc.push(stale);
            return acc;
        }, []);
    } else {
        data = orders.data.filter((order) => {
            const hasValidDates =
                order.potrjenRok &&
                dayjs(order.potrjenRok, "YYYYMMDD", true).isValid() &&
                order.datumZacetek &&
                dayjs(order.datumZacetek, "YYYYMMDD", true).isValid();

            const checks = [];
            const deadlineDate = dayjs(order.potrjenRok, "YYYYMMDD");
            if (order.status == "Oddana") return false;
            switch (timewindow) {
                case "all_time":
                    if (!hasValidDates) return false;
                    break;
                case "late":
                    checks.push(deadlineDate.isBefore(dayjs(), "day"));
                    break;
                case "current_week":
                    checks.push(deadlineDate.isSame(dayjs(), "week"));
                    break;
                case "current_month":
                    checks.push(deadlineDate.isSame(dayjs(), "month"));
                    break;
                case "custom_range":
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
        });
    }
    if (!data || data.length == 0) return [];
    return data.map((entry) => {
        const techSheetStatus = entry.pozicije.reduce(
            (acc, position) => {
                position.tehnoloskiListi.forEach((techSheet) => {
                    if (techSheet.statusTL == "V izvajanju") acc.active++;
                    if (techSheet.statusTL == "Izdelan" || techSheet.statusTL == "Zaključen")
                        acc.finished++;
                });
                return acc;
            },
            {
                active: 0,
                finished: 0,
            },
        );
        const deadlineDate = dayjs(entry.potrjenRok, "YYYYMMDD");
        const dayDiff = deadlineDate.isSame(dayjs(), "date")
            ? 0
            : Math.ceil(deadlineDate.diff(dayjs(), "day", true));
        return {
            name: entry.stNarocila,
            daysLeft: timewindow == "exposed" ? entry.late : dayDiff,
            staleActivity: timewindow == "exposed" ? entry.staleActivity : "",
            deadline: deadlineDate,
            techSheetStatus: techSheetStatus,
        };
    });
};

const checkIfStale = (order) => {
    for (const position of order.pozicije) {
        for (const techSheet of position.tehnoloskiListi) {
            const lastActivity = {
                name: "",
                diff: 0,
            };

            for (const activity of techSheet.aktivnosti) {
                if (
                    activity.naziv === "900 Ure delavec" ||
                    (activity.status !== "Planirana" && activity.status !== "Potrditev dir. orod.")
                )
                    continue;
                //? If activity is '010 Priprava materiala' and is 'Planirana' check if it's stale
                const diff = dayjs().diff(dayjs(order.datumZacetek, "YYYYMMDD"), "day");
                if (diff >= 14 && diff > lastActivity.diff) {
                    lastActivity.name = activity.naziv;
                    lastActivity.diff = diff;
                }
            }
            if (lastActivity.diff == 0) return false;
            return { ...order, late: lastActivity.diff, staleActivity: lastActivity.name };
        }
    }
    return false;
};

export default OrdersTile;
