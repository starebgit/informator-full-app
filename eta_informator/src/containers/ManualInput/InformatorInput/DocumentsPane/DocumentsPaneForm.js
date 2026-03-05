import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import * as Yup from "yup";
import Select, {
    CreateSelect,
    findOptionByValue,
} from "../../../../components/Forms/CustomInputs/Select/Select";
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
import { removeUpload } from "../../../../data/API/Informator/InformatorAPI";

function DocumentsPaneForm({ categories, subcategories, ...props }) {
    const history = useHistory();
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [removedFiles, setRemovedFiles] = useState([]);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isAdding = !id;

    //* Queries
    const documents = useQuery(
        ["document", id],
        async () => {
            return client
                .service("documents")
                .get(id, {})
                .then((result) => result);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                if (
                    data.userId != state.user.id &&
                    data.userId != null &&
                    state.user.role.role != "admin" &&
                    state.user.role.role != "human_resources"
                )
                    history.push("..");
                const unit = findOptionByValue(unitsLabels, data?.subunitId);
                const category = categories?.find((category) => data.categoryId == category.id);
                const subcategory = subcategories?.find(
                    (subcategory) => data.subcategoryId == subcategory.id,
                );
                setValue("subunit", unit);
                setValue("startDate", dayjs(data.startDate).toDate());
                setValue("endDate", dayjs(data.endDate).toDate());
                setValue("name", data.name);
                if (category) {
                    setValue("category", {
                        value: category.id,
                        label: category.name,
                    });
                }
                if (subcategory) {
                    setValue("subcategory", {
                        value: subcategory.id,
                        label: subcategory.name,
                    });
                }
                setUploadedFiles(data.uploads);
            },
        },
    );

    //* Mutations
    const addDocumentMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "post",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data }) => data.map((file) => file.id));
            const documentsResponse = client
                .service("documents")
                .create({
                    name: values.name,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    active: 1,
                    subunitId: null,
                    categoryId: values.category.value,
                    subcategoryId: values.subcategory?.value,
                    userId: values.userId,
                })
                .then((response) => response.id);
            Promise.all([filesResponse, documentsResponse]).then(([filesResponse, docResponse]) => {
                client
                    .service("documents-uploads")
                    .create({
                        documentId: docResponse,
                        uploadsId: filesResponse,
                    })
                    .then(() => {
                        queryClient.invalidateQueries("documents");
                    });
            });
        },
        {
            onSuccess: async () => {
                setTimeout(() => {
                    history.push(".");
                }, 2000);
            },
        },
    );

    const editDocumentMutation = useMutation(
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

            const documentsResponse = client
                .service("documents")
                .patch(id, {
                    name: values.name,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    active: 1,
                    subunitId: null,
                    categoryId: values.category.value,
                    subcategoryId: values.subcategory?.value || null,
                    userId: values.userId,
                })
                .then((response) => {
                    return response.id;
                });
            Promise.all([filesResponse, documentsResponse]).then(([filesResponse, docResponse]) => {
                const uploadedFilesIds = uploadedFiles?.map((file) => file.id);
                filesResponse = [...uploadedFilesIds, ...filesResponse];
                client
                    .service("documents-uploads")
                    .remove(docResponse)
                    .then(() => {
                        client
                            .service("documents-uploads")
                            .create({
                                documentId: docResponse,
                                uploadsId: filesResponse,
                            })
                            .then(() => {
                                queryClient.invalidateQueries("documents");
                            });
                    });
            });
        },
        {
            onSuccess: async () => {
                setTimeout(() => {
                    history.push("..");
                }, 2000);
            },
        },
    );

    //* Validation schema
    const validationSchema = Yup.object().shape({
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

    //* Form
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
        control,
        watch,
    } = useForm({
        resolver: yupResolver(validationSchema),
    });

    //* Watchers
    const watchStartDate = watch("startDate", dayjs().startOf("week"));
    const watchEndDate = watch("endDate", dayjs().endOf("week"));
    const watchFiles = watch("files", []);
    const watchCategory = watch("category", null);
    const unitsLabels = queryClient.getQueryData("unitsLabels");

    //* Labels
    const categoryLabels = categories?.map((category) => {
        return {
            value: category.id,
            label: t("labels:" + category.name),
        };
    });
    const subcategoriesLabels = subcategories?.map((subcategory) => {
        return {
            value: subcategory.id,
            label: t("labels:" + subcategory.name),
            categoryId: subcategory.categoryId,
        };
    });

    //* Dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ".pdf",
        onDrop: (acceptedFiles) => {
            setValue("files", acceptedFiles);
        },
    });

    //* Columns
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
                name: t("labels:id"),
                selector: (row) => row.id,
                omit: true,
            },
            {
                name: t("labels:name"),
                selector: (row) => row.name,
                grow: 6,
            },
            {
                name: t("labels:size"),
                selector: (row) => row.size,
            },
            {
                name: t("labels:edit"),
                cell: (row) => (
                    <FontAwesomeIcon icon='times' onClick={() => onRemoveHandler(row.id)} />
                ),
            },
        ];
    }, [watchFiles, setValue, t]);

    const uploadedFilesColumns = useMemo(() => {
        const uploadedFilesRemoveHandler = (id) => {
            setRemovedFiles((prev) => {
                return [...prev, id];
            });
            setUploadedFiles((prev) => {
                return prev.filter((file) => file.id !== id);
            });
        };
        return [
            {
                name: t("labels:id"),
                selector: (row) => row.id,
                omit: true,
            },
            {
                name: t("labels:documentId"),
                selector: (row) => row.documentId,
                omit: true,
            },
            {
                name: t("labels:name"),
                selector: (row) => row.name,
                grow: 6,
            },
            {
                name: t("labels:size"),
                selector: (row) => row.size,
            },
            {
                name: t("labels:edit"),
                cell: (row) => (
                    <FontAwesomeIcon
                        icon='times'
                        onClick={() => uploadedFilesRemoveHandler(row.documentId)}
                    />
                ),
            },
        ];
    }, [t]);

    //* Handlers
    const onSubmit = (values) => {
        removedFiles.forEach((fileId) => {
            removeUpload(fileId);
        });
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
        isAdding ? addDocumentMutation.mutate(newValues) : editDocumentMutation.mutate(newValues);
    };

    const createSubcategory = (value) => {
        client
            .service("subcategories")
            .create({
                name: value,
                categoryId: watchCategory.value,
            })
            .then(() => {
                queryClient.invalidateQueries("subcategories");
            });
        setValue("subcategory", {
            value: value,
            label: value,
        });
    };

    return (
        <>
            <h3>{isAdding ? t("add_document") : t("edit_document")}</h3>
            {addDocumentMutation.isSuccess || editDocumentMutation.isSuccess ? (
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
                                    <Form.Label>{t("category")}</Form.Label>
                                    <Controller
                                        name='category'
                                        control={control}
                                        defaultValue={null}
                                        render={({ ref, field }) => (
                                            <Select
                                                {...field}
                                                ref={ref}
                                                options={categoryLabels}
                                                placeholder={t("select_category")}
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.categories?.message}</ErrorMessage>
                                </Col>
                                <Col>
                                    <Form.Label>{t("labels:subcategory")}</Form.Label>
                                    <Controller
                                        name='subcategory'
                                        control={control}
                                        render={({ ref, field }) => (
                                            <CreateSelect
                                                {...field}
                                                ref={ref}
                                                options={subcategoriesLabels?.filter((label) => {
                                                    return label.categoryId == watchCategory?.value;
                                                })}
                                                placeholder={t("labels:select_subcategory")}
                                                isDisabled={watchCategory == null}
                                                isClearable
                                                onCreateOption={createSubcategory}
                                            />
                                        )}
                                    />
                                    <ErrorMessage>{errors?.subcategory?.message}</ErrorMessage>
                                </Col>
                            </FormRow>
                            <FormRow>
                                <Col>
                                    <Controller
                                        name='files'
                                        control={control}
                                        defaultValue={[]}
                                        render={(props) => (
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
                                        )}
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
                                                          name: file.name,
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
                                                          documentId: file.id,
                                                          name: file.name,
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

export default DocumentsPaneForm;
