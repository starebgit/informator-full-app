import React, { useContext, useEffect } from "react";
import { FormControl, Col, Button, FormLabel, Form } from "react-bootstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useFlawLocations } from "../../../../data/ReactQuery";
import { generateFlawLocationsLabels } from "../../../../data/Formaters/Informator";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createFlaw, editFlaw } from "../../../../data/API/Informator/InformatorAPI";
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

function FlawAddForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const locationParam = useURL().get("location");
    const { t } = useTranslation(["manual_input", "labels"]);
    const {
        data: flawLocationData,
        isLoading: flawLocationLoading,
        isError: flawLocationError,
    } = useFlawLocations();
    const isAdding = !id;

    const addAccidentMutation = useMutation((values) => createFlaw(values), {
        onSuccess: async () => {
            queryClient.invalidateQueries("flaws");
            setTimeout(() => {
                history.go(-1);
            }, 2000);
        },
    });
    const editAccidentMutation = useMutation((values) => editFlaw(values), {
        onSuccess: () => {
            setTimeout(() => {
                queryClient.invalidateQueries("flaws");
                history.go(-1);
            }, 2000);
        },
    });
    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t("labels:required")),
        flawLocation: Yup.object().required(t("labels:required")),
        color: Yup.string().required(t("labels:required")),
        highlight: Yup.boolean().required(t("labels:required")),
        material_component: Yup.boolean().required(t("labels:required")),
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const flawLocation = useQuery(
        ["flawLocation", id],
        async () => {
            return qualityClient
                .service("flaws")
                .get(id)
                .then((response) => response);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const selectedFlaw = flawLocationsLabels.find(
                    (flaw) => flaw.id === data.flawLocationId,
                );
                setValue("name", data.name);
                setValue("flawLocation", selectedFlaw);
                setValue("color", data.color);
                setValue("highlight", data.highlight);
                setValue("material_component", data.material_component);
            },
        },
    );
    // watch
    const highlightValue = watch("highlight");
    const materialComponentValue = watch("material_component");

    useEffect(() => {
        if (highlightValue) {
            setValue("material_component", false);
        }
    }, [highlightValue, setValue]);

    useEffect(() => {
        if (materialComponentValue) {
            setValue("highlight", false);
        }
    }, [materialComponentValue, setValue]);
    if (flawLocationLoading) return <p>Loading...</p>;

    const flawLocationsLabels = generateFlawLocationsLabels(flawLocationData, t);

    function setSelectDefaultValue() {
        if (locationParam && isAdding) {
            if (flawLocationsLabels.length > 0) {
                const selectedLocation = flawLocationsLabels.find(
                    (flaw) => +flaw?.value == +locationParam,
                );
                return selectedLocation;
            }
        }
        return null;
    }

    function onSubmit(data) {
        return isAdding
            ? addAccidentMutation.mutate({ ...data, userId: state?.user?.id })
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
                                <FormLabel>{t("flaw_location")}</FormLabel>
                                <Controller
                                    name='flawLocation'
                                    control={control}
                                    defaultValue={setSelectDefaultValue()}
                                    render={({ ref, field }) => (
                                        <ReactSelect
                                            {...field}
                                            ref={ref}
                                            options={flawLocationsLabels}
                                            placeholder={t("select_flaw_location")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{errors?.locationId?.message}</ErrorMessage>
                            </Col>
                            <Col>
                                <FormLabel>{t("flaw_name")}</FormLabel>
                                <FormControl
                                    {...register("name")}
                                    type='text'
                                    placeholder={t("enter_flaw_name")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("color")}</FormLabel>
                                <FormControl
                                    {...register("color")}
                                    type='color'
                                    label={t("select_color_used_to_display_on_the_graph")}
                                    defaultValue='#212312'
                                />
                                <ErrorMessage>{errors?.color?.message}</ErrorMessage>
                            </Col>
                            <Col className='d-flex justify-content-end flex-column'>
                                <FormLabel>{t("highlight_flaw")}</FormLabel>
                                <Form.Check
                                    style={{ height: "40px" }}
                                    {...register("highlight")}
                                    type='switch'
                                    label={t("select_to_highlight_the_flaw")}
                                />
                                <ErrorMessage>{errors?.highlight?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col></Col>
                            <Col>
                                <FormLabel>{t("material_component")}</FormLabel>
                                <Form.Check
                                    style={{ height: "40px" }}
                                    {...register("material_component")}
                                    type='switch'
                                    label={t("select_to_material_component")}
                                />
                                <ErrorMessage>{errors?.material_component?.message}</ErrorMessage>
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

export default FlawAddForm;
