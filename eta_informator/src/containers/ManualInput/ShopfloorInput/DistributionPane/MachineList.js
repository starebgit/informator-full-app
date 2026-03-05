import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import dayjs from "dayjs";
import { PulseLoader } from "react-spinners";
import { Row, Col, Modal, Form, Button } from "react-bootstrap";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { useTranslation } from "react-i18next";
import { generateMachinesLabels } from "../../../../data/Formaters/Informator";
import _ from "lodash";

const Machine = styled.div`
    width: 90%;
    height: 36px;
    border-radius: 12px;
    background-color: #efefef;
    border: ${(props) => (props.selected ? "1px solid var(--bs-primary)" : "1px solid F3F3F3")};
    box-shadow: 0px 0px 3px 5px #fafafa;
    transition:
        background-color 0.3s ease,
        border 0.3s ease;
    &:hover {
        background-color: whitesmoke;
    }
`;

const AddButton = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    padding: 0.3em 0.5em;
    transition: background-color 0.3s ease;
    width: 140px;
    cursor: pointer;
    &:hover {
        background-color: #f3f3f3;
    }
`;

function MachineList({
    dayEntry,
    selectedMachine,
    setSelectedMachine,
    machines,
    insertMachine,
    open,
    setOpen,
    isLoading,
    ...props
}) {
    const { t } = useTranslation("manual_input");
    const { register, reset, errors, control, handleSubmit } = useForm();
    const [list, setList] = useState([]);
    useEffect(() => {
        setList(
            dayEntry?.distribution !== undefined && dayEntry?.distribution.length > 0
                ? dayEntry?.distribution?.map((entry) => {
                      return { name: entry.name, id: entry.id };
                  })
                : [],
        );
    }, [dayEntry, selectedMachine]);

    //* If the querry is still loading show loading status
    if (isLoading) {
        return (
            <div className='d-flex justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={5} margin={10} />
            </div>
        );
    }

    const existingMachinesList = list?.map((machine) => +machine.id);

    const onSubmit = (data) => {
        const machineObject = {
            id: data.machine?.value ? +data.machine?.value : dayjs().unix(),
            name: data.name,
            dist: { 1: [], 2: [], 3: [] },
        };

        insertMachine(machineObject);
        reset();
    };

    return (
        <>
            <AddButton onClick={() => setOpen(1)}>
                <FontAwesomeIcon icon='plus' color='var(--bs-success)' />
                <div className='mx-1'>{t("add_machine")}</div>
            </AddButton>
            <Modal
                show={open === 1}
                onHide={() => {
                    setOpen(0);
                }}
            >
                <Form onSubmit={handleSubmit(onSubmit)} style={{ padding: "1em 2em" }}>
                    <Row>
                        <div className='h4'>{t("add_machine")}</div>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Label>{t("machine")}</Form.Label>
                            <Controller
                                name='machine'
                                control={control}
                                defaultValue={null}
                                disabled
                                render={({ ref, field }) => (
                                    <Select
                                        {...field}
                                        ref={ref}
                                        name='machine'
                                        options={
                                            machines.isFetched
                                                ? generateMachinesLabels(
                                                      machines?.data.filter(
                                                          (entry) =>
                                                              !existingMachinesList?.includes(
                                                                  +entry.idAlt,
                                                              ),
                                                      ),
                                                  )
                                                : []
                                        }
                                        placeholder={t("select_machine")}
                                        isDisabled={machines.isError || machines.isLoading}
                                    />
                                )}
                            />
                        </Col>
                    </Row>
                    <Row className='mt-3'>
                        <Col>
                            <Form.Label>{t("machine_name")}</Form.Label>
                            <Form.Control
                                {...register("name")}
                                required
                                type='text'
                                placeholder={t("enter_machine_name")}
                                autoComplete='off'
                            />
                            <ErrorMessage>{errors?.name?.message}</ErrorMessage>
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
                            {t("cancel")}
                        </Button>
                        <Button type='submit'>{t("add")}</Button>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}

export default MachineList;
