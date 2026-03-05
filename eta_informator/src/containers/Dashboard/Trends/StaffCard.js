import styled, { keyframes } from "styled-components";
import { Col, Row } from "react-bootstrap";
import MonthValue from "./MonthValue";
import TrendBadge from "./TrendBadge";
import TrendChart from "./TrendChart";
import UnitDetail from "./UnitDetail";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import findSubunitByKeyword from "../../../utils/finders";
import { PulseLoader } from "react-spinners";
import StaffChart from "./StaffChart";

const fade = keyframes`
	from{
		opacity: 0
	}

	to{
		opacity: 1
	}
`;

const Card = styled.div`
    background: #005252;
    color: white;
    border-radius: 0px;
    padding: 1.5rem 2rem;
`;

const Fader = styled.div`
    * {
        animation: ${fade} 0.1s linear 1;
    }
`;

function StaffCard({
    name,
    indicator = "staff",
    inverted,
    query,
    mergedQuery,
    unitMonthDifference,
    timeUnit,
    selectSubunitHandler,
    ...props
}) {
    const { t } = useTranslation("labels");

    const lastTwoMonths = () => {
        if (mergedQuery?.data) {
            const sorted = _.sortBy(Object.values(mergedQuery?.data), ["year", timeUnit]);
            const currMonth = sorted.at(-1).events;
            const lastMonth = sorted.at(-2).events;
            if (lastMonth && currMonth) {
                let sum1 = 0;
                let sum2 = 0;
                for (const [key, value] of Object.entries(currMonth)) {
                    if (!(key == 0 || key == 27)) {
                        sum1 += value;
                    }
                }
                for (const [key, value] of Object.entries(lastMonth)) {
                    if (!(key == 0 || key == 27)) {
                        sum2 += value;
                    }
                }
                const diff = sum1 - sum2;
                const trend = diff > sum2 * 0.02 ? 1 : diff < sum2 * 0.02 && diff < 0 ? -1 : 0;
                return [sum1, sum2, trend];
            }
        }
        return [];
    };
    const [currMonth, lastMonth, trend] = lastTwoMonths();

    return (
        <Card>
            {mergedQuery?.isFetched ? (
                <Fader>
                    <Row className='g-0'>
                        <Col xs={12} sm={4}>
                            <Row>
                                <Col>
                                    <div className='h2'>{t("staff")}</div>
                                </Col>
                            </Row>
                            <Row>
                                <Col>{t("absence")}</Col>
                            </Row>
                        </Col>
                        <Col xs={12} sm={8}>
                            <Row className='d-flex justify-content-end pb-2'>
                                <Col className='d-flex align-items-end'>
                                    <MonthValue
                                        indicator={indicator}
                                        label={t("last_" + timeUnit)}
                                        entry={lastMonth}
                                    />
                                </Col>
                                <Col className='d-flex align-items-end'>
                                    <MonthValue
                                        indicator={indicator}
                                        label={t("last_" + timeUnit)}
                                        entry={currMonth}
                                    />
                                </Col>
                                <Col>
                                    <TrendBadge
                                        inverted={true}
                                        trend={trend}
                                        value={currMonth - lastMonth}
                                        indicator={"staff"}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className='mt-2'>
                        <Col>
                            {/* <TrendChart
								data={mergedQuery}
								indicator={indicator}
								timeUnit={timeUnit}
							/> */}
                            <StaffChart data={mergedQuery} timeUnit={timeUnit} />
                        </Col>
                    </Row>
                </Fader>
            ) : (
                <Row>
                    <div
                        className='d-flex justify-content-center align-items-center flex-column'
                        style={{ height: "200px", width: "100%" }}
                    >
                        <PulseLoader color='#FFFFFF' size={5} margin={10} />
                        <div>{name}</div>
                    </div>
                </Row>
            )}
        </Card>
    );
}

export default StaffCard;
