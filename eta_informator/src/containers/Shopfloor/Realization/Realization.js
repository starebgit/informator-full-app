import React, { useContext, useState, Fragment, useRef, useEffect } from "react";
import { Row, Col, Tab, Nav } from "react-bootstrap";
import DynamicGrid from "../../../components/DynamicGrid/DynamicGrid";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useQuery, useQueryClient } from "react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { GridItem } from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import Select from "../../../components/Forms/CustomInputs/Select/Select";
import _ from "lodash";
import { generateMachinesLabels } from "../../../data/Formaters/Informator";
import GraphSwitchCard from "../../../components/GraphSwitchCard/GraphSwitchCard";
import MachineGroupGraph from "../../../components/MachineGroupGraph/MachineGroupGraph";
import MachineGraph from "../../../components/MachineGraph/MachineGraph";
import client, { sinaproClient } from "../../../feathers/feathers";
import CategoryPane from "../Attachments/CategoryPane";
const StyledNav = styled(Nav)`
    font-size: var(--body) !important;

    *.active {
        color: white !important;
        background-color: var(--bs-primary) !important;
        font-weight: bold;
    }
    .nav-tabs .nav-link.active,
    .nav-tabs .nav-item.show .nav-link {
        color: green;
        background-color: #fff;
        minheight: 48px !important;
        padding: 12px 0px !important;
    }
`;

const StyledContainer = styled.div`
    ${"" /* box-shadow: 0px 5px 15px lightgray; */}
    margin-bottom: var(--s1);
`;

function Realization(props) {
    const { state, dispatch } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [save, setSave] = useState(false);
    const [reset, setReset] = useState(false);
    const [editable, setEditable] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [selectedMachineGroup, setSelectedMachineGroup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const bottomScrollRef = useRef(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const { t } = useTranslation("shopfloor");
    const selectedMachines = JSON.parse(
        queryClient.getQueryData(["userSettings", state?.user.id]).selectedMachines.value,
    )[props.selectedUnit.keyword];

    useEffect(() => {
        setSelectedMachine(null);
    }, [props.selectedUnit]);

    const scrollToBottom = () => {
        if (selectedAttachment) {
            bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setTimeout(() => {
                bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 200);
        }
    };

    const sinaproData = useQuery(
        ["production", props.selectedMonth.format("MM-YYYY"), props.selectedUnit.ted],
        () => {
            return sinaproClient.service("machine-production").find({
                query: {
                    start: props.selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    end: props.selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    ted: props.selectedUnit.ted + "",
                },
            });
        },
    );

    const staticData = useQuery(["static", props.selectedMonth.format("MM-YYYY")], () => {
        return client
            .service("production-data-static")
            .find({
                query: {
                    date: {
                        $lte: props.selectedMonth.endOf("month"),
                        $gte: props.selectedMonth.startOf("month"),
                    },
                },
            })
            .then((response) => {
                const { data } = response;
                return data;
            });
    });

    const attachments = useQuery(
        [
            "attachments",
            props.selectedUnit.subunitId,
            props.selectedMonth.format("MM"),
            "realization",
        ],
        () =>
            client
                .service("attachments")
                .find({
                    query: {
                        categoryId: 7,
                        subunitId: props.selectedUnit.subunitId,
                        startDate: { $lte: props.selectedMonth.endOf("month") },
                        endDate: { $gte: props.selectedMonth.startOf("month") },
                    },
                })
                .then((response) => {
                    const { data } = response;
                    return data;
                }),
    );

    const isEditableHandler = (bool) => {
        setEditable(bool);
    };

    const onClickHandler = (doc) => {
        setSelectedAttachment(doc);
        scrollToBottom();
    };

    const onSavedLayout = () => {
        props.saveLayoutsHandler("realization");
        isEditableHandler(false);
    };

    const resetHandler = () => {
        setReset(true);
        setEditable(false);
    };

    const resize = () => {
        if (typeof Event === "function") {
            // modern browsers
            setTimeout(() => {
                window.dispatchEvent(new Event("resize"));
            }, 50);
        } else {
            // for IE and other old browsers
            // causes deprecation warning on modern browsers
            var evt = window.document.createEvent("UIEvents");
            evt.initUIEvent("resize", true, false, window, 0);
            setTimeout(() => {
                window.dispatchEvent(evt);
            }, 50);
        }
    };

    const openMoreModal = (machineGroup) => {
        setSelectedMachineGroup(machineGroup);
        setShowModal(true);
    };

    const machineGroupeCard = React.useMemo(
        () =>
            props.machineGroups
                .filter((mg) => mg.realization == 1)
                .map((mg, index) => {
                    var machinesLabels = mg.static
                        ? mg.machineGroupsGroups.map((m) => m.groupId)
                        : mg.machines.map((m) => {
                              return { key: m.machineAltKey, name: m.name };
                          });
                    machinesLabels = _.orderBy(machinesLabels, "name", "asc");
                    const categories = mg.static
                        ? ["sum"]
                        : ["sum", mg.perShift ? "shift" : null, mg.perMachine ? "machine" : null];

                    return (
                        <GridItem
                            key={mg.id}
                            data-grid={{
                                w: 6,
                                h: 10,
                                x: 0 + ((index * 6) % 12),
                                y: 0,
                                minW: 4,
                                minH: 8,
                            }}
                        >
                            <GraphSwitchCard
                                title={t(mg.name)}
                                categories={categories}
                                icon='table'
                                actions={
                                    mg.static
                                        ? []
                                        : [
                                              {
                                                  onClick: openMoreModal,
                                                  icon: "table",
                                              },
                                          ]
                                }
                                machineGroup={mg}
                            >
                                <MachineGroupGraph
                                    indicator='realization'
                                    valueType='total'
                                    machines={machinesLabels}
                                    machineGroupData={
                                        mg.static
                                            ? staticData?.data?.filter((row) => {
                                                  return machinesLabels.some(
                                                      (label) =>
                                                          Number(label) ==
                                                          Number(row?.groupsStaticId),
                                                  );
                                              })
                                            : sinaproData?.data?.filter((row) => {
                                                  return machinesLabels.some(
                                                      (label) =>
                                                          Number(label.key) ==
                                                          Number(row?.machineKeyAlt),
                                                  );
                                              })
                                    }
                                    machineGroup={mg}
                                    selectedMonth={props.selectedMonth}
                                    goals={true}
                                    showModal={showModal}
                                    setShowModal={setShowModal}
                                    selectedMachineGroup={selectedMachineGroup}
                                ></MachineGroupGraph>
                            </GraphSwitchCard>
                        </GridItem>
                    );
                }),
        [
            props.machineGroups,
            sinaproData,
            props.selectedMonth,
            selectedMachineGroup,
            showModal,
            staticData?.data,
            t,
        ],
    );

    const selectedMachinesCards = React.useMemo(
        () =>
            selectedMachines?.map((machine, index) => {
                const [name] = props.machines?.filter((m) => {
                    return m.idAlt == machine;
                });
                return (
                    <GridItem
                        key={name?.name + "realization"}
                        data-grid={{
                            w: 6,
                            h: 10,
                            x: 0 + ((index * 6) % 12),
                            y: 0,
                            minW: 4,
                            minH: 8,
                        }}
                    >
                        <GraphSwitchCard title={name?.name} categories={["sum", "shift", "buyer"]}>
                            <MachineGraph
                                indicator='realization'
                                valueType='total'
                                machineData={sinaproData?.data?.filter((row) => {
                                    return row.machineKeyAlt == machine;
                                })}
                                machine={machine}
                                selectedMonth={props.selectedMonth}
                            />
                        </GraphSwitchCard>
                    </GridItem>
                );
            }),
        [selectedMachines, props.machines, props.selectedMonth, sinaproData?.data],
    );

    return (
        <Fragment>
            <Tab.Container id='tabs' defaultActiveKey='skupine_strojev'>
                <StyledContainer>
                    <StyledNav variant='tabs' onSelect={() => resize()}>
                        <Nav.Item>
                            <Nav.Link eventKey='skupine_strojev'>
                                {t("machine_group", { count: 3 })}
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey='izbrani_stroji'>
                                {t("selected_machine", { count: 3 })}
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey='vsi_stroji'>{t("all_machines")}</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey='attachments'>{t("attachments")}</Nav.Link>
                        </Nav.Item>
                        {editable ? (
                            <div className='ms-auto me-3 my-auto text-muted'>
                                <FontAwesomeIcon
                                    className='mx-2'
                                    icon='check'
                                    onClick={() => onSavedLayout()}
                                    size='lg'
                                />
                                <FontAwesomeIcon
                                    className='ms-2'
                                    icon='times'
                                    onClick={() => resetHandler()}
                                    size='lg'
                                />
                            </div>
                        ) : (
                            <FontAwesomeIcon
                                className='my-auto me-3 ms-auto text-muted'
                                onClick={() => isEditableHandler(true)}
                                icon='bars'
                                size='lg'
                            />
                        )}
                    </StyledNav>
                    <Tab.Content style={{ boxShadow: "2px 2px 10px -2px #cccccc" }}>
                        <Tab.Pane eventKey='skupine_strojev'>
                            <Row>
                                <Col>
                                    {machineGroupeCard?.length > 0 ? (
                                        <DynamicGrid
                                            source='realization'
                                            isEditable={editable}
                                            save={save}
                                            reset={reset}
                                            setReset={setReset}
                                            setTempLayoutsHandler={props.setTempLayoutsHandler}
                                            layouts={props.layouts?.realization}
                                            initLayoutsHandler={props.initLayoutsHandler}
                                        >
                                            {machineGroupeCard}
                                        </DynamicGrid>
                                    ) : (
                                        <div
                                            style={{ height: "225px" }}
                                            className='d-flex justify-content-center align-items-center'
                                        >
                                            <h4 className='text-muted'>{t("no_machine_groups")}</h4>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='izbrani_stroji'>
                            <Row>
                                <Col>
                                    {selectedMachinesCards?.length > 0 ? (
                                        <DynamicGrid
                                            source='realization_selected'
                                            isEditable={editable}
                                            save={save}
                                            reset={reset}
                                            setReset={setReset}
                                            setTempLayoutsHandler={props.setTempLayoutsHandler}
                                            layouts={props.layouts?.realization_selected}
                                            initLayoutsHandler={props.initLayoutsHandler}
                                        >
                                            {selectedMachinesCards}
                                        </DynamicGrid>
                                    ) : (
                                        <div
                                            style={{ height: "225px" }}
                                            className='d-flex justify-content-center align-items-center'
                                        >
                                            <h4 className='text-muted'>
                                                {t("no_selected_machines")}
                                            </h4>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane className='p-xs-1 p-4' eventKey='vsi_stroji'>
                            <Row>
                                <Col>
                                    <Select
                                        style={{ position: "relative" }}
                                        options={generateMachinesLabels(props.machines)}
                                        value={selectedMachine}
                                        onChange={(machine) => {
                                            setSelectedMachine(machine);
                                        }}
                                        placeholder={t("select_machine")}
                                    />
                                    <label>{t("machine")}</label>
                                </Col>
                            </Row>
                            <Row className='p-xs-1 p-1'>
                                <Col className='text-center'>
                                    {selectedMachine && (
                                        <GraphSwitchCard
                                            style={{ minHeight: "450px" }}
                                            title={selectedMachine.label}
                                        >
                                            <MachineGraph
                                                indicator='realization'
                                                valueType='total'
                                                machineData={sinaproData?.data?.filter((row) => {
                                                    return (
                                                        row.machineKeyAlt == selectedMachine.value
                                                    );
                                                })}
                                                machine={selectedMachine.value}
                                                selectedMonth={props.selectedMonth}
                                            />
                                        </GraphSwitchCard>
                                    )}
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='attachments'>
                            <Row>
                                <Col>
                                    <CategoryPane
                                        attachments={attachments?.data?.filter((doc) => {
                                            if (props.selectedMonth.isSame(dayjs(), "month")) {
                                                return (
                                                    dayjs(doc.startDate).isSameOrBefore(
                                                        dayjs(),
                                                        "day",
                                                    ) &&
                                                    dayjs(doc.endDate).isSameOrAfter(dayjs(), "day")
                                                );
                                            }
                                            return true;
                                        })}
                                        selectedAttachment={selectedAttachment}
                                        onClickHandler={onClickHandler}
                                    />
                                    <div ref={bottomScrollRef} />
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </Fragment>
    );
}

export default React.memo(Realization);
