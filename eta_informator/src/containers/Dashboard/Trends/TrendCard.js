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
    height: 100%;
`;

const Fader = styled.div`
    * {
        animation: ${fade} 0.1s linear 1;
    }
`;

function TrendCard({
    name,
    indicator,
    inverted,
    query,
    mergedQuery,
    unitMonthDifference,
    timeUnit,
    selectSubunitHandler,
    ...props
}) {
    const { t } = useTranslation("labels");
    const queryClient = useQueryClient();
    const units = queryClient.getQueryData("unitsLabels");

    const monthlyTrend = (lastMonthValue, currentMonthValue) => {
        const diff = currentMonthValue - lastMonthValue;
        if (diff > lastMonthValue * 0.02) return 1;
        if (diff < lastMonthValue * 0.02 && diff < 0) return -1;
        return 0;
    };

    //* This is calculation for the badge, meaning for all units combined
    const badgeValue =
        indicator == "bad"
            ? _.round(
                  mergedQuery?.data?.at(-1)?.["bad"] / mergedQuery?.data?.at(-1)?.["total"] -
                      mergedQuery?.data?.at(-2)?.["bad"] / mergedQuery?.data?.at(-2)?.["total"],
                  3,
              )
            : mergedQuery?.data?.at(-1)?.[indicator] - mergedQuery?.data?.at(-2)?.[indicator];

    const trend =
        indicator == "bad"
            ? monthlyTrend(
                  _.round(
                      mergedQuery?.data?.at(-2)?.["bad"] / mergedQuery?.data?.at(-2)?.["total"],
                      3,
                  ),
                  _.round(
                      mergedQuery?.data?.at(-1)?.["bad"] / mergedQuery?.data?.at(-1)?.["total"],
                      3,
                  ),
              )
            : monthlyTrend(
                  mergedQuery?.data?.at(-2)?.[indicator],
                  mergedQuery?.data?.at(-1)?.[indicator],
              );

    //* Where as this is calculation per unit
    const perSubunit = Object.entries(unitMonthDifference?.data || [])?.map(([key, value]) => {
        let subunit;
        _.forEach(units, (unit) => {
            const match = _.find(unit.options, (u) => u.ted == key);
            if (!_.isUndefined(match)) subunit = match;
        });
        return {
            name: subunit.label,
            ted: key,
            value: indicator == "bad" ? value["scrap"] : value[indicator],
            property: "",
        };
    });

    return (
        <Card>
            {mergedQuery.isFetched ? (
                <Fader>
                    <Row className='g-0'>
                        <Col xs={12} sm={8}>
                            <Row>
                                <Col>
                                    <div className='h2'>{name}</div>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    {indicator == "total" ? t("number_parts") : t("percentage")}
                                </Col>
                            </Row>
                            <Row className='justify-content-start pb-2'>
                                <Col className='d-flex align-items-end'>
                                    <MonthValue
                                        indicator={indicator}
                                        label={t("last_" + timeUnit)}
                                        entry={mergedQuery?.data?.at(-2)}
                                    />
                                </Col>
                                <Col className='d-flex align-items-end'>
                                    <MonthValue
                                        indicator={indicator}
                                        label={t("current_" + timeUnit)}
                                        entry={mergedQuery?.data?.at(-1)}
                                    />
                                </Col>
                                <Col>
                                    <TrendBadge
                                        inverted={inverted}
                                        trend={trend}
                                        value={badgeValue}
                                        indicator={indicator}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={12} sm={4}>
                            <div>{t("per_subunit")}</div>
                            {perSubunit?.map((entry) => (
                                <UnitDetail
                                    unit={entry.name}
                                    value={entry.value}
                                    property={entry.property}
                                    inverted={inverted}
                                    onClick={() => selectSubunitHandler(entry.ted, indicator)}
                                />
                            ))}
                        </Col>
                    </Row>
                    <Row className='mt-2'>
                        <Col>
                            <TrendChart
                                data={mergedQuery}
                                indicator={indicator}
                                timeUnit={timeUnit}
                            />
                        </Col>
                    </Row>
                </Fader>
            ) : (
                <Row>
                    <div
                        className='d-flex justify-content-center align-items-center flex-column'
                        style={{
                            height: "100%",
                            minHeight: "250px",
                            width: "100%",
                        }}
                    >
                        <div>
                            <PulseLoader color='#FFFFFF' size={5} margin={10} />
                            <div>{name}</div>
                        </div>
                    </div>
                </Row>
            )}
        </Card>
    );
}

export default TrendCard;
