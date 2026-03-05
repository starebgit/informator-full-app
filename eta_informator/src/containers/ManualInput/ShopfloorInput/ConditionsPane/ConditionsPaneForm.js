import { useMemo } from "react";
import { Row, Col, Button, Modal, Form, Tooltip, OverlayTrigger } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "react-query";
import { createCondition, removeCondition } from "../../../../data/API/Informator/InformatorAPI";

function ConditionsPaneForm({ machineGroups, ...props }) {
    const [show, setShow] = useState(false);
    const { t } = useTranslation("manual_input", "labels");
    const { id } = useParams();
    const history = useHistory();
    const queryClient = useQueryClient();

    const addConditionMutation = useMutation((values) => createCondition(values), {
        onSuccess: () => {
            queryClient.invalidateQueries("machineGroups");
            setShow(false);
        },
    });

    const removeConditionMutation = useMutation((id) => removeCondition(id), {
        onSuccess: () => {
            queryClient.invalidateQueries("machineGroups");
        },
    });

    const { register, control, handleSubmit, reset } = useForm();

    const machineGroup = useMemo(() => {
        return machineGroups?.find((entry) => entry.id == id);
    }, [machineGroups, id]);

    const columns = [
        {
            name: "#",
            selector: "count",
        },
        {
            name: "id",
            selector: "id",
            omit: true,
        },
        {
            name: t("type"),
            selector: "type",
        },
        {
            name: t("exact"),
            selector: "exact",
            format: (row) => t(row.exact),
        },
        {
            name: t("value"),
            selector: "value",
        },
        {
            name: t("edit"),
            selector: "edit",
            cell: (row) => (
                <div className='d-flex'>
                    <div
                        className='btn btn-link btn-sm'
                        onClick={() => {
                            removeConditionMutation.mutate(row.id);
                        }}
                    >
                        <FontAwesomeIcon
                            icon='trash-alt'
                            style={{ fontSize: "21px", color: "firebrick" }}
                            size='sm'
                            className='mx-1'
                        />
                    </div>
                </div>
            ),
        },
    ];

    const data = useMemo(
        () =>
            machineGroup?.machineConditions.map((entry, index) => ({
                count: index + 1,
                id: entry.id,
                type: entry?.condition?.name,
                exact: entry.exact,
                value: entry.value,
            })),
        [machineGroup],
    );

    const handleClose = () => {
        setShow(false);
        reset();
    };

    const onSubmit = (values) => {
        const insertData = {
            ...values,
            machineGroupId: id,
        };
        addConditionMutation.mutate(insertData);
    };

    const renderTooltip = (props) => (
        <Tooltip id='button-tooltip' {...props}>
            <p style={{ fontSize: "14px" }}>
                {"V primeru, da želite strogo ujemanje pri preverjanju pogoja, obkljukajte opcijo "}
                <a className='font-italic text-lowercase text-white'>{t("exact") + "."}</a>
            </p>
        </Tooltip>
    );

    return (
        <>
            <Row>
                <Col>
                    <div className='d-flex align-items-center'>
                        <Button size='lg' onClick={() => history.goBack()} variant='link'>
                            {t("condition", { count: 2 })}
                        </Button>
                        <div>/</div>
                        <div>
                            <Button
                                size='lg'
                                style={{ color: "darkslategray" }}
                                disabled
                                variant='link'
                            >
                                {machineGroup?.name}
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <DataTable
                        columns={columns}
                        data={data}
                        actions={
                            data?.length > 0 && (
                                <Button onClick={() => setShow(true)}>{t("add_condition")}</Button>
                            )
                        }
                        noDataComponent={
                            <Button variant='info' onClick={() => setShow(true)}>
                                {t("add_condition")}
                            </Button>
                        }
                    />
                </Col>
            </Row>
            <Row className='mt-5'>
                <Col className='d-flex'>
                    <Button
                        variant='outline-primary'
                        className='ms-auto'
                        onClick={() => history.goBack()}
                    >
                        {t("labels:back")}
                    </Button>
                </Col>
            </Row>
            <Modal
                show={show}
                onHide={() => {
                    reset();
                    setShow(false);
                }}
            >
                <Form onSubmit={handleSubmit(onSubmit)} className='p-3'>
                    <Row>
                        <Col>
                            <h4>Add condition</h4>
                        </Col>
                    </Row>
                    <Row className='mt-4'>
                        <Col xs={4}>
                            <Form.Label>{t("condition_type")}</Form.Label>
                        </Col>
                        <Col xs={8} className='d-flex justify-content-end'>
                            <Form.Check
                                custom
                                inline
                                name='type'
                                label={t("material")}
                                value={1}
                                type='radio'
                                id='radio-material'
                                defaultChecked={true}
                                {...register("conditionId")}
                            />

                            <Form.Check
                                custom
                                inline
                                name='type'
                                label={t("operation")}
                                value={2}
                                type='radio'
                                id='radio-operation'
                                {...register("conditionId")}
                            />
                        </Col>
                    </Row>
                    <Row className='mt-3'>
                        <Col className='mt-1' xs={12}>
                            <Form.Label>{t("value")}</Form.Label>
                        </Col>
                        <Col xs={9} className='d-flex justify-content-center'>
                            <Form.Control
                                {...register("value")}
                                type='text'
                                placeholder={t("npr. 55.170")}
                                autoComplete='off'
                            />
                        </Col>
                        <Col xs={3} className='d-flex justify-content-center align-items-center'>
                            <Form.Check
                                custom
                                inline
                                name='exact'
                                label={t("exact")}
                                type='checkbox'
                                id='check-exact'
                                {...register("exact")}
                            />
                            <OverlayTrigger placement='bottom' overlay={renderTooltip}>
                                <FontAwesomeIcon
                                    style={{ color: "var(--bs-secondary)" }}
                                    icon='info-circle'
                                />
                            </OverlayTrigger>
                        </Col>
                    </Row>
                    <Row className='mt-2'>
                        <Col className='d-flex justify-content-end'>
                            <Button
                                onClick={() => handleClose()}
                                className='mx-2'
                                variant='outlined'
                            >
                                {t("cancel")}
                            </Button>
                            <Button type='submit'>{t("add")}</Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}

export default ConditionsPaneForm;
