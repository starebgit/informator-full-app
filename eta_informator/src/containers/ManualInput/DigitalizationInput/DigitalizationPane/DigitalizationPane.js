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
    getDigitalizationByQuery,
    removeDigitalization,
} from "../../../../data/API/Informator/InformatorAPI";
import Digitalization from "../../../Documentation/Digitalization/Element";
import { useDebounce } from "@uidotdev/usehooks";
import DigitalizationPaneForm from "./DigitalizationPaneForm";

function DigitalizationPane() {
    const queryClient = useQueryClient();
    const { t } = useTranslation("manual_input");
    const { path } = useRouteMatch();
    const [material, setMaterial] = useState(undefined);
    const debouncedMaterial = useDebounce(material, 200);
    const [selectedDigitalization, setSelectedDigitalization] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);
    const types = queryClient.getQueryData("typesLabels");

    const removeDigitalizationMutation = useMutation((id) => removeDigitalization(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries(["digitalization"]);
            setTimeout(() => {
                setShowRemoveModal(false);
                removeDigitalizationMutation.reset();
            }, 1000);
        },
    });

    const handleShowRemoveModal = (id) => {
        setShowRemoveModal(true);
        setSelectedDigitalization(id);
    };

    const digitalization = useQuery(
        ["digitalization", page, perPage, sort, debouncedMaterial],
        () =>
            getDigitalizationByQuery(page, perPage, sort, {
                ...(debouncedMaterial && {
                    $or: {
                        materialCode: {
                            $like: `%${debouncedMaterial}%`,
                        },
                    },
                }),
            }).then((result) => result),
    );

    const tableData = digitalization?.data?.data.map((digitalization, i) => {
        return {
            id: i + 1,
            digitalizationId: digitalization.id,
            title: digitalization.title,
            description: digitalization.description,
            status: digitalization.active,
            createdBy: digitalization.user || {},
            timestamp: digitalization.createdAt,
            images: digitalization.uploads,
        };
    });

    const digitalizationPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("pictorial_instructions")}</h3>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Digitalization
                        search
                        edit
                        path={`${path}/add`}
                        data={tableData}
                        material={material}
                        setMaterial={setMaterial}
                        clicked={handleShowRemoveModal}
                        isLoading={digitalization.isLoading}
                        total={digitalization?.data?.total}
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
                    {removeDigitalizationMutation.isSuccess ? (
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
                                        removeDigitalizationMutation.mutate(selectedDigitalization)
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
            <PrivateRoute path={`${path}/edit/:id`}>
                <DigitalizationPaneForm types={types?.data} />
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <DigitalizationPaneForm types={types?.data} />
            </PrivateRoute>
            <PrivateRoute exact path={path}>
                {types == undefined ? <h1>Loading</h1> : digitalizationPane}
            </PrivateRoute>
        </Switch>
    );
}

export default DigitalizationPane;
