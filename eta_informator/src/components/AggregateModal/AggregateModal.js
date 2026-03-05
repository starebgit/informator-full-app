import { Col, Container, Modal, Row } from "react-bootstrap";
import _ from "lodash";
import dayjs from "dayjs";
import Table from "../Tables/Table";
import styled from "styled-components";
import { CSVLink } from "react-csv";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    startEndTimeArrayGenerator,
    tableForm,
    getMachineNameById,
} from "../../data/Formaters/Informator";
import Indicator from "../Indicators/Indicator";
import Select from "../Forms/CustomInputs/Select/Select";
import { useState, useMemo, useCallback } from "react";

import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import Worker from "../../workers/workerFetcher";
import ToggleGroup from "../ToggleGroup/ToggleGroup";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { exportToXLSX } from "../../utils/utils";

const BigModal = styled(Modal)`
    .modal-dialog {
        min-width: 90vw;
        height: 90vh;
    }
`;

const toggleButtons = [
    { name: "total", value: "sum" },
    { name: "per_shift", value: "shift" },
    { name: "per_machine", value: "machine" },
];

const conditionalRowStyles = [
    {
        when: (row) => row.sum,
        style: {
            borderTop: "1px solid gray",
        },
    },
];

function sortingFunction(a, b) {
    const sumA = a["sum"]; // ignore upper and lowercase
    const sumB = b["sum"]; // ignore upper and lowercase
    if (sumA) return 1;
    if (a.machine > b.machine || a.shift > b.shift) return 1;
    return -1;
}

function AggregateModal({
    monthData,
    machineGroup,
    selectedMonth,
    data,
    indicator,
    labels,
    showModal,
    setShowModal,
    machines,
    weeks,
    ...props
}) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedChartCategory, setSelectedChartCategory] = useState("sum");
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const { t } = useTranslation("shopfloor");
    let startDay = selectedMonth.startOf("month");
    let endDay = selectedMonth.endOf("month");

    //! Data querries
    const groupedData = useQuery(
        [machineGroup.name, indicator, "sum"],
        () => {
            const workerInst = Worker();
            return workerInst
                .groupDataProvider(data, {
                    indicator: indicator,
                    category: "sum",
                })
                .then((response) => {
                    workerInst.terminate();
                    return response;
                });
        },
        {
            onSuccess: (data) => {
                setChartData(generateChartData(data, "sum", null, labels));
            },
        },
    );
    const machineGroupedData = useQuery([machineGroup.name, indicator, "machine"], () => {
        const workerInst = Worker();
        return workerInst
            .groupDataProvider(data, {
                indicator: indicator,
                category: "machine",
            })
            .then((response) => {
                workerInst.terminate();
                return response;
            });
    });
    const shiftGroupedData = useQuery([machineGroup.name, indicator, "shift"], () => {
        const workerInst = Worker();
        return workerInst
            .groupDataProvider(data, {
                indicator: indicator,
                category: "shift",
            })
            .then((response) => {
                workerInst.terminate();
                return response;
            });
    });

    const generateColumns = useCallback(
        (weeks, category) => {
            const formater =
                indicator == "oee" || indicator == "quality"
                    ? new Intl.NumberFormat("sl", {
                          style: "percent",
                          minimumFractionDigits: indicator == "quality" ? 2 : 1,
                      })
                    : new Intl.NumberFormat("sl", {
                          style: "decimal",
                          maximumFractionDigits: 0,
                      });
            const columns = weeks.map((week) => {
                return {
                    name: t("T") + week,
                    selector: (row) => row[+week],
                    format: (row) => (isNaN(row[+week]) ? "" : formater.format(+row[+week])),
                    right: true,
                    width: "90px",
                };
            });
            columns.unshift({
                name: t(category),
                selector: (row) =>
                    category == "machine" ? getMachineNameById(machines, row.machine) : row.shift,

                grow: 3,
                wrap: true,
            });
            columns.push({
                name: t("total"),
                selector: (row) => row.all,
                format: (row) => formater.format(row.all),
                right: true,
            });
            return columns;
        },
        [t, machines, indicator],
    );

    //! Handlers
    const hideHandler = () => {
        setShowModal(false);
    };

    const onChartCategoryChangeHandler = (category) => {
        const data =
            category == "sum"
                ? groupedData?.data
                : category == "machine"
                ? machineGroupedData?.data
                : shiftGroupedData?.data;
        const option =
            category == "machine"
                ? { label: machines[0]?.name, value: machines[0]?.key }
                : category == "shift"
                ? { label: "1", value: 1 }
                : null;
        setChartData(generateChartData(data, category, option?.value, labels));
        setSelectedChartCategory(category);
        if (option != null) setSelectedOption(option);
    };

    const onOptionChangeHandler = (option) => {
        const category = selectedChartCategory;
        const data =
            category == "sum"
                ? groupedData?.data
                : category == "machine"
                ? machineGroupedData?.data
                : shiftGroupedData?.data;
        setChartData(generateChartData(data, category, option?.value, labels));
        setSelectedOption(option);
    };

    function generateChartData(data, category, id, labels) {
        const performanceData = startEndTimeArrayGenerator(
            data,
            startDay.format("DD/MM/YYYY"),
            endDay.format("DD/MM/YYYY"),
            { category: category, id: id, valueType: "performance" },
        );
        const oeeData = startEndTimeArrayGenerator(
            data,
            startDay.format("DD/MM/YYYY"),
            endDay.format("DD/MM/YYYY"),
            { category: category, id: id, valueType: "oee" },
        );
        const avaliablityData = startEndTimeArrayGenerator(
            data,
            startDay.format("DD/MM/YYYY"),
            endDay.format("DD/MM/YYYY"),
            { category: category, id: id, valueType: "availability" },
        );
        const qualityData = startEndTimeArrayGenerator(
            data,
            startDay.format("DD/MM/YYYY"),
            endDay.format("DD/MM/YYYY"),
            { category: category, id: id, valueType: "quality" },
        );

        const shiftPlannedData = startEndTimeArrayGenerator(
            data,
            startDay.format("DD/MM/YYYY"),
            endDay.format("DD/MM/YYYY"),
            { category: category, id: id, valueType: "shiftPlanned" },
        );

        const oeeSet = {
            label: "OEE",
            data: oeeData,
            borderColor: "rgba(52, 152, 219, 0.5)",
            backgroundColor: "rgba(52, 152, 219)",
            fill: false,
        };

        const peformanceSet = {
            label: "Zmogljivost",
            data: performanceData,
            borderColor: "rgba(255, 99, 132, 0.4)",
            backgroundColor: "rgb(255, 99, 132)",
            fill: false,
        };

        const avaliablitySet = {
            label: "Razpoložljivost",
            data: avaliablityData,
            borderColor: "rgba(100, 49, 132, 0.4)",
            backgroundColor: "rgb(100, 49, 132)",
            fill: false,
        };

        const qualitySet = {
            label: "Kvaliteta",
            data: qualityData,
            borderColor: "rgba(255, 150, 30, 0.4)",
            backgroundColor: "rgb(255, 150, 30)",
            fill: false,
        };

        const shiftPlannedSet = {
            label: "Planirano",
            data: shiftPlannedData,
            borderColor: "rgba(155, 50, 130, 0.4)",
            backgroundColor: "rgb(155, 50, 130)",
            fill: false,
        };

        return {
            labels: labels,
            datasets: [oeeSet, peformanceSet, avaliablitySet, qualitySet, shiftPlannedSet],
        };
    }

    //! Table data
    const weekAvgPerMachine = useMemo(
        () => tableForm(machineGroupedData.data, indicator, "machines"),
        [machineGroupedData, indicator],
    );
    const weekAvgPerShift = useMemo(
        () => tableForm(shiftGroupedData.data, indicator, "shifts"),
        [shiftGroupedData, indicator],
    );
    const machinesTableColumns = useMemo(
        () => generateColumns(weeks, "machine"),
        [weeks, generateColumns],
    );
    const shiftTableColumns = useMemo(
        () => generateColumns(weeks, "shift"),
        [weeks, generateColumns],
    );

    const handleMachineExport = () => {
        const dataToExport = prepareExportData(weekAvgPerMachine);
        exportToXLSX(
            dataToExport,
            `${dayjs().format("MM")}-${machineGroup.name.toLowerCase()}-machines`,
        );
    };

    const handleShiftExport = () => {
        const dataToExport = prepareExportData(weekAvgPerShift);
        exportToXLSX(
            dataToExport,
            `${dayjs().format("MM")}-${machineGroup.name.toLowerCase()}-shifts`,
        );
    };

    if (groupedData.isLoading || machineGroupedData.isLoading || shiftGroupedData.isLoading)
        return null;
    return (
        <BigModal centered show={showModal} size='xl' onHide={() => hideHandler()}>
            <Container>
                {indicator == "oee" ? (
                    <Row>
                        <Col className='mt-3'>
                            <h3>OEE parameteri</h3>
                            <div
                                className='d-flex justify-content-end align-items-center'
                                style={{ minHeight: "40px" }}
                            >
                                <ToggleGroup
                                    buttons={toggleButtons}
                                    selectedButton={selectedChartCategory}
                                    onSelected={onChartCategoryChangeHandler}
                                    title={"oee_details"}
                                />
                                {selectedChartCategory != "sum" ? (
                                    <div
                                        style={{
                                            minWidth: "250px",
                                            marginLeft: "1em",
                                        }}
                                    >
                                        <Select
                                            value={selectedOption}
                                            onChange={onOptionChangeHandler}
                                            placeholder={
                                                selectedChartCategory == "machine"
                                                    ? "Izberite stroj"
                                                    : "Izberite izmeno"
                                            }
                                            options={
                                                selectedChartCategory == "machine"
                                                    ? machines.map((machine) => {
                                                          return {
                                                              label: machine.name,
                                                              value: machine.key,
                                                          };
                                                      })
                                                    : ["1", "2", "3"].map((shift) => {
                                                          return {
                                                              label: shift,
                                                              value: shift,
                                                          };
                                                      })
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </Col>
                        <Col xs={12}>
                            <Indicator
                                height='300px'
                                indicator='oee'
                                type='line'
                                datasets={chartData}
                            />
                        </Col>
                    </Row>
                ) : null}
                <Row className='mt-4'>
                    <Col xs={12} xl={6}>
                        <div className='d-flex justify-content-between'>
                            <div>
                                <h3>{t("weekly_average_by_machine")}</h3>
                            </div>
                            <div className='mt-3 me-3'>
                                <CSVLink
                                    data={prepareExportData(weekAvgPerMachine)}
                                    filename={
                                        dayjs().format("MM") +
                                        "-" +
                                        machineGroup.name.toLowerCase() +
                                        "-shifts.csv"
                                    }
                                    target='_blank'
                                >
                                    <FontAwesomeIcon icon='download' color='gray' />
                                </CSVLink>
                                <FontAwesomeIcon
                                    onClick={handleMachineExport}
                                    icon={faFileExcel}
                                    color='gray'
                                    style={{ marginLeft: 10 }}
                                />
                            </div>
                        </div>
                        <Table
                            noHeader={true}
                            dense
                            conditionalRowStyles={conditionalRowStyles}
                            pagination={false}
                            columns={machinesTableColumns}
                            data={weekAvgPerMachine.sort((a, b) => sortingFunction(a, b))}
                        ></Table>
                    </Col>
                    <Col xs={12} xl={6}>
                        <div className='d-flex justify-content-between'>
                            <div>
                                <h3>{t("weekly_average_by_shift")}</h3>
                            </div>

                            <div className='mt-3 me-3'>
                                <CSVLink
                                    data={prepareExportData(weekAvgPerShift)}
                                    filename={
                                        dayjs().format("MM") +
                                        "-" +
                                        machineGroup.name.toLowerCase() +
                                        "-shifts.csv"
                                    }
                                    target='_blank'
                                >
                                    <FontAwesomeIcon icon='download' color='gray' />
                                </CSVLink>
                                <FontAwesomeIcon
                                    onClick={handleShiftExport}
                                    icon={faFileExcel}
                                    color='gray'
                                    style={{ marginLeft: 10 }}
                                />
                            </div>
                        </div>
                        <Table
                            noHeader={true}
                            dense
                            conditionalRowStyles={conditionalRowStyles}
                            pagination={false}
                            columns={shiftTableColumns}
                            data={weekAvgPerShift?.sort((a, b) => sortingFunction(a, b))}
                        ></Table>
                    </Col>
                </Row>
            </Container>
            ;
        </BigModal>
    );
}

export default AggregateModal;

function prepareExportData(rows) {
    return rows
        ?.filter((row) => !row.sum)
        ?.map((row) => {
            delete row.sum;
            return row;
        });
}
