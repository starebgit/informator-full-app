import { useMemo, useState } from "react";
import { Modal, Nav, Tab } from "react-bootstrap";
import _ from "lodash";
import MontazaModal from "./ModalContent/MontazaModal";
import DefaultModal from "./ModalContent/DefaultModal";
import { useQuery } from "react-query";
import { sinaproClient } from "../../feathers/feathers";
import { useTranslation } from "react-i18next";
import ParetoModal from "./ModalContent/ParetoModal";
import { PulseLoader } from "react-spinners";
import styled from "styled-components";
import { filteredMachineGroupNames, useScrapData } from "../../utils/utils";

const BigModal = styled(Modal)`
    .modal-dialog {
        min-width: 70vw;
    }
`;

function ScrapModal({
    machineGroup,
    selectedMonth,
    setShowModal,
    showModal,
    data = [],
    dataPeka = [],
    selectedUnit,
    setSelectedMonth,
    ...props
}) {
    const [loaded, setLoaded] = useState(false);
    const { t } = useTranslation("labels");
    const hideHandler = () => {
        setShowModal(false);
    };

    const machineGroupMachines = useMemo(
        () => machineGroup?.machines.map((machine) => String(machine.machineAltKey)),
        [machineGroup],
    );

    const productionData = useQuery(
        ["production", selectedMonth.format("MM-YYYY"), selectedUnit.ted],
        () => {
            return sinaproClient.service("machine-production").find({
                query: {
                    start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    ted: selectedUnit.ted + "",
                },
            });
        },
    );

    const scrapData = useScrapData(selectedMonth, machineGroup, selectedUnit);

    if (scrapData?.data && Object.keys(filteredMachineGroupNames).includes(machineGroup?.name)) {
        var filteredScrapData = filterScrapData(
            JSON.parse(JSON.stringify(scrapData?.data)),
            machineGroup?.name,
        );
        scrapData.data = [];
        scrapData.data.splice(0, scrapData.data.length);
        scrapData.data = filteredScrapData;
    }

    const scrapDataAssembly = useQuery(
        ["scrap", selectedMonth.format("MM-YYYY"), machineGroup?.id, "assembly"],
        () => {
            return sinaproClient.service("scrap").find({
                query: {
                    start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    ted: selectedUnit.ted + "",
                    source: "assembly",
                    replace:
                        '{"408424800": 448880300, "408424900":448880400, "408425000": 448880500, "408425100": 448880600}',
                },
            });
        },
        { enabled: !!machineGroup && +selectedUnit.ted === 404 },
    );

    const scrapDataPackaging = useQuery(
        ["scrap", selectedMonth.format("MM-YYYY"), machineGroup?.id, "packaging"],
        () => {
            return sinaproClient.service("scrap").find({
                query: {
                    start: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    end: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    ted: selectedUnit.ted + "",
                    source: "packaging",
                    replace:
                        '{"408424800": 449980300, "408424900":400411900, "408425000": 449980500, "408425100": 449980600}',
                },
            });
        },
        { enabled: !!machineGroup && +selectedUnit.ted === 404 },
    );

    const passOnProps = {
        machineGroup: machineGroup,
        selectedMonth: selectedMonth,
        selectedUnit: selectedUnit,
        data: scrapData?.data,
        dataAssembly: scrapDataAssembly?.data,
        dataPackaging: scrapDataPackaging?.data,
        loaded: loaded,
    };

    return (
        <BigModal
            centered
            show={showModal}
            onEnter={() => {
                setLoaded(true);
            }}
            onHide={() => hideHandler()}
        >
            <Modal.Header className='d-flex flex-col align-items-center pb-0'>
                <Modal.Title>
                    {machineGroup?.name}
                    <h6>{`${t("detailed_data_about_scrap")} - ${selectedMonth.format(
                        "MMMM YYYY",
                    )}`}</h6>
                </Modal.Title>

                <button
                    type='button'
                    className='btn-close mb-1'
                    aria-label='Close'
                    onClick={() => setShowModal(false)}
                ></button>
            </Modal.Header>
            <Modal.Body>
                {scrapData.isLoading ||
                scrapDataAssembly.isLoading ||
                scrapDataPackaging.isLoading ? (
                    <div className='d-flex h-100 justify-content-center align-items-center'>
                        <PulseLoader color='#2c3e50' size={15} margin={10} />
                    </div>
                ) : (
                    <Tab.Container
                        id='scrap_modal_tabs'
                        defaultActiveKey={props?.defaultTab || "first"}
                    >
                        <Nav variant='tabs'>
                            <Nav.Item>
                                <Nav.Link eventKey='first'>{t("monthly_view")}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey='second'>{t("pareto")}</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Tab.Content className='px-0 mx-0 px-xl-5 mx-xl-5'>
                            <Tab.Pane eventKey='first' className='p-4'>
                                {machineGroup?.id == 21
                                    ? loaded && <MontazaModal {...passOnProps} />
                                    : loaded && <DefaultModal {...passOnProps} />}
                            </Tab.Pane>
                            <Tab.Pane eventKey='second' className='p-4'>
                                {machineGroupMachines && productionData && (
                                    <ParetoModal
                                        repair={scrapData?.data?.some((entry) => entry.repair)}
                                        query={scrapData}
                                        productionData={productionData.data?.filter((entry) =>
                                            machineGroupMachines.includes(
                                                String(entry.machineKeyAlt),
                                            ),
                                        )}
                                        machineGroup={machineGroup}
                                        setSelectedMonth={setSelectedMonth}
                                        selectedMonth={selectedMonth}
                                    />
                                )}
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                )}
            </Modal.Body>
        </BigModal>
    );
}
export default ScrapModal;

function filterScrapData(scrapData, machineGroupName) {
    const flawLocation = machineGroupName ? filteredMachineGroupNames[machineGroupName] : null;
    return flawLocation ? scrapData?.filter((item) => item.flawlocation === flawLocation) : [];
}
