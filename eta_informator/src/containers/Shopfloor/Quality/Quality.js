import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Tab, Nav } from "react-bootstrap";
import DynamicGrid from "../../../components/DynamicGrid/DynamicGrid";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useQuery, useQueryClient } from "react-query";
import dayjs from "dayjs";
import {
    GridItem,
    StyledContainer,
    StyledNav,
} from "../../../components/UI/ShopfloorCard/ShopfloorCard";
import { Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { getTedQueryList } from "../../../utils/shopfloor/ted";
import Select from "../../../components/Forms/CustomInputs/Select/Select";
import client, { sinaproClient } from "../../../feathers/feathers";
import { generateMachinesLabels } from "../../../data/Formaters/Informator";
import GraphSwitchCard from "../../../components/GraphSwitchCard/GraphSwitchCard";
import MachineGraph from "../../../components/MachineGraph/MachineGraph";
import MachineGroupGraph from "../../../components/MachineGroupGraph/MachineGroupGraph";
import _ from "lodash";
import ScrapModal from "../../../components/ScrapModal/ScrapModal";
import CategoryPane from "../Attachments/CategoryPane";
import ScrapGroupGraph from "../../../components/ScrapGroupGraph/ScrapGroupGraph";

function Quality({
    machineGroup,
    selectedUnit,
    selectedMonth,
    machineGroups,
    machines,
    setTempLayoutsHandler,
    initLayoutsHandler,
    layouts,
    saveLayoutsHandler,
    setSelectedMonth,
    ...props
}) {
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [save, setSave] = useState(false);
    const [reset, setReset] = useState(false);
    const [editable, setEditable] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showModalQuality, setShowModalQuality] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [selectedMachineGroup, setSelectedMachineGroup] = useState(null);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const bottomScrollRef = useRef(null);
    const { t } = useTranslation("shopfloor");
    const selectedMachines = JSON.parse(
        queryClient.getQueryData(["userSettings", state?.user.id]).selectedMachines.value,
    )[selectedUnit.keyword];

    useEffect(() => {
        setSelectedMachine(null);
    }, [selectedUnit]);

    const scrollToBottom = () => {
        if (selectedAttachment) {
            bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setTimeout(() => {
                bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 200);
        }
    };
    const [scrapModalDefaultTab, setScrapModalDefaultTab] = useState("first");

    const showModalQualityHandler = useCallback((machineGroup) => {
        setSelectedMachineGroup(machineGroup);
        setScrapModalDefaultTab("first");
        setShowModalQuality(true);
    }, []);

    const showModalHandler = useCallback((machineGroup) => {
        setSelectedMachineGroup(machineGroup);
        setShowModal(true);
    }, []);

    const showParetoHandler = useCallback((machineGroup) => {
        setSelectedMachineGroup(machineGroup);
        setScrapModalDefaultTab("second");
        setShowModalQuality(true);
    }, []);

    const onClickHandler = (doc) => {
        setSelectedAttachment(doc);
        scrollToBottom();
    };

    const sinaproData = useQuery(
        ["production", selectedMonth.format("MM-YYYY"), selectedUnit.ted],
        async () => {
            const tedIds = getTedQueryList(selectedUnit.ted);
            const responses = await Promise.all(
                tedIds.map((tedId) =>
                    sinaproClient.service("machine-production").find({
                        query: {
                            start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                            end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                            ted: tedId + "",
                        },
                    }),
                ),
            );

            return {
                data: responses.flatMap((response) => response.data),
            };
        },
    );

    const staticData = useQuery(["static", selectedMonth.format("MM-YYYY")], () => {
        return client
            .service("production-data-static")
            .find({
                query: {
                    date: {
                        $lte: selectedMonth.endOf("month"),
                        $gte: selectedMonth.startOf("month"),
                    },
                },
            })
            .then((response) => {
                const { data } = response;
                return data;
            });
    });

    const pdf = useQuery(
        ["attachments", selectedUnit.subunitId, selectedMonth.format("MM"), "quality"],
        () =>
            client
                .service("attachments")
                .find({
                    query: {
                        categoryId: 5,
                        subunitId: selectedUnit.subunitId,
                        startDate: { $lte: selectedMonth.endOf("month") },
                        endDate: { $gte: selectedMonth.startOf("month") },
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

    const onSavedLayout = () => {
        saveLayoutsHandler("quality");
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

    const machineGroupeCard = useMemo(
        () =>
            machineGroups
                ? machineGroups
                      .filter((mg) => mg.quality == 1)
                      .map((mg, index) => {
                          var machinesLabels = mg.static
                              ? mg.machineGroupsGroups.map((m) => m.groupId)
                              : mg.machines.map((m) => {
                                    return { key: m.machineAltKey, name: m.name };
                                });
                          machinesLabels = _.orderBy(machinesLabels, "name", "asc");
                          const categories =
                              mg.static || [93, 96, 97, 114].includes(mg.id)
                                  ? ["sum"]
                                  : [
                                        "sum",
                                        mg.perShift ? "shift" : null,
                                        mg.perMachine ? "machine" : null,
                                    ];
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
                                      actions={
                                          !mg.static
                                              ? [
                                                    {
                                                        onClick: showModalQualityHandler,
                                                        icon: "info-circle",
                                                    },
                                                    ...([93, 96, 97, 114].includes(mg.id)
                                                        ? []
                                                        : [
                                                              {
                                                                  onClick: showModalHandler,
                                                                  icon: "table",
                                                              },
                                                          ]),
                                                    {
                                                        button: true,
                                                        onClick: showParetoHandler,
                                                        icon: "chart-bar",
                                                        text: "Pareto",
                                                        className: "btn-sm",
                                                    },
                                                ]
                                              : []
                                      }
                                      machineGroup={mg}
                                      title={t(mg.name)}
                                      categories={categories}
                                  >
                                      {[93, 96, 97, 114].includes(mg.id) ? (
                                          <ScrapGroupGraph
                                              category='sum'
                                              selectedMonth={selectedMonth}
                                              machineGroup={mg}
                                              selectedUnit={selectedUnit}
                                              height='250px'
                                              filterTooltip={true}
                                              showModal={showModal}
                                              setShowModal={setShowModal}
                                              selectedMachineGroup={selectedMachineGroup}
                                              indicator='quality'
                                              valueType='percentage'
                                              machines={machinesLabels}
                                              goals={false}
                                          />
                                      ) : (
                                          <MachineGroupGraph
                                              indicator='quality'
                                              valueType='percentage'
                                              machines={machinesLabels}
                                              machineGroupData={
                                                  mg.static
                                                      ? staticData?.data?.filter((row) => {
                                                            return machinesLabels?.some(
                                                                (label) =>
                                                                    Number(label) ==
                                                                    Number(row.groupsStaticId),
                                                            );
                                                        })
                                                      : sinaproData?.data?.filter((row) => {
                                                            return machinesLabels?.some(
                                                                (label) =>
                                                                    Number(label.key) ==
                                                                    Number(row.machineKeyAlt),
                                                            );
                                                        })
                                              }
                                              machineGroup={mg}
                                              selectedMonth={selectedMonth}
                                              goals={true}
                                              showModal={showModal}
                                              setShowModal={setShowModal}
                                              selectedMachineGroup={selectedMachineGroup}
                                          ></MachineGroupGraph>
                                      )}
                                  </GraphSwitchCard>
                              </GridItem>
                          );
                      })
                : null,

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [machineGroups, staticData, sinaproData, selectedMonth],
    );

    const selectedMachinesCard = React.useMemo(
        () =>
            selectedMachines?.map((machine, index) => {
                const [name] = machines?.filter((m) => {
                    return m.idAlt == machine;
                });
                return (
                    <GridItem
                        key={name?.name + "quality"}
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
                                indicator='quality'
                                valueType='percentage'
                                machineData={sinaproData?.data?.filter((row) => {
                                    return row.machineKeyAlt == machine;
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
                                            source='quality'
                                            isEditable={editable}
                                            save={save}
                                            reset={reset}
                                            setReset={setReset}
                                            setTempLayoutsHandler={setTempLayoutsHandler}
                                            layouts={layouts?.quality}
                                            initLayoutsHandler={initLayoutsHandler}
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
                                    {selectedMachinesCard?.length > 0 ? (
                                        <DynamicGrid
                                            source='quality_selected'
                                            isEditable={editable}
                                            save={save}
                                            reset={reset}
                                            setReset={setReset}
                                            setTempLayoutsHandler={setTempLayoutsHandler}
                                            layouts={layouts?.quality_selected}
                                            initLayoutsHandler={initLayoutsHandler}
                                        >
                                            {selectedMachinesCard}
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
                                        options={generateMachinesLabels(
                                            machines?.length > 0 ? machines : [],
                                        )}
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
                                                indicator='quality'
                                                valueType='percentage'
                                                machineData={sinaproData?.data?.filter((row) => {
                                                    return (
                                                        row.machineKeyAlt == selectedMachine.value
                                                    );
                                                })}
                                                machine={selectedMachine.value}
                                                selectedMonth={selectedMonth}
                                                setSelectedMonth={setSelectedMonth}
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
                                        attachments={pdf?.data?.filter((doc) => {
                                            if (selectedMonth.isSame(dayjs(), "month")) {
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
            <ScrapModal
                showModal={showModalQuality}
                setShowModal={setShowModalQuality}
                machineGroup={selectedMachineGroup}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedUnit={selectedUnit}
                defaultTab={scrapModalDefaultTab}
            />
        </Fragment>
    );
}

export default Quality;
