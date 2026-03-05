import { Row, ToggleButton } from "react-bootstrap";
import MachineDistributionCard from "./Cards/MachineDistributionCard";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import client from "../../../feathers/feathers";
import OperationCard from "./Cards/OperationCard";
import EmployeesCard from "./Cards/EmployeesCard";
import { useState, useMemo, useEffect, useRef } from "react";
import { PulseLoader } from "react-spinners";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getStaff } from "../../../data/API/Informator/InformatorAPI";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import ToggleGroup from "../../../components/ToggleGroup/ToggleGroup";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";

const ShiftButton = styled(ToggleButton)`
    background-color: white !important;
    border: unset;
    border-bottom: 1px solid white;
    border-radius: 0px;
    padding: 0px 4px;
    margin: 0em 0.5em;
    color: black !important;
    transition: border-bottom 0.25s ease;
    &:hover {
        background-color: white;
        color: gray;
        border-bottom: 1px solid var(--bs-primary) !important;
        transition: border-bottom 1s ease;
    }

    &.active {
        background-color: white !important;
        color: black !important;
        border-bottom: 1px solid var(--bs-primary);
        box-shadow: unset !important;
    }

    &.focus {
        box-shadow: unset !important;
        color: black !important;
        border-bottom: 1px solid var(--bs-primary) !important;
    }
`;

const NoticeBox = styled.div`
    width: 100%;
`;

const NoticeTextArea = styled(Form.Control)`
    min-height: 40px;
    border-radius: 6px;
    padding: 6px 10px;
    resize: vertical;
    line-height: 1.4;
    flex: 1 1 auto; /* take remaining space */
    min-width: 0; /* prevent overflow */
`;

function Distribution({ selectedUnit, selectedDate, setSelectedDate, ...props }) {
    const [shift, setShift] = useState(1);
    const [notice, setNotice] = useState("");
    const baseUrl = process.env.REACT_APP_OTD_API;
    const noteDate = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : "";

    useEffect(() => {
        const now = dayjs().add(15, "minute");
        //const now = dayjs()
        setSelectedDate(now.toDate());
        const six = dayjs().hour(6).minute(0).second(0);
        const two = dayjs().hour(14).minute(0).second(0);
        const ten = dayjs().hour(22).minute(0).second(0);
        if (now.isSameOrAfter(six) && now.isBefore(two)) {
            setShift(1);
        } else if (now.isSameOrAfter(two) && now.isBefore(ten)) {
            setShift(2);
        } else {
            setShift(3);
        }
    }, []);

    const { t } = useTranslation("shopfloor");
    const shiftToggleButtons = useMemo(() => {
        return [
            {
                name: t("shift_1"),
                value: 1,
            },
            {
                name: t("shift_2"),
                value: 2,
            },
            {
                name: t("shift_3"),
                value: 3,
            },
        ];
    }, [t]);

    const distributionQ = useQuery(
        ["distribution", dayjs(selectedDate).format("DD-MM-YYYY"), selectedUnit.subunitId],
        () => {
            return client
                .service("worker-distribution")
                .find({
                    query: {
                        $limit: 1,
                        $sort: { createdAt: -1 },
                        date: dayjs(selectedDate).toDate(),
                        subunitId: selectedUnit.subunitId,
                    },
                })
                .then((response) => {
                    return response.data;
                });
        },
        {
            onSuccess: (data) => {},
        },
    );

    const employees = useQuery(
        ["employees", dayjs(selectedDate).format("YYYY-MM-DD"), selectedUnit?.keyword],
        () => getStaff(selectedUnit.subunitId, dayjs(selectedDate), dayjs(selectedDate)),
    );

    const saveNote = async (value) => {
        const deptId = selectedUnit?.subunitId;
        if (!deptId) return;
        const res = await fetch(`${baseUrl}/api/DepartmentNotes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ departmentId: deptId, note: value }),
        });
        if (!res.ok) throw new Error("Save failed");
    };

    // keep your queueSave logic, but call saveNote:
    // load note when department changes
    useEffect(() => {
        const deptId = selectedUnit?.subunitId;
        if (!deptId || !selectedDate) return;

        (async () => {
            try {
                const d = dayjs(selectedDate).format("YYYY-MM-DD");
                const res = await fetch(
                    `${baseUrl}/api/DepartmentNotes/${deptId}?date=${encodeURIComponent(d)}`,
                );
                if (res.ok) {
                    const data = await res.json();
                    setNotice(data?.note ?? "");
                } else {
                    setNotice("");
                }
            } catch {
                setNotice("");
            }
        })();
    }, [selectedUnit?.subunitId, selectedDate, baseUrl]);

    if (distributionQ.isLoading || employees.isLoading)
        return (
            <div className='d-flex justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={5} margin={10} />
            </div>
        );

    const [data] = distributionQ?.data;
    if (!data?.distribution)
        return (
            <div
                className='h-100 w-100 d-flex justify-content-center align-items-center'
                style={{ height: "600px" }}
            >
                {t("no_distribution")}
            </div>
        );
    const dayEntry = JSON.parse(data.distribution);

    const dayDistribution = dayEntry
        .sort((a, b) => Intl.Collator("sl").compare(a.name, b.name))
        .map((machine) => {
            const shiftData = machine.dist[shift];
            let numEmployees = 0;
            shiftData.forEach((operation) => {
                const operationEmployees = employees.data.filter((employee) =>
                    operation.employees?.includes(employee.employeeId),
                );
                numEmployees += operationEmployees.length;
            });
            const name = machine.name.split("!").pop();
            return numEmployees > 0 ? (
                <MachineDistributionCard name={name} key={machine.id}>
                    {shiftData
                        .filter((op) =>
                            employees.data.some((emp) => op.employees?.includes(emp.employeeId)),
                        )
                        .sort((a, b) => Intl.Collator("sl").compare(a.operation, b.operation))
                        .map((operation) => {
                            //* Get all the employees from the unit employees for the operation
                            const operationEmployees = employees.data.filter((employee) => {
                                return operation.employees?.includes(employee.employeeId);
                            });
                            return (
                                <OperationCard
                                    key={machine.id + operation.operation}
                                    name={
                                        operation.operation.includes("!")
                                            ? operation.operation.split("!")[1]
                                            : operation.operation
                                    }
                                    empty={operationEmployees.length > 0}
                                >
                                    <EmployeesCard employees={operationEmployees} />
                                </OperationCard>
                            );
                        })}
                </MachineDistributionCard>
            ) : null;
        });

    return (
        <>
            <Row className='mb-3'>
                <NoticeBox>
                    <InputGroup>
                        <NoticeTextArea
                            as='textarea'
                            value={notice}
                            readOnly
                            disabled
                            placeholder='Opombe in obvestila delavcem'
                            style={{ background: "#f8f9fa", cursor: "not-allowed" }}
                        />
                    </InputGroup>
                </NoticeBox>
            </Row>
            <Row className='d-flex justify-content-center align-items-center'>
                <ToggleGroup
                    buttons={shiftToggleButtons}
                    selectedButton={shift}
                    onSelected={setShift}
                    title={"shift_distribution"}
                    customButton={ShiftButton}
                />
            </Row>
            <ResponsiveMasonry
                columnsCountBreakPoints={{
                    350: 1,
                    900: 2,
                    1200: 3,
                    1600: 4,
                    1800: 6,
                }}
            >
                <Masonry gutter='1rem' className='p-2'>
                    {dayDistribution.filter((item) => item)}
                </Masonry>
            </ResponsiveMasonry>
        </>
    );
}

export default Distribution;
