import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import * as Yup from "yup";
import Select, { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import formatBytes from "../../../../data/Formaters/formatBytes";
import { useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useContext } from "react";
import client from "../../../../feathers/feathers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import dayjs from "dayjs";
import { Link, useHistory, useParams } from "react-router-dom";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import DatePicker from "../../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { useDropzone } from "react-dropzone";

function AttachmentsPaneForm(props) {
    const history = useHistory();
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const addAttachmentMutation = useMutation(
        async ({ files, subunit, category, name, startDate, endDate, userId }) => {
            const promises = subunit.map(async (unit) => {
                let bodyFormData = new FormData();
                files.forEach((file) => {
                    bodyFormData.append("files", file);
                });
                bodyFormData.append("description", name);

                const filesResponse = await axios({
                    method: "post",
                    url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                    data: bodyFormData,
                    headers: {
                        Authorization: `Bearer ${state.token}`,
                    },
                });
                const newFileIds = filesResponse.data.map((file) => file.id);

                const createdAttachment = await client.service("attachments").create({
                    name,
                    startDate,
                    endDate,
                    active: 1,
                    subunitId: unit.value,
                    categoryId: category.value,
                    userId,
                });

                await client.service("attachments-uploads").create({
                    attachmentId: createdAttachment.id,
                    uploadsId: newFileIds,
                });
            });

            await Promise.all(promises);
        },
        {
            onSuccess: async () => {
                queryClient.invalidateQueries("attachments");
                setTimeout(() => {
                    history.push(".");
                }, 2000);
            },
        },
    );

    const editAttachmentMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "post",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data }) =>
                data.map((file) => {
                    return file.id;
                }),
            );

            const attachmentsResponse = client
                .service("attachments")
                .patch(id, {
                    name: values.name,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    active: 1,
                    subunitId: values.subunit.value,
                    categoryId: values.category.value,
                    userId: values.userId,
                })
                .then((response) => {
                    return response.id;
                });
            Promise.all([filesResponse, attachmentsResponse]).then(
                ([filesResponse, docResponse]) => {
                    const uploadedFilesIds = uploadedFiles.map((file) => file.id);
                    filesResponse = [...uploadedFilesIds, ...filesResponse];
                    client
                        .service("attachments-uploads")
                        .remove(docResponse)
                        .then(() => {
                            client
                                .service("attachments-uploads")
                                .create({
                                    attachmentId: docResponse,
                                    uploadsId: filesResponse,
                                })
                                .then(() => {
                                    queryClient.invalidateQueries("attachments");
                                });
                        });
                },
            );
        },
        {
            onSuccess: async () => {
                setTimeout(() => {
                    history.push("..");
                }, 2000);
            },
        },
    );
    const { id } = useParams();

    const isAdding = !id;
    const validationSchemaEdit = Yup.object().shape({
        subunit: Yup.object().nullable().required(t("labels:required_field")),
        category: Yup.object().nullable().required(t("labels:required_field")),
        startDate: Yup.date().required(t("labels:required_field")),
        endDate: Yup.date().required(t("labels:required_field")),
        name: Yup.string().required(t("labels:required_field")),
        files: Yup.array().test(
            "notEmpty",
            t("labels:required_field"),
            (value) => value.length != 0 || uploadedFiles.length != 0,
        ),
    });

    const validationSchemaCreate = Yup.object().shape({
        subunit: Yup.array()
            .min(1, t("labels:required_field"))
            .required(t("labels:required_field")),
        category: Yup.object().nullable().required(t("labels:required_field")),
        startDate: Yup.date().required(t("labels:required_field")),
        endDate: Yup.date().required(t("labels:required_field")),
        name: Yup.string().required(t("labels:required_field")),
        files: Yup.array().test(
            "notEmpty",
            t("labels:required_field"),
            (value) => value.length !== 0 || uploadedFiles.length !== 0,
        ),
    });

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({
        resolver: yupResolver(isAdding ? validationSchemaCreate : validationSchemaEdit),
    });

    const watchStartDate = watch("startDate", dayjs().startOf("week"));
    const watchEndDate = watch("endDate", dayjs().endOf("week"));
    const watchFiles = watch("files", []);
    const watchCategory = watch("category", null);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const categories = props.categories.map((category) => {
        return {
            value: category.id,
            label: t("labels:" + category.name),
        };
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ".pdf",
        onDrop: (acceptedFiles) => {
            setValue("files", acceptedFiles);
        },
    });

    const {
        getRootProps: getRootProps2,
        getInputProps: getInputProps2,
        isDragActive: isDragActive2,
    } = useDropzone({
        accept: ".jpeg,.png,.jpg",
        onDrop: (acceptedFiles) => {
            setValue("files", acceptedFiles);
        },
    });

    const columns = useMemo(() => {
        const onRemoveHandler = (id) => {
            const currentFiles = [...watchFiles];
            const newFiles = currentFiles.filter((_, i) => {
                return i !== id - 1;
            });
            setValue("files", newFiles);
        };
        return [
            {
                name: "id",
                selector: "id",
            },
            {
                name: "document",
                selector: "document",
                grow: 6,
            },
            {
                name: "size",
                selector: "size",
            },
            {
                name: "edit",
                selector: "edit",
                cell: (row) => (
                    <FontAwesomeIcon icon='times' onClick={() => onRemoveHandler(row.id)} />
                ),
            },
        ];
    }, [watchFiles, setValue]);
    const uploadedFilesColumns = useMemo(() => {
        const uploadedFilesRemoveHandler = (id) => {
            client.service("uploads").remove(id).then();

            const currentFiles = [...uploadedFiles];
            const newFiles = currentFiles.filter((_, i) => {
                return i !== id - 1;
            });
            setUploadedFiles(newFiles);
        };
        return [
            {
                name: "id",
                selector: "id",
            },
            {
                name: "document",
                selector: "document",
                grow: 6,
            },
            {
                name: "size",
                selector: "size",
            },
            {
                name: "edit",
                selector: "edit",
                cell: (row) => (
                    <FontAwesomeIcon
                        icon='times'
                        onClick={() => uploadedFilesRemoveHandler(row.id)}
                    />
                ),
            },
        ];
    }, [uploadedFiles]);
    const attachment = useQuery(
        ["attachment", id],
        async () => {
            return client
                .service("attachments")
                .get(id, {})
                .then((result) => result);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                if (
                    data.userId != state.user.id &&
                    data.userId != null &&
                    state.user.role.role != "admin"
                )
                    history.push("..");
                const unit = findOptionByValue(unitsLabels, data?.subunitId);
                const [category] = props.categories.filter(
                    (category) => data.categoryId == category.id,
                );
                setValue("subunit", unit);
                setValue("startDate", dayjs(data.startDate).toDate());
                setValue("endDate", dayjs(data.endDate).toDate());
                setValue("name", data.name);
                setValue("category", {
                    value: category.id,
                    label: category.name,
                });
                setUploadedFiles(data.uploads);
            },
        },
    );

    const onSubmit = (values) => {
        let bodyFormData = new FormData();
        values.files.forEach((file) => {
            bodyFormData.append("files", file);
        });
        bodyFormData.append("description", values.name);
        const newValues = {
            body: bodyFormData,
            ...values,
            userId: state.user.id,
        };
        isAdding
            ? addAttachmentMutation.mutate(newValues)
            : editAttachmentMutation.mutate(newValues);
    };

    return (
        <>
            <h3>{isAdding ? t("add_attachment") : t("edit_attachment")}</h3>
            {addAttachmentMutation.isSuccess || editAttachmentMutation.isSuccess ? (
                <SubmitMessage
                    isSuccess={true}
                    message={
                        isAdding ? t("labels:successfully_added") : t("labels:successfully_edited")
                    }
                />
            ) : (
                <Row>
                    <FormWrap>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FormRow xs={1} md={1}>
                                <Col>
                                    <Form.Label>{t("name")}</Form.Label>
                                    <Form.Control
                                        {...register("name")}
                                        type='text'
                                        placeholder={t("enter_name")}
                                        autoComplete='off'
                                    />
                                    <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            {watchCategory?.value != 6 && (
                                <FormRow xs={1} md={2}>
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
                                        <ErrorMessage>{errors?.startDate?.message}</ErrorMessage>
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
                                        <ErrorMessage>{errors?.endDate?.message}</ErrorMessage>
                                    </Col>
                                </FormRow>
                            )}
                            <FormRow>
                                <Col>
                                    <Form.Label>{t("section")}</Form.Label>
                                    <Controller
                                        name='subunit'
                                        control={control}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                options={unitsLabels}
                                                isMulti={isAdding}
                                                placeholder={t("select_section")}
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.subunit?.message}</ErrorMessage>
                                </Col>
                                <Col>
                                    <Form.Label>{t("category")}</Form.Label>
                                    <Controller
                                        name='category'
                                        control={control}
                                        defaultValue={null}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                options={categories}
                                                placeholder={t("select_category")}
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.categories?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            <FormRow>
                                <Col>
                                    <Controller
                                        name='files'
                                        control={control}
                                        defaultValue={[]}
                                        render={(props) => {
                                            return watchCategory?.value != 6 ? (
                                                <div
                                                    {...getRootProps({
                                                        className: "dropzone",
                                                    })}
                                                    {...props}
                                                >
                                                    <input {...getInputProps()} />
                                                    {isDragActive ? (
                                                        <div
                                                            className='d-flex align-items-center justify-content-center'
                                                            style={{
                                                                height: "80px",
                                                                border: "2px dotted lightgray",
                                                                borderRadius: "6px",
                                                            }}
                                                        >
                                                            <div>{t("drop_here")}</div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className='d-flex align-items-center justify-content-center'
                                                            style={{
                                                                height: "80px",
                                                                border: "2px solid lightgray",
                                                                borderRadius: "6px",
                                                            }}
                                                        >
                                                            <div>{t("click_or_drag_to_add")}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    {...getRootProps2({
                                                        className: "dropzone",
                                                    })}
                                                    {...props}
                                                >
                                                    <input {...getInputProps2()} />
                                                    {isDragActive2 ? (
                                                        <div
                                                            className='d-flex align-items-center justify-content-center'
                                                            style={{
                                                                height: "80px",
                                                                border: "2px dotted lightgray",
                                                                borderRadius: "6px",
                                                            }}
                                                        >
                                                            <div>{t("drop_here")}</div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className='d-flex align-items-center justify-content-center'
                                                            style={{
                                                                height: "80px",
                                                                border: "2px solid lightgray",
                                                                borderRadius: "6px",
                                                            }}
                                                        >
                                                            <div>{t("click_or_drag_to_add")}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                    <ErrorMessage>{errors?.files?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            <FormRow>
                                <Col>
                                    <Form.Label>
                                        {watchFiles?.length > 0 ? t("selected_files_list") : null}
                                    </Form.Label>
                                    <DataTable
                                        columns={columns}
                                        noHeader
                                        data={
                                            watchFiles?.length > 0
                                                ? watchFiles?.map((file, i) => {
                                                      return {
                                                          id: i + 1,
                                                          document: file.name,
                                                          size: formatBytes(file.size),
                                                      };
                                                  })
                                                : []
                                        }
                                        noDataComponent={t("")}
                                        dense
                                    />
                                </Col>
                            </FormRow>
                            <FormRow>
                                <Col>
                                    <Form.Label>
                                        {uploadedFiles?.length > 0
                                            ? t("uploaded_files_list")
                                            : null}
                                    </Form.Label>
                                    <DataTable
                                        columns={uploadedFilesColumns}
                                        noHeader
                                        data={
                                            uploadedFiles?.length > 0
                                                ? uploadedFiles?.map((file, i) => {
                                                      return {
                                                          id: i + 1,
                                                          document: file.name,
                                                          size: formatBytes(file.size),
                                                      };
                                                  })
                                                : []
                                        }
                                        noDataComponent={t("")}
                                        dense
                                    />
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
                </Row>
            )}
        </>
    );
}

export default AttachmentsPaneForm;
