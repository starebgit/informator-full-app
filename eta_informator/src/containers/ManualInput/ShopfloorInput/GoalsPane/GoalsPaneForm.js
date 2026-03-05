import React, { useContext, useState } from "react";
import { Form, Col, Button } from "react-bootstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createGoal, editGoal } from "../../../../data/API/Informator/InformatorAPI";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import dayjs from "dayjs";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { generateMachineGroupsLabels } from "../../../../data/Formaters/Informator";
import { Fragment } from "react";
import { useHistory, useParams } from "react-router";
import { Link } from "react-router-dom";
import { useMachineGroups } from "../../../../data/ReactQuery";
import client from "../../../../feathers/feathers";
import { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import { yupResolver } from "@hookform/resolvers/yup";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { useForm, Controller } from "react-hook-form";

function GoalsAddPane(props) {
    const [selectedUnit, setSelectedUnit] = useState(null);
    const queryClient = useQueryClient();
    const { state } = useContext(AuthContext);
    const history = useHistory();
    const { id } = useParams();

    const isAdding = !id;
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const addGoalMutation = useMutation((values) => createGoal(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("goals");
                history.push(".");
            }, 2000);
        },
    });

    const editGoalMutation = useMutation((values) => editGoal(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries(["goals"]);
                history.push("..");
            }, 2000);
        },
    });

    const validationSchema = Yup.object().shape({
        subunitId: Yup.object().nullable().required("labels:required_field"),
        machineGroupId: Yup.object().nullable().required("labels:required_field"),
        startDate: Yup.date().required("labels:required_field"),
        endDate: Yup.date().required("labels:required_field"),
        realizationGoal: Yup.number()
            .required("labels:required_field")
            .typeError("labels:field_number_err"),
        qualityGoal: Yup.number()
            .required("labels:required_field")
            .typeError("labels:field_number_err"),
        oeeGoal: Yup.number()
            .required("labels:required_field")
            .typeError("labels:field_number_err"),
    });

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({
        resolver: yupResolver(validationSchema),
    });
    const watchStartDate = watch("startDate", dayjs().startOf("week"));
    const watchEndDate = watch("endDate", dayjs().endOf("week"));
    const watchMachineGroup = watch("machineGroupId", null);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const machineGroups = useMachineGroups(selectedUnit?.subunitId, {
        onSuccess: (data) => {
            const labels = generateMachineGroupsLabels(data);
            if (!isAdding) {
                const [label] = labels?.filter((label) => {
                    return label.value == goal?.data?.machineGroupId;
                });
                setValue("machineGroupId", label);
            }
        },
    });
    const goal = useQuery(
        ["goal", id],
        async () => {
            return client
                .service("goals")
                .get(id, {})
                .then((result) => result);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const unit = findOptionByValue(unitsLabels, data?.machine_group.subunitId);
                setSelectedUnit(findOptionByValue(unitsLabels, data.machine_group.subunitId));
                setValue("subunitId", unit);
                setValue("startDate", dayjs(data.startDate).toDate());
                setValue("endDate", dayjs(data.endDate).toDate());
                setValue("realizationGoal", data.realizationGoal);
                setValue("qualityGoal", data.qualityGoal);
                setValue("oeeGoal", data.oeeGoal);
            },
        },
    );

    function onSubmit(data) {
        isAdding
            ? addGoalMutation.mutate({
                  userId: state.user.id,
                  ...data,
                  machineGroupId: data.machineGroupId.value,
              })
            : editGoalMutation.mutate({
                  id: id,
                  userId: state.user.id,
                  ...data,
                  machineGroupId: data.machineGroupId.value,
              });
    }
    return (
        <Fragment>
            <h3>{isAdding ? t("add_goal") : t("edit_goal")}</h3>
            {addGoalMutation.isSuccess || editGoalMutation.isSuccess ? (
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
                                <Form.Label>{t("section")}</Form.Label>
                                <Controller
                                    name='subunitId'
                                    control={control}
                                    defaultValue={null}
                                    render={({ ref, field }) => (
                                        <Select
                                            {...field}
                                            ref={ref}
                                            options={unitsLabels}
                                            placeholder={t("select_section")}
                                            onChange={(e) => {
                                                setSelectedUnit(e);
                                                field.onChange(e);
                                                setValue("machineGroupId", null);
                                            }}
                                        />
                                    )}
                                />
                                <ErrorMessage>{t(errors?.subunitId?.message)}</ErrorMessage>
                            </Col>
                            <Col>
                                <Form.Label>{t("machine_group")}</Form.Label>
                                <Controller
                                    name='machineGroupId'
                                    control={control}
                                    defaultValue={null}
                                    render={({ ref, field }) => (
                                        <Select
                                            {...field}
                                            ref={ref}
                                            options={generateMachineGroupsLabels(
                                                machineGroups.data,
                                            )}
                                            isDisabled={
                                                selectedUnit === null || machineGroups.isLoading
                                            }
                                            placeholder={t("select_machine_group")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{t(errors?.machineGroupId?.message)}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow xs={1} md={1} lg={2}>
                            <Col>
                                <Form.Label>{t("start_date")}</Form.Label>
                                <Controller
                                    name='startDate'
                                    control={control}
                                    defaultValue={dayjs().startOf("week").toDate()}
                                    render={({ field }) => (
                                        <DatePicker
                                            onChange={(e) => field.onChange(e)}
                                            locale={i18n.language}
                                            selectsStart
                                            selected={field.value}
                                            startDate={field.value}
                                            endDate={watchEndDate}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode='select'
                                            dateFormat='P'
                                        />
                                    )}
                                />
                                <ErrorMessage>{t(errors?.endDate?.message)}</ErrorMessage>
                            </Col>
                            <Col>
                                <Form.Label>{t("end_date")}</Form.Label>
                                <Controller
                                    name='endDate'
                                    control={control}
                                    defaultValue={dayjs().endOf("week").toDate()}
                                    render={({ field }) => (
                                        <DatePicker
                                            onChange={(e) => field.onChange(e)}
                                            locale={i18n.language}
                                            selectsEnd
                                            selected={field.value}
                                            startDate={watchStartDate}
                                            endDate={field.value}
                                            minDate={watchStartDate}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode='select'
                                            dateFormat='P'
                                        />
                                    )}
                                />
                                <ErrorMessage>{t(errors?.endDate?.message)}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow xs={1} md={1} lg={3}>
                            <Col>
                                <Form.Label>{t("realization_goal")}</Form.Label>
                                <Form.Control
                                    {...register("realizationGoal")}
                                    type='number'
                                    disabled={watchMachineGroup == null}
                                    placeholder={t("produced")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{t(errors?.realizationGoal?.message)}</ErrorMessage>
                            </Col>
                            <Col>
                                <Form.Label>{t("quality_goal")}</Form.Label>
                                <Form.Control
                                    {...register("qualityGoal")}
                                    type='number'
                                    step='0.01'
                                    disabled={watchMachineGroup == null}
                                    placeholder={t("scrap_percentage")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{t(errors?.qualityGoal?.message)}</ErrorMessage>
                            </Col>
                            <Col>
                                <Form.Label>{t("oee_goal")}</Form.Label>
                                <Form.Control
                                    {...register("oeeGoal")}
                                    type='number'
                                    step='0.01'
                                    disabled={watchMachineGroup == null}
                                    placeholder={t("oee")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{t(errors?.oeeGoal?.message)}</ErrorMessage>
                            </Col>
                        </FormRow>
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

export default GoalsAddPane;
