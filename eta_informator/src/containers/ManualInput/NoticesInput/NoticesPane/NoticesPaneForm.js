import { Form, FormControl, Col, Button, FormLabel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DataTable from "react-data-table-component";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import client from "../../../../feathers/feathers";
import { useHistory, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";
import formatBytes from "../../../../data/Formaters/formatBytes";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import ReactSelect, {
    findOptionByValue,
    CreateSelect,
} from "../../../../components/Forms/CustomInputs/Select/Select";
import { useMutation, useQueryClient, useQuery } from "react-query";
import { editNotice } from "../../../../data/API/Informator/InformatorAPI";
import * as Yup from "yup";
import { useContext, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import styled from "styled-components";

const DeleteButton = styled(FontAwesomeIcon)`
    &:hover {
        cursor: pointer;
    }
`;

function NoticesPaneForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const typesLabels = queryClient.getQueryData("typesLabels");
    const keywordsLabels = queryClient.getQueryData("keywordsLabels");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isAddingKeyword, setIsAddingKeyword] = useState(false);
    const isAdding = !id;

    const addNoticeMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data, ...response }) => data.map((file) => file.id));
            const noticesResponse = client
                .service("notices")
                .create({
                    noticeTypeId: values.type.value,
                    title: "",
                    materialCode: values.materialCode,
                    machineCode: values.machineCode,
                    formCode: values.formCode,
                    description: values.description,
                    active: true,
                    subunitId: values.subunitId.value,
                    userId: values.userId,
                })
                .then((response) => {
                    if (!!values.keywords?.length) {
                        const keywordsId = values.keywords.map((keyword) => keyword.value);
                        client
                            .service("notices-keywords")
                            .create({
                                noticeId: response.id,
                                keywordsId: keywordsId,
                            })
                            .then((response) => response);
                    }
                    return response.id;
                });
            Promise.all([filesResponse, noticesResponse]).then(
                ([filesResponse, noticesResponse]) => {
                    client
                        .service("notices-uploads")
                        .create({
                            noticeId: noticesResponse,
                            uploadsId: filesResponse,
                        })
                        .then((response) => {
                            queryClient.invalidateQueries(["notices", values.subunitId.value]);
                        });
                },
            );
        },
        {
            onSuccess: async () => {
                setTimeout(() => {
                    history.push(".");
                }, 2000);
            },
        },
    );

    const editNoticeMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data, ...response }) => data.map((file) => file.id));
            const noticesResponse = editNotice(values).then(async (response) => {
                const editResponseId = response.id;
                await client
                    .service("notices-keywords")
                    .remove(response.id)
                    .then((response) => {
                        if (!!values.keywords?.length) {
                            const keywordsId = values.keywords.map((keyword) => keyword.value);
                            client
                                .service("notices-keywords")
                                .create({
                                    noticeId: editResponseId,
                                    keywordsId: keywordsId,
                                })
                                .then((response) => {
                                    queryClient.invalidateQueries("keywordsLabels");
                                });
                        }
                    });
                return response.id;
            });

            Promise.all([filesResponse, noticesResponse]).then(
                ([filesResponse, noticesResponse]) => {
                    const uploadedFilesIds = uploadedFiles.map((file) => file.id);
                    filesResponse = [...uploadedFilesIds, ...filesResponse];
                    client
                        .service("notices-uploads")
                        .remove(noticesResponse)
                        .then(() => {
                            client
                                .service("notices-uploads")
                                .create({
                                    noticeId: noticesResponse,
                                    uploadsId: filesResponse,
                                })
                                .then((response) => {
                                    queryClient.invalidateQueries("notices");
                                });
                        });
                },
            );
        },
        {
            onSuccess: () => {
                setTimeout(() => {
                    queryClient.invalidateQueries("notices");
                    history.push("..");
                }, 2000);
            },
        },
    );

    const validationSchema = Yup.object()
        .shape({
            type: Yup.object().nullable().required(t("labels:required_field")),
            materialCode: Yup.string(),
            machineCode: Yup.string(),
            formCode: Yup.string(),
            subunitId: Yup.object().nullable().required(t("labels:required_field")),
            keywords: Yup.array().nullable(),
            description: Yup.string().required(t("labels:required_field")),
            //files: Yup.array().min(1, t("labels:required_field")).required(t("labels:required_field"))
            files: Yup.array().test(
                "notEmpty",
                t("labels:required_field"),
                (value, context) => value.length != 0 || uploadedFiles.length != 0,
            ),
        })
        .test("atLeastOneCode", null, (obj) => {
            if (obj.machineCode || obj.materialCode || obj.formCode) {
                return true;
            }
            return new Yup.ValidationError(t("labels:enter_at_least_one"), null, "oneCode");
        });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
        formState: { errors },
        control,
    } = useForm({
        resolver: yupResolver(validationSchema),
    });

    const watchFiles = watch("files", []);
    const watchType = watch("type", "returns");
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: [".jpg", ".pdf"],
        onDrop: (acceptedFiles) => {
            setValue("files", [...watchFiles, ...acceptedFiles]);
        },
    });
    const watchSection = watch("subunitId", "");

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
                selector: (row) => row.id,
            },
            {
                name: "document",
                selector: (row) => row.document,
                grow: 6,
            },
            {
                name: "size",
                selector: (row) => row.size,
            },
            {
                name: "edit",
                cell: (row) => {
                    return <FontAwesomeIcon icon='times' onClick={() => onRemoveHandler(row.id)} />;
                },
            },
        ];
    }, [watchFiles, setValue]);

    const uploadedFilesColumns = useMemo(() => {
        const uploadedFilesRemoveHandler = (id) => {
            client.service("uploads").remove(id).then();
            const currentFiles = [...uploadedFiles];
            const newFiles = currentFiles.filter((file) => {
                return file.id !== id;
            });
            setUploadedFiles(newFiles);
        };
        return [
            {
                name: "id",
                selector: (row) => row.id,
            },
            {
                name: "document",
                selector: (row) => row.document,
                grow: 6,
            },
            {
                name: "size",
                selector: (row) => row.size,
            },
            {
                name: "edit",
                cell: (row) => {
                    return (
                        <DeleteButton
                            icon='times'
                            onClick={() => uploadedFilesRemoveHandler(row.uploadId)}
                        />
                    );
                },
            },
        ];
    }, [uploadedFiles]);

    const notice = useQuery(
        ["notice", id],
        async () => {
            return client
                .service("notices")
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
                const currentKeywordsList = data.keywords.map((keyword) => keyword.id);
                const keyword = keywordsLabels.filter((keyword) => {
                    return currentKeywordsList.includes(keyword.value);
                });
                const type = typesLabels.find((type) => {
                    if (data.noticeTypeId == null) return null;
                    return type.value == data.noticeTypeId;
                });
                setValue("subunitId", unit);
                setValue("type", type);
                setValue("startDate", dayjs(data.startDate).toDate());
                setValue("endDate", dayjs(data.endDate).toDate());

                setValue("materialCode", data.materialCode);
                setValue("machineCode", data.machineCode == null ? "" : data.machineCode, {
                    shouldDirty: true,
                });
                setValue("formCode", data.formCode == null ? "" : data.formCode, {
                    shouldDirty: true,
                });
                setValue("description", data.description);
                setValue("keywords", keyword);
                setUploadedFiles(data.uploads);
                //const [type] = props.types.filter(typeId => data.typeId == typeId)
            },
        },
    );

    const createKeyword = (value) => {
        setIsAddingKeyword(true);
        client
            .service("keywords")
            .create({
                keyword: value.toLowerCase(),
            })
            .then((response) => {
                setIsAddingKeyword(false);
                queryClient.invalidateQueries("keywordsLabels");
                setValue("keywords", [
                    {
                        value: response.id,
                        label: i18n.t("labels:" + response.keyword).toUpperCase(),
                    },
                    ...getValues("keywords"),
                ]);
            });
    };

    const onSubmit = (values) => {
        let bodyFormData = new FormData();
        values.files.forEach((file) => {
            bodyFormData.append("files", file);
        });
        bodyFormData.append("description", values.name);
        const newValues = isAdding
            ? { userId: state?.user?.id, body: bodyFormData, ...values }
            : {
                  id: id,
                  userId: state?.user?.id,
                  body: bodyFormData,
                  ...values,
              };
        isAdding ? addNoticeMutation.mutate(newValues) : editNoticeMutation.mutate(newValues);
    };
    return (
        <>
            <h2>{isAdding ? t("labels:add_notice") : t("labels:edit_notice")}</h2>
            {addNoticeMutation.isSuccess || editNoticeMutation.isSuccess ? (
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
                                <FormLabel>{t("labels:type")}</FormLabel>
                                <Controller
                                    name='type'
                                    control={control}
                                    defaultValue={isAdding ? false : typesLabels[0]}
                                    render={({ ref, field }) => (
                                        <ReactSelect
                                            {...field}
                                            ref={ref}
                                            options={typesLabels}
                                            placeholder={t("labels:select_type")}
                                        />
                                    )}
                                />
                                <ErrorMessage>{errors?.type?.message}</ErrorMessage>
                            </Col>
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
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("labels:material_code")}</FormLabel>
                                <FormControl
                                    {...register("materialCode")}
                                    type='text'
                                    placeholder={t("labels:enter_material_code")}
                                    disabled={watchType?.label == "general_notice"}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.oneCode?.message}</ErrorMessage>
                            </Col>
                            <Col>
                                <FormLabel>{t("labels:machine_code")}</FormLabel>
                                <FormControl
                                    {...register("machineCode")}
                                    type='text'
                                    placeholder={t("labels:enter_machine_code")}
                                    disabled={watchType?.label == "general_notice"}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.oneCode?.message}</ErrorMessage>
                            </Col>
                            {watchSection?.subunitId == 11 ? (
                                <Col>
                                    <FormLabel>{t("labels:form_code")}</FormLabel>
                                    <FormControl
                                        {...register("formCode")}
                                        type='text'
                                        placeholder={t("labels:enter_form_code")}
                                    />
                                    <ErrorMessage>{errors?.oneCode?.message}</ErrorMessage>
                                </Col>
                            ) : null}
                        </FormRow>

                        <FormRow>
                            <Col>
                                <FormLabel>{t("labels:notice")}</FormLabel>
                                <FormControl
                                    {...register("description")}
                                    type='text'
                                    as='textarea'
                                    rows='4'
                                    placeholder={t("labels:enter_notice")}
                                />
                                <ErrorMessage>{errors?.description?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("labels:keywords")}</FormLabel>
                                <Controller
                                    name='keywords'
                                    control={control}
                                    defaultValue={false}
                                    render={({ ref, field }) => (
                                        <CreateSelect
                                            {...field}
                                            ref={ref}
                                            options={keywordsLabels}
                                            placeholder={t("labels:select_keywords")}
                                            isDisabled={isAddingKeyword}
                                            isMulti
                                            onChange={(value) => {
                                                setValue("keywords", value);
                                            }}
                                            onCreateOption={(value) => createKeyword(value)}
                                        />
                                    )}
                                />
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("labels:pictures")}</FormLabel>
                                <Controller
                                    name='files'
                                    control={control}
                                    defaultValue={[]}
                                    render={(props) => {
                                        return (
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
                                    {uploadedFiles?.length > 0 ? t("uploaded_files_list") : null}
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
                                                      uploadId: file.id,
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
export default NoticesPaneForm;
