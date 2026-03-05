import { Modal, Row, Col } from "react-bootstrap";
import { CSVLink } from "react-csv";
import MachineGroupGraph from "../../MachineGroupGraph/MachineGroupGraph";
import GraphSwitchCard from "../../GraphSwitchCard/GraphSwitchCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import dayjs from "dayjs";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { exportToXLSX } from "../../../utils/utils";
import { useState, useEffect } from "react";
import { fetchMaterialsInfoBulk } from "../../../data/API/Informator/InformatorAPI";

function DefaultModal({ loaded, data = [], selectedMonth, machineGroup, ...props }) {
    const [materialNameMap, setMaterialNameMap] = useState({});
    // Izpis podatkov v konzolo ob mountu
    useEffect(() => {
        console.log("DefaultModal: podatki v data:", data);
    }, [data]);

    const machineGroupKeys = machineGroup?.machines.map((machineGroup) => ({
        key: machineGroup.machineAltKey,
        name: machineGroup.name,
    }));

    const machineGroupData = data?.filter((entry) =>
        machineGroupKeys?.some((m) => String(m.key) === String(entry.machineIdAlt)),
    );

    //materialCodesKey is here for tje useeffect not to rerender every time the array changes, to not have an infinite loop
    const materialCodesKey = JSON.stringify([
        ...new Set(
            (machineGroupData || [])
                .map((entry) => entry.productNumber)
                .filter((code) => !!code)
                .map((code) => code.toString()),
        ),
    ]);

    useEffect(() => {
        async function loadMaterialNames() {
            if (!machineGroupData || machineGroupData.length === 0) {
                setMaterialNameMap({});
                return;
            }

            const codes = [
                ...new Set(
                    machineGroupData
                        .map((entry) => entry.productNumber)
                        .filter((code) => !!code)
                        .map((code) => code.toString()),
                ),
            ];

            if (codes.length === 0) {
                setMaterialNameMap({});
                return;
            }

            try {
                const materialInfos = await fetchMaterialsInfoBulk(codes);

                const map = materialInfos.reduce((acc, info) => {
                    const key = parseInt(info.Code, 10);
                    acc[key] = info.Name || info.Description || info.NAZIV || "";
                    return acc;
                }, {});

                setMaterialNameMap(map);
            } catch (err) {
                console.error("Failed to fetch material names for modal export:", err);
                setMaterialNameMap({});
            }
        }

        loadMaterialNames();
    }, [materialCodesKey]);

    const charts = machineGroupKeys
        ?.sort((a, b) => a.key - b.key)
        .map((machine) => {
            const entries = data?.filter(
                (entry) => String(machine.key) === String(entry.machineIdAlt),
            );
            return (
                <Row
                    className='mb-2'
                    style={{ minHeight: "250px" }}
                    key={"scrapmodalchartrow_" + machine.key}
                >
                    <Col>
                        <GraphSwitchCard
                            title={machine?.name}
                            categories={["sum", "shift"]}
                            selectable
                            showScrapByMaterial
                            materialNameMap={materialNameMap}
                        >
                            {loaded && !!selectedMonth && (
                                <MachineGroupGraph
                                    goals={false}
                                    machineGroup={machineGroup}
                                    selectedMonth={selectedMonth}
                                    machineGroupData={entries}
                                    scrap
                                    machine={machine?.key}
                                    height='250px'
                                    filterTooltip={true}
                                />
                            )}
                        </GraphSwitchCard>
                    </Col>
                </Row>
            );
        });

    return (
        <>
            <div className='d-flex justify-content-between align-items-center'>
                <h3>Skupno</h3>
                <div>
                    <CSVLink
                        data={machineGroupData?.map((entry) => {
                            const codeNum = parseInt(entry.productNumber, 10);
                            return {
                                datum: entry.date,
                                material: entry.productNumber,
                                material_name:
                                    materialNameMap && materialNameMap[codeNum]
                                        ? materialNameMap[codeNum]
                                        : "",
                                izmena: entry.shift,
                                stroj: entry.machineLabel,
                                kolicina: entry.quantity,
                                napaka: entry.typeLabel,
                                komentar: entry.comment,
                            };
                        })}
                        filename={
                            dayjs().format("MM") +
                            "-" +
                            props.machineGroup?.name.toLowerCase() +
                            ".csv"
                        }
                        target='_blank'
                    >
                        <FontAwesomeIcon icon='download' color='gray' />
                    </CSVLink>
                    <FontAwesomeIcon
                        icon={faFileExcel}
                        color='gray'
                        style={{ marginLeft: 10 }}
                        onClick={() => {
                            const normalRows =
                                machineGroupData
                                    ?.filter((entry) => !entry.materialComponent)
                                    .map((entry) => {
                                        const codeNum = parseInt(entry.productNumber, 10);
                                        return {
                                            datum: entry.date,
                                            material: entry.productNumber,
                                            material_name:
                                                materialNameMap && materialNameMap[codeNum]
                                                    ? materialNameMap[codeNum]
                                                    : "",
                                            izmena: entry.shift,
                                            stroj: entry.machineLabel,
                                            kolicina: entry.quantity,
                                            napaka: entry.typeLabel,
                                            komentar: entry.comment,
                                        };
                                    }) || [];

                            const componentRows =
                                machineGroupData
                                    ?.filter((entry) => entry.materialComponent)
                                    .map((entry) => {
                                        const codeNum = parseInt(entry.productNumber, 10);
                                        return {
                                            datum: entry.date,
                                            material: entry.productNumber,
                                            material_name:
                                                materialNameMap && materialNameMap[codeNum]
                                                    ? materialNameMap[codeNum]
                                                    : "",
                                            izmena: entry.shift,
                                            stroj: entry.machineLabel,
                                            kolicina: entry.quantity,
                                            napaka: entry.typeLabel,
                                            komentar: entry.comment,
                                        };
                                    }) || [];

                            // Dodaj prazno vrstico in vrstico z napisom
                            const dataForXlsx = [
                                ...normalRows,
                                {}, // prazna vrstica
                                { datum: "Komponente materiala:" }, // vrstica z napisom
                                ...componentRows,
                            ];

                            exportToXLSX(
                                dataForXlsx,
                                dayjs().format("MM") + "-" + props.machineGroup?.name.toLowerCase(),
                            );
                        }}
                    />
                </div>
            </div>
            <Row className='mb-4' style={{ minHeight: "400px" }}>
                <Col>
                    <GraphSwitchCard
                        categories={["sum"]}
                        showScrapByMaterial
                        materialNameMap={materialNameMap}
                    >
                        {loaded && (
                            <MachineGroupGraph
                                goals={false}
                                machineGroup={machineGroup}
                                selectedMonth={selectedMonth}
                                machineGroupData={machineGroupData}
                                scrap
                                height='350px'
                                filterTooltip={true}
                            />
                        )}
                    </GraphSwitchCard>
                </Col>
            </Row>
            <h3>Po strojih</h3>
            {charts}
        </>
    );
}

export default DefaultModal;
