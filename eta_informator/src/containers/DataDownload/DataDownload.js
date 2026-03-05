/* eslint-disable */
import { Card, Container, Row, Button, Col, Form, Fade } from "react-bootstrap";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm, Controller } from "react-hook-form";
import * as Yup from "yup";
import dayjs from "dayjs";
import DatePicker from "../../components/Forms/CustomInputs/DatePicker/DatePicker";
import ErrorMessage from "../../components/Layout/ManualInput/Forms/ErrorMessage";
import { yupResolver } from "@hookform/resolvers/yup";
import queryClient, { useMachines, useMachinesAll } from "../../data/ReactQuery";
import Select from "../../components/Forms/CustomInputs/Select/Select";
import {
    generateMachinesLabels,
    generateMachinesLabelsInternal,
} from "../../data/Formaters/Informator";
import { CSVLink } from "react-csv";
import { sinaproClient } from "../../feathers/feathers";
import _ from "lodash";
import { PulseLoader } from "react-spinners";
import { getEvents } from "../../data/API/Spica/SpicaAPI";
import SubmitMessage from "../../components/UI/UserMessages/SubmitMessage";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";

const SourceButton = styled(Button)`
    width: 150px;
    height: 100px;
    border: 0px;
    box-shadow: 3px 3px 3px lightgray;
    padding: 1em;
    margin: 0em 1em;
`;

const Checkbox = styled(Form.Check)``;

//* Represents fields that are possible to choose from for each data type (realization, oee, scrap, staff).
function parameters(dataType) {
    switch (dataType) {
        case "realization":
            return [
                {
                    id: "machine",
                    label: "machine_id",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "datum",
                    label: "date",
                    timeframe: ["no_grouping", "day"],
                },
                {
                    id: "week",
                    label: "week",
                    timeframe: ["no_grouping", "day", "week"],
                },
                {
                    id: "month",
                    label: "month",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "year",
                    label: "year",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "shift",
                    label: "shift",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "total",
                    label: "total",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "good",
                    label: "good",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "bad",
                    label: "bad",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "effectiveWork",
                    label: "effective_work",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
            ];
        case "oee":
            return [
                {
                    id: "machine",
                    label: "machine_id",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "day",
                    label: "day",
                    timeframe: ["no_grouping", "day"],
                },
                {
                    id: "datum",
                    label: "date",
                    timeframe: ["no_grouping", "day"],
                },
                {
                    id: "week",
                    label: "week",
                    timeframe: ["no_grouping", "day", "week"],
                },
                {
                    id: "month",
                    label: "month",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "year",
                    label: "year",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "shift",
                    label: "shift",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "breaks",
                    label: "breaks",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "oee",
                    label: "oee",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "nee",
                    label: "nee",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "teep",
                    label: "teep",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "quality",
                    label: "quality",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "availability",
                    label: "availability",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "performance",
                    label: "performance",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "shiftPlanned",
                    label: "shift_planned",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
            ];
        case "scrap":
            return [
                {
                    id: "machine",
                    label: "machine_id",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "day",
                    label: "day",
                    timeframe: ["no_grouping", "day"],
                },
                {
                    id: "datum",
                    label: "date",
                    timeframe: ["no_grouping", "day"],
                },
                {
                    id: "week",
                    label: "week",
                    timeframe: ["no_grouping", "day", "week"],
                },
                {
                    id: "month",
                    label: "month",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "year",
                    label: "year",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "shift",
                    label: "shift",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "type",
                    label: "type",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "total",
                    label: "total",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "quantity",
                    label: "quantity",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "relativeScrap",
                    label: "relative_scrap",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
            ];
        case "staff":
            return [
                {
                    id: "datum",
                    label: "date",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "week",
                    label: "week",
                    timeframe: ["no_grouping", "day", "week"],
                },
                {
                    id: "month",
                    label: "month",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "year",
                    label: "year",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "subunit",
                    label: "subunit",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "absent",
                    label: "absent",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "higherForce",
                    label: "higher_force",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "hourUse",
                    label: "use_of_hours",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "leave",
                    label: "leave",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "present",
                    label: "present",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "quarantine",
                    label: "quarantine",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
                {
                    id: "sick",
                    label: "sick",
                    timeframe: ["no_grouping", "day", "week", "month"],
                },
            ];
        default:
            return [];
    }
}

function fetchData(dataType, source, startDate, endDate, operation = null) {
    const replace =
        operation == "assembly"
            ? '{"360": 558, "361":559, "362": 560, "363": 561}'
            : operation == "sinapro" || operation == "packaging"
            ? '{"360": 568, "361":36, "362": 569, "363": 570}'
            : "{}";
    switch (dataType) {
        case "realization":
            return sinaproClient.service("machine-production").find({
                query: {
                    start: dayjs(startDate).format("YYYY-MM-DD"),
                    end: dayjs(endDate).format("YYYY-MM-DD"),
                    ted: source + "",
                },
            });
        case "oee":
            return sinaproClient.service("oee").find({
                query: {
                    start: dayjs(startDate).format("YYYY-MM-DD"),
                    end: dayjs(endDate).format("YYYY-MM-DD"),
                    id: source + "",
                },
            });
        case "scrap":
            return sinaproClient.service("scrap").find({
                query: {
                    start: dayjs(startDate).format("YYYY-MM-DD"),
                    end: dayjs(endDate).format("YYYY-MM-DD"),
                    ted: source + "",
                    source: operation,
                    replace: replace,
                },
            });
        case "staff":
            return getEvents(source, dayjs(startDate), dayjs(endDate));
    }
}

function round(value, decimals) {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals).toFixed(decimals);
}

//* Used to wrangle OEE data for download
function reduceOEE(data, timeframe) {
    if (!data) return null;
    const reduced = data.reduce((prev, curr) => {
        //* These are the values that get averaged at the end
        const values = {
            breaks: [curr.breaks],
            oee: [curr.oee],
            nee: [curr.nee],
            teep: [curr.teep],
            performance: [curr.perforamce],
            quality: [curr.quality],
            availability: [curr.availability],
            shiftPlanned: [curr.shiftPlanned],
        };
        //* These are the constants that don't change inside the entry/object.
        const date = curr["date"];
        const week = curr["week"];
        const month = dayjs(date, "YYYY-MM-DD").month();
        const shift = curr["shift"];
        const machine = curr["machineID"];

        let dataObject;

        const [prevObject] = _.remove(prev, (o) => {
            switch (timeframe) {
                case "day":
                    return o.datum == date && o.shift == shift && o.machine == machine;
                case "week":
                    return o.week == week && o.machine == machine;
                case "month":
                    return o.month == month && o.machine == machine;
                default:
                    return false;
            }
        });
        //* If there is no entry with this date, we generate new object.
        if (!prevObject) {
            dataObject = {
                datum: date,
                week: week,
                month: month,
                shift: shift,
                machine: machine,
            };
            dataObject = { ...dataObject, ...values };
            return [...prev, dataObject];
            //* If there is we iterate over each of the value we want to average and push onto the list
        } else {
            _.forEach(values, (value, key) => {
                const [sValue] = value;
                prevObject[key].push(sValue);
            });
            return [...prev, prevObject];
        }
    }, []);

    //* The arrays created are averaged and zero/infinity values are replaced by 0.
    return reduced.map((entry) => {
        const mEntry = _.forEach(entry, (value, key) => {
            if (!Array.isArray(value)) return;
            _.update(entry, key, () => {
                const updatedValue = _.mean(value.filter((digit) => +digit != 0));
                if (isNaN(updatedValue) || updatedValue == Infinity) return 0;
                return round(updatedValue, 2);
            });
        });
        return mEntry;
    });
}

function reduceRealization(data, timeframe) {
    if (!data) return null;
    const reducedData = data.reduce((prev, curr) => {
        const values = {
            total: [+curr.quantity],
            good: [+curr.good],
            bad: [+curr.scrap],
            effectiveWork: [+curr.effectively],
        };

        const date = curr["date"];
        const week = dayjs(date, "YYYY-MM-DD").isoWeek();
        const month = dayjs(date, "YYYY-MM-DD").month();
        const year = dayjs(date, "YYYY-MM-DD").year();
        const shift = curr["shift"];
        const machine = curr["machineKeyAlt"];

        let dataObject;

        //* Find for object with entry date
        const [prevObject] = _.remove(prev, (o) => {
            switch (timeframe) {
                case "day":
                    return o.datum == date && o.shift == shift && o.machine == machine;
                case "week":
                    return o.week == week && o.machine == machine;
                case "month":
                    return o.month == month && o.machine == machine;
                default:
                    return false;
            }
        });
        //* If there is no entry with this date, we generate new object.
        if (!prevObject) {
            dataObject = {
                datum: date,
                week: week,
                month: month,
                shift: shift,
                machine: machine,
                year: year,
            };
            dataObject = { ...dataObject, ...values };
            return [...prev, dataObject];
        } else {
            _.forEach(values, (value, key) => {
                const [sValue] = value;
                prevObject[key].push(sValue);
            });
            return [...prev, prevObject];
        }
    }, []);

    //* The arrays created are averaged and zero/infinity values are replaced by 0.
    return reducedData.map((entry) => {
        const mEntry = _.forEach(entry, (value, key) => {
            if (!Array.isArray(value)) return;
            _.update(entry, key, () => {
                const updatedValue = _.sum(value.filter((digit) => +digit != 0));
                if (isNaN(updatedValue) || updatedValue == Infinity) return 0;
                return updatedValue;
            });
        });
        return mEntry;
    });
}

function reduceScrap(data, timeframe) {
    const reducedData = data.reduce((prev, curr) => {
        let values = {
            quantity: [curr.quantity] ?? 0,
            total: [+curr.total] ?? 0,
        };

        const date = curr.date;
        const week = dayjs(date, "YYYY-MM-DD").isoWeek();
        const month = dayjs(date, "YYYY-MM-DD").month();
        const type = curr.typeId;
        const machine = curr.machineId;
        const shift = curr.shift;

        let dataObject;

        const [prevObject] = _.remove(prev, (o) => {
            switch (timeframe) {
                case "day":
                    return (
                        o.datum == date &&
                        o.shift == shift &&
                        o.type == type &&
                        o.machine == machine
                    );
                case "week":
                    return o.week == week && o.type == type && o.machine == machine;
                case "month":
                    return o.month == month && o.type == type && o.machine == machine;
                default:
                    return false;
            }
        });

        if (!prevObject) {
            dataObject = {
                datum: date,
                week: week,
                month: month,
                shift: shift,
                machine: machine,
                type: type,
            };
            dataObject = { ...dataObject, ...values };
            return [...prev, dataObject];

            //* If there is we iterate over each of the value we want to average and push onto the list
        } else {
            _.forEach(values, (value, key) => {
                const [sValue] = value;
                prevObject[key].push(sValue);
            });
            return [...prev, prevObject];
        }
    }, []);

    return reducedData.map((entry) => {
        const mEntry = _.forEach(entry, (value, key) => {
            if (!Array.isArray(value)) return;
            _.update(entry, key, () => {
                const updatedValue = _.sum(value.filter((digit) => +digit != 0));
                if (isNaN(updatedValue) || updatedValue == Infinity) return 0;
                return updatedValue;
            });
        });
        mEntry.relativeScrap = mEntry.quantity / mEntry.total;
        return mEntry;
    });
}

function reduceStaff(data, timeframe, unit) {
    if (!data) return null;
    const reducedData = data.reduce((prev, curr) => {
        const values = {
            absent: [+curr.absent],
            higherForce: [+curr.higherForce],
            hourUse: [+curr.hourUse],
            leave: [+curr.leave],
            present: [+curr.present],
            quarantine: [+curr.quarantine],
            sick: [+curr.sick],
        };

        const date = curr.day;
        const week = dayjs(date, "YYYY-MM-DD").isoWeek();
        const month = dayjs(date, "YYYY-MM-DD").month();
        const year = dayjs(date, "YYYY-MM-DD").year();

        let dataObject;

        //* Find for object with entry date
        const [prevObject] = _.remove(prev, (o) => {
            switch (timeframe) {
                case "day":
                    return o.datum == date;
                case "week":
                    return o.week == week;
                case "month":
                    return o.month == month;
                default:
                    return false;
            }
        });
        //* If there is no entry with this date, we generate new object.
        if (!prevObject) {
            dataObject = {
                datum: date,
                week: week,
                month: month,
                year: year,
                subunit: unit.label,
            };
            dataObject = { ...dataObject, ...values };
            return [...prev, dataObject];
        } else {
            _.forEach(values, (value, key) => {
                const [sValue] = value;
                prevObject[key].push(sValue);
            });
            return [...prev, prevObject];
        }
    }, []);

    return reducedData.map((entry) => {
        const mEntry = _.forEach(entry, (value, key) => {
            if (!Array.isArray(value)) return;
            _.update(entry, key, () => {
                const updatedValue = _.sum(value.filter((digit) => +digit != 0));
                if (isNaN(updatedValue) || updatedValue == Infinity) return 0;
                return updatedValue;
            });
        });
        return mEntry;
    });
}

function groupData(data, timeframe, indicator, subunit) {
    if (timeframe == "no_grouping") return data;
    switch (indicator) {
        case "realization":
            return reduceRealization(data, timeframe);
        case "oee":
            return reduceOEE(data, timeframe);
        case "scrap":
            return reduceScrap(data, timeframe);
        case "staff":
            return reduceStaff(data, timeframe, subunit);
    }

    return [];
}

function DataDownload(props) {
    const [dataType, setDataType] = useState(null);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const link = useRef();

    const setNavigationContext = useContext(SetNavigationContext);
    useEffect(() => {
        setNavigationContext.setNavigationHandler({});
    }, []);

    const validationSchema = Yup.object().shape({
        subunit:
            dataType != "oee"
                ? Yup.object().nullable().required(t("labels:required_field"))
                : Yup.object().nullable().notRequired(),
        startDate: Yup.date().required(t("labels:required_field")),
        endDate: Yup.date().required(t("labels:required_field")),
    });

    const dataTypeSelectHandler = (type) => {
        setDataType(type);
    };

    const {
        register,
        unregister,
        handleSubmit,
        formState: { errors },
        control,
        watch,
        reset,
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            timeframe: "day",
            startDate: dayjs().subtract(1, "week").startOf("week").toDate(),
            endDate: dayjs().subtract(1, "week").endOf("week").toDate(),
        },
    });

    //* Watches
    const watchSelectedTed = watch("subunit", undefined);
    const watchStartDate = watch("startDate", dayjs().startOf("week"));
    const watchEndDate = watch("endDate", dayjs().endOf("week"));
    const watchTimeframe = watch("timeframe", null);
    const watchOperation = watch("operation", null);
    const watchMachines = watch("selectedMachines", null);

    useEffect(() => {
        unregister("fields");
    }, [watchTimeframe]);

    useEffect(() => {
        reset();
    }, [dataType]);

    useEffect(() => {
        if (isFinished == true) {
            setTimeout(() => {
                setIsFinished(false);
                setDataType(null);
            }, 2000);
        }
    });

    const unitsLabels =
        dataType == "staff"
            ? [
                  {
                      keyword: "all",
                      label: "Vsi oddelki",
                      subunitId: -1,
                      ted: null,
                      unitId: -1,
                      value: -1,
                  },
                  ...queryClient.getQueryData("unitsLabels"),
              ]
            : queryClient.getQueryData("unitsLabels");
    const operationsLabels = [
        {
            label: t("lines_preassembly"),
            value: "preassembly",
        },
        {
            label: t("lines_assembly"),
            value: "assembly",
        },
        {
            label: t("lines_calibration"),
            value: "sinapro",
        },
        {
            label: t("lines_packaging"),
            value: "packaging",
        },
    ];
    const isEdge = (date) => {
        if (watchTimeframe != "week") return true;
        const day = dayjs(date).day();
        return day == 0 || day == 1;
    };

    const machines = useMachinesAll();

    const param = parameters(dataType);
    const onSubmit = async (input) => {
        setIsLoading(true);
        const {
            startDate,
            endDate,
            subunit,
            selectedMachines = [],
            fields,
            timeframe,
            operation,
        } = input;

        const teds = selectedMachines.reduce((acc, cur) => {
            if (!acc?.includes(cur.ted)) acc?.push(cur.ted);
            return acc;
        }, []);
        const subunitId =
            dataType == "staff"
                ? subunit?.subunitId
                : dataType == "oee"
                ? teds.toString()
                : subunit?.ted;
        const machines = selectedMachines?.map((entry) => entry.value) ?? [];
        let data = await fetchData(dataType, subunitId, startDate, endDate, operation?.value);
        data = groupData(data, timeframe, dataType, subunit);
        setData(
            data
                .filter((entry) => {
                    if (machines?.length > 0) {
                        return machines.includes(entry.machine);
                    }
                    return true;
                })
                .map((entry) => {
                    return _.pick(entry, fields);
                }),
        );
        setIsLoading(false);
        setIsFinished(true);
        link.current.link.click();
    };

    return (
        <Container className={"mt-3"}>
            {isFinished && (
                <div
                    className='d-flex justify-content-center align-items-center flex-column'
                    style={{
                        zIndex: 100,
                        position: "absolute",
                        backgroundColor: "rgba(255, 255, 255, 1)",
                        top: "0px",
                        left: "0px",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <SubmitMessage isSuccess message='download_success' />
                </div>
            )}
            {isLoading && (
                <div
                    className='d-flex justify-content-center align-items-center flex-column'
                    style={{
                        zIndex: 100,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        position: "absolute",
                        top: "0px",
                        left: "0px",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <PulseLoader loading={isLoading} color='white' />
                    <p className='lead' style={{ color: "white", fontWeight: "500" }}>
                        {t("data_is_loading")}
                    </p>
                </div>
            )}
            <Row>
                <h2>{t("data_download")}</h2>
            </Row>
            <Row>
                <Card className='w-100'>
                    <Container className='p-4'>
                        {dataType === null ? (
                            <Row className='d-flex justify-content-center align-items-center mt-4'>
                                <h3 className='mb-0' style={{ color: "GrayText" }}>
                                    {t("select_data_type")}
                                </h3>
                            </Row>
                        ) : (
                            <Row className='d-flex justify-content-start align-items-center mt-4'>
                                {
                                    <Button
                                        style={{ backgroundColor: "" }}
                                        className='d-flex justify-items-center align-items-center'
                                        variant='outlined'
                                        onClick={() => dataTypeSelectHandler(null)}
                                    >
                                        <FontAwesomeIcon
                                            icon='chevron-left'
                                            size='2x'
                                            color='GrayText'
                                        />
                                    </Button>
                                }
                                <h3 className='mb-0' style={{ color: "GrayText" }}>
                                    {t(dataType)}
                                </h3>
                            </Row>
                        )}
                        <Form onSubmit={handleSubmit(onSubmit)} className='mb-1 mt-5 px-5'>
                            {dataType == null ? (
                                <Row className='d-flex justify-content-center'>
                                    <SourceButton
                                        className='d-flex justify-items-center align-items-center flex-column my-1'
                                        variant='warning'
                                        style={{ color: "white" }}
                                        onClick={() => dataTypeSelectHandler("realization")}
                                    >
                                        <FontAwesomeIcon
                                            className='m-1'
                                            icon='chart-line'
                                            size='2x'
                                        />
                                        <h4 className='mt-1'>{t("realization")}</h4>
                                    </SourceButton>
                                    <SourceButton
                                        className='d-flex justify-items-center align-items-center flex-column my-1'
                                        variant='info'
                                        onClick={() => dataTypeSelectHandler("oee")}
                                    >
                                        <FontAwesomeIcon className='m-1' icon='bolt' size='2x' />
                                        <h4 className='mt-1'>{t("oee")}</h4>
                                    </SourceButton>
                                    <SourceButton
                                        className='d-flex justify-items-center align-items-center flex-column my-1'
                                        variant='danger'
                                        style={{ color: "white" }}
                                        onClick={() => dataTypeSelectHandler("scrap")}
                                    >
                                        <FontAwesomeIcon
                                            className='m-1'
                                            icon='chart-pie'
                                            size='2x'
                                        />
                                        <h4 className='mt-1'>{t("scrap")}</h4>
                                    </SourceButton>
                                    <SourceButton
                                        className='d-flex justify-items-center align-items-center flex-column my-1'
                                        variant='success'
                                        onClick={() => dataTypeSelectHandler("staff")}
                                    >
                                        <FontAwesomeIcon
                                            className='m-1'
                                            icon='chart-line'
                                            size='2x'
                                        />
                                        <h4 className='mt-1'>{t("staff")}</h4>
                                    </SourceButton>
                                </Row>
                            ) : (
                                <>
                                    <Row className='d-flex flex-column'>
                                        <p className='lead mb-0' style={{ fontWeight: "500" }}>
                                            {t("source")}
                                        </p>
                                        <p className='text-muted'>{t("select_ted_or_machines")}</p>
                                    </Row>
                                    <Row>
                                        {dataType != "oee" && (
                                            <Col xs={12} lg={3}>
                                                <Form.Label>{t("section")}</Form.Label>
                                                <Controller
                                                    name='subunit'
                                                    control={control}
                                                    defaultValue={null}
                                                    render={({ ref, field }) => (
                                                        <Select
                                                            {...field}
                                                            ref={ref}
                                                            options={unitsLabels}
                                                            placeholder={t("select_section")}
                                                        />
                                                    )}
                                                />
                                                <ErrorMessage>
                                                    {errors?.subunit?.message}
                                                </ErrorMessage>
                                            </Col>
                                        )}
                                        {dataType != "staff" && (
                                            <Col xs={12} lg={5}>
                                                <Form.Label>{t("list_of_machines")}</Form.Label>
                                                <Controller
                                                    name='selectedMachines'
                                                    control={control}
                                                    defaultValue={null}
                                                    disabled
                                                    render={({ ref, field }) => (
                                                        <Select
                                                            {...field}
                                                            ref={ref}
                                                            name='unitMachines'
                                                            options={
                                                                machines.isFetched
                                                                    ? generateMachinesLabelsInternal(
                                                                          machines?.data,
                                                                      )
                                                                    : []
                                                            }
                                                            placeholder={t("select_machine", {
                                                                count: 3,
                                                            })}
                                                            isDisabled={
                                                                machines.isError ||
                                                                machines.isLoading ||
                                                                !(watchOperation == null) ||
                                                                !(watchOperation == undefined)
                                                            }
                                                            isMulti
                                                        />
                                                    )}
                                                />
                                                <ErrorMessage>
                                                    {errors?.selectedMachines?.message}
                                                </ErrorMessage>
                                            </Col>
                                        )}
                                        <Fade
                                            in={
                                                watchSelectedTed?.ted == "404" &&
                                                dataType == "scrap"
                                            }
                                        >
                                            <Col xs={12} lg={3}>
                                                <Form.Label>{t("operation")}</Form.Label>
                                                <Controller
                                                    name='operation'
                                                    control={control}
                                                    defaultValue={null}
                                                    render={({ ref, field }) => (
                                                        <Select
                                                            {...field}
                                                            ref={ref}
                                                            options={operationsLabels}
                                                            placeholder={t("select_operation")}
                                                            isDisabled={
                                                                (watchMachines != null &&
                                                                    !Array.isArray(
                                                                        watchMachines,
                                                                    )) ||
                                                                watchMachines?.length > 0
                                                            }
                                                            isClearable
                                                        />
                                                    )}
                                                />
                                                <ErrorMessage>
                                                    {errors?.operation?.message}
                                                </ErrorMessage>
                                            </Col>
                                        </Fade>
                                    </Row>
                                    <Row className='d-flex flex-column'>
                                        <p className='lead mb-0' style={{ fontWeight: "500" }}>
                                            {t("date")}
                                        </p>
                                        <p className='text-muted'>{t("select_date_range")}</p>
                                    </Row>
                                    <Row>
                                        <Col xs={12} lg={3}>
                                            <Form.Label>{t("start_date")}</Form.Label>
                                            <Controller
                                                name='startDate'
                                                control={control}
                                                defaultValue={dayjs()
                                                    .subtract(1, "week")
                                                    .startOf("week")
                                                    .toDate()}
                                                render={({ ref, field }) => (
                                                    <DatePicker
                                                        onChange={(e) => field.onChange(e)}
                                                        locale={i18n.language}
                                                        selectsStart
                                                        selected={field.value}
                                                        startDate={field.value}
                                                        endDate={watchEndDate}
                                                        showMonthDropdown={
                                                            watchTimeframe == "no_grouping" ||
                                                            watchTimeframe == "day"
                                                        }
                                                        showYearDropdown
                                                        showMonthYearPicker={
                                                            watchTimeframe == "month"
                                                        }
                                                        showFullMonthYearPicker={
                                                            watchTimeframe == "month"
                                                        }
                                                        dropdownMode='select'
                                                        filterDate={isEdge}
                                                        dateFormat={
                                                            watchTimeframe == "month"
                                                                ? "MMMM yyyy"
                                                                : "P"
                                                        }
                                                    />
                                                )}
                                            />
                                            <ErrorMessage>
                                                {t(errors?.endDate?.message)}
                                            </ErrorMessage>
                                        </Col>
                                        <Col xs={12} lg={3}>
                                            <Form.Label>{t("end_date")}</Form.Label>
                                            <Controller
                                                name='endDate'
                                                control={control}
                                                defaultValue={dayjs()
                                                    .subtract(1, "week")
                                                    .endOf("week")
                                                    .toDate()}
                                                render={({ ref, field }) => (
                                                    <DatePicker
                                                        onChange={(e) => field.onChange(e)}
                                                        locale={i18n.language}
                                                        selectsEnd
                                                        selected={field.value}
                                                        startDate={watchStartDate}
                                                        endDate={field.value}
                                                        minDate={watchStartDate}
                                                        maxDate={new Date()}
                                                        showMonthDropdown={
                                                            watchTimeframe == "no_grouping" ||
                                                            watchTimeframe == "day"
                                                        }
                                                        showYearDropdown
                                                        showMonthYearPicker={
                                                            watchTimeframe == "month"
                                                        }
                                                        showFullMonthYearPicker={
                                                            watchTimeframe == "month"
                                                        }
                                                        dropdownMode='select'
                                                        filterDate={isEdge}
                                                        dateFormat={
                                                            watchTimeframe == "month"
                                                                ? "MMMM yyyy"
                                                                : "P"
                                                        }
                                                    />
                                                )}
                                            />
                                            <ErrorMessage>
                                                {t(errors?.endDate?.message)}
                                            </ErrorMessage>
                                        </Col>
                                    </Row>
                                    <Row className='d-flex flex-column'>
                                        <p className='lead mb-0' style={{ fontWeight: "500" }}>
                                            {t("fields")}
                                        </p>
                                        <p className='text-muted'>{t("select_fields")}</p>
                                    </Row>
                                    <Row className='d-flex justify-content-start'>
                                        <Col className='d-flex flex-row flex-wrap'>
                                            {param
                                                .filter((entry) => {
                                                    return watchTimeframe == null
                                                        ? true
                                                        : entry.timeframe.includes(watchTimeframe);
                                                })
                                                .map((c, i) => (
                                                    <Checkbox
                                                        key={"checkbox" + c.id}
                                                        custom
                                                        inline
                                                        type='checkbox'
                                                        id={c.id}
                                                        value={c.id}
                                                        label={t(c.label)}
                                                        defaultChecked={true}
                                                        {...register("fields")}
                                                    />
                                                ))}
                                        </Col>
                                    </Row>
                                    <Row className='d-flex flex-column mt-3'>
                                        <p className='lead mb-0' style={{ fontWeight: "500" }}>
                                            {t("grouping")}
                                        </p>
                                        <p className='text-muted'>{t("time_frame_grouping")}</p>
                                    </Row>
                                    <Row>
                                        <Col>
                                            <Checkbox
                                                custom
                                                inline
                                                name='timeframe'
                                                label={t("month")}
                                                value='month'
                                                type='radio'
                                                id='radio-month'
                                                {...register("timeframe")}
                                            />
                                            <Checkbox
                                                custom
                                                inline
                                                name='timeframe'
                                                label={t("week")}
                                                value='week'
                                                type='radio'
                                                id='radio-week'
                                                {...register("timeframe")}
                                            />
                                            <Checkbox
                                                custom
                                                inline
                                                name='timeframe'
                                                label={t("day")}
                                                value='day'
                                                type='radio'
                                                id='radio-day'
                                                {...register("timeframe")}
                                            />
                                            {/* <Checkbox
												custom
												inline
												name="timeframe"
												label={t("no_grouping")}
												value="no_grouping"
												type="radio"
												id="radio-raw"
												{...register("timeframe")}
											/> */}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Button className='ms-auto mt-5' type='submit'>
                                            {t("download")}
                                        </Button>
                                        <CSVLink
                                            data={data}
                                            asyncOnClick={true}
                                            filename={`${dayjs(watchStartDate).format(
                                                "DD/MM/YYYY",
                                            )}-${dayjs(watchEndDate).format(
                                                "DD/MM/YYYY",
                                            )}-${dataType.toLowerCase()}-${
                                                watchSelectedTed?.keyword
                                            }.csv`}
                                            target='_blank'
                                            ref={link}
                                        ></CSVLink>
                                    </Row>
                                </>
                            )}
                        </Form>
                    </Container>
                </Card>
            </Row>
        </Container>
    );
}

export default DataDownload;
