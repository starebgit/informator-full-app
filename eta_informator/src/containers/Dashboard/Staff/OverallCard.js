import styled from "styled-components";
import { Bar, Doughnut } from "react-chartjs-2";
import { useMemo } from "react";
import { ProgressBar, Table } from "react-bootstrap";
import { eventCategories, eventNames } from "../../../data/Formaters/Informator";
import { useTranslation } from "react-i18next";
import { eventNameColors } from "../../../theme/ChartColors";

const Card = styled.div`
    border-radius: 10px;
    box-shadow: var(--shadow-regular);
    display: flex;
    flex-direction: column;
    padding: 1rem;
    margin: 0.5rem;
    flex: 1 0 auto;
    min-width: 500px;
`;

const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
            position: "right",
            labels: {
                usePointStyle: true,
                pointStyle: "rect",
            },
        },
    },
};

function OverallCard({ unit, foremans, ...props }) {
    const { t } = useTranslation("labels");
    const reducedAbsence = useMemo(() => {
        return Object.values(foremans).reduce((acc, cur) => {
            for (const [idE, value] of Object.entries(cur)) {
                const id = eventCategories[idE] == undefined ? "other" : eventCategories[idE];
                //const id = idE
                if (acc[id] == undefined) acc[id] = value;
                else acc[id] = acc[id] + value;
            }
            return acc;
        }, {});
    }, [foremans]);

    const absences = useMemo(() => {
        const labels = [];
        const data = [];
        const colors = [];
        reducedAbsence &&
            Object.keys(reducedAbsence)
                .filter(
                    (entry) =>
                        !(
                            entry == "absences" ||
                            entry == "plan" ||
                            entry == "presences" ||
                            entry == "physical_attendance" ||
                            entry == "other"
                        ),
                )
                .forEach((entry) => {
                    labels.push(eventNames[entry]);
                    data.push(reducedAbsence[entry]);
                    colors.push(eventNameColors[entry]);
                });

        return {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: colors,
                    hoverOffset: 4,
                },
            ],
        };
    }, [reducedAbsence]);

    const detailAbsence = Object.keys(reducedAbsence)
        .sort()
        .filter(
            (entry) =>
                !(
                    entry == "absences" ||
                    entry == "plan" ||
                    entry == "physical_attendance" ||
                    entry == "other" ||
                    entry == "presences"
                ),
        )
        .map((key) => {
            const entry = reducedAbsence[key];
            const color = eventNameColors[key];
            return (
                <tr>
                    <td>
                        <div className='d-flex align-items-center' style={{ height: "20px" }}>
                            <div
                                style={{
                                    width: "15px",
                                    height: "15px",
                                    borderRadius: "5px",
                                    background: color,
                                }}
                            />
                        </div>
                    </td>
                    <td>{t(key)}</td>
                    <td>{entry}</td>
                </tr>
            );
        });
    return (
        <Card>
            <h6>{t("ETA")}</h6>
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    padding: "0.2rem 1rem",
                    justifyContent: "space-around",
                }}
            >
                <div
                    className='d-flex flex-column align-items-center justify-content-center'
                    style={{ width: "40%" }}
                >
                    <h1 className='fw-bold'>
                        {new Intl.NumberFormat("sl", {
                            style: "percent",
                        }).format(reducedAbsence?.["presences"] / reducedAbsence?.["plan"] || 0)}
                    </h1>
                    <div className='w-100'>
                        <ProgressBar>
                            <ProgressBar
                                variant='success'
                                striped
                                now={
                                    (reducedAbsence?.["presences"] / reducedAbsence?.["plan"]) *
                                        100 || 0
                                }
                                label={reducedAbsence["presences"]}
                            />
                            <ProgressBar
                                variant='danger'
                                now={
                                    (reducedAbsence?.["absences"] / reducedAbsence?.["plan"]) *
                                        100 || 0
                                }
                                label={reducedAbsence["absences"] || "0"}
                            />
                        </ProgressBar>
                    </div>
                    <h6 className='mt-1'>{`${t("plan")} ${reducedAbsence?.["plan"]}`}</h6>
                </div>

                <div
                    style={{
                        padding: "0rem 2rem",
                        fontSize: "14px",
                        width: "33%",
                    }}
                >
                    <Table size='sm'>
                        <thead>
                            <tr>
                                <th></th>
                                <th>{t("event")}</th>
                                <th>{t("number")}</th>
                            </tr>
                        </thead>
                        <tbody>{detailAbsence}</tbody>
                    </Table>
                </div>
                <div style={{ width: "200px" }}>
                    <Doughnut options={opts} data={absences} />
                </div>
            </div>
        </Card>
    );
}

export default OverallCard;
