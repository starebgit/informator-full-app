import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef, useEffect, useState } from "react";
import { Button, FormControl, Form, Dropdown, Fade, InputGroup } from "react-bootstrap";
import Operation from "./Operation";
import _ from "lodash";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import { useForm } from "react-hook-form";

const Card = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    width: 100%;
    height: min-content;
    background: linear-gradient(200deg, rgba(212, 227, 228, 0.3) 0%, rgba(215, 232, 241, 0.7) 100%);
    break-inside: avoid;
`;

const Children = styled.div`
    > * {
        &:first-child {
        }
    }
`;

const Toggle = styled.div`
    padding: 0.3em 0.9em;
    border-radius: 2em;
    transition: background-color 0.3s ease;
    &:hover {
        background-color: lightgray;
    }
`;

const Item = styled(Dropdown.Item)`
    color: black;
    transition: background-color 0.3s ease;
    &:hover {
        color: black;
        background-color: lightgray;
    }
`;

const AddButton = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    padding: 0.3em 0.5em;
    transition: background-color 0.3s ease;
    width: 160px;
    cursor: pointer;
    &:hover {
        background-color: #f3f3f3;
    }
`;

const Input = styled(FormControl)`
    background: rgba(255, 255, 255, 0.75);
    border-radius: unset;
    border: unset;
    border-bottom: 1px solid lightgray;
    transition: background 0.2s ease;
    padding: 0.75em 0.75em;
    height: 2em;
    width: 100%;
    &:focus {
        border: unset;
        border-bottom: 1px solid lightgray;
        box-shadow: unset;
        background: rgba(255, 255, 255, 1);
    }

    :hover {
        background: rgba(255, 255, 255, 1);
    }
`;

const InputButton = styled(Button)`
    margin-left: -28px;
    z-index: 10;
    height: 2em;
    padding: unset;
    color: gray;
`;

function MachineDistribution({
    machineEntry,
    shift,
    open,
    setOpen,
    allEmployees,
    editing,
    active,
    setActive,
    setSelectedMachine,
    renameOperation,
    removeOperation,
    renameMachine,
    removeMachine,
    ...props
}) {
    const [operations, setOperations] = useState([]);
    const { t } = useTranslation(["manual_input", "labels"]);
    const [rename, setRename] = useState(false);
    const { register, handleSubmit } = useForm();

    useEffect(() => {
        const clonedEntry = _.cloneDeep(machineEntry);
        const operationList = clonedEntry?.dist?.[shift] ?? [];
        setOperations(operationList);
    }, [machineEntry, shift]);

    useEffect(() => {
        setRename(false);
    }, [editing]);

    const CustomMore = forwardRef(({ children, onClick }, ref) => (
        <Toggle
            href=''
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
        >
            <FontAwesomeIcon icon='ellipsis-v' />
        </Toggle>
    ));

    const clickHandler = (e) => {
        if (e.detail == 2) {
            setRename(true);
        }
    };

    const submitHandler = (value) => {
        renameMachine(machineEntry.id, value.rename);
        setRename(false);
    };

    if (allEmployees.isLoading) return null;

    //TODO - add required on both forms
    return (
        <Card className='shadow-sm rounded p-3'>
            <div>
                {machineEntry != null && Object.keys(machineEntry).length != 0 && (
                    <div className='m-0 d-flex align-items-center justify-content-between'>
                        {!(rename && editing) ? (
                            <div
                                className='fs-6 fw-bold'
                                style={{ textTransform: "capitalize" }}
                                onClick={clickHandler}
                            >
                                {machineEntry.name.includes("!")
                                    ? machineEntry.name.split("!")[1]
                                    : machineEntry.name}
                            </div>
                        ) : (
                            <Form
                                className='w-100'
                                style={{ marginRight: "10px" }}
                                onSubmit={handleSubmit(submitHandler)}
                            >
                                <InputGroup>
                                    <Input
                                        {...register("rename")}
                                        placeholder={machineEntry.name}
                                        defaultValue={machineEntry.name}
                                        autoComplete='off'
                                    />
                                    <InputButton type='submit' variant='text'>
                                        <FontAwesomeIcon icon='check' />
                                    </InputButton>
                                </InputGroup>
                            </Form>
                        )}
                        <div className='d-flex'>
                            <Fade in={editing}>
                                <Dropdown>
                                    <Dropdown.Toggle
                                        as={CustomMore}
                                        id='more_tgl'
                                    ></Dropdown.Toggle>
                                    <Dropdown.Menu style={{ zIndex: 1000 }}>
                                        <Item
                                            eventKey='1'
                                            onClick={() => {
                                                setSelectedMachine(machineEntry.id);
                                                setOpen(2);
                                            }}
                                        >
                                            {t("labels:add_operation")}
                                        </Item>
                                        <Item
                                            eventKey='2'
                                            onClick={() => removeMachine(machineEntry.id)}
                                        >
                                            {t("labels:remove_machine")}
                                        </Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Fade>
                        </div>
                    </div>
                )}
                <div className='m-0'>
                    <Children>
                        {operations?.length > 0 ? (
                            _.sortBy(operations, (o) => o.operation)?.map((entry) => {
                                const employees = allEmployees.data.filter((employee) => {
                                    return entry.employees?.includes(employee.employeeId);
                                });
                                return (
                                    <Operation
                                        key={entry.operation + machineEntry.id}
                                        id={entry.id}
                                        name={entry.operation}
                                        employees={employees}
                                        allEmployees={allEmployees.data}
                                        editing={editing}
                                        active={active}
                                        machine={machineEntry.id}
                                        renameOperation={renameOperation}
                                        removeOperation={removeOperation}
                                    />
                                );
                            })
                        ) : editing ? (
                            <div className='d-flex justify-content-center'>
                                <AddButton
                                    onClick={() => {
                                        setSelectedMachine(machineEntry.id);
                                        setOpen(2);
                                    }}
                                >
                                    <FontAwesomeIcon icon='plus' color='var(--bs-success)' />
                                    <span className='mx-1'>{t("labels:add_operation")}</span>
                                </AddButton>
                            </div>
                        ) : (
                            <div>{t("no_operation_defined")}</div>
                        )}
                    </Children>
                </div>
            </div>
        </Card>
    );
}

export default MachineDistribution;
