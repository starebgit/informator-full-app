import * as Yup from "yup";
import dayjs from "dayjs";
import Select, { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import client from "../../../../feathers/feathers";
import React, { useState, useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { generateSubunitLabels } from "../../../../data/Formaters/Informator";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { id } from "date-fns/locale";
import { createGroup, editGroup } from "../../../../data/API/Informator/InformatorAPI";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import useURL from "../../../../routes/useURL";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useMachines } from "../../../../data/ReactQuery";

function GroupsPaneForm(props) {
    const [inputValue, setInputValue] = useState("");
    const [selectedUnit, setSelectedUnit] = useState(null);
    const queryClient = useQueryClient();
    const history = useHistory();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const url = useURL();
    const { state, dispatch } = useContext(AuthContext);
    const { t } = useTranslation(["manual_input", "labels"]);
    const validationSchema = Yup.object()
        .shape({
            subunit: Yup.object().nullable().required(t("labels:required_field")),
            name: Yup.string().required(t("labels:required_field")),
            selectedMachines: Yup.array()
                .required(t("labels:required_field"))
                .min(1, t("labels:required_field")),
            quality: Yup.bool().required(t("labels:required_field")),
            realization: Yup.bool().required(t("labels:required_field")),
            oee: Yup.bool().required(t("labels:required_field")),
            realizationTol: Yup.number().required(t("labels:required_field")),
            qualityTol: Yup.number().required(t("labels:required_field")),
            dashboard: Yup.bool(),
            perShift: Yup.bool(),
            perMachine: Yup.bool(),
            perBuyer: Yup.bool(),
            perProduct: Yup.bool(),
        })
        .test("graphCategorizationTest", null, (obj) => {
            if (obj.perShift || obj.perMachine || obj.perBuyer || obj.perProduct) {
                return true;
            }
            return new Yup.ValidationError(t("select_at_least_one"), null, "graphCategorization");
        })
        .test("graphVisibilityTest", null, (obj) => {
            if (obj.dashboard || obj.realization || obj.quality || obj.oee) {
                return true;
            }

            return new Yup.ValidationError(t("select_at_least_one"), null, "graphVisibility");
        });
    const {
        register,
        handleSubmit,
        reset,
        getValues,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({ resolver: yupResolver(validationSchema) });
    const { id } = useParams();
    const isAdding = !id;
    const perProductWatch = watch("perProduct", false);
    const selectedTedWatch = watch("subunit", undefined);

    const machineGroup = useQuery(
        ["machineGroup", id],
        async () => {
            return client
                .service("machine-groups")
                .get(id, {})
                .then((result) => result);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const unit = findOptionByValue(unitsLabels, data?.subunitId);
                setValue("selectedMachines", generateSelectedMachinesLabels(data.machines));
                setValue("subunit", unit);
                setValue("name", data.name);
                setValue("realizationTol", +data.realizationTol);
                setValue("qualityTol", +data.qualityTol);
                setValue("dashboard", data.dashboard);
                setValue("realization", data.realization);
                setValue("quality", data.quality);
                setValue("oee", data.oee);
                setValue("perShift", data.perShift);
                setValue("perMachine", data.perMachine);
                setValue("perBuyer", data.perBuyer);
                setValue("perProduct", data.perProduct);
            },
        },
    );

    const addGroupMutation = useMutation((values) => createGroup(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("machineGroups");
                history.push(".");
            }, 2000);
        },
        onError: (e) => console.log(e),
    });
    const editGroupMutation = useMutation((values) => editGroup(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("machineGroups");
                history.push("..");
            }, 2000);
        },
    });

    function onSubmit(data) {
        isAdding
            ? addGroupMutation.mutate({
                  userId: state.user.id,
                  ...data,
              })
            : editGroupMutation.mutate({
                  id: id,
                  userId: state.user.id,
                  ...data,
              });
    }

    const machines = useMachines(selectedTedWatch?.ted, {
        onSuccess: () => {
            if (isAdding) setValue("selectedMachines", "");
        },
    });

    const components = {
        DropdownIndicator: null,
    };

    const createOption = (label) => ({
        label,
        value: label,
    });

    const handleChange = (value) => {
        setValue("products", value);
    };

    const handleKeyDown = (event) => {
        if (!inputValue) return;
        const currentValue = getValues("products");
        switch (event.key) {
            case "Enter":
            case "Tab":
                setValue("products", [...currentValue, createOption(inputValue)]);
                setInputValue("");
                event.preventDefault();
                break;
            default:
                break;
        }
    };

    const handleInputChange = (inputValue) => {
        setInputValue(inputValue);
    };

    function generateSelectedMachinesLabels(machines) {
        return machines.map((machine) => {
            return {
                label: machine.machineAltKey + " - " + machine.name,
                value: machine.machineKey,
                altKey: machine.machineAltKey,
                name: machine.displayName,
                nameShort: machine.name,
            };
        });
    }

    function generateMachinesLabels(machines) {
        return machines?.length
            ? machines.map((machine) => {
                  return {
                      label: machine.idAlt + " - " + machine.name,
                      value: machine.id,
                      altKey: machine.idAlt,
                      name: machine.name,
                      nameShort: machine.nameShort,
                  };
              })
            : [];
    }

    return (
        <Fragment>
            <h3>{isAdding ? t("add_group") : t("edit_group")}</h3>
            {addGroupMutation.isSuccess || editGroupMutation.isSuccess ? (
                <SubmitMessage
                    isSuccess={true}
                    message={
                        isAdding ? t("labels:successfully_added") : t("labels:successfully_edited")
                    }
                />
            ) : (
                <FormWrap>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FormRow xs={1} md={1} lg={2}>
                            <Col>
                                <Form.Label>{t("group_name")}</Form.Label>
                                <Form.Control
                                    {...register("name")}
                                    type='text'
                                    placeholder={t("enter_group_name")}
                                    autoComplete='off'
                                />

                                <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                            </Col>
                            <Col>
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
                        <FormRow xs={1} md={1} lg={2}>
                            <Col>
                                <Form.Label>{t("realization_tolerance")}</Form.Label>
                                <Form.Control
                                    {...register("realizationTol")}
                                    type='number'
                                    defaultValue={1}
                                    step='0.1'
                                />
                                <Form.Text>{t("percentage")}</Form.Text>
                            </Col>
                            <Col>
                                <Form.Label>{t("quality_tolerance")}</Form.Label>
                                <Form.Control
                                    {...register("qualityTol")}
                                    type='number'
                                    defaultValue={1}
                                    step='0.1'
                                />
                                <Form.Text>{t("percentage")}</Form.Text>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <Form.Label>{t("graph_visibility")}</Form.Label>
                                <div className='d-flex flex-wrap justify-content-xl-between flex-lg-row flex-column'>
                                    <Col>
                                        <Form.Check
                                            {...register("dashboard")}
                                            inline
                                            type='switch'
                                            id='dashboard'
                                            size='lg'
                                            label={t("dashboard")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("realization")}
                                            inline
                                            type='switch'
                                            id='realization'
                                            label={t("realization")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("quality")}
                                            inline
                                            type='switch'
                                            id='quality'
                                            label={t("quality")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("oee")}
                                            inline
                                            type='switch'
                                            id='oee'
                                            label={t("oee")}
                                        />
                                    </Col>
                                </div>
                                <ErrorMessage>{errors?.graphVisibility?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <Form.Label>{t("graph_categorization")}</Form.Label>
                                <div className='d-flex flex-wrap justify-content-xl-between flex-lg-row flex-column'>
                                    <Col>
                                        <Form.Check
                                            {...register("perShift")}
                                            inline
                                            type='switch'
                                            id='perShift'
                                            size='lg'
                                            label={t("per_shift")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("perMachine")}
                                            inline
                                            type='switch'
                                            id='perMachine'
                                            size='lg'
                                            label={t("per_machine")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("perBuyer")}
                                            inline
                                            type='switch'
                                            id='perBuyer'
                                            size='lg'
                                            label={t("per_buyer")}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Check
                                            {...register("perProduct")}
                                            inline
                                            type='switch'
                                            id='perProduct'
                                            size='lg'
                                            label={t("per_product")}
                                        />
                                    </Col>
                                </div>
                                <ErrorMessage>{errors?.graphCategorization?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        {perProductWatch ? (
                            <FormRow>
                                <Col>
                                    <Controller
                                        name='products'
                                        control={control}
                                        defaultValue={[]}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                isClearable
                                                isMulti
                                                menuIsOpen={false}
                                                onChange={handleChange}
                                                inputValue={inputValue}
                                                onInputChange={handleInputChange}
                                                components={components}
                                                onKeyDown={handleKeyDown}
                                                placeholder={t("enter_product_numbers")}
                                            />
                                        )}
                                    />
                                </Col>
                            </FormRow>
                        ) : null}
                        <div className='d-flex justify-content-end gap-2'>
                            <Link
                                to={isAdding ? "." : ".."}
                                className='btn btn-danger ms-auto me-1'
                            >
                                {t("labels:cancel")}
                            </Link>

                            <Button type='submit'>
                                {isAdding ? t("labels:add") : t("labels:edit")}
                            </Button>
                        </div>
                    </form>
                </FormWrap>
            )}
        </Fragment>
    );
}

export default GroupsPaneForm;
