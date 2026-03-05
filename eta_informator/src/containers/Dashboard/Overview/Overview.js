import styled from "styled-components";
import { useQuery, useQueryClient } from "react-query";
import client, { sinaproClient } from "../../../feathers/feathers";
import { Card, Container, Row, Col, Tab, Nav, Modal } from "react-bootstrap";
import UnitGoalReach from "./UnitGoalReach";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import UnitCard from "./UnitCard";
import GroupGoalReach from "./GroupGoalReach";
import { useMachineGroups } from "../../../data/ReactQuery";
import { Dot } from "./GoalReachDot";
import _ from "lodash";
import { getUnitKeyFromSubunitKeyword } from "../../../utils/utils";

const StyledContainer = styled(Container)`
    max-width: 95%;
    padding-top: 1rem;
    overflow: hidden;
    min-height: 850px;
    height: 100%;
`;

const UnitSelector = styled(Nav.Link)`
    border-radius: 15px !important;
    padding: 0.25rem 1rem !important;
    border: 1px solid var(--bs-primary);
    margin-right: 0.5rem;
`;

//background: rgba(0,0,0, 0.01);
/* background: rgb(254,254,254);
background: linear-gradient(120deg, rgba(255,252,255,1) 0%, rgba(229,239,247,0.3) 100%); 

bluepink
background: rgb(125,212,237);
background: linear-gradient(120deg, rgba(125,212,237,0.4587009803921569) 0%, rgba(231,87,175,0.23853291316526615) 100%);

redgreen
background: rgb(31,186,42);
background: linear-gradient(120deg, rgba(31,186,42,0.151612394957983194) 0%, rgba(231,87,87,0.165898109243697474) 100%);
*/
const IndicatorCard = styled.div`
    background: rgb(125, 212, 237);
    background: linear-gradient(
        120deg,
        rgba(125, 212, 237, 0.4587009803921569) 0%,
        rgba(231, 87, 175, 0.23853291316526615) 100%
    );
    padding: 1rem;
    box-shadow: var(--shadow-regular);
    margin: 0px 15px;
    border-radius: 10px;
    margin-top: 10px;
`;

const SubunitCardWrap = styled.div`
    display: inline-grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(5, auto);
`;

const UnitCardWrap = styled.div`
    display: inline-grid;
    grid-auto-flow: row;
    grid-template-rows: repeat(4, auto);
`;

function Overview({
    selectedUnit,
    selectedDate,
    selectedSubunit,
    selectedIndicator,
    setSelectedIndicator,
    setSelectedSubunit,
    selectSubunitHandler,
    open,
    setOpen,
    settings,
    ...props
}) {
    const { t } = useTranslation("labels");
    const [flag, setFlag] = useState(false);
    const [show, setShow] = useState(false);
    const [modalCards, setModalCards] = useState([]);
    const queryClient = useQueryClient();
    const [selectedTab, setSelectedTab] = useState(
        () => getUnitKeyFromSubunitKeyword(settings?.defaultSubunit?.value) || "thermo",
    );
    //Data fetching

    const unitLabels = queryClient.getQueryData("unitsLabels");

    const machineGroups = useMachineGroups();

    const sinaproData = useQuery(["production", selectedDate.format("YYYY-MM-DD")], () => {
        return sinaproClient.service("machine-production").find({
            query: {
                start: selectedDate.format("YYYY-MM-DD"),
                end: selectedDate.format("YYYY-MM-DD"),
            },
        });
    });

    const staticData = useQuery(["static", selectedDate.format("YYYY-MM-DD")], () => {
        return client
            .service("production-data-static")
            .find({
                query: {
                    date: {
                        $eq: selectedDate,
                    },
                },
            })
            .then((response) => {
                const { data } = response;
                return data;
            });
    });

    const goalsData = useQuery(["goals", selectedDate.format("YYYY-MM-DD")], () => {
        return client
            .service("goals")
            .find({
                query: {
                    $sort: {
                        updatedAt: 1,
                    },
                    $and: [
                        {
                            startDate: { $lte: selectedDate.toISOString() },
                        },
                        {
                            endDate: { $gte: selectedDate.toISOString() },
                        },
                    ],
                },
            })
            .then(({ data }) => data);
    });

    const calculatedData = useMemo(() => {
        const o = {};
        unitLabels
            .filter((unit) => unit.sfm)
            .forEach((entry) => {
                const unitLabel = entry.keyword;
                entry.options.forEach((subunit) => {
                    const unit = subunit.unitId;
                    const subunitLabel = subunit.label;
                    const subunitId = subunit.subunitId;
                    const machines = machineGroups?.data?.filter(
                        (mg) => mg.subunitId === subunitId,
                    );
                    machines?.forEach((machine) => {
                        const machineIds = machine.machines.map((m) => m.machineAltKey + "");
                        const goals = goalsData?.data?.filter(
                            (goal) => goal.machineGroupId == machine.id,
                        );
                        const productionData = () => {
                            if (machine.static) {
                                const staticIds = machine.machineGroupsGroups?.map(
                                    (group) => group.groupId,
                                );
                                return staticData?.data
                                    ?.filter((entry) => staticIds.includes(entry.groupsStaticId))
                                    ?.reduce((acc, cur) => {
                                        if (!acc["total"]) acc["total"] = +cur.total;
                                        else acc["total"] += +cur.total;
                                        if (!acc["good"]) acc["good"] = +cur.good;
                                        else acc["good"] += +cur.good;
                                        if (!acc["bad"]) acc["bad"] = +cur.bad;
                                        else acc["bad"] += +cur.bad;
                                        return acc;
                                    }, {});
                            } else {
                                return sinaproData?.data
                                    ?.filter((entry) => machineIds.includes(entry.machineKeyAlt))
                                    ?.reduce((acc, cur) => {
                                        if (machine.hourly == 1) {
                                            if (!acc["total"]) acc["total"] = +cur.effectively;
                                            else acc["total"] += +cur.effectively;
                                        } else {
                                            if (!acc["total"]) acc["total"] = +cur.quantity;
                                            else acc["total"] += +cur.quantity;
                                            if (!acc["good"]) acc["good"] = +cur.good;
                                            else acc["good"] += +cur.good;
                                            if (!acc["bad"]) acc["bad"] = +cur.scrap;
                                            else acc["bad"] += +cur.scrap;
                                        }
                                        return acc;
                                    }, {});
                            }
                        };

                        const reaching = () => {
                            const data = productionData();
                            if (!data || !goals) return {};

                            const [goal] = goals;
                            const rTolerance = 1 - machine.realizationTol * 0.01;
                            const qTolerance = 1 - machine.realizationTol * 0.01;
                            return {
                                total: data.total,
                                good: data.good,
                                bad: data.bad,
                                realizationGoal: goal?.realizationGoal,
                                qualityGoal: goal?.qualityGoal,
                                realization:
                                    goal?.realizationGoal == undefined
                                        ? -3
                                        : data.total == undefined
                                        ? -2
                                        : data.total < goal?.realizationGoal * rTolerance
                                        ? -1
                                        : data.total < goal?.realizationGoal
                                        ? 0
                                        : 1,
                                quality:
                                    goal?.qualityGoal == undefined
                                        ? -3
                                        : data.total == undefined
                                        ? -2
                                        : (data.bad / data.total) * 100 >
                                          +goal?.qualityGoal * qTolerance
                                        ? -1
                                        : (data.bad / data.total) * 100 > +goal?.qualityGoal
                                        ? 0
                                        : 1,
                            };
                        };

                        const goalsReached = reaching();
                        if (!o[unit]) o[unit] = { label: unitLabel, subunits: [] };
                        if (!o[unit]["subunits"][subunitId])
                            o[unit]["subunits"][subunitId] = {
                                label: subunitLabel,
                                groups: [],
                            };
                        if (!o[unit]["subunits"][subunitId]["groups"][machine?.id])
                            o[unit]["subunits"][subunitId]["groups"][machine?.id] = {
                                label: machine?.name,
                                total: goalsReached?.total,
                                good: goalsReached?.good,
                                bad: goalsReached?.bad,
                                realization: goalsReached?.realization,
                                quality: goalsReached?.quality,
                                realizationGoal: goalsReached?.realizationGoal,
                                qualityGoal: goalsReached?.qualityGoal,
                                dashboard: machine.dashboard,
                                showRealization: machine.realization,
                                showQuality: machine.quality,
                            };
                    });
                });
            });
        return o;
    }, [staticData, sinaproData, goalsData]);

    const tabs = useMemo(() => {
        return Object.values(calculatedData).map((value) => {
            const subunits = value.subunits.filter((o) => o);
            return (
                <Tab.Pane eventKey={value.label}>
                    <Card style={{ width: "100%", padding: "2rem" }}>
                        <Row>
                            <Col>
                                <h5>{t("goal_reached")}</h5>
                            </Col>
                        </Row>
                        <Row className='my-2'>
                            <Col className='d-flex justify-content-start align-items-center flex-wrap justify-content-sm-center'>
                                <div className='d-flex justify-content-center align-items-center px-1 px-sm-2'>
                                    <Dot reached={-3} />
                                    <div className='ms-1' style={{ fontSize: "12px" }}>
                                        {t("goal_not_set")}
                                    </div>
                                </div>
                                <div className='d-flex justify-content-center align-items-center px-1 px-sm-2'>
                                    <Dot reached={-1} />
                                    <div className='ms-1' style={{ fontSize: "12px" }}>
                                        {t("goal_not_reached")}
                                    </div>
                                </div>
                                <div className='d-flex justify-content-center align-items-center px-1 px-sm-2'>
                                    <Dot reached={0} />
                                    <div className='ms-1' style={{ fontSize: "12px" }}>
                                        {t("in_tolerance")}
                                    </div>
                                </div>
                                <div className='d-flex justify-content-center align-items-center px-1 px-sm-2'>
                                    <Dot reached={1} />
                                    <div className='ms-1' style={{ fontSize: "12px" }}>
                                        {t("goal_reached")}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <div className='d-flex justify-content-center'>
                            <IndicatorCard>
                                <div>{t("realization")}</div>
                                <SubunitCardWrap>
                                    {subunits.map((subunit) => (
                                        <UnitGoalReach
                                            key={"unitGoalReact_" + subunit.label}
                                            unit={subunit.label}
                                            groups={subunit.groups.filter(
                                                (group) =>
                                                    group &&
                                                    group.dashboard &&
                                                    group.showRealization,
                                            )}
                                            indicator='realization'
                                        />
                                    ))}
                                </SubunitCardWrap>
                            </IndicatorCard>
                            <IndicatorCard>
                                <div>{t("quality")}</div>
                                <SubunitCardWrap>
                                    {subunits.map((subunit) => (
                                        <UnitGoalReach
                                            unit={subunit.label}
                                            groups={subunit.groups.filter(
                                                (group) =>
                                                    group && group.dashboard && group.showQuality,
                                            )}
                                            indicator='quality'
                                        />
                                    ))}
                                </SubunitCardWrap>
                            </IndicatorCard>
                        </div>
                    </Card>
                </Tab.Pane>
            );
        });
    }, [calculatedData]);

    const realizationCards = useMemo(() => {
        return Object.keys(calculatedData)
            .map((unit) => {
                const unitLabel = calculatedData[unit].label;
                const subunits = calculatedData[unit].subunits.filter((o) => o);
                const realizationCards = subunits.map((subunit) => {
                    const subunitLabel = subunit.label;
                    return subunit.groups
                        .filter((group) => group.realization == -1 || group.realization == 0)
                        .map((group) => {
                            return (
                                <GroupGoalReach
                                    name={group.label}
                                    unit={subunitLabel}
                                    value={group.total}
                                    goal={group.realizationGoal}
                                    reached={group.realization}
                                />
                            );
                        });
                });
                return (
                    <UnitCard setModalCards={setModalCards} setShow={setShow} unit={unitLabel}>
                        {_.flatten(realizationCards).sort((a, b) => {
                            const { goal: aGoal, value: aValue } = a.props;
                            const { goal: bGoal, value: bValue } = b.props;
                            const aDiff = aValue / aGoal;
                            const bDiff = bValue / bGoal;
                            return aDiff - bDiff;
                        })}
                    </UnitCard>
                );
            })
            .sort((a, b) =>
                a?.props?.unit === selectedTab ? -1 : b?.props?.unit === selectedTab ? 1 : 0,
            );
    }, [calculatedData, selectedTab]);

    const qualityCards = useMemo(() => {
        return Object.keys(calculatedData)
            .map((unit) => {
                const unitLabel = calculatedData[unit].label;
                const subunits = calculatedData[unit].subunits.filter((o) => o);
                const qualityGoal = subunits.map((subunit) => {
                    const subunitLabel = subunit.label;
                    return subunit.groups
                        .filter((group) => group.quality == -1 || props.quality == -0)
                        .map((group) => {
                            return (
                                <GroupGoalReach
                                    name={group.label}
                                    unit={subunitLabel}
                                    value={group.bad / group.total}
                                    goal={group.qualityGoal / 100}
                                    indicator={"quality"}
                                    reached={group.quality}
                                />
                            );
                        });
                });
                return (
                    <UnitCard setModalCards={setModalCards} setShow={setShow} unit={unitLabel}>
                        {_.flatten(qualityGoal).sort((a, b) => {
                            const { goal: aGoal, value: aValue } = a.props;
                            const { goal: bGoal, value: bValue } = b.props;
                            const aDiff = aValue / aGoal;
                            const bDiff = bValue / bGoal;
                            return bDiff - aDiff;
                        })}
                    </UnitCard>
                );
            })
            .sort((a, b) =>
                a?.props?.unit === selectedTab ? -1 : b?.props?.unit === selectedTab ? 1 : 0,
            );
    }, [calculatedData, setShow, setModalCards, selectedTab]);

    return (
        <StyledContainer className='p-0'>
            <Tab.Container
                defaultActiveKey={selectedTab}
                onSelect={(key) => {
                    setSelectedTab(key);
                }}
            >
                <Nav variant='pills' className='mb-2'>
                    {unitLabels
                        ?.filter((unit) => unit.sfm)
                        ?.map((unit) => {
                            return (
                                <Nav.Item key={"nav_item_" + unit.keyword}>
                                    <UnitSelector eventKey={unit.keyword}>
                                        {t(unit.keyword)}
                                    </UnitSelector>
                                </Nav.Item>
                            );
                        })}
                </Nav>
                <Tab.Content>{tabs}</Tab.Content>
            </Tab.Container>
            <h5 className='mt-4'>{t("realization")}</h5>
            <Card style={{ width: "100%", padding: "0.5rem 2rem" }}>
                <Row>
                    <div className='d-flex flex-wrap'>{realizationCards}</div>
                </Row>
            </Card>

            <h5 className='mt-4'>{t("quality")}</h5>
            <Card className='mb-3' style={{ width: "100%", padding: "0.5rem 2rem" }}>
                <Row>
                    <div className='d-flex flex-wrap '>{qualityCards}</div>
                </Row>
            </Card>
            <Modal show={show} onHide={() => setShow(false)}>
                <div style={{ padding: "2rem" }}>{modalCards}</div>
            </Modal>
        </StyledContainer>
    );
}

export default Overview;
