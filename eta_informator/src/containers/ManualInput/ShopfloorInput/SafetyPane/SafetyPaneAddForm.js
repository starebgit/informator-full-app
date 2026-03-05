import React, { useContext } from "react";
import { FormControl, Col, Button, FormLabel } from "react-bootstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { useCauses } from "../../../../data/ReactQuery";
import { generateCauseLabels } from "../../../../data/Formaters/Informator";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createAccident, editAccident } from "../../../../data/API/Informator/InformatorAPI";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import ReactSelect, {
    findOptionByValue,
} from "../../../../components/Forms/CustomInputs/Select/Select";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import client from "../../../../feathers/feathers";
import { useHistory, useParams } from "react-router";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import useURL from "../../../../routes/useURL";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { PulseLoader } from "react-spinners";

function SafetyAddPaneForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const { data: causeData, isLoading: causeIsLoading, isError: causeIsError } = useCauses();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const isAdding = !id;

    const addAccidentMutation = useMutation((values) => createAccident(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("accidents");
                history.push(".");
            }, 2000);
        },
    });
    const editAccidentMutation = useMutation((values) => editAccident(values), {
        onSuccess: () => {
            setTimeout(() => {
                queryClient.invalidateQueries("accidents");
                history.push("..");
            }, 2000);
        },
    });
    const validationSchema = Yup.object().shape({
        employeeId: Yup.number().required(t("labels:required_field")),
        accidentDate: Yup.date().required(t("labels:required_field")),
        subunitId: Yup.object().nullable().required(t("labels:required_field")),
        accidentCauseId: Yup.object().nullable().required(t("labels:required_field")),
        description: Yup.string().required(t("labels:required_field")),
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        control,
    } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const accident = useQuery(
        ["accident", id],
        async () => {
            return client
                .service("accidents")
                .get(id, {})
                .then((response) => response);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const unit = findOptionByValue(unitsLabels, data.subunitId);
                const cause = causes[data.accidentCauseId];
                setValue("employeeId", data.employeeId);
                setValue("accidentDate", dayjs(data.accidentDate).toDate());
                setValue("subunitId", unit);
                setValue("accidentCauseId", cause);
                setValue("description", data.description);
            },
        },
    );

    if (causeIsLoading)
        return (
            <div
                className='d-flex flex-column justify-content-center align-items-center'
                style={{ width: "100%", minHeight: "300px" }}
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
                {t("data_is_loading")}
            </div>
        );

    const causes = generateCauseLabels(causeData, t);

    function onSubmit(data) {
        return isAdding
            ? addAccidentMutation.mutate({ userId: state?.user?.id, ...data })
            : editAccidentMutation.mutate({
                  id: id,
                  userId: state?.user?.id,
                  ...data,
              });
    }

    return (
        <>
            <h2>{isAdding ? t("add_accident") : t("edit_accident")}</h2>
            {addAccidentMutation.isSuccess || editAccidentMutation.isSuccess ? (
                <SubmitMessage
                    isSuccess={true}
                    message={
                        isAdding ? t("labels:successfully_added") : t("labels:successfully_edited")
                    }
                />
            ) : (
                <FormWrap>
                    <form onSubmit={handleSubmit(onSubmit)} onReset={reset}>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("employee_id")}</FormLabel>
                                <FormControl
                                    {...register("employeeId")}
                                    type='text'
                                    placeholder={t("enter_employee_id")}
                                />
                                <ErrorMessage>{errors?.employeeId?.message}</ErrorMessage>
                            </Col>
                            <Col>
                                <FormLabel>{t("accident_date")}</FormLabel>
                                <Controller
                                    name='accidentDate'
                                    control={control}
                                    defaultValue={new Date()}
                                    render={({ ref, field }) => (
                                        <DatePicker
                                            onChange={(e) => field.onChange(e)}
                                            selected={field.value}
                                            locale={i18n.language}
                                            dateFormat='Pp'
                                            showTimeSelect
                                            timeIntervals={15}
                                            timeCaption={t("labels: time")}
                                        />
                                    )}
                                />
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("section")}</FormLabel>
                                <Controller
                                    name='subunitId'
                                    control={control}
                                    defaultValue={isAdding ? false : unitsLabels[1].options[1]}
                                    render={({ ref, field }) => (
                                        <ReactSelect
                                            {...field}
                                            ref={ref}
                                            options={unitsLabels}
                                            placeholder={t("select_section")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{errors?.subunitId?.message}</ErrorMessage>
                            </Col>
                            <Col>
                                <FormLabel>{t("cause")}</FormLabel>
                                <Controller
                                    name='accidentCauseId'
                                    control={control}
                                    defaultValue={false}
                                    render={({ ref, field }) => (
                                        <ReactSelect
                                            {...field}
                                            ref={ref}
                                            options={causes}
                                            placeholder={t("select_cause")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{errors?.accidentCauseId?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("description")}</FormLabel>
                                <FormControl
                                    {...register("description")}
                                    type='text'
                                    as='textarea'
                                    rows='4'
                                    placeholder={t("describe_accident")}
                                />
                                <ErrorMessage>{errors?.description?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <div className='d-flex justify-content-end gap-2'>
                            <Link to={isAdding ? "." : ".."} className='btn btn-danger ms-auto'>
                                {t("labels:cancel")}
                            </Link>
                            <Button variant='primary' type='submit'>
                                {isAdding ? t("labels:add") : t("labels:edit")}
                            </Button>
                        </div>
                    </form>
                </FormWrap>
            )}
        </>
    );
}

export default SafetyAddPaneForm;
