import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { matchPath, Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import DetailModal from "../../../Orders/DetailModal";
import OrderOperations from "./OrderOperations/OrderOperations";
import OrdersTile from "./OrdersTile/OrdersTile";
import OrdersStatus from "./OrdersStatus/OrdersStatus";
import OtdTile from "./OtdTile/OtdTile";
import "./styles.scss";
import QueueModal from "./QueueModal/QueueModal";
import Tile from "../../../../components/Tile/Tile";
import { useAccidents, useAllAccidents } from "../../../../data/ReactQuery";
import dayjs from "dayjs";
import Bar from "../../../../components/UI/Bar/Bar";
import { useMemo } from "react";

const ToolshopDashboard = ({
    timewindow,
    status,
    startDate,
    endDate,
    orders,
    finishedOrders,
    reports,
    selectedUnit,
    dnSearchTerm,
    ...props
}) => {
    const { t } = useTranslation("shopfloor");
    const { path, url } = useRouteMatch();
    const [detail, setDetail] = useState(null);
    const history = useHistory();
    const [anyAccident, setAnyAccident] = useState([]);

    const match = matchPath(history.location.pathname, {
        path: path + "/detail/:order",
    });
    const accidentsData = useAllAccidents(selectedUnit.subunitId, {
        onSuccess: (res) => {
            if (res.length > 0) {
                // Get the last accident date in ETA
                const lastAccidentDate = dayjs(res[0]?.accidentDate);
                const daysSince = dayjs().diff(lastAccidentDate, "day");

                //Get the last accident date in subunit
                const subunitAccidents = res.filter(
                    (accident) => accident.subunitId == selectedUnit.subunitId,
                );
                const lastSubunitAccidentDate =
                    subunitAccidents.length > 0 ? dayjs(subunitAccidents[0].accidentDate) : null;
                const daysSinceSubunit =
                    subunitAccidents.length > 0
                        ? dayjs().diff(lastSubunitAccidentDate, "day")
                        : null;

                setAnyAccident([
                    { value: daysSince, timestamp: lastAccidentDate },
                    { value: daysSinceSubunit, timestamp: lastSubunitAccidentDate },
                ]);
            }
        },
    });

    useEffect(() => {
        if (match?.params?.order !== undefined && !orders.isLoading) {
            const matchRow = orders.data.find(
                (item) => item.stNarocila?.trim() == decodeURIComponent(match.params.order?.trim()),
            );
            if (matchRow) {
                setDetail(matchRow);
            } else {
                history.push(url);
            }
        }
    }, [match?.params]);

    const filteredOrders = useMemo(() => {
        if (!orders.data) return [];
        if (!dnSearchTerm || !dnSearchTerm.trim()) return orders.data;
        return orders.data.filter((order) =>
            order.pozicije?.some((poz) => poz.DN?.includes(dnSearchTerm.trim())),
        );
    }, [orders.data, dnSearchTerm]);

    if (orders?.isLoading || finishedOrders?.isLoading || reports?.isLoading) {
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
                <PulseLoader
                    loading={orders?.isLoading || finishedOrders?.isLoading || reports?.isLoading}
                    color='gray'
                />
                <p className='lead' style={{ fontWeight: "500" }}>
                    {t("data_is_loading")}
                </p>
            </div>
        );
    }

    return (
        <Container>
            {
                <Row className='mb-4'>
                    <Col>
                        <div className='d-flex'>
                            <Bar
                                title='last_accident'
                                content={anyAccident}
                                path='safety'
                                isLoading={accidentsData.isLoading}
                            ></Bar>
                        </div>
                    </Col>
                </Row>
            }
            <Row className='mb-4'>
                <Col xs={12} lg={timewindow == "late" ? 12 : 8}>
                    <OrdersStatus
                        status={status}
                        orders={{ ...orders, data: filteredOrders }}
                        finishedOrders={finishedOrders}
                    />
                </Col>
                {timewindow != "late" && (
                    <Col xs={12} lg={4}>
                        <OtdTile
                            timewindow={timewindow}
                            startDate={startDate}
                            endDate={endDate}
                            orders={{ ...orders, data: filteredOrders }}
                            finishedOrders={finishedOrders}
                        />
                    </Col>
                )}
            </Row>
            <Row className='mb-3'>
                <Col>
                    <Tile>
                        <Row>
                            <Col xs={12}>
                                <OrderOperations
                                    startDate={startDate}
                                    endDate={endDate}
                                    timewindow={timewindow}
                                    status={status}
                                    orders={{ ...orders, data: filteredOrders }}
                                />
                            </Col>
                        </Row>
                        <Row className='mb-4'></Row>
                        <Row>
                            <Col xs={12} lg={6}>
                                <OrdersTile
                                    startDate={startDate}
                                    endDate={endDate}
                                    timewindow={timewindow}
                                    status={status}
                                    orders={{ ...orders, data: filteredOrders }}
                                />
                            </Col>
                            <Col xs={12} lg={6}>
                                <OrdersTile
                                    orders={{ ...orders, data: filteredOrders }}
                                    reports={reports}
                                    status={status}
                                    timewindow='exposed'
                                />
                            </Col>
                        </Row>
                    </Tile>
                </Col>
            </Row>

            <Switch>
                <Route
                    path={[
                        path + "/detail/:order/:position/:techSheet/:activity",
                        path + "/detail/:order/:position/:techSheet",
                        path + "/detail/:order/:position",
                        path + "/detail/:order",
                    ]}
                >
                    {detail ? <DetailModal base={url} selectedRow={detail} /> : null}
                </Route>
                <Route path={path + "/queue/:operation"}>
                    {
                        <QueueModal
                            timewindow={timewindow}
                            status={status}
                            startDate={startDate}
                            endDate={endDate}
                            base={url}
                            orders={{ ...orders, data: filteredOrders }}
                            reports={reports}
                        />
                    }
                </Route>
            </Switch>
        </Container>
    );
};
export default ToolshopDashboard;
