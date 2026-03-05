import React, { useMemo, useState } from "react";
import { Row, Col, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useAccidents } from "../../../../data/ReactQuery";
import { Button } from "react-bootstrap";
import { Switch, useRouteMatch } from "react-router";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQueryClient } from "react-query";
import { removeAccident } from "../../../../data/API/Informator/InformatorAPI";
import SafetyPaneAddForm from "./SafetyPaneAddForm";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import Table from "../../../../components/Tables/Table";
import PrivateRoute from "../../../../routes/PrivateRoute";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import dayjs from "dayjs";

function SafetyPane(props) {
    const queryClient = useQueryClient();
    const { path } = useRouteMatch();
    const { t } = useTranslation(["manual_input", "labels"]);
    const removeAccidentMutation = useMutation((id) => removeAccident(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries("accidents");
            setTimeout(() => {
                setShow(false);
                removeAccidentMutation.reset();
            }, 2000);
        },
    });
    const { data, isLoading, isError } = useAccidents(props.selectedUnit.subunitId);
    const columns = useMemo(
        () => [
            {
                name: t("id"),
                selector: "id",
                width: "60px",
                center: true,
                sortable: true,
            },
            {
                name: t("accident_id"),
                selector: "accidentId",
                omit: true,
            },
            {
                name: t("cause"),
                selector: "accidentCause",
                wrap: true,
            },

            {
                name: t("description"),
                selector: "description",
                wrap: true,
            },
            {
                name: t("date"),
                selector: "accidentDate",
                sortable: true,
            },
            {
                name: t("created_at"),
                selector: "createdAt",
            },
            {
                name: t("created_by"),
                selector: "createdBy",
            },
            {
                name: t("edit"),
                selector: "edit",
                right: true,
                width: "40px",
                cell: (row) => (
                    <div className='d-flex'>
                        <div className='btn btn-link btn-sm'>
                            <Link
                                as={Button}
                                style={{ fontSize: "14px" }}
                                to={`${path}/edit/${row.accidentId}`}
                            >
                                <FontAwesomeIcon icon='pencil-alt' style={{ fontSize: "21px" }} />
                            </Link>
                        </div>

                        <div
                            className='btn btn-link btn-sm'
                            onClick={() => {
                                setShow(true);
                                setSelectedRow(row.accidentId);
                            }}
                        >
                            <FontAwesomeIcon
                                icon='trash-alt'
                                style={{
                                    fontSize: "21px",
                                    color: "var(--bs-danger)",
                                }}
                            />
                        </div>
                    </div>
                ),
            },
        ],
        [t, path],
    );

    const [show, setShow] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    if (isError) return <h1>Error</h1>;

    const safetyPane = (
        <>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("safety")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        i='subunit'
                        value={props.selectedUnit}
                        options={props.units}
                        onChange={(selected) => props.setSelectedUnit(selected)}
                    />
                    <label htmlFor='subunit'>{t("section")}</label>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        responsive
                        actions={
                            <Link
                                className='btn btn-primary'
                                to={`${path}/add?unit=${props.selectedUnit.subunitId}`}
                            >
                                {t("add_accident")}
                            </Link>
                        }
                        title={t("list_of_work_accidents")}
                        columns={columns}
                        progressPending={isLoading}
                        data={
                            data
                                ? data.map((accident, index) => {
                                      return {
                                          id: index,
                                          accidentId: accident.id,
                                          accidentCause: t(
                                              "labels:" + accident.accident_cause.cause,
                                          ),
                                          accidentDate: dayjs(accident.accidentDate).format("LL"),
                                          description: accident.description,
                                          createdAt: dayjs(accident.createdAt).format("LLL"),
                                          createdBy: accident.user?.username || "Ni aktiven",
                                      };
                                  })
                                : []
                        }
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                    ></Table>
                </Col>
            </Row>
            <Modal centered onHide={() => setShow(false)} show={show}>
                <Modal.Body>
                    {removeAccidentMutation.isSuccess ? (
                        <SubmitMessage isSuccess={true} message='successfully_removed' />
                    ) : (
                        <div className='d-flex flex-column align-items-center'>
                            <h5 className='p-4'>{t("removal_prompt")}</h5>
                            <div>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='primary'
                                    onClick={() => setShow(false)}
                                >
                                    {t("labels:cancel")}
                                </Button>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='danger'
                                    onClick={() => removeAccidentMutation.mutate(selectedRow)}
                                >
                                    {t("labels:remove")}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {safetyPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <SafetyPaneAddForm />
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <SafetyPaneAddForm />
            </PrivateRoute>
        </Switch>
    );
}

export default SafetyPane;
