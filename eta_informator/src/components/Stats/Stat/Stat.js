import { Card, Col, Row, Container } from "react-bootstrap";
import styles from "./Stat.module.scss";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import styled from "styled-components";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import { ClipLoader } from "react-spinners";

const StyledDataRow = styled(Row)`
    justify-content: space-around;
`;

const LoadingBlur = styled(Container)`
    height: 100%;
    width: 100%;
    filter: blur(2px);
`;

const StyledColoredCard = styled.div`
    padding: 18px 28px;
    font-family: "Nunito", sans-serif;
    box-shadow: 0 0 5px rgba(#000, 0.25);
    display: flex;
    flex-direction: column;
    min-width: 200px;
    min-height: 180px;
    height: 100%;
    justify-content: center;
    color: white;
    border-radius: 5px;
    background: ${(props) => {
        switch (props.color) {
            case "red":
                return "rgb(181, 1, 89)";
            case "green":
                return "rgb(1, 181, 52)";
            case "orange":
                return "rgb(255, 124, 0)";
            default:
                return "var(--bs-cyan)";
        }
    }};
    background: ${(props) => {
        switch (props.color) {
            case "red":
                return `linear-gradient(29deg, rgba(181, 1, 89, 1) 0%, rgba(251, 0, 34, 1) 100%)`;
            case "green":
                return "linear-gradient(15deg, rgb(12, 157, 53) 0%, rgb(4, 213, 56) 100%)";
            case "orange":
                return "linear-gradient(45deg, rgba(255, 124, 0, 1) 0%, rgba(255, 206, 0, 1) 100%)";
            default:
                return "var(--bs-cyan)";
        }
    }};
    filter: ${(props) => (props.isLoading ? "blur(2px)" : null)};
`;

function Stat({ data = [], ...props }) {
    const { t } = useTranslation("shopfloor");

    const [sparkline, setSparkline] = useState({
        series: [
            {
                name: t(props.title),
                data: data,
            },
        ],

        options: {
            annotations: {
                xaxis: [
                    {
                        x: props.selectedDate.hour(2).valueOf(),
                        borderColor: "#2c3e50",
                        width: 10,
                        strokeDashArray: 10,
                    },
                ],
                /* points:[{
                    x: props.selectedDate.hour(2).valueOf(),
                    y: 5092,
                    marker: {
                        size: 8,
                        fillColor: 'green',
                        strokeColor: 'blue',
                        radius: 2,
                      }
                }] */
            },
            chart: {
                animations: {
                    enabled: false,
                },
                background: "transparent",
                sparkline: {
                    enabled: true,
                },
            },
            stroke: {
                curve: "straight",
            },

            gradient: {
                shadeIntensity: 0,
            },
            xaxis: {
                type: "datetime",
            },
            yaxis: {
                min: (min) => {
                    return min - min - 1;
                },
                max: (max) => {
                    return max + max / 5 + 10;
                },
            },
            colors: ["#DCE6EC"],
            theme: { mode: "dark" },
            tooltip: {
                x: {
                    format: "dd. MM",
                },
            },
        },
    });

    useEffect(() => {
        setSparkline({
            series: [
                {
                    name: t(props.title),
                    data: data,
                },
            ],

            options: {
                grid: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 5,
                    },
                },
                annotations: {
                    xaxis: [
                        {
                            x: props.selectedDate.hour(2).valueOf(),
                            borderColor: "#2c3e50",
                            borderWidth: 2,
                            offsetY: 5,
                            width: 10,
                            strokeDashArray: 10,
                        },
                    ],
                    points: [
                        {
                            x: props.selectedDate.hour(2).valueOf(),
                            y: data
                                .filter((day) => {
                                    return (
                                        day.x == props.selectedDate.format("YYYY-MM-DD") + " GMT"
                                    );
                                })
                                .pop()?.y,
                            marker: {
                                size: 4,
                                fillColor: "darkblue",
                                strokeColor: "darkblue",
                                radius: 2,
                            },
                        },
                    ],
                },
                chart: {
                    animations: {
                        enabled: false,
                    },
                    background: "transparent",
                    sparkline: {
                        enabled: true,
                    },
                },
                stroke: {
                    curve: "straight",
                },
                markers: {
                    size: 0,
                },
                gradient: {
                    shadeIntensity: 0,
                },
                xaxis: {
                    type: "datetime",
                },
                yaxis: {
                    labels: {
                        show: false,
                    },
                },
                colors: ["#DCE6EC"],
                theme: { mode: "dark" },
            },
        });
    }, [props.selectedDate, data, props.title, t]);

    const sparklineStyle = {
        strokeWidth: "2px",
    };

    const statColor = clsx(styles.Stat, {
        [styles.StatRed]: props.color === "red",
        [styles.StatGreen]: props.color === "green",
        [styles.StatOrange]: props.color === "orange",
    });
    return (
        <Col xs={12} md={6} lg={4} xl={4}>
            <StyledColoredCard
                isLoading={props.isLoading}
                color={props.color}
                onClick={props.onClick}
            >
                <Row>
                    <Col className={"ps-1 pe-1"}>
                        <div className={styles.StatTitle}>{t(props.title)}</div>
                    </Col>
                </Row>
                <StyledDataRow>
                    <Col lg={12} xl={7} style={{ padding: "unset" }} className={[styles.StatGraph]}>
                        {props.isLoading ? (
                            <div className='w-100 h-100 d-flex justify-content-center align-items-center text-white'>
                                <ClipLoader color='white' size='75px' />
                            </div>
                        ) : (
                            <Chart
                                options={sparkline.options}
                                series={sparkline.series}
                                type='area'
                                height={130}
                            />
                        )}
                    </Col>
                    <Col lg={12} xl={4} style={{ padding: "unset" }} className={styles.StatContent}>
                        <div className={getNormClass(props.norm)}>
                            <h5 className={styles.StatNorm}>
                                {props.norm && (
                                    <div>
                                        {getNormIcon(props.norm)}
                                        {props.norm}
                                    </div>
                                )}
                            </h5>
                            {props.norm && (
                                <div className={styles.StatNormText}>{t("norm_achieving")}</div>
                            )}
                        </div>
                        <div className={styles.StatNumber}>{props.value}</div>
                        <div className={styles.StatChange}>
                            <div className={styles.StatPercentage}>{props.compared}</div>
                            <div className={styles.StatTimeframe}>{props.text}</div>
                        </div>
                    </Col>
                </StyledDataRow>
            </StyledColoredCard>
        </Col>
    );
}

export default Stat;

function getNormClass(norm) {
    const normValue = parseFloat(norm);
    if (isNaN(normValue)) return null;

    if (normValue >= 95) return styles.normValueGreen;
    if (normValue >= 90) return styles.normValueOrange;
    return styles.normValueRed;
}

function getNormIcon(norm) {
    const normValue = parseFloat(norm);
    if (isNaN(normValue)) return null;

    if (normValue >= 95) return <span className={styles.normIcon}>✔</span>;
    if (normValue < 90) return <span className={styles.normIcon}>✖</span>;
    return null;
}
