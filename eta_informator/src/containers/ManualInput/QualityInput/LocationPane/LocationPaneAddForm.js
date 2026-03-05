import React, { useContext } from "react";
import { FormControl, Col, Button, FormLabel } from "react-bootstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
    createInputLocation,
    editInputLocation,
} from "../../../../data/API/Informator/InformatorAPI";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import ReactSelect from "../../../../components/Forms/CustomInputs/Select/Select";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { qualityClient } from "../../../../feathers/feathers";
import { useHistory, useParams } from "react-router";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { Link } from "react-router-dom";

function LocationPaneAddForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const { t } = useTranslation(["manual_input", "labels"]);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const isAdding = !id;
    const addLocationMutation = useMutation((values) => createInputLocation(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("inputLocations");
                history.push(".");
            }, 2000);
        },
    });
    const editLocationMutation = useMutation((values) => editInputLocation(values), {
        onSuccess: () => {
            setTimeout(() => {
                queryClient.invalidateQueries("inputLocations");
                history.push("..");
            }, 2000);
        },
    });
    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t("labels:required_field")),
        subunitId: Yup.object().nullable().required(t("labels:required_field")),
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

    const location = useQuery(
        ["location", id],
        async () => {
            return qualityClient
                .service("locations")
                .get(id)
                .then((response) => response);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                setValue("name", data.name);
            },
        },
    );

    function onSubmit(data) {
        const payload = {
            ...data,
            subunitId: data.subunitId.value,
        };
        return isAdding
            ? addLocationMutation.mutate(payload)
            : editLocationMutation.mutate({
                  id: id,
                  userId: state?.user?.id,
                  ...payload,
              });
    }

    return (
        <>
            <h2>{isAdding ? t("add_input_location") : t("edit_input_location")}</h2>
            {addLocationMutation.isSuccess || editLocationMutation.isSuccess ? (
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
                                <FormLabel>{t("input_location_name")}</FormLabel>
                                <FormControl
                                    {...register("name")}
                                    type='text'
                                    placeholder={t("enter_input_location_name")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.name?.message}</ErrorMessage>
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

export default LocationPaneAddForm;
