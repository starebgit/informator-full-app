import { useQuery, useQueryClient } from "react-query";
import React from "react";
import dayjs from "dayjs";
import jsonata from "jsonata";
import { Fragment, useContext, useState } from "react";
import { Row, Col, Tab, Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    GridItem,
    StyledContainer,
    StyledNav,
} from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import DynamicGrid from "../../../components/DynamicGrid/DynamicGrid";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { sinaproClient } from "../../../feathers/feathers";
import Select from "../../../components/Forms/CustomInputs/Select/Select";
import { generateMachinesLabels } from "../../../data/Formaters/Informator";
import GraphSwitchCard from "../../../components/GraphSwitchCard/GraphSwitchCard";
import MachineGraph from "../../../components/MachineGraph/MachineGraph";
import MachineGroupGraph from "../../../components/MachineGroupGraph/MachineGroupGraph";
import _ from "lodash";
import { ClipLoader } from "react-spinners";

// TODO - Spread props
function Oee({ selectedUnit, selectedMonth, machines, ...props }) {
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [save, setSave] = useState(false);
    const [reset, setReset] = useState(false);
    const [editable, setEditable] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [selectedMachineGroup, setSelectedMachineGroup] = useState(null);
    const { t } = useTranslation("shopfloor");
    const selectedMachines = JSON.parse(
        queryClient.getQueryData(["userSettings", state?.user.id]).selectedMachines.value,
    )[selectedUnit.keyword];

    const sinaproData = useQuery(["oee", selectedMonth.format("MM-YYYY"), selectedUnit.ted], () => {
        return sinaproClient.service("oee").find({
            query: {
                start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                id: selectedUnit.ted + "",
            },
        });
    });

    const isEditableHandler = (bool) => {
        setEditable(bool);
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
                .filter((mg) => mg.oee == 1)
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
                                title={mg.name}
                                categories={categories}
                                actions={[{ onClick: openMoreModal, icon: "table" }]}
                                machineGroup={mg}
                            >
                                <MachineGroupGraph
                                    indicator='oee'
                                    valueType='oee'
                                    machines={machinesLabels}
                                    machineGroupData={
                                        mg.static
                                            ? []
                                            : sinaproData?.data?.filter((row) =>
                                                  machinesLabels?.some(
                                                      (label) =>
                                                          Number(label.key) ==
                                                          Number(row.machineID),
                                                  ),
                                              )
                                    }
                                    machineGroup={mg}
                                    selectedMonth={selectedMonth}
                                    goals={true}
                                    showModal={showModal}
                                    setShowModal={setShowModal}
                                    selectedMachineGroup={selectedMachineGroup}
                                ></MachineGroupGraph>
                            </GraphSwitchCard>
                        </GridItem>
                    );
                }),
        [props.machineGroups, sinaproData, selectedMachineGroup, showModal, selectedMonth],
    );

    const selectedMachinesCards = React.useMemo(
        () =>
            selectedMachines?.map((machine, index) => {
                const [name] = machines?.filter((m) => {
                    return m.idAlt == machine;
                });
                return (
                    <GridItem
                        key={machine}
                        data-grid={{
                            w: 6,
                            h: 10,
                            x: 0 + ((index * 6) % 12),
                            y: 0,
                            minW: 4,
                            minH: 8,
                        }}
                    >
                        <GraphSwitchCard title={name?.name}>
                            <MachineGraph
                                indicator='oee'
                                valueType='oee'
                                machineData={sinaproData?.data?.filter((row) => {
                                    return Number(row.machineID) == Number(machine);
                                })}
                                machine={machine}
                                selectedMonth={selectedMonth}
                            />
                        </GraphSwitchCard>
                    </GridItem>
                );
            }),
        [selectedMachines, machines, selectedMonth, sinaproData?.data],
    );

    if (sinaproData.isLoading)
        return (
            <div
                className='d-flex h-100 justify-content-center align-items-center'
                style={{ minHeight: "600px" }}
            >
                <ClipLoader size='150px' />
            </div>
        );

    if (sinaproData.isError) return <h1>Error</h1>;

    return (
        <Fragment>
            <Tab.Container
                id='tabs'
                onSelect={() => {
                    resize();
                }}
                defaultActiveKey='skupine_strojev'
            >
                <StyledContainer>
                    <StyledNav variant='tabs'>
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
                                    <DynamicGrid
                                        source='oee'
                                        isEditable={editable}
                                        save={save}
                                        reset={reset}
                                        setReset={setReset}
                                        setTempLayoutsHandler={props.setTempLayoutsHandler}
                                        layouts={props.layouts?.oee}
                                        initLayoutsHandler={props.initLayoutsHandler}
                                    >
                                        {machineGroupeCard}
                                    </DynamicGrid>
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='izbrani_stroji'>
                            <Row>
                                <Col>
                                    <DynamicGrid
                                        source='oee_selected'
                                        isEditable={editable}
                                        save={save}
                                        reset={reset}
                                        setReset={setReset}
                                        setTempLayoutsHandler={props.setTempLayoutsHandler}
                                        layouts={props.layouts?.oee_selected}
                                        initLayoutsHandler={props.initLayoutsHandler}
                                    >
                                        {selectedMachinesCards}
                                    </DynamicGrid>
                                </Col>
                            </Row>
                        </Tab.Pane>
                        <Tab.Pane eventKey='vsi_stroji'>
                            <Row>
                                <Col>
                                    <Select
                                        style={{ position: "relative" }}
                                        options={generateMachinesLabels(machines)}
                                        value={selectedMachine}
                                        onChange={(machine) => {
                                            setSelectedMachine(machine);
                                        }}
                                        placeholder={t("select_machine")}
                                    />
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
                                                indicator='oee'
                                                valueType='oee'
                                                machineData={sinaproData?.data?.filter((row) => {
                                                    return (
                                                        Number(row.machineID) ==
                                                        Number(selectedMachine.value)
                                                    );
                                                })}
                                                machine={selectedMachine.value}
                                                selectedMonth={selectedMonth}
                                            />
                                        </GraphSwitchCard>
                                    )}
                                </Col>
                            </Row>
                        </Tab.Pane>
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </Fragment>
    );
}
export default Oee;
