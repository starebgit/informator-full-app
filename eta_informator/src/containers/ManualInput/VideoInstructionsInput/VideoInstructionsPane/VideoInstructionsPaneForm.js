import { Form, FormControl, Col, Button, FormLabel, Row } from "react-bootstrap";
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
import { Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "react-query";
import { editVideoInstruction } from "../../../../data/API/Informator/InformatorAPI";
import * as Yup from "yup";
import { useContext, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import styled from "styled-components";
import ReactSelect from "../../../../components/Forms/CustomInputs/Select/Select";

const DeleteButton = styled(FontAwesomeIcon)`
    &:hover {
        cursor: pointer;
    }
`;

function VideoInstructionsPaneForm(props) {
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

    const addVideoInstructionMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data, ...response }) => data.map((file) => file.id));
            const VideoInstructionsResponse = client.service("video-instructions").create({
                name: values.title,
                description: values.description,
                machineCode: values.machineCode,
                active: true,
                subunitId: values.subunitId.value,
                createdBy: values.userId,
            });
            Promise.all([filesResponse, VideoInstructionsResponse]).then(
                ([filesResponse, videoInstructionsResponse]) => {
                    client
                        .service("video-instructions-uploads")
                        .create({
                            videoInstructionId: videoInstructionsResponse,
                            uploadsId: filesResponse,
                        })
                        .then((response) => {
                            queryClient.invalidateQueries([
                                "video-instructions",
                                values.subunitId.value,
                            ]);
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

    const editVideoInstructionMutation = useMutation(
        ({ body, ...values }) => {
            const filesResponse = axios({
                method: "POST",
                url: `http://${process.env.REACT_APP_INFORMATOR}/uploads`,
                data: body,
                headers: {
                    Authorization: `Bearer ${state.token}`,
                },
            }).then(({ data, ...response }) => data.map((file) => file.id));
            const videoInstructionResponse = editVideoInstruction(values).then((response) => {
                return response.id;
            });

            Promise.all([filesResponse, videoInstructionResponse]).then(
                ([filesResponse, videoInstructionResponse]) => {
                    const uploadedFilesIds = uploadedFiles.map((file) => file.id);
                    filesResponse = [...uploadedFilesIds, ...filesResponse];
                    client
                        .service("video-instructions-uploads")
                        .remove(videoInstructionResponse)
                        .then(() => {
                            client
                                .service("video-instructions-uploads")
                                .create({
                                    videoInstructionId: videoInstructionResponse,
                                    uploadsId: filesResponse,
                                })
                                .then((response) => {
                                    queryClient.invalidateQueries("video-instructions");
                                });
                        });
                },
            );
        },
        {
            onSuccess: () => {
                setTimeout(() => {
                    queryClient.invalidateQueries("video-instructions");
                    history.push("..");
                }, 2000);
            },
        },
    );

    const validationSchema = Yup.object().shape({
        title: Yup.string().required(t("labels:required_field")),
        machineCode: Yup.string().required(t("labels:required_field")),
        subunitId: Yup.object().required(t("labels:required_field")).nullable(),
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
        accept: [".mp4", ".mov", ".avi"],
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
            ? addVideoInstructionMutation.mutate(newValues)
            : editVideoInstructionMutation.mutate(newValues);
    };

    return (
        <>
            <h2>
                {isAdding ? t("labels:add_video_instruction") : t("labels:edit_video_instruction")}
            </h2>
            {addVideoInstructionMutation.isSuccess || editVideoInstructionMutation.isSuccess ? (
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
                                <FormLabel>{t("labels:title")}</FormLabel>
                                <FormControl
                                    {...register("title")}
                                    type='text'
                                    placeholder={t("labels:enter_title")}
                                />
                                <ErrorMessage>{errors?.title?.message}</ErrorMessage>
                            </Col>
                        </FormRow>
                        <FormRow>
                            <Col>
                                <FormLabel>{t("labels:machine_code")}</FormLabel>
                                <FormControl
                                    {...register("machineCode")}
                                    type='text'
                                    placeholder={t("labels:enter_machine_code")}
                                    autoComplete='off'
                                />
                                <ErrorMessage>{errors?.machineCode?.message}</ErrorMessage>
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
                                <FormLabel>{t("labels:description")}</FormLabel>
                                <FormControl
                                    {...register("description")}
                                    type='text'
                                    as='textarea'
                                    rows='4'
                                    placeholder={t("labels:enter_description")}
                                />
                                <ErrorMessage>{errors?.description?.message}</ErrorMessage>
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

export default VideoInstructionsPaneForm;
