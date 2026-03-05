import { useState } from "react";
import { Row, Col, Button, Modal, FormControl as BsFormControl } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import { getNoticesByQuery, removeNotice } from "../../../../data/API/Informator/InformatorAPI";
import Notice from "../../../Documentation/Notices/Notice";
import NoticesPaneForm from "./NoticesPaneForm";
import { useDebounce } from "@uidotdev/usehooks";

function NoticesPane({ selectedUnit, units, setSelectedUnit }) {
    const queryClient = useQueryClient();
    const { t } = useTranslation("manual_input");
    const { path } = useRouteMatch();
    const [material, setMaterial] = useState(undefined);
    const debouncedMaterial = useDebounce(material, 200);
    const [selectedNotice, setSelectedNotice] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);
    const types = queryClient.getQueryData("typesLabels");

    const removeNoticeMutation = useMutation((id) => removeNotice(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries(["notices", selectedUnit?.subunitId]);
            setTimeout(() => {
                setShowRemoveModal(false);
                removeNoticeMutation.reset();
            }, 1000);
        },
    });

    const handleShowRemoveModal = (id) => {
        setShowRemoveModal(true);
        setSelectedNotice(id);
    };

    const notices = useQuery(
        ["notices", selectedUnit?.subunitId, page, perPage, sort, debouncedMaterial],
        () =>
            getNoticesByQuery(page, perPage, sort, {
                subunitId: selectedUnit?.subunitId,
                ...(debouncedMaterial && {
                    $or: {
                        materialCode: {
                            $like: `%${debouncedMaterial}%`,
                        },
                    },
                }),
            }).then((result) => result),
        {
            enabled: !!selectedUnit,
        },
    );

    const tableData = notices?.data?.data.map((notice, i) => {
        return {
            id: i + 1,
            noticeId: notice.id,
            name: notice.title,
            code: notice.materialCode,
            subunit: notice.subunit.name,
            description: notice.description,
            status: notice.active,
            createdBy: notice.user || {},
            timestamp: notice.createdAt,
            images: notice.uploads,
            keywords: notice.keywords.map((keyword) => keyword.keyword),
            formCode: notice.formCode,
        };
    });

    const noticesPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("notices")}</h3>
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
                    <Notice
                        search
                        edit
                        createdBy
                        path={path + "/add?unit=" + selectedUnit.subunitId}
                        selectedUnit={selectedUnit}
                        data={tableData}
                        material={material}
                        setMaterial={setMaterial}
                        clicked={handleShowRemoveModal}
                        isLoading={notices.isLoading}
                        total={notices?.data?.total}
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
                    {removeNoticeMutation.isSuccess ? (
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
                                    onClick={() => removeNoticeMutation.mutate(selectedNotice)}
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
                {noticesPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <NoticesPaneForm types={types?.data} />
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <NoticesPaneForm types={types?.data} />
            </PrivateRoute>
        </Switch>
    );
}

export default NoticesPane;
