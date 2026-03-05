import { useState } from "react";
import { Row, Col, Button, Modal, FormControl as BsFormControl } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import {
    getVideoInstructionsByQuery,
    removeVideoInstruction,
} from "../../../../data/API/Informator/InformatorAPI";
import VideoInstruction from "../../../Documentation/VideoInstructions/VideoInstruction";
import VideoInstructionsPaneForm from "./VideoInstructionsPaneForm";
import { useDebounce } from "@uidotdev/usehooks";

function VideoInstructionsPane({ selectedUnit, units, setSelectedUnit }) {
    const queryClient = useQueryClient();
    const { t } = useTranslation("manual_input");
    const { path } = useRouteMatch();
    const [material, setMaterial] = useState(undefined);
    const debouncedSearchText = useDebounce(material, 200);
    const [selectedVideoInstruction, setSelectedVideoInstruction] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);
    const types = queryClient.getQueryData("typesLabels");

    const removeVideoInstructionMutation = useMutation((id) => removeVideoInstruction(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries(["video-instructions", selectedUnit?.subunitId]);
            setTimeout(() => {
                setShowRemoveModal(false);
                removeVideoInstructionMutation.reset();
            }, 1000);
        },
    });
    const handleShowRemoveModal = (id) => {
        setShowRemoveModal(true);
        setSelectedVideoInstruction(id);
    };

    const videoInstructions = useQuery(
        ["video-instructions", selectedUnit?.subunitId, page, perPage, sort, debouncedSearchText],
        () =>
            getVideoInstructionsByQuery(page, perPage, sort, {
                subunitId: selectedUnit?.subunitId,
                ...(debouncedSearchText && {
                    $or: {
                        materialCode: {
                            $like: `%${debouncedSearchText}%`,
                        },
                    },
                }),
            }).then((result) => result),
        {
            enabled: !!selectedUnit,
        },
    );

    const tableData = videoInstructions?.data?.data.map((videoInstruction, i) => {
        return {
            id: i + 1,
            videoInstructionId: videoInstruction.id,
            name: videoInstruction.title,
            subunit: videoInstruction.subunit.name,
            description: videoInstruction.description,
            createdBy: videoInstruction.user || {},
            status: videoInstruction.active,
            timestamp: videoInstruction.createdAt,
            videos: videoInstruction.uploads,
            machineCode: videoInstruction.machineCode,
        };
    });

    const videoInstructionsPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("video_instructions")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        i='subunit'
                        value={selectedUnit}
                        options={units}
                        onChange={(selected) => setSelectedUnit(selected)}
                    />
                    <label htmlFor='subunit'>{t("section")}</label>
                </Col>
            </Row>
            <Row>
                <Col>
                    <VideoInstruction
                        search
                        edit
                        createdBy
                        path={path + "/add?unit=" + selectedUnit.subunitId}
                        selectedUnit={selectedUnit}
                        data={tableData}
                        material={material}
                        setMaterial={setMaterial}
                        clicked={handleShowRemoveModal}
                        isLoading={videoInstructions.isLoading}
                        total={videoInstructions?.data?.total}
                        handlePageChange={(value) => setPage(value)}
                        handlePerPageChange={(value) => setPerPage(value)}
                        handleSort={(column, sortDirection) =>
                            setSort(sortDirection == "desc" ? -1 : 1)
                        }
                    />
                </Col>
            </Row>
            <Modal centered onHide={() => setShowRemoveModal(false)} show={showRemoveModal}>
                <Modal.Body>
                    {removeVideoInstructionMutation.isSuccess ? (
                        <SubmitMessage isSuccess={true} message='successfully_removed' />
                    ) : (
                        <div className='d-flex flex-column align-items-center'>
                            <h5 className='p-4'>{t("removal_prompt")}</h5>
                            <div>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='primary'
                                    onClick={() => setShowRemoveModal(false)}
                                >
                                    {t("labels:cancel")}
                                </Button>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='danger'
                                    onClick={() =>
                                        removeVideoInstructionMutation.mutate(
                                            selectedVideoInstruction,
                                        )
                                    }
                                >
                                    {t("labels:remove")}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Fragment>
    );

    if (types == undefined || types?.isLoading) return <h1>Loading</h1>;
    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {videoInstructionsPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <VideoInstructionsPaneForm types={types?.data} />
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <VideoInstructionsPaneForm types={types?.data} />
            </PrivateRoute>
        </Switch>
    );
}
export default VideoInstructionsPane;
