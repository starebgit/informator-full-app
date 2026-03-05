import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Card = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--s2) var(--s1);
    border: 1px solid var(--light);
    box-shadow: 2px 1px 4px var(--bs-light);
`;

const MachineRow = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    border: 1px solid var(--bs-light);
    padding: var(--s3) var(--s3);
`;

const MachineBadge = styled.div`
    max-width: 235px;
    padding: var(--s4);
    margin: var(--s5);
    font-size: 16px;
    word-wrap: break-word;
    font-weight: bold;
    color: white;
    background-color: var(--bs-cyan);
`;

const TolerancesRow = styled.div`
    display: flex;
    flex-direction: flex-start;
    width: 100%;
    flex-wrap: wrap;
`;

function GroupCard({ machineGroup, ...props }) {
    const { t } = useTranslation("manual_input");
    return (
        <Card className='mx-md-4'>
            <Row className='d-flex justify-content-between'>
                <h4 style={{ fontWeight: "bold" }}> {machineGroup?.name}</h4>
                <div className='d-flex justify-content-between'>
                    <div className='mx-1'>
                        {t("dashboard") + ":"}{" "}
                        <FontAwesomeIcon
                            style={
                                machineGroup?.dashboard
                                    ? { color: "green" }
                                    : { color: "lightsalmon" }
                            }
                            icon={machineGroup?.dashboard ? "check" : "times"}
                        />{" "}
                    </div>
                    <div className='mx-1'>
                        {t("realization") + ":"}{" "}
                        <FontAwesomeIcon
                            style={
                                machineGroup?.realization
                                    ? { color: "green" }
                                    : { color: "lightsalmon" }
                            }
                            icon={machineGroup?.realization ? "check" : "times"}
                        />
                    </div>
                    <div className='mx-1'>
                        {t("quality") + ":"}{" "}
                        <FontAwesomeIcon
                            style={
                                machineGroup?.quality
                                    ? { color: "green" }
                                    : { color: "lightsalmon" }
                            }
                            icon={machineGroup?.quality ? "check" : "times"}
                        />
                    </div>
                    <div className='mx-1'>
                        {t("OEE") + ":"}{" "}
                        <FontAwesomeIcon
                            style={
                                machineGroup?.oee ? { color: "green" } : { color: "lightsalmon" }
                            }
                            icon={machineGroup?.oee ? "check" : "times"}
                        />
                    </div>
                    <div className='d-flex'>
                        <div className='btn btn-link btn-sm'>
                            <Link
                                as={Button}
                                style={{ fontSize: "14px" }}
                                to={"/manual-input/shopfloor/groups/edit/" + machineGroup?.id}
                            >
                                <FontAwesomeIcon
                                    icon='pencil-alt'
                                    style={{ fontSize: "21px" }}
                                    className='mx-1'
                                />
                            </Link>
                        </div>

                        <div
                            className='btn btn-link btn-sm'
                            onClick={() => {
                                //setShow(true);
                                //setSelectedRow(row.accidentId);
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
                </div>
            </Row>
            <Row className='d-flex flex-column mt-4 p-1'>
                <h5>{machineGroup?.static ? t("operation_group") : t("machines")}</h5>
                <MachineRow>
                    {machineGroup?.static
                        ? machineGroup?.machineGroupsGroups.map((group) => {
                              return (
                                  <MachineBadge key={"badge" + group.id}>
                                      {group.groupId}
                                  </MachineBadge>
                              );
                          })
                        : machineGroup?.machines.map((machine) => {
                              return (
                                  <MachineBadge key={"badge" + machine.machineAltKey}>
                                      {machine.name + " - " + machine.machineAltKey}
                                  </MachineBadge>
                              );
                          })}
                </MachineRow>
            </Row>
            <Row className='d-flex flex-column mt-4'>
                <h5>{t("tolerances")}</h5>
                <TolerancesRow>
                    <Col xs={12} sm={6} md={2}>
                        <div>
                            Realizacija: {machineGroup?.realizationTol?.toString().slice(0, -1)} %
                        </div>
                    </Col>
                    <Col xs={12} sm={6} md={2}>
                        <div>Kvaliteta: {machineGroup?.qualityTol?.toString().slice(0, -1)} %</div>
                    </Col>
                </TolerancesRow>
            </Row>
        </Card>
    );
}
export default GroupCard;
