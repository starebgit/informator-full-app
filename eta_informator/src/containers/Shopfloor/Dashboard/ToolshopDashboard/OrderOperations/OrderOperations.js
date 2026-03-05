import dayjs from "dayjs";
import { Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import OperationTile from "./OperationTile";
import ReactSwitch from "react-switch";
import { useState } from "react";

const OrderOperations = ({ orders, status, timewindow, startDate, endDate }) => {
    const [includeLate, setIncludeLate] = useState(false);
    const { t } = useTranslation("shopfloor");
    const operations = {
        "020 Struženje univerzalno": 0,
        "021 Struženje CNC": 0,
        "040 Rezkanje univerzalno": 0,
        "041 Rezkanje CNC": 0,
        "060 Vrtanje koordinatno": 0,
        "070 Brušenje ploščinsko": 0,
        "080 Brušenje okroglo": 0,
        "101 Ročna obdelava": 0,
        "111 Kleparska dela": 0,
        "170 Termična obdelava": 0,
        "183 Erozija žična": 0,
        "190 Vrtanje radialno": 0,
        "010 Priprava materiala": 0, // ✅ NEW
        "061 Brušenje koordinatno": 0, // ✅ NEW
        "180 Erozija elektrodna": 0, // ✅ NEW
    };
    const activeAndAvailableHours = orders.data
        .filter((order) => {
            const checks = [];
            const deadlineDate = dayjs(order.potrjenRok, "YYYYMMDD");

            if (order.status == "Oddana") return false;

            switch (timewindow) {
                case "all_time":
                    if (!order.potrjenRok || !deadlineDate.isValid()) return false;
                    checks.push(true);
                    break;
                case "late":
                    checks.push(deadlineDate.isBefore(dayjs(), "day"));
                    break;
                case "current_week":
                    checks.push(
                        includeLate
                            ? deadlineDate.isBefore(dayjs(), "day") ||
                                  deadlineDate.isSame(dayjs(), "week")
                            : deadlineDate.isSame(dayjs(), "week"),
                    );
                    break;
                case "current_month":
                    checks.push(
                        includeLate
                            ? deadlineDate.isBefore(dayjs(), "day") ||
                                  deadlineDate.isSame(dayjs(), "month")
                            : deadlineDate.isSame(dayjs(), "month"),
                    );
                    break;
                case "custom_range":
                    checks.push(
                        includeLate
                            ? deadlineDate.isBefore(dayjs(), "day") ||
                                  (deadlineDate.isSameOrAfter(startDate, "day") &&
                                      deadlineDate.isSameOrBefore(endDate, "day"))
                            : deadlineDate.isSameOrAfter(startDate, "day") &&
                                  deadlineDate.isSameOrBefore(endDate, "day"),
                    );
                    break;
                default:
                    checks.push(false);
            }

            if (status !== "all") checks.push(order.utez.toLowerCase() === status);
            return checks.every(Boolean);
        })
        .reduce(
            (acc, order) => {
                order.pozicije.forEach((position) => {
                    position.tehnoloskiListi.forEach((tl) => {
                        for (let i = 0; i < tl.aktivnosti.length; i++) {
                            const current = tl.aktivnosti[i];
                            const prev = tl.aktivnosti[i - 1];
                            const naziv = current.naziv;

                            if (!naziv || !acc.hasOwnProperty(naziv)) continue;

                            const status = current.status;

                            if (status === "V izvajanju") {
                                const plan = +current.planUr || 0;
                                const real = +current.realUr || 0;
                                const remaining = plan - real;
                                if (remaining > 0) {
                                    acc[naziv] += remaining;
                                }
                            }

                            if (
                                status === "Planirana" &&
                                ((i === 0 && current.naziv !== "900 Ure delavec") ||
                                    (prev && prev.status === "Zaključena"))
                            ) {
                                acc[naziv] += +current.planUr || 0;
                            }
                        }
                    });
                });
                return acc;
            },
            { ...operations },
        );

    const hoursPerOperation = orders.data
        .filter((order) => {
            const checks = [];
            const deadlineDate = dayjs(order.potrjenRok, "YYYYMMDD");

            if (order.status == "Oddana") return false;
            switch (timewindow) {
                case "all_time":
                    if (!order.potrjenRok || !deadlineDate.isValid()) return false;
                    checks.push(true);
                    break;
                case "late":
                    checks.push(deadlineDate.isBefore(dayjs(), "day"));
                    break;
                case "current_week": {
                    if (includeLate)
                        checks.push(
                            deadlineDate.isBefore(dayjs(), "day") ||
                                deadlineDate.isSame(dayjs(), "week"),
                        );
                    else checks.push(deadlineDate.isSame(dayjs(), "week"));
                    break;
                }

                case "current_month":
                    if (includeLate)
                        checks.push(
                            deadlineDate.isBefore(dayjs(), "day") ||
                                deadlineDate.isSame(dayjs(), "month"),
                        );
                    else checks.push(deadlineDate.isSame(dayjs(), "month"));
                    break;
                case "custom_range":
                    if (includeLate)
                        checks.push(
                            deadlineDate.isBefore(dayjs(), "day") ||
                                (deadlineDate.isSameOrAfter(startDate, "day") &&
                                    deadlineDate.isSameOrBefore(endDate, "day")),
                        );
                    else
                        checks.push(
                            deadlineDate.isSameOrAfter(startDate, "day") &&
                                deadlineDate.isSameOrBefore(endDate, "day"),
                        );
                    break;
                default:
                    checks.push(true);
            }
            if (status !== "all") checks.push(order.utez.toLowerCase() === status);
            return checks.every((check) => check);
        })
        .reduce((acc, order) => {
            order.pozicije.forEach((position) => {
                position.tehnoloskiListi.forEach((tl) => {
                    tl.aktivnosti
                        .filter(
                            (activity) =>
                                activity.status !== "Zaključena" &&
                                activity.status !== "Oddana" &&
                                activity.naziv !== "",
                        )
                        .forEach((activity) => {
                            const completedHours = +activity.realUr;
                            const plannedHours = +activity.planUr;
                            const leftHours =
                                plannedHours < completedHours ? 0 : plannedHours - completedHours;
                            if (acc[activity.naziv] != undefined) {
                                acc[activity.naziv] =
                                    acc[activity.naziv] > 0
                                        ? acc[activity.naziv] + leftHours
                                        : leftHours;
                            }
                        });
                });
            });
            return acc;
        }, operations);

    const tiles = Object.entries(hoursPerOperation).map(([operation, hours]) => {
        const title = operation.slice(operation.indexOf(" "));
        const activeAndAvailable = activeAndAvailableHours[operation] || 0;

        return (
            <OperationTile
                key={operation}
                operation={title}
                operationKey={operation}
                hours={hours}
                greenHours={activeAndAvailable}
                includeLate={includeLate}
            />
        );
    });

    return (
        <Card body className='tile'>
            <div className='d-flex justify-content-between'>
                <div>
                    <h3 className='mb-0 fw-bold'>{t("operations")}</h3>
                    <h6>
                        {timewindow != "custom_range"
                            ? t(timewindow)
                            : `${dayjs(startDate).format("LL")} - ${dayjs(endDate).format("LL")}`}
                    </h6>
                    <p>Število preostalih ur potrebnih za zaključek naročilnic.</p>
                </div>
                <div className='d-flex align-items-start'>
                    <label className='mb-0 me-2'>{t("include_all_late")}</label>
                    <ReactSwitch
                        className='mt-1'
                        onChange={(current) => setIncludeLate(current)}
                        checked={includeLate}
                        onColor='#86d3ff'
                        onHandleColor='#2693e6'
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                        activeBoxShadow='0px 0px 1px 10px rgba(0, 0, 0, 0.2)'
                        height={15}
                        width={40}
                    />
                </div>
            </div>
            <Row style={{ display: "inline" }}>
                <div className='d-flex flex-wrap justify-content-center' style={{ gap: "10px" }}>
                    {tiles}
                </div>
            </Row>
        </Card>
    );
};

export default OrderOperations;
