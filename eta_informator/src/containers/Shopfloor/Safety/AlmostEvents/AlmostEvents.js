import React, { useEffect, useState } from "react";
import { Col, Row, Table } from "react-bootstrap";
import dayjs from "dayjs";
import "dayjs/locale/sl";
import { useTranslation } from "react-i18next";
import Time from "../../../../components/Charts/Time/Time";

function AlmostEventsTab({ selectedYear }) {
    const [almostEvents, setAlmostEvents] = useState([]);
    const { t } = useTranslation("shopfloor");

    useEffect(() => {
        const baseUrl = process.env.REACT_APP_OTD_API;

        const from = selectedYear.startOf("year").format("YYYY-MM-DD");
        const until = selectedYear.endOf("year").format("YYYY-MM-DD");

        fetch(`${baseUrl}/api/almostevents?from=${from}&until=${until}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch almost events");
                return res.json();
            })
            .then((data) => {
                setAlmostEvents(data);
            })
            .catch((err) => {
                console.error("🚨 Error fetching almost events:", err);
            });
    }, [selectedYear]);

    return (
        <>
            <Row>
                <Col>
                    <h3>{t("almost_events")}</h3>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Row>
                        <Col style={{ height: 400 }}>
                            <Time
                                timeUnit='month'
                                type='bar'
                                beginAtZero
                                showAllAccidentsUpToMonth={false}
                                enableLineClick={false}
                                datasets={{
                                    datasets: [
                                        {
                                            label: t("almost_events_count"),
                                            data: almostEvents
                                                .map((ev) => ({
                                                    x: dayjs(ev?.endTime).startOf("month").toDate(),
                                                    y: 1,
                                                }))
                                                .reduce((acc, curr) => {
                                                    const found = acc.find((a) =>
                                                        dayjs(a.x).isSame(curr.x, "month"),
                                                    );
                                                    if (found) {
                                                        found.y += 1;
                                                    } else {
                                                        acc.push({ ...curr });
                                                    }
                                                    return acc;
                                                }, []),
                                            backgroundColor: "#0f5959",
                                        },
                                        {
                                            label: t("almost_events_total"),
                                            type: "line",
                                            borderColor: "#00c853",
                                            backgroundColor: "#00c853",
                                            data: (() => {
                                                const byMonth = {};
                                                let total = 0;
                                                almostEvents.forEach((ev) => {
                                                    const key = dayjs(ev.endTime)
                                                        .startOf("month")
                                                        .toISOString();
                                                    byMonth[key] = (byMonth[key] || 0) + 1;
                                                });
                                                return Object.entries(byMonth)
                                                    .sort(([a], [b]) => new Date(a) - new Date(b))
                                                    .map(([x, y]) => {
                                                        total += y;
                                                        return { x: new Date(x), y: total };
                                                    });
                                            })(),
                                            fill: false,
                                        },
                                    ],
                                }}
                            />
                        </Col>
                    </Row>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th style={{ width: "10%" }}>{t("date")}</th>
                                <th style={{ width: "30%" }}>{t("description")}</th>
                                <th style={{ width: "15%" }}>{t("location")}</th>
                                <th style={{ width: "15%" }}>{t("reporter")}</th>
                                <th style={{ width: "10%" }}>{t("reported_date")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...almostEvents]
                                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                                .map((event, index) => (
                                    <tr key={index}>
                                        <td>{event?.eventDate}</td>
                                        <td>{event?.description}</td>
                                        <td>{event?.location}</td>
                                        <td>{event?.reporter}</td>
                                        <td>
                                            {dayjs(event.startTime).format(
                                                "dddd, D. MMMM YYYY H:mm",
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </>
    );
}

export default AlmostEventsTab;
