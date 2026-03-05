import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { Col, Row, ToggleButton, Button, Modal, Form, Fade, Toast } from "react-bootstrap";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { Fragment, useEffect, useState } from "react";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import { useMachines } from "../../../../data/ReactQuery";
import DatePicker from "../../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import dayjs from "dayjs";
import styled from "styled-components";
import MachineList from "./MachineList";
import MachineDistribution from "./MachineDistribution";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import client from "../../../../feathers/feathers";
import { useQuery, useMutation, useQueryClient } from "react-query";
import EmployeesList from "./EmployeesList";
import { useForm, Controller } from "react-hook-form";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { getStaff, getUnitStaff } from "../../../../data/API/Informator/InformatorAPI";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import UserTag from "./UserTag";
import { MdHelp } from "react-icons/md";
import { HiSwitchHorizontal } from "react-icons/hi";
import ToggleGroup from "../../../../components/ToggleGroup/ToggleGroup";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import InputGroup from "react-bootstrap/InputGroup";
import { Spinner } from "react-bootstrap";
import { useRef } from "react";

const NoticeBox = styled.div`
    width: 100%;
`;

const NoticeTextArea = styled(Form.Control)`
    min-height: 40px;
    border-radius: 6px;
    padding: 6px 10px;
    resize: vertical;
    line-height: 1.4;
    flex: 1 1 auto;
    min-width: 0;
`;

const ShiftButton = styled(ToggleButton)`
    background-color: white !important;
    border: unset;
    border-bottom: 1px solid white;
    border-radius: 0px;
    padding: 0px 4px;
    margin: auto 0.5em;
    color: black !important;
    transition: border-bottom 0.25s ease;
    height: min-content;
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

const StyledButton = styled(Button)`
    margin: 0px 2px;
    display: ${(props) => (props.editing ? "inline-block" : "none")};
`;

const Grid = styled.div`
    columns: 3 330px;
    column-gap: 0.1rem;
`;

function DistributionPane({ selectedUnit, setSelectedUnit, machineGroups, units, ...props }) {
    const [helpPdfTs, setHelpPdfTs] = useState(null);

    const { path } = useRouteMatch();
    const { t, i18n } = useTranslation(["manual_input", "shopfloor", "labels"]);
    const [date, setDate] = useState(dayjs().toDate());
    const [shift, setShift] = useState(1);
    const [dayEntry, setDayEntry] = useState(null);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(false);
    const [active, setActive] = useState(null);
    const [toast, setToast] = useState(null);

    /////////// implementing notices input field start
    const [notice, setNotice] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteToast, setNoteToast] = useState(false);
    const baseUrl = process.env.REACT_APP_OTD_API;
    const noteDate = dayjs(date).format("YYYY-MM-DD");

    const noteTimer = useRef(null);
    const noteSavingStartedAt = useRef(null);

    const saveDepartmentNote = async (value) => {
        const deptId = selectedUnit?.subunitId;
        if (!deptId) return;

        const res = await fetch(`${baseUrl}/api/DepartmentNotes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                departmentId: deptId,
                date: dayjs(date).format("YYYY-MM-DD"),
                note: value,
            }),
        });
        if (!res.ok) throw new Error("Save failed");
    };

    const queueSaveNote = (value) => {
        if (noteTimer.current) clearTimeout(noteTimer.current);

        if (!noteSaving) {
            setNoteSaving(true);
            noteSavingStartedAt.current = Date.now();
        }

        // send after 3s of inactivity
        noteTimer.current = setTimeout(async () => {
            try {
                await saveDepartmentNote(value);
            } catch {}

            // ensure spinner shows >= 2s
            const elapsed = noteSavingStartedAt.current
                ? Date.now() - noteSavingStartedAt.current
                : 0;
            const remaining = Math.max(0, 2000 - elapsed);

            setTimeout(() => {
                setNoteSaving(false);
                noteSavingStartedAt.current = null;
                setNoteToast(true);
            }, remaining);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (noteTimer.current) clearTimeout(noteTimer.current);
        };
    }, []);

    useEffect(() => {
        const deptId = selectedUnit?.subunitId;
        if (!deptId || !date) return;

        (async () => {
            try {
                const d = dayjs(date).format("YYYY-MM-DD");
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
    }, [selectedUnit?.subunitId, date, baseUrl]);

    /////////// implementing notices input field end

    //TODO - Add validation so that differnece between startDate and endDate isn't different from startDateDest and endDateDest
    const {
        register,
        reset,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ defaultValues: { s1: "1", s2: "2" } });
    const { register: registerOp, reset: resetOp, handleSubmit: handleSubmitOp } = useForm();
    const queryClient = useQueryClient();

    //* Fetch distribution for selected DAY and SUBUNIT
    const distributionQ = useQuery(
        ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
        () => {
            return client
                .service("worker-distribution")
                .find({
                    query: {
                        $limit: 1,
                        $sort: { createdAt: -1 },
                        date: dayjs(date).format("YYYY-MM-DD"),
                        subunitId: selectedUnit.subunitId,
                    },
                })
                .then((response) => {
                    return response.data;
                });
        },
        {
            onSuccess: (data) => {
                try {
                    const [entry] = data;
                    if (entry != undefined) {
                        setDayEntry({
                            id: entry.id,
                            distribution: JSON.parse(entry.distribution),
                        });
                    } else setDayEntry(null);
                    queryClient.invalidateQueries(["distribution template"]);
                } catch (e) {
                    console.log(e);
                }
            },
        },
    );

    //* Fetch employees for selected DAY and SUBUNIT
    const unitEmployees = useQuery(
        ["unitEmployees", dayjs(date).format("YYYY-MM-DD"), selectedUnit?.keyword],
        () => getUnitStaff(selectedUnit?.subunitId, dayjs(date)),
    );

    //* Fetch all employees for selected DAY
    const employees = useQuery(
        ["employees", dayjs(date).format("YYYY-MM-DD"), selectedUnit?.keyword],
        () => getStaff(selectedUnit.subunitId, dayjs(date), dayjs(date)),
    );

    //* Fetch ditribution template for selected SUBUNIT

    const distributionTemplateQ = useQuery(
        ["distribution template", selectedUnit.subunitId],
        () => {
            return client
                .service("worker-distribution-template")
                .find({
                    query: {
                        $limit: 1,
                        $sort: { createdAt: -1 },
                        subunitId: selectedUnit.subunitId,
                    },
                })
                .then((response) => {
                    return response.data;
                });
        },
        {
            enabled: distributionQ.isFetched,
        },
    );

    const machines = useMachines(selectedUnit?.ted);

    //* Watches
    const watchStartDate = watch("startDate", dayjs().startOf("week"));
    const watchEndDate = watch("endDate", dayjs().endOf("week"));
    const watchStartDateDest = watch("startDateDest", dayjs().startOf("week"));
    const watchEndDateDest = watch("endDateDest", dayjs().endOf("week"));

    const shiftToggleButtons = [
        { name: t("shift_1"), value: 1 },
        { name: t("shift_2"), value: 2 },
        { name: t("shift_3"), value: 3 },
    ];

    const copyHandler = async (input) => {
        const sourceEntries = await client
            .service("worker-distribution")
            .find({
                query: {
                    $sort: { createdAt: -1 },
                    date: { $gte: input.startDate, $lte: input.endDate },
                    subunitId: selectedUnit.subunitId,
                },
            })
            .then((res) => res.data);

        //* Iterate over the source dates and for each search for a matching entry.
        //* If found copy it, if not just skip it.
        let start = dayjs(input.startDate);
        let startDest = dayjs(input.startDateDest).add(3, "hour");
        const end = dayjs(input.endDate);
        while (start.isSameOrBefore(end, "day")) {
            const startString = start.format("YYYY-MM-DD");
            const match = _.find(sourceEntries, (entry) => entry.date === startString);
            if (match) {
                await client.service("worker-distribution").create({
                    date: startDest.toDate(),
                    distribution: match.distribution,
                    subunitId: match.subunitId,
                    userId: match.userId,
                });
            }

            start = start.add(1, "day");
            startDest = startDest.add(1, "day");
        }
        setOpen(0);
    };

    const switchHandler = async (input) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);
        clonedDayEntry.distribution.forEach((entry) => {
            const tempShift = [...entry.dist[+input.s1]];
            entry.dist[+input.s1] = [...entry.dist[+input.s2]];
            entry.dist[+input.s2] = [...tempShift];
        });

        clonedDayEntry.distribution = JSON.stringify([...clonedDayEntry.distribution]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
        setOpen(0);
    };

    const saveHandler = () => {
        const id = dayEntry.id;
        if (id == undefined) {
            client
                .service("worker-distribution")
                .create({
                    subunitId: selectedUnit.subunitId,
                    date: dayjs(date).format("YYYY-MM-DD"),
                    distribution: JSON.stringify(dayEntry.distribution),
                })
                .then((res) => {
                    setEdit(false);
                });
        } else {
            client
                .service("worker-distribution")
                .patch(id, {
                    distribution: JSON.stringify(dayEntry.distribution),
                })
                .then((res) => {
                    setEdit(false);
                });
        }
    };

    useEffect(() => {
        setDayEntry(null);
    }, [date]);

    const insertMachine = (machine) => {
        let clonedDayEntry = _.cloneDeep(dayEntry);
        if (clonedDayEntry === null || clonedDayEntry === undefined) {
            clonedDayEntry = {
                distribution: JSON.stringify([machine]),
            };
        } else {
            clonedDayEntry.distribution = JSON.stringify([
                ...clonedDayEntry?.distribution,
                machine,
            ]);
        }
        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
        setOpen(0);
    };

    const insertOperation = (operation, machineId) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        const [machineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == machineId,
        );
        [1, 2, 3].forEach((shift) => {
            machineEntry.dist[shift] = [...machineEntry.dist[shift], operation];
        });
        clonedDayEntry.distribution = JSON.stringify([
            ...clonedDayEntry.distribution,
            machineEntry,
        ]);
        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
        setOpen(0);
    };

    const renameOperation = (operationId, name, machineId) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        const [machineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == machineId,
        );

        const [operation] = _.remove(machineEntry.dist[shift], (entry) => entry.id == operationId);
        operation.operation = name;

        machineEntry.dist[shift] = [...machineEntry.dist[shift], operation];

        clonedDayEntry.distribution = JSON.stringify([
            ...clonedDayEntry.distribution,
            machineEntry,
        ]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
    };

    const removeOperation = (operationId, machineId) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        const [machineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == machineId,
        );

        _.remove(machineEntry.dist[shift], (entry) => entry.id == operationId);

        clonedDayEntry.distribution = JSON.stringify([
            ...clonedDayEntry.distribution,
            machineEntry,
        ]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
    };

    const renameMachine = (machineId, name) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        const [machineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == machineId,
        );
        machineEntry.name = name;

        clonedDayEntry.distribution = JSON.stringify([
            ...clonedDayEntry.distribution,
            machineEntry,
        ]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
    };

    const removeMachine = (machineId, name) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        const [machineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == machineId,
        );

        clonedDayEntry.distribution = JSON.stringify([...clonedDayEntry.distribution]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
    };

    const updateDistribution = (
        srcMachine,
        destMachine,
        employeeId,
        srcOperationId = null,
        destOperationId = null,
    ) => {
        const clonedDayEntry = _.cloneDeep(dayEntry);

        let srcMachineEntry = undefined;
        if (srcOperationId == destOperationId && srcMachine == destMachine) return;

        const [destMachineEntry] = _.remove(
            clonedDayEntry.distribution,
            (entry) => entry.id == destMachine,
        );

        if (srcOperationId != null) {
            [srcMachineEntry] = _.remove(
                clonedDayEntry.distribution,
                (entry) => entry.id == srcMachine,
            );

            if (srcMachine == destMachine) {
                srcMachineEntry = { ...destMachineEntry };
            }

            const [removeOperationEntry] = _.remove(
                srcMachineEntry.dist[shift],
                (entry) => entry.operation == srcOperationId,
            );
            if (removeOperationEntry) {
                removeOperationEntry.employees = removeOperationEntry.employees.filter(
                    (entry) => entry != employeeId,
                );
                srcMachineEntry.dist[shift] = [
                    ...srcMachineEntry.dist[shift],
                    removeOperationEntry,
                ];
            }
        }

        if (destOperationId != null) {
            const [operationEntry] = _.remove(
                destMachineEntry.dist[shift],
                (entry) => entry.operation == destOperationId,
            );

            operationEntry.employees = [...operationEntry.employees, employeeId];

            destMachineEntry.dist[shift] = [...destMachineEntry.dist[shift], operationEntry];
        }

        clonedDayEntry.distribution =
            srcMachineEntry && destMachineEntry && srcMachine != destMachine
                ? JSON.stringify([
                      ...clonedDayEntry.distribution,
                      srcMachineEntry,
                      destMachineEntry,
                  ])
                : destMachineEntry
                ? JSON.stringify([...clonedDayEntry.distribution, destMachineEntry])
                : JSON.stringify([...clonedDayEntry.distribution, srcMachineEntry]);

        queryClient.setQueryData(
            ["distribution", dayjs(date).format("DD-MM-YYYY"), selectedUnit.subunitId],
            [clonedDayEntry],
        );
    };

    function handleDragStart(event) {
        setActive(event.active.data.current);
    }

    function handleDragEnd(event) {
        setActive(null);
        const {
            active: {
                data: {
                    current: {
                        employeeId: srcEmployeeId,
                        operation: srcOperation,
                        machine: srcMachine,
                    },
                },
            },
            over,
        } = event;
        const destMachine = over?.data?.current?.machine;
        if (over?.id) {
            const destOperation = over.data.current.operation;
            updateDistribution(
                srcMachine,
                destMachine,
                srcEmployeeId,
                srcOperation != "list" ? srcOperation : null,
                destOperation,
            );
        } else {
            updateDistribution(
                srcMachine,
                destMachine,
                srcEmployeeId,
                srcOperation != "list" ? srcOperation : null,
                null,
            );
        }
    }

    const onSubmit = (data) => {
        const operationObject = {
            id: dayjs().unix(),
            operation: data.operation,
            employees: [],
        };
        insertOperation(operationObject, selectedMachine);
        resetOp();
    };

    const saveTemplate = () => {
        let template = _.cloneDeep(dayEntry);
        if (template == null) {
            template = {
                distribution: [],
            };
        }
        if (template?.distribution.length !== 0) {
            template.distribution.forEach((entry) => {
                if (entry.dist[2].length == 0) {
                    entry.dist[2] = [...entry.dist[1]];
                }
                if (entry.dist[3].length == 0) {
                    entry.dist[3] = [...entry.dist[1]];
                }
            });
        }
        client
            .service("worker-distribution-template")
            .create({
                subunitId: selectedUnit.subunitId,
                distribution: JSON.stringify(template.distribution),
            })
            .then(() => {
                queryClient.invalidateQueries(["distribution template"]);
                setToast(t("template_saved"));
            });
    };

    const setTemplate = () => {
        const [entry] = distributionTemplateQ.data;
        setDayEntry({ distribution: JSON.parse(entry?.distribution ?? "[]") });
        setToast(t("template_applied"));
    };

    const groupsPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8} className='align-content-bottom'>
                    <h3>{t("worker_distribution")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        i='subunit'
                        value={selectedUnit}
                        options={units}
                        onChange={(value) => setSelectedUnit(value)}
                        isDisabled={edit}
                    />
                    <label htmlFor='subunit'>{t("section")}</label>
                </Col>
            </Row>

            <div className='mb-4 no-gutters justify-content-between'>
                <Row className='m-0'>
                    <Col xs={12} lg={6} xl={3}>
                        <div>{t("date")}</div>
                        <DatePicker
                            onChange={(e) => setDate(e)}
                            locale={i18n.language}
                            selectsStart
                            selected={date}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode='select'
                            dateFormat='P'
                            disabled={edit}
                        />
                    </Col>
                    <Col xs={12} xl={6} xll={4} className='d-flex mt-auto'>
                        <ToggleGroup
                            buttons={shiftToggleButtons}
                            customButton={ShiftButton}
                            selectedButton={shift}
                            onSelected={setShift}
                            title={"manual_input_dist_shifts"}
                            size='xs'
                            breakpoint='xs'
                        />
                    </Col>
                    <Col
                        xs={12}
                        xl={12}
                        xxl={12}
                        className='d-flex justify-content-end align-items-end'
                    >
                        <StyledButton editing={true} size='sm' onClick={() => setOpen(3)}>
                            <div className='d-flex justify-content-center align-items-center'>
                                <div className='me-1'>{t("copy")}</div>
                                <FontAwesomeIcon icon='copy' />
                            </div>
                        </StyledButton>
                        <StyledButton
                            size='sm'
                            editing={true}
                            variant='info'
                            onClick={() => {
                                setHelpPdfTs(Date.now());
                                setOpen(4);
                            }}
                        >
                            <div className='d-flex justify-content-center align-items-center'>
                                <div className='me-1'>{t("help")}</div>
                                <MdHelp />
                            </div>
                        </StyledButton>
                        <Fade in={edit}>
                            <div className='d-flex'>
                                <StyledButton
                                    editing={edit}
                                    size='sm'
                                    variant='info'
                                    onClick={() => {
                                        setOpen(5);
                                    }}
                                >
                                    <div className='d-flex justify-content-center align-items-center'>
                                        <div className='me-1'>{t("labels:switch")}</div>
                                        <HiSwitchHorizontal />
                                    </div>
                                </StyledButton>
                                <StyledButton editing={edit} size='sm' onClick={() => setOpen(6)}>
                                    <div className='d-flex justify-content-center align-items-center'>
                                        <div className='me-1'>{t("set_as_template")}</div>
                                        <FontAwesomeIcon icon='upload' />
                                    </div>
                                </StyledButton>
                                <StyledButton
                                    editing={edit}
                                    size='sm'
                                    onClick={() => setTemplate()}
                                >
                                    <div className='d-flex justify-content-center align-items-center'>
                                        <div className='me-1'>{t("set_template")}</div>
                                        <FontAwesomeIcon icon='download' />
                                    </div>
                                </StyledButton>
                                <StyledButton
                                    editing={edit}
                                    size='sm'
                                    variant='outline-primary'
                                    onClick={() => {
                                        setEdit(false);
                                        queryClient.invalidateQueries([
                                            "distribution",
                                            dayjs(date).format("DD-MM-YYYY"),
                                        ]);
                                    }}
                                >
                                    <div className='d-flex justify-content-center align-items-center'>
                                        <div className='me-1'>{t("cancel")}</div>
                                        <FontAwesomeIcon icon='ban' />
                                    </div>
                                </StyledButton>

                                <StyledButton
                                    editing={edit}
                                    size='sm'
                                    variant='danger'
                                    onClick={() => saveHandler()}
                                >
                                    <div className='d-flex justify-content-center align-items-center'>
                                        <div className='me-1'>{t("save")}</div>
                                        <FontAwesomeIcon icon='save' />
                                    </div>
                                </StyledButton>
                            </div>
                        </Fade>

                        <Fade in={!edit}>
                            <StyledButton
                                editing={!edit}
                                size='sm'
                                onClick={() => setEdit(true)}
                                variant='outline-primary'
                            >
                                <div className='d-flex justify-content-center align-items-center'>
                                    <div className='me-1'>{t("edit")}</div>
                                    <FontAwesomeIcon icon='pencil-alt' />
                                </div>
                            </StyledButton>
                        </Fade>
                    </Col>
                </Row>
            </div>

            <Row
                className='m-0 m-lg-2 p-1 p-lg-2'
                style={{
                    border: "1px solid whitesmoke",
                    borderRadius: "0px",
                    minHeight: "600px",
                }}
            >
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className='m-0 mt-3 w-100'>
                        <div className='h5'>{t("employee_list")}</div>
                        <EmployeesList
                            editing={edit}
                            employees={employees}
                            unitEmployees={unitEmployees}
                            dayEntry={dayEntry}
                            active={active}
                        />
                        <div className='d-flex justify-content-between mb-2 mt-4'>
                            <div className='h5'>{t("machines")}</div>
                            {edit && (
                                <MachineList
                                    machines={machines}
                                    dayEntry={dayEntry}
                                    insertMachine={insertMachine}
                                    open={open}
                                    setOpen={setOpen}
                                    isLoading={distributionQ.isLoading}
                                />
                            )}
                        </div>
                    </div>
                    <div className='w-100'>
                        {!dayEntry?.distribution?.length > 0 && (
                            <div
                                style={{
                                    margin: "auto",
                                    width: "100%",
                                    textAlign: "center",
                                }}
                            >
                                {t("no_machines_added")}
                            </div>
                        )}
                        <ResponsiveMasonry columnsCountBreakPoints={{ 960: 1, 1200: 2, 1400: 5 }}>
                            <Masonry gutter='1rem'>
                                {dayEntry?.distribution?.length > 0 &&
                                    dayEntry?.distribution
                                        ?.sort((a, b) =>
                                            Intl.Collator("sl").compare(a.name, b.name),
                                        )
                                        .map((machineEntry) => {
                                            return (
                                                <MachineDistribution
                                                    machineEntry={machineEntry}
                                                    shift={shift}
                                                    key={machineEntry.id}
                                                    open={open}
                                                    setOpen={setOpen}
                                                    active={active}
                                                    allEmployees={employees}
                                                    editing={edit}
                                                    renameOperation={renameOperation}
                                                    removeOperation={removeOperation}
                                                    renameMachine={renameMachine}
                                                    removeMachine={removeMachine}
                                                    setSelectedMachine={setSelectedMachine}
                                                />
                                            );
                                        })}
                            </Masonry>
                        </ResponsiveMasonry>
                    </div>
                    <DragOverlay dropAnimation={null}>
                        <UserTag name={active?.name} available={active?.available} />
                    </DragOverlay>
                </DndContext>
            </Row>
            <Row className='mb-3'>
                <NoticeBox>
                    <InputGroup>
                        <NoticeTextArea
                            as='textarea'
                            value={notice}
                            onChange={(e) => {
                                const v = e.target.value;
                                setNotice(v);
                                queueSaveNote(v);
                            }}
                            placeholder='Opombe in obvestila delavcem'
                        />
                        {noteSaving && (
                            <InputGroup.Text style={{ whiteSpace: "nowrap" }}>
                                <Spinner animation='border' size='sm' />
                            </InputGroup.Text>
                        )}
                    </InputGroup>
                </NoticeBox>
            </Row>
            <Modal
                show={open === 3}
                onHide={() => {
                    setOpen(0);
                }}
            >
                <Form onSubmit={handleSubmit(copyHandler)} style={{ padding: "1em 2em" }}>
                    <Row className='d-flex flex-column'>
                        <p className='h4 mb-4' style={{ fontWeight: "500" }}>
                            {t("labels:copy")}
                        </p>
                    </Row>
                    <Row className='d-flex flex-column'>
                        <p className='text-justify' style={{ fontSize: "14px" }}>
                            {t("manual_input:copy_info")}
                        </p>
                        <p className='text-muted'>{t("select_date_range_source")}</p>
                    </Row>
                    <Row>
                        <Col xs={12} lg={6}>
                            <Form.Label>{t("start_date")}</Form.Label>
                            <Controller
                                name='startDate'
                                control={control}
                                rules={{
                                    validate: () => {
                                        return (
                                            dayjs(watchStartDate).diff(
                                                dayjs(watchEndDate),
                                                "day",
                                            ) ==
                                                dayjs(watchStartDateDest).diff(
                                                    dayjs(watchEndDateDest),
                                                    "day",
                                                ) || t("range_should_match")
                                        );
                                    },
                                }}
                                defaultValue={dayjs().subtract(1, "week").startOf("week").toDate()}
                                render={({ ref, field }) => (
                                    <DatePicker
                                        onChange={(e) => field.onChange(e)}
                                        locale={i18n.language}
                                        selectsStart
                                        selected={field.value}
                                        startDate={field.value}
                                        endDate={watchEndDate}
                                        showYearDropdown
                                        dropdownMode='select'
                                        dateFormat={"P"}
                                    />
                                )}
                            />
                        </Col>
                        <Col xs={12} lg={6}>
                            <Form.Label>{t("end_date")}</Form.Label>
                            <Controller
                                name='endDate'
                                control={control}
                                defaultValue={dayjs().subtract(1, "week").endOf("week").toDate()}
                                render={({ ref, field }) => (
                                    <DatePicker
                                        onChange={(e) => field.onChange(e)}
                                        locale={i18n.language}
                                        selectsEnd
                                        selected={field.value}
                                        startDate={watchStartDate}
                                        endDate={field.value}
                                        minDate={watchStartDate}
                                        showYearDropdown
                                        dropdownMode='select'
                                        dateFormat={"P"}
                                    />
                                )}
                            />
                            <ErrorMessage>{t(errors?.endDate?.message)}</ErrorMessage>
                        </Col>
                    </Row>
                    <Row className='d-flex flex-column'>
                        <p className='text-muted'>{t("select_date_range_dest")}</p>
                    </Row>
                    <Row>
                        <Col xs={12} lg={6}>
                            <Form.Label>{t("start_date")}</Form.Label>
                            <Controller
                                name='startDateDest'
                                control={control}
                                defaultValue={dayjs().startOf("week").toDate()}
                                render={({ ref, field }) => (
                                    <DatePicker
                                        onChange={(e) => field.onChange(e)}
                                        locale={i18n.language}
                                        selectsStart
                                        selected={field.value}
                                        startDate={field.value}
                                        endDate={watchEndDateDest}
                                        minDate={watchEndDate}
                                        showYearDropdown
                                        dropdownMode='select'
                                        dateFormat={"P"}
                                    />
                                )}
                            />
                            <ErrorMessage>{t(errors?.endDateDest?.message)}</ErrorMessage>
                        </Col>
                        <Col xs={12} lg={6}>
                            <Form.Label>{t("end_date")}</Form.Label>
                            <Controller
                                name='endDateDest'
                                control={control}
                                defaultValue={dayjs().endOf("week").toDate()}
                                render={({ ref, field }) => (
                                    <DatePicker
                                        onChange={(e) => field.onChange(e)}
                                        locale={i18n.language}
                                        selectsEnd
                                        selected={field.value}
                                        startDate={watchStartDateDest}
                                        endDate={field.value}
                                        minDate={watchStartDateDest}
                                        showYearDropdown
                                        dropdownMode='select'
                                        dateFormat={"P"}
                                    />
                                )}
                            />
                            <ErrorMessage>{t(errors?.endDateDest?.message)}</ErrorMessage>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <ErrorMessage>{t(errors?.startDate?.message)}</ErrorMessage>
                        </Col>
                    </Row>
                    <Row className='m-0 d-flex justify-content-end'>
                        <Button
                            variant='outlined'
                            className='mx-1'
                            onClick={() => {
                                setOpen(false);
                                reset();
                            }}
                        >
                            {t("labels:cancel")}
                        </Button>
                        <Button type='submit'>{t("labels:copy")}</Button>
                    </Row>
                </Form>
            </Modal>
            <Modal
                show={open === 2}
                onHide={() => {
                    setOpen(0);
                    resetOp();
                }}
            >
                <Form onSubmit={handleSubmitOp(onSubmit)} style={{ padding: "1em 2em" }}>
                    <Row className='mt-3'>
                        <Col>
                            <Form.Label>{t("labels:operation_name")}</Form.Label>
                            <Form.Control
                                {...registerOp("operation")}
                                type='text'
                                required
                                placeholder={t("labels:enter_operation_name")}
                                autoComplete='off'
                            />
                            <ErrorMessage>{errors?.operation?.message}</ErrorMessage>
                        </Col>
                    </Row>
                    <Row className='m-0 d-flex justify-content-end'>
                        <Button
                            variant='outlined'
                            className='mx-1'
                            onClick={() => {
                                setOpen(0);
                                resetOp();
                            }}
                        >
                            {t("labels:cancel")}
                        </Button>
                        <Button type='submit'>{t("labels:add")}</Button>
                    </Row>
                </Form>
            </Modal>
            <Modal
                show={open === 4}
                onHide={() => {
                    setOpen(0);
                }}
                size='xl'
            >
                <div>
                    <iframe
                        title='pdf_wraper'
                        src={`http://${process.env.REACT_APP_INFORMATOR}/uploads/worker_dist.pdf?ts=${helpPdfTs}`}
                        target='_parent'
                        height={1200}
                        width={"100%"}
                    />
                </div>
            </Modal>
            <Modal
                show={open === 5}
                onHide={() => {
                    setOpen(0);
                }}
            >
                <Form onSubmit={handleSubmit(switchHandler)} style={{ padding: "1em 2em" }}>
                    <Row className='d-flex flex-column'>
                        <p className='h4 mb-4' style={{ fontWeight: "500" }}>
                            {t("labels:switch_shift")}
                        </p>
                    </Row>
                    <Row className='d-flex flex-column'>
                        <p className='text-muted'>{t("select_shifts")}</p>
                    </Row>
                    <Row>
                        <Col className='d-flex justify-content-center align-items-center'>
                            <Form.Check
                                custom
                                inline
                                name='s11'
                                label={"1"}
                                value='1'
                                defaultChecked
                                type='radio'
                                id='radio-s11'
                                {...register("s1")}
                            />
                            <Form.Check
                                custom
                                inline
                                name='s12'
                                label={"2"}
                                value='2'
                                type='radio'
                                id='radio-s12'
                                {...register("s1")}
                            />
                            <Form.Check
                                custom
                                inline
                                name='s13'
                                label={"3"}
                                value='3'
                                type='radio'
                                id='radio-s13'
                                {...register("s1")}
                            />
                        </Col>
                        <Col className='d-flex justify-content-center align-items-center'>
                            <Form.Check
                                custom
                                inline
                                name='s21'
                                label={"1"}
                                value='1'
                                type='radio'
                                id='radio-s21'
                                {...register("s2")}
                            />
                            <Form.Check
                                custom
                                inline
                                name='s22'
                                label={"2"}
                                value='2'
                                type='radio'
                                id='radio-s22'
                                {...register("s2")}
                            />
                            <Form.Check
                                custom
                                inline
                                name='s23'
                                label={"3"}
                                value='3'
                                type='radio'
                                id='radio-s23'
                                {...register("s2")}
                            />
                        </Col>
                    </Row>

                    <Row className='m-0 mt-4 d-flex justify-content-end'>
                        <Button
                            variant='outlined'
                            className='mx-1'
                            onClick={() => {
                                setOpen(false);
                                reset();
                            }}
                        >
                            {t("labels:cancel")}
                        </Button>
                        <Button type='submit'>{t("labels:switch")}</Button>
                    </Row>
                </Form>
            </Modal>
            <Modal className='' show={open === 6}>
                <div className='d-flex flex-column p-4 mt-4'>
                    <div className='w-100'>
                        <p>{t("save_current_distribution_as_template")}</p>
                    </div>
                    <div className='m-0 mt-4 d-flex justify-content-end w-100'>
                        <Button
                            variant='outlined'
                            className='mx-1'
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            {t("labels:cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                saveTemplate();
                            }}
                        >
                            {t("labels:accept")}
                        </Button>
                    </div>
                </div>
            </Modal>
            <div className='position-fixed bottom-0 end-0 m-4'>
                <Toast onClose={() => setToast(null)} show={!!toast} delay={3000} autohide>
                    <Toast.Header className='d-flex gap-2'>
                        <FontAwesomeIcon icon='info-circle' />
                        <strong className='me-auto'>{t("notification")}</strong>
                    </Toast.Header>
                    <Toast.Body>{toast}</Toast.Body>
                </Toast>
            </div>
            <div
                className='position-fixed top-0 start-50 translate-middle-x p-3'
                style={{ zIndex: 1080 }}
            >
                <Toast
                    bg='success'
                    onClose={() => setNoteToast(false)}
                    show={noteToast}
                    delay={2000}
                    autohide
                >
                    <Toast.Body className='text-white'>Opomba shranjena.</Toast.Body>
                </Toast>
            </div>
        </Fragment>
    );
    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {groupsPane}
            </PrivateRoute>
        </Switch>
    );
}

export default DistributionPane;
