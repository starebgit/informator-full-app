import * as Yup from "yup";
import dayjs from "dayjs";
import Select, { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import React, { useState, useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { id } from "date-fns/locale";
import {
    createGroup,
    createInputLocationMachines,
    createInputLocationMachines2,
} from "../../../../data/API/Informator/InformatorAPI";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import useURL from "../../../../routes/useURL";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useInputLocations, useMachines } from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { generateLocationsLabels } from "../../../../data/Formaters/Informator";

function MachinesPaneAddForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const inputLocations = useInputLocations();
    const locationParam = useURL().get("location");
    const { state, dispatch } = useContext(AuthContext);
    const { t } = useTranslation(["manual_input", "labels"]);

    const validationSchema = Yup.object().shape({
        selectedMachines: Yup.array()
            .nullable()
            .required(t("labels: required_field"))
            .min(1, t("labels: required_field")),
        inputLocation: Yup.object().nullable().required(t("labels: required_field")),
    });
    const {
        handleSubmit,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({ resolver: yupResolver(validationSchema) });
    const selectedInputLocation = watch("inputLocation", undefined);

    const unitsLabels = queryClient.getQueryData("unitsLabels");

    const ted = findOptionByValue(unitsLabels, selectedInputLocation?.subunitId)?.ted;

    const addInputLocationMachines = useMutation((values) => createInputLocationMachines2(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("inputLocationMachines");
                history.push(".");
            }, 2000);
        },
        onError: (e) => console.log(e),
    });

    function onSubmit(data) {
        const values = data.selectedMachines.map((machine) => {
            return {
                machineCode: machine.idAlt,
                locationId: Number(data.inputLocation.value),
            };
        });
        addInputLocationMachines.mutate(values);
    }

    const machines = useMachines(ted, {
        onSuccess: () => {
            setValue("selectedMachines", "");
        },
        enabled: !!ted,
    });

    function generateMachinesLabels(machines) {
        return machines?.length
            ? machines.map((machine) => {
                  return {
                      label: machine.idAlt + " - " + machine.name,
                      value: machine.id,
                      idAlt: machine.idAlt,
                      name: machine.name,
                      nameShort: machine.nameShort,
                  };
              })
            : [];
    }

    function setSelectDefaultValue() {
        if (locationParam) {
            if (locationsLabels.length > 0) {
                const selectedLocation = locationsLabels.find(
                    (flaw) => flaw?.value === +locationParam,
                );
                return selectedLocation;
            }
        }
        return null;
    }

    if (inputLocations.isLoading) {
        <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ width: "100%", minHeight: "300px" }}
        >
            <PulseLoader color='#2c3e50' size={15} margin={10} />
            {t("data_is_loading")}
        </div>;
    }

    const locationsLabels = generateLocationsLabels(inputLocations.data, t);

    return (
        <Fragment>
            <h3>{t("add_machine")}</h3>
            {addInputLocationMachines.isSuccess ? (
                <SubmitMessage isSuccess={true} message={t("labels:successfully_added")} />
            ) : (
                <>
                    <FormWrap>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormRow xs={1} md={1} lg={2}>
                                <Col>
                                    <Form.Label>{t("section")}</Form.Label>
                                    <Controller
                                        name='inputLocation'
                                        control={control}
                                        defaultValue={setSelectDefaultValue()}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                options={locationsLabels}
                                                placeholder={t("select_input_location")}
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.subunit?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            <FormRow>
                                <Col>
                                    <Form.Label>{t("list_of_machines")}</Form.Label>
                                    <Controller
                                        name='selectedMachines'
                                        control={control}
                                        defaultValue={null}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                name='unitMachines'
                                                options={generateMachinesLabels(machines?.data)}
                                                placeholder={t("select_machine", {
                                                    count: 3,
                                                })}
                                                isMulti
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.selectedMachines?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            <div className='d-flex justify-content-end gap-2'>
                                <Link to={"."} className='btn btn-danger ms-auto me-1'>
                                    {t("labels:cancel")}
                                </Link>

                                <Button type='submit'>{t("labels:add")}</Button>
                            </div>
                        </form>
                    </FormWrap>
                </>
            )}
        </Fragment>
    );
}

export default MachinesPaneAddForm;
