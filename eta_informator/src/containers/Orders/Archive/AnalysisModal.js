import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Button, CloseButton, Modal } from "react-bootstrap";
import DatePicker from "../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { useTranslation } from "react-i18next";
import writeXlsxFile from "write-excel-file";

const AnalysisModal = ({ show, setShow, ordersQuery, setToast }) => {
    const [startDate, setStartDate] = useState(dayjs().toDate());
    const [endDate, setEndDate] = useState(dayjs().toDate());
    const { t, i18n } = useTranslation(["shopfloor", "labels", "manual_input"]);

    const schema = useMemo(
        () => [
            {
                column: t("order"),
                type: String,
                value: (row) => row.id,
                width: 15,
            },
            {
                column: t("purpose"),
                type: String,
                value: (row) => row.purpose,
                width: 30,
            },
            {
                column: t("customer"),
                type: String,
                value: (row) => row.customer,
                width: 15,
            },
            {
                column: t("startDate"),
                type: Date,
                format: "YYYY-MM-DD",
                value: (entry) => dayjs(entry.startDate).toDate(),
            },
            {
                column: t("endDate"),
                type: Date,
                format: "YYYY-MM-DD",
                value: (entry) => dayjs(entry.endDate).toDate(),
            },
            {
                column: t("deadline"),
                type: Date,
                format: "YYYY-MM-DD",
                value: (entry) => dayjs(entry.deadline).toDate(),
            },
            {
                column: t("date_difference"),
                type: Number,
                value: (entry) => entry.difference,
                width: 15,
            },
            {
                column: t("planned_hours"),
                type: Number,
                value: (entry) => entry.plannedHours,
                width: 15,
            },
            {
                column: t("finished_hours"),
                type: Number,
                value: (entry) => entry.realizedHours,
                width: 15,
            },
        ],
        [t],
    );

    const analyzeData = async () => {
        const filtered = ordersQuery.data.filter((order) => {
            const deadline = dayjs(order.potrjenRok, "YYYYMMDD");
            return (
                deadline.isSameOrAfter(dayjs(startDate)) && deadline.isSameOrBefore(dayjs(endDate))
            );
        });
        if (filtered.length == 0) {
            setShow(false);
            setToast({ text: t("labels:no_data"), bg: "warning" });
            return;
        }

        const analyzedData = filtered.reduce((acc, order) => {
            const hours = order.pozicije?.reduce(
                (acc, pos) => {
                    const tlHours = pos.tehnoloskiListi?.reduce(
                        (tlAcc, tl) => {
                            const actHours = tl.aktivnosti
                                ?.filter((act) => act.naziv != "")
                                .reduce(
                                    (actAcc, act) => {
                                        actAcc.planned += +act.planUr || 0;
                                        actAcc.realized += +act.realUr || 0;
                                        return actAcc;
                                    },
                                    {
                                        planned: 0,
                                        realized: 0,
                                    },
                                );
                            tlAcc.planned += actHours.planned;
                            tlAcc.realized += actHours.realized;
                            return tlAcc;
                        },
                        { planned: 0, realized: 0 },
                    );
                    acc.planned += tlHours.planned;
                    acc.realized += tlHours.realized;
                    return acc;
                },
                {
                    planned: 0,
                    realized: 0,
                },
            );
            const orderStartDate = dayjs(order.datumZacetek, "YYYYMMDD");
            const orderEndDate = dayjs(order.datumKonec, "YYYYMMDD");
            const orderDeadline = dayjs(order.potrjenRok, "YYYYMMDD");
            const orderWithDifference = {
                id: order.zaporednaSt,
                customer: order.narocnik,
                purpose: order.namen,
                startDate: orderStartDate,
                endDate: orderEndDate,
                deadline: orderDeadline,
                difference: orderEndDate.diff(orderDeadline, "day"),
                plannedHours: hours.planned,
                realizedHours: hours.realized,
            };

            acc.push(orderWithDifference);
            return acc;
        }, []);

        await writeXlsxFile(analyzedData, {
            schema,
            fileName: "order_analysis.xlsx",
        });
        setShow(false);
        setToast({ text: t("labels:data_download_success"), bg: "default" });
    };

    return (
        <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header className='d-flex justify-between'>
                <div>Analysis</div>
                <CloseButton onClick={() => setShow(false)} />
            </Modal.Header>
            <Modal.Body>
                <div className='mb-2'>
                    Prosimo, izberite začetni in končni datum za filtriranje rezultatov glede na
                    polje 'potrjen rok'.
                </div>
                <div className='d-flex justify-content-start gap-2'>
                    <div>
                        <DatePicker
                            selected={startDate}
                            onSelect={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            locale={i18n.language}
                            dateFormat='PP'
                        />
                        <label>{t("manual_input:start_date")}</label>
                    </div>
                    <div>
                        <DatePicker
                            selected={endDate}
                            onSelect={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            maxDate={dayjs().toDate()}
                            locale={i18n.language}
                            dateFormat='PP'
                        />
                        <label>{t("manual_input:end_date")}</label>
                    </div>
                </div>
                <Button
                    onClick={() => analyzeData(startDate, endDate, ordersQuery)}
                    className='float-end'
                >
                    Prenesi
                </Button>
            </Modal.Body>
        </Modal>
    );
};

export default AnalysisModal;
