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
import { editDigitalization } from "../../../../data/API/Informator/InformatorAPI";
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

function DigitalizationPaneForm(props) {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const { id } = useParams();
    const { t, i18n } = useTranslation(["manual_input", "labels"]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const isAdding = !id;

    const addDigitalizationMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            })
                .then(({ data, ...response }) => data.map((file) => file.id))
                .catch((err) => {
                    console.error("Napaka pri uploadu:", err.response?.data || err.message);
                });
            const digitalizationResponse = client
                .service("digitalization")
                .create({
                    title: values.title,
                    active: true,
                    //userId: values.userId,
                })
                .then((response) => response.id);
            Promise.all([filesResponse, digitalizationResponse])
                .then(([filesResponse, digitalizationResponse]) => {
                    client
                        .service("digitalization-uploads")
                        .create({
                            digitalizationId: digitalizationResponse,
                            uploadsId: filesResponse,
                        })
                        .then((response) => {
                            queryClient.invalidateQueries(["digitalization"]);
                        })
                        .catch(console.error);
                })
                .catch((err) => {
                    console.error("Promise.all error:", err);
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

    const editDigitalizationMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data, ...response }) => data.map((file) => file.id));
            const digitalizationResponse = editDigitalization(values).then((response) => {
                return response.id;
            });

            Promise.all([filesResponse, digitalizationResponse]).then(
                ([filesResponse, digitalizationResponse]) => {
                    const uploadedFilesIds = uploadedFiles.map((file) => file.id);
                    filesResponse = [...uploadedFilesIds, ...filesResponse];
                    client
                        .service("digitalization-uploads")
                        .remove(digitalizationResponse)
                        .then(() => {
                            client
                                .service("digitalization-uploads")
                                .create({
                                    digitalizationId: digitalizationResponse,
                                    uploadsId: filesResponse,
                                })
                                .then((response) => {
                                    queryClient.invalidateQueries("digitalization");
                                });
                        });
                },
            );
        },
        {
            onSuccess: () => {
                setTimeout(() => {
                    queryClient.invalidateQueries("digitalization");
                    history.push("..");
                }, 2000);
            },
        },
    );

    const validationSchema = Yup.object().shape({
        title: Yup.string().required(t("labels:required_field")),
        //files: Yup.array().min(1, t("labels:required_field")).required(t("labels:required_field"))
        files: Yup.array().test(
            "notEmpty",
            t("labels:required_field"),
            (value, context) => value.length != 0 || uploadedFiles.length != 0,
        ),
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
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

    const digitalization = useQuery(
        ["digitalization", id],
        async () => {
            return client
                .service("digitalization")
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
                setValue("startDate", dayjs(data.startDate).toDate());
                setValue("endDate", dayjs(data.endDate).toDate());
                setValue("title", data.title);
                setUploadedFiles(data.uploads);
                //const [type] = props.types.filter(typeId => data.typeId == typeId)
            },
        },
    );

    const onSubmit = (values) => {
        console.log("On Submut:", values);
        let bodyFormData = new FormData();
        values.files.forEach((file) => {
            bodyFormData.append("files", file);
        });
        bodyFormData.append("title", values.title);
        bodyFormData.append("description", values.description || "");
        const newValues = isAdding
            ? { /*userId: state?.user?.id,*/ body: bodyFormData, ...values }
            : {
                  id: id,
                  /*userId: state?.user?.id,*/
                  body: bodyFormData,
                  ...values,
              };
        isAdding
            ? addDigitalizationMutation.mutate(newValues)
            : editDigitalizationMutation.mutate(newValues);
    };
    return (
        <>
            <h2>
                {isAdding
                    ? t("labels:add_pictorial_instructions")
                    : t("labels:edit_pictorial_instructions")}
            </h2>
            {addDigitalizationMutation.isSuccess || editDigitalizationMutation.isSuccess ? (
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
                                <FormLabel>{t("labels:variant")}</FormLabel>
                                <FormControl
                                    {...register("title")}
                                    type='text'
                                    placeholder={t("labels:enter_variant")}
                                />
                                <ErrorMessage>{errors?.title?.message}</ErrorMessage>
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
export default DigitalizationPaneForm;
