import { Col, Button } from "react-bootstrap";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import React, { useMemo } from "react";
import dayjs from "dayjs";
import DataTable from "react-data-table-component";
import { ClipLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Card = styled.div`
    display: flex;
    flex-direction: column;
    padding: var(--s3);
    border: 1px solid var(--bs-light);
    margin-bottom: var(--s3);
    min-height: 64px;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    margin: 0 var(--s3);
    box-shadow: 1px 1px 3px lightgray;
`;

const Stamp = styled.span`
    margin-left: auto;
    font-size: var(--small-caption);
    color: var(--muted);
`;

const customStyles = {
    table: {
        style: {},
    },
    headRow: {
        style: {
            paddingLeft: "8px", // override the cell padding for head cells
            paddingRight: "8px",
            minHeight: "30px",
            backgroundColor: "var(--bs-light)",
        },
    },
    headCells: {
        style: {
            fontWeight: "bold",
        },
    },
    rows: {
        style: {
            marginRight: "40px",
        },
    },
};

function MachineGroupGoalCard({ machineGroup, data, clicked, ...props }) {
    const { t } = useTranslation("manual_input");
    const columns = useMemo(
        () => [
            { name: "goalId", selector: (row) => row.goalId, omit: true },
            {
                name: t("start_date"),
                selector: (row) => row.startDate,
                format: (row, index) => {
                    return dayjs(row.startDate).format("LL");
                },
            },
            {
                name: t("end_date"),
                selector: (row) => row.endDate,
                format: (row, index) => {
                    return dayjs(row.endDate).format("LL");
                },
            },
            {
                name: t("realization_goal"),
                selector: (row) => row.realizationGoal,
            },
            {
                name: t("quality_goal") + " %",
                selector: (row) => row.qualityGoal,
            },
            {
                name: t("oee_goal") + " %",
                selector: (row) => row.oeeGoal,
            },
            {
                name: t("created_by"),
                selector: (row) => row.userId,
                right: true,
            },
            {
                name: t("edit"),
                selector: (row) => row.edit,
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
        [t, clicked],
    );

    //if (goals.isLoading) return <h1>isLoading</h1>;

    const goalsContent = data?.map((goal) => {
        return {
            goalId: goal.id,
            startDate: goal.startDate,
            endDate: goal.endDate,
            realizationGoal: goal.realizationGoal,
            qualityGoal: goal.qualityGoal,
            oeeGoal: goal.oeeGoal,
            userId: goal.user.username || "",
        };
    });
    return (
        <Col xs={12}>
            <Card>
                <div>
                    <h5>{machineGroup.name}</h5>
                </div>
                <Content>
                    <DataTable
                        columns={columns}
                        data={goalsContent}
                        noHeader={true}
                        highlightOnHover
                        dense
                        progressPending={!data}
                        customStyles={customStyles}
                        progressComponent={<ClipLoader loading={true} size={40} />}
                        noDataComponent={<div className='p-3'>{t("no_active_goals")}</div>}
                    />
                </Content>
                <Stamp>
                    {props.user} {props.timestamp}
                </Stamp>
            </Card>
        </Col>
    );
}
export default MachineGroupGoalCard;
