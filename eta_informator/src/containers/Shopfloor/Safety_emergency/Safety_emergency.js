import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Tab, Nav } from "react-bootstrap";
import Time from "../../../components/Charts/Time/Time";
import { useAccidentsByYear, useAllAccidents } from "../../../data/ReactQuery";
import dayjs from "dayjs";
import AccidentsTable from "./AccidentsTable/AccidentsTable";
import { useTranslation } from "react-i18next";
import { StyledContainer, StyledNav } from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import CategoryPane from "../Attachments/CategoryPane";
import client from "../../../feathers/feathers";
import { useQuery } from "react-query";
import ChartColors, { lightChartColors } from "../../../theme/ChartColors";
import SafetyBar from "../../../components/UI/Bar/SafetyBar";

function Safety({ selectedUnit, selectedYear, ...props }) {
    const [selectedAccidents, setSelectedAccidents] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const bottomScrollRef = useRef(null);

    const { data, status, isLoading, isError } = useAllAccidents();

    const attachments = useQuery(
        ["attachments", selectedUnit.subunitId, selectedYear.format("YYYY"), "safety"],
        () =>
            client
                .service("attachments")
                .find({
                    query: {
                        categoryId: 8,
                        subunitId: selectedUnit.subunitId,
                        startDate: { $lte: selectedYear.endOf("year") },
                        endDate: { $gte: selectedYear.startOf("year") },
                    },
                })
                .then((response) => {
                    const { data } = response;
                    return data;
                }),
    );

    const { t } = useTranslation("shopfloor");
    const chartDataArray = (data) => {
        if (!data) return [];
        // Initialize the chart.js monthly array

        const subunitAccidents = [];
        const companyAccidents = [];

        const firstMonthOfYear = dayjs(selectedYear).startOf("year");
        const lastMonthOfYear = dayjs(selectedYear).endOf("year");

        const selectedYearAccidents = data.filter((accident) => {
            return (
                dayjs(accident.accidentDate).isSameOrAfter(firstMonthOfYear) &&
                dayjs(accident.accidentDate).isSameOrBefore(lastMonthOfYear)
            );
        });

        const selectedYearSubunitAccidents = data.filter((accident) => {
            return (
                dayjs(accident.accidentDate).isSameOrAfter(firstMonthOfYear) &&
                dayjs(accident.accidentDate).isSameOrBefore(lastMonthOfYear) &&
                accident.subunitId === selectedUnit.subunitId
            );
        });

        let subunitAccidentsCount = 0;

        var accidentsCount = 0;

        for (let i = 0; i < 12; i++) {
            const subunitMonthAccidents = selectedYearSubunitAccidents.filter((accident) => {
                return dayjs(accident.accidentDate).month() === i;
            });

            const companyMonthAccidents = selectedYearAccidents.filter((accident) => {
                return dayjs(accident.accidentDate).month() === i;
            });

            subunitAccidents.push({
                x: dayjs(selectedYear).month(i).format("MM/YYYY"),
                y: isFutureMonth(i, selectedYear.year())
                    ? 0
                    : subunitMonthAccidents.length + subunitAccidentsCount,
                accidents: subunitMonthAccidents,
            });

            if (subunitMonthAccidents.length > 0) {
                subunitAccidentsCount += subunitMonthAccidents.length;
            }

            companyAccidents.push({
                x: dayjs(selectedYear).month(i).format("MM/YYYY"),
                y: isFutureMonth(i, selectedYear.year())
                    ? 0
                    : companyMonthAccidents.length + accidentsCount,
                accidents: companyMonthAccidents,
            });

            if (companyMonthAccidents.length > 0) {
                accidentsCount += companyMonthAccidents.length;
            }
        }
        return [
            {
                label: t("work_accident", { count: 3 }),
                data: subunitAccidents,
                backgroundColor: ChartColors["sum"],
            },
            {
                label: t("work_accident", { count: 3 }),
                data: companyAccidents,
                backgroundColor: ChartColors["norm"],
            },
            subunitAccidentsCount,
            accidentsCount,
        ];
    };

    useEffect(() => {
        setSelectedAccidents(null);
    }, [selectedYear, selectedUnit]);

    const onClickHandler = (doc) => {
        setSelectedAttachment(doc);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        if (selectedAttachment) {
            bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setTimeout(() => {
                bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 200);
        }
    };

    const selectedAccidentsTable = selectedAccidents ? (
        <AccidentsTable month={selectedAccidents.x} accidents={selectedAccidents.accidents} />
    ) : null;

    const [
        subunitAccidentsDataset,
        companyAccidentsDataset,
        subunitAccidentsCount = 0,
        accidentsCount = 0,
    ] = chartDataArray(data);

    return (
        <React.Fragment>
            <Tab.Container id='safety-tabs' defaultActiveKey='emergency'>
                <StyledContainer>
                    <StyledNav variant='tabs'>
                        <Nav.Item>
                            <Nav.Link eventKey='accidents'>
                                {t("work_accident", { count: 3 })}
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey='attachments'>{t("attachments")}</Nav.Link>
                        </Nav.Item>
                    </StyledNav>
                    <Tab.Content
                        style={{
                            boxShadow: "2px 2px 10px -2px #cccccc",
                            padding: "1rem",
                        }}
                    >
                        <Tab.Pane eventKey='accidents'>
                            <SafetyBar
                                companyAccidents={accidentsCount}
                                subunitAccidents={subunitAccidentsCount}
                                isLoading={isLoading}
                            />
                            <h4 className='mt-3'>{t("cumulative_charts")}</h4>
                            <Row className='mt-2'>
                                <Col xs={12} sm={6}>
                                    <h5>{t("in_company")}</h5>
                                    {isLoading ? null : isError ? (
                                        <div
                                            className='w-100 d-flex justify-content-center align-items-center'
                                            style={{ minHeight: "400px" }}
                                        >
                                            <h1>Error</h1>
                                        </div>
                                    ) : (
                                        <div style={{ minHeight: "400px" }}>
                                            <Time
                                                timeParse={"month"}
                                                setSelectedAccidents={setSelectedAccidents}
                                                datasets={{
                                                    datasets: [companyAccidentsDataset],
                                                }}
                                                type='bar'
                                                label={t("work_accident", {
                                                    count: 3,
                                                })}
                                                title={t("in_compnay")}
                                                timeUnit={"month"}
                                                step={1}
                                            />
                                        </div>
                                    )}
                                </Col>
                                <Col xs={12} sm={6}>
                                    <h5>{t("in_subunit")}</h5>
                                    {isLoading ? null : isError ? (
                                        <div
                                            className='w-100 d-flex justify-content-center align-items-center'
                                            style={{ minHeight: "400px" }}
                                        >
                                            <h1>Error</h1>
                                        </div>
                                    ) : (
                                        <div style={{ minHeight: "400px" }}>
                                            <Time
                                                timeParse={"month"}
                                                setSelectedAccidents={setSelectedAccidents}
                                                datasets={{
                                                    datasets: [subunitAccidentsDataset],
                                                }}
                                                type='bar'
                                                label={t("work_accident", {
                                                    count: 3,
                                                })}
                                                title=''
                                                timeUnit={"month"}
                                                step={1}
                                            />
                                        </div>
                                    )}
                                </Col>
                            </Row>
                            <Row>
                                <Col>{selectedAccidentsTable}</Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='attachments'>
                            <Row>
                                <Col>
                                    <CategoryPane
                                        attachments={attachments?.data?.filter((doc) => {
                                            if (selectedYear.isSame(dayjs(), "month")) {
                                                return (
                                                    dayjs(doc.startDate).isSameOrBefore(
                                                        dayjs(),
                                                        "day",
                                                    ) &&
                                                    dayjs(doc.endDate).isSameOrAfter(dayjs(), "day")
                                                );
                                            }
                                            return true;
                                        })}
                                        selectedAttachment={selectedAttachment}
                                        onClickHandler={onClickHandler}
                                    />
                                    <div ref={bottomScrollRef} />
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='emergency'>
                            <Row>
                                <Col>
                                    <CategoryPane
                                        attachments={attachments?.data?.filter((doc) => {
                                            if (selectedYear.isSame(dayjs(), "month")) {
                                                return (
                                                    dayjs(doc.startDate).isSameOrBefore(
                                                        dayjs(),
                                                        "day",
                                                    ) &&
                                                    dayjs(doc.endDate).isSameOrAfter(dayjs(), "day")
                                                );
                                            }
                                            return true;
                                        })}
                                        selectedAttachment={selectedAttachment}
                                        onClickHandler={onClickHandler}
                                    />
                                    <div ref={bottomScrollRef} />
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </React.Fragment>
    );
}

const isFutureMonth = (month, year) => {
    return dayjs().isBefore(dayjs(`${year}-${month + 1}-01`));
};

export default Safety;
