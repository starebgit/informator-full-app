import { Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { matchPath, useHistory, useRouteMatch } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import Tile from "../../../../components/Tile/Tile";
import GraphSwitchCard from "../../../../components/GraphSwitchCard/GraphSwitchCard";
import FormsGraphCard from "./FormsGraphCard/FormsGraphCard";
import DailyFormsCard from "./DailyFormsCard/DailyFormsCard";
import { useAccidents, useAllAccidents } from "../../../../data/ReactQuery";
import { useState } from "react";
import dayjs from "dayjs";
import Bar from "../../../../components/UI/Bar/Bar";
const FoundryDashboard = ({ foundryForms, selectedMonth, selectedUnit, ...props }) => {
    const [anyAccident, setAnyAccident] = useState([]);
    const { t } = useTranslation("shopfloor");
    const { path, url } = useRouteMatch();
    const history = useHistory();
    const match = matchPath(history.location.pathname, {
        path: path + "/detail/:order",
    });
    const accidentsData = useAllAccidents(selectedUnit?.subunitId, {
        onSuccess: (res) => {
            if (res.length > 0) {
                // Get the last accident date in ETA
                const lastAccidentDate = dayjs(res[0]?.accidentDate);
                const daysSince = dayjs().diff(lastAccidentDate, "day");

                //Get the last accident date in subunit
                const subunitAccidents = res.filter(
                    (accident) => accident.subunitId == selectedUnit?.subunitId,
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
    if (foundryForms.isLoading) {
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
                <PulseLoader loading={foundryForms.isLoading} color='gray' />
                <p className='lead' style={{ fontWeight: "500" }}>
                    {t("data_is_loading")}
                </p>
            </div>
        );
    }

    return (
        <Container>
            {
                <Row className='mb-2'>
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
                <Col xs={12} lg={12}>
                    <DailyFormsCard />
                </Col>
            </Row>
            <Row className='mb-4'>
                <Col xs={12}>
                    <Tile style={{ height: "400px" }}>
                        <GraphSwitchCard title={t("forms")}>
                            <FormsGraphCard
                                selectedMonth={selectedMonth}
                                data={foundryForms.data}
                            />
                        </GraphSwitchCard>
                    </Tile>
                </Col>
            </Row>
        </Container>
    );
};
export default FoundryDashboard;
