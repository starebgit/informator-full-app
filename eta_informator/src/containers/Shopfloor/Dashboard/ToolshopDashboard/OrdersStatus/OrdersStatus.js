import dayjs from "dayjs";
import { Card, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const StatusCard = styled(Card)`
    border: 0;
    box-shadow: var(--shadow-regular);
    background: rgb(243, 255, 254);
    background: linear-gradient(10deg, rgba(240, 250, 255, 1) 0%, rgba(245, 245, 245, 1) 100%);
    border-radius: 1rem;
    height: 100%;
`;

const OrdersStatus = ({ orders, status, props }) => {
    const { t } = useTranslation("shopfloor");

    const statusObject = orders.data
        .filter((order) => {
            if (status === "all") return true;
            return order.utez.toLowerCase().includes(status);
        })
        .reduce(
            (acc, cur) => {
                const deadline = dayjs(cur.potrjenRok, "YYYYMMDD");
                if (cur.status == "Oddana") return acc;
                //If the order is active, it has a start date but no end date
                if (cur.datumZacetek != "" && cur.datumKonec == "") acc.active += 1;
                //If the order is overdue, the deadline is before today
                if (deadline.isBefore(dayjs(), "day")) acc.overdue += 1;
                //If the order is due this week, the deadline is this week
                if (deadline.isSame(dayjs(), "week")) acc.dueThisWeek += 1;
                return acc;
            },
            { active: 0, overdue: 0, dueThisWeek: 0 },
        );

    return (
        <StatusCard body>
            <div className='d-flex flex-wrap justify-content-between align-items-center h-100'>
                <div>
                    <h3 className='mb-0 fw-bold'>{t("order", { count: 2 })}</h3>
                    <h6>{t("current_day_status")}</h6>
                </div>
                <div className='d-flex'>
                    <div className='d-flex flex-column justify-content-center align-items-center mx-xs-1 mx-md-2 mx-lg-4'>
                        <h3 className='mb-0' style={{ fontWeight: 700 }}>
                            {statusObject.active}
                        </h3>
                        <h6 className='mb-0'>{t("active")}</h6>
                    </div>
                    <div className='d-flex flex-column justify-content-center align-items-center mx-xs-1 mx-md-2 mx-lg-4'>
                        <h3
                            className='mb-0 '
                            style={{
                                color: "var(--bs-danger)",
                                fontWeight: 700,
                            }}
                        >
                            {statusObject.overdue}
                        </h3>
                        <h6 className='mb-0'>{t("overdue")}</h6>
                    </div>
                    <div className='d-flex flex-column justify-content-center align-items-center mx-xs-1 mx-md-2 mx-lg-4'>
                        <h3
                            className='mb-0'
                            style={{
                                color: "var(--bs-warning)",
                                fontWeight: 700,
                            }}
                        >
                            {statusObject.dueThisWeek}
                        </h3>
                        <h6 className='mb-0'>{t("due_this_week")}</h6>
                    </div>
                </div>
            </div>
        </StatusCard>
    );
};

export default OrdersStatus;
