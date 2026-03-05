import dayjs from "dayjs";
import { Card, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TileOg from "../../../../../components/Tile/Tile";
import STATUS from "../OrderStatus";

const Tile = styled(Card)`
    background: rgb(243, 255, 254);
    background: linear-gradient(10deg, rgba(240, 250, 255, 1) 0%, rgba(245, 245, 245, 1) 100%);
    .card-body {
        display: flex;
        flex-direction: column;
    }
`;

const OtdTile = ({ orders, timewindow, startDate, endDate, finishedOrders, props }) => {
    const { t } = useTranslation("shopfloor");
    const combinedOrders = [...orders.data, ...finishedOrders.data];
    const currentOrders = combinedOrders.filter((item) => {
        const isValidDate = item.datumKonec && dayjs(item.datumKonec, "YYYYMMDD", true).isValid();

        const submissionDate = dayjs(item.datumKonec, "YYYYMMDD");

        switch (timewindow) {
            case "all_time":
                if (!isValidDate) return false;
                return true;
            case "current_month":
                return submissionDate.isSame(dayjs(), "month");
            case "current_week":
                return submissionDate.isSame(dayjs(), "week");
            case "custom_range":
                return (
                    submissionDate.isSameOrAfter(startDate, "day") &&
                    submissionDate.isSameOrBefore(endDate, "day")
                );
            default:
                return submissionDate.isSame(dayjs(), "month");
        }
    });

    const realizationCounts = currentOrders.reduce(
        (acc, order) => {
            acc.all += 1;
            const submissionDate = dayjs(order.datumKonec, "YYYYMMDD");
            const deadlineDate = dayjs(order.potrjenRok, "YYYYMMDD");

            if (submissionDate.isBefore(deadlineDate, "day")) {
                acc.intime += 1;
            } else {
                acc.late += 1;
            }
            return acc;
        },
        { late: 0, intime: 0, all: 0 },
    );
    return (
        <Tile body className='tile'>
            <div className='d-flex justify-content-between flex-wrap'>
                <div>
                    <h2 className='mb-0 fw-bold'>{t("on_time_delivery")}</h2>
                    <h6>{t(timewindow)}</h6>
                </div>
                <div className='d-flex flex-column align-items-end justify-content-end flex-wrap align-self-stretch'>
                    <div className='d-flex' style={{ gap: "1rem" }}>
                        <h6>
                            {t("in_time")}: {realizationCounts.intime}
                        </h6>
                        <h6>
                            {t("finished", { count: 3 })}: {realizationCounts.all}
                        </h6>
                    </div>
                    <div className='d-flex justify-content-end ms-4'>
                        <h2 className='mb-0'>
                            {Intl.NumberFormat("sl", {
                                style: "percent",
                                maximumFractionDigits: 1,
                            }).format(realizationCounts.intime / realizationCounts.all)}
                        </h2>
                    </div>
                </div>
            </div>
        </Tile>
    );
};

export default OtdTile;
