import { useContext, useMemo, useState } from "react";
import { Row, Col, Button, Modal, FormControl as BsFormControl } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import MachineGroupGoalCard from "./MachineGroupGoalCard/MachineGroupGoalCard";
import { Fragment } from "react";
import DataTable from "react-data-table-component";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";

import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { ClipLoader } from "react-spinners";
import { removeGoal } from "../../../../data/API/Informator/InformatorAPI";
import { useMutation, useQuery, useQueryClient } from "react-query";
import GoalsPaneForm from "./GoalsPaneForm";
import client from "../../../../feathers/feathers";
import { Switch, useRouteMatch } from "react-router";
import { Link } from "react-router-dom";
import PrivateRoute from "../../../../routes/PrivateRoute";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import dayjs from "dayjs";
import Table from "../../../../components/Tables/Table";

const StyledDataTable = styled(DataTable)`
    .rdt_TableCell {
        font-size: 16px;
        font-weight: 400;
    }
    .rdt_TableCol. {
        font-size: 16px;
    }

    .rdt_TableCol_Sortable {
        font-size: 16px;
        font-weight: 700;
    }
`;

const FormControl = styled(BsFormControl)`
    padding-top: var(--s3);
    padding-bottom: var(--s3);
`;

const FieldWrap = styled.div`
    padding: 12px;
`;

const StyledError = styled.span`
    color: var(--bs-red);
    font-size: 14px;
    margin-left: ${(props) => (props.response ? "0px" : "8px")};
`;

function GoalsPane({ clicked, ...props }) {
    const { path } = useRouteMatch();
    const queryClient = useQueryClient();
    const { state, dispatch } = useContext(AuthContext);
    const [selectedGoal, setSelectedGoal] = useState(false);
    const [show, setShow] = useState(false);
    const { t } = useTranslation("manual_input");

    const removeGoalMutation = useMutation((id) => removeGoal(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries("goals");
            setTimeout(() => {
                setShow(false);
                setTimeout(() => {
                    removeGoalMutation.reset();
                }, 300);
            }, 2000);
        },
    });

    const handleShow = (id) => {
        setShow(true);
        setSelectedGoal(id);
    };
    const goals = useQuery(
        ["goals", props.selectedUnit.keyword],
        () => {
            const machineGroupIds = props.machineGroups.map((machineGroup) => machineGroup.id);
            return client
                .service("goals")
                .find({
                    query: {
                        machineGroupId: { $in: machineGroupIds },
                    },
                })
                .then((response) => {
                    const { data } = response;
                    return data;
                });
        },
        {
            enabled: !!props.machineGroups?.length,
        },
    );
    const columns = useMemo(
        () => [
            { name: "goalId", selector: "goalId", omit: true },
            {
                name: t("start_date"),
                selector: "startDate",
                sortable: true,
                format: (row, index) => {
                    return dayjs(row.startDate).format("LL");
                },
            },
            {
                name: t("end_date"),
                selector: "endDate",
                sortable: true,
                format: (row, index) => {
                    return dayjs(row.endDate).format("LL");
                },
            },
            {
                name: t("realization_goal"),
                selector: "realizationGoal",
            },
            {
                name: t("quality_goal") + " %",
                selector: "qualityGoal",
            },
            {
                name: t("oee_goal") + " %",
                selector: "oeeGoal",
            },
            {
                name: t("created_by"),
                selector: "userId",
                right: true,
            },
            {
                name: t("edit"),
                selector: "edit",
                right: true,
                cell: (row) => (
                    <div className='d-flex'>
                        {dayjs(row.endDate).isBefore(dayjs(), "day") ? null : (
                            <div className='btn btn-link btn-sm'>
                                <Link
                                    as={Button}
                                    style={{ fontSize: "14px" }}
                                    to={"/manual-input/shopfloor/goals/edit/" + row.goalId}
                                >
                                    <FontAwesomeIcon
                                        icon='pencil-alt'
                                        style={{ fontSize: "21px" }}
                                        className='mx-1'
                                    />
                                </Link>
                            </div>
                        )}
                        <div
                            className='btn btn-link btn-sm'
                            onClick={() => {
                                clicked(row.goalId);
                            }}
                        >
                            <FontAwesomeIcon
                                icon='trash-alt'
                                style={{
                                    fontSize: "21px",
                                    color: "var(--bs-danger)",
                                }}
                                className='mx-1'
                            />
                        </div>
                    </div>
                ),
            },
        ],
        [clicked, t],
    );

    const goalsPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("goals")}</h3>
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
                    {props.machineGroups?.length > 0 ? (
                        <h4 className='pb-1 pe-4 ps-3 pt-3' style={{ fontSize: "22px" }}>
                            {t("active_goals")}
                        </h4>
                    ) : null}
                    <Row className='no-gutters'>
                        {props.machineGroups?.map((machineGroup, index) => {
                            return (
                                <MachineGroupGoalCard
                                    key={"mggc" + index}
                                    machineGroup={machineGroup}
                                    data={goals?.data?.filter((goal) => {
                                        return (
                                            goal.machineGroupId == machineGroup.id &&
                                            dayjs(goal.startDate).isBefore(dayjs()) &&
                                            dayjs(goal.endDate).isAfter(dayjs())
                                        );
                                    })}
                                    clicked={handleShow}
                                />
                            );
                        })}
                    </Row>
                    {/* 					<Row className='flex no-gutters'>
						<Link className='btn btn-primary' to={`${path}/add?unit=${props.selectedUnit.subunitId}`}>{t('dodaj_cilj')}</Link>
					</Row> */}
                </Col>
            </Row>

            <Row>
                {/* <Col>
					<h5 style={{fontWeight:'bold'}}>{t("seznam_vseh_ciljev")}</h5>
				</Col> */}
                <Col>
                    {/* <h5 style={{ fontWeight: 'bold' }}>{t("list_of_goals")}</h5> */}
                    <Table
                        actions={
                            <Link
                                className='btn btn-primary'
                                to={`${path}/add?unit=${props.selectedUnit.subunitId}`}
                            >
                                {t("add_goal")}
                            </Link>
                        }
                        columns={columns}
                        title={t("list_of_goals")}
                        data={goals?.data?.map((goal) => {
                            return {
                                goalId: goal.id,
                                startDate: goal.startDate,
                                endDate: goal.endDate,
                                realizationGoal: goal.realizationGoal,
                                qualityGoal: goal.qualityGoal,
                                oeeGoal: goal.oeeGoal,
                                userId: goal.user?.username || "Ni aktiven",
                            };
                        })}
                        noDataComponent={t("no_active_goals")}
                        defaultSortField='startDate'
                        defaultSortAsc={false}
                    />
                </Col>
            </Row>
            <Modal centered onHide={() => setShow(false)} show={show}>
                <Modal.Body>
                    {removeGoalMutation.isSuccess ? (
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
                                    onClick={() => removeGoalMutation.mutate(selectedGoal)}
                                >
                                    {t("labels:remove")}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Fragment>
    );

    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {goalsPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <GoalsPaneForm />
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <GoalsPaneForm />
            </PrivateRoute>
        </Switch>
    );
}

export default GoalsPane;
