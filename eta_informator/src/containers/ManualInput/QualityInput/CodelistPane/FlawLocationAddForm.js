import React, { useContext } from "react";
import { FormControl, Col, Button, FormLabel } from "react-bootstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useFlawLocations, useInputLocations } from "../../../../data/ReactQuery";
import {
    generateCauseLabels,
    generateLocationsLabels,
} from "../../../../data/Formaters/Informator";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
    createFlawLocation,
    editFlawLocation,
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
import useURL from "../../../../routes/useURL";

function FlawLocationAddForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const locationParam = useURL().get("location");
    const { t } = useTranslation(["manual_input", "labels"]);
    const {
        data: locationData,
        isLoading: locationLoading,
        isError: locationError,
    } = useInputLocations();
    const isAdding = !id;

    const addAccidentMutation = useMutation((values) => createFlawLocation(values), {
        onSuccess: async () => {
            queryClient.invalidateQueries("flawsLocations");
            setTimeout(() => {
                history.push("..");
            }, 2000);
        },
    });
    const editAccidentMutation = useMutation((values) => editFlawLocation(values), {
        onSuccess: () => {
            setTimeout(() => {
                queryClient.invalidateQueries("flawLocations");
                history.push("..");
            }, 2000);
        },
    });
    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t("labels:required_field")),
        locationId: Yup.object().nullable().required(t("labels:required_field")),
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

    const flawLocation = useQuery(
        ["flawLocation", id],
        async () => {
            return qualityClient
                .service("flaw-location")
                .get(id)
                .then((response) => response);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const selectedFlaw = locationsLabels.find((flaw) => flaw.id === data.locationId);
                setValue("locationId", selectedFlaw);
                setValue("name", data.name);
            },
        },
    );

    if (locationError) return <h1>ni podatkov :/</h1>;
    if (locationLoading) return <h1>Loading</h1>;

    const locationsLabels = generateLocationsLabels(locationData, t);

    function setSelectDefaultValue() {
        if (locationParam && isAdding) {
            if (locationsLabels.length > 0) {
                const selectedLocation = locationsLabels.find(
                    (flaw) => flaw?.value === +locationParam,
                );
                return selectedLocation;
            }
        }
        return null;
    }

    function onSubmit(data) {
        return isAdding
            ? addAccidentMutation.mutate({ ...data })
            : editAccidentMutation.mutate({
                  id: id,
                  userId: state?.user?.id,
                  ...data,
              });
    }

    return (
        <>
            <h2>{isAdding ? t("add_flaw_location") : t("edit_flaw_location")}</h2>
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
                                <FormLabel>{t("input_location")}</FormLabel>
                                <Controller
                                    name='locationId'
                                    control={control}
                                    defaultValue={setSelectDefaultValue()}
                                    render={({ ref, field }) => (
                                        <ReactSelect
                                            {...field}
                                            ref={ref}
                                            options={locationsLabels}
                                            placeholder={t("select_section")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{errors?.locationId?.message}</ErrorMessage>
                            </Col>
                            <Col>
                                <FormLabel>{t("flaw_location")}</FormLabel>
                                <FormControl
                                    {...register("name")}
                                    type='text'
                                    placeholder={t("enter_flaw_location_name")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <div className='d-flex justify-content-end gap-2'>
                            <Link to={isAdding ? ".." : "../.."} className='btn btn-danger ms-auto'>
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

export default FlawLocationAddForm;
