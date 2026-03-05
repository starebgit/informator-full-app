import { Col, Row, Button, Spinner, Modal } from "react-bootstrap";
import React, { useState, useMemo, useContext } from "react";
import AttachmentsPaneForm from "./AttachmentsPaneForm";
import dayjs from "dayjs";
import client from "../../../../feathers/feathers";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import Table from "../../../../components/Tables/Table";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import { Link, Switch, useRouteMatch } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "react-query";
import PrivateRoute from "../../../../routes/PrivateRoute";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import { removeAttachment } from "../../../../data/API/Informator/InformatorAPI";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import ToggleGroup from "../../../../components/ToggleGroup/ToggleGroup";

const expandableComponent = ({ data }) => (
    <ul>
        {data.files.map((file) => {
            return (
                <li key={file.id}>
                    <div>
                        <em>{file.name + "   "}</em>
                        <em>{file.path + "   "}</em>
                        <em>{file.size}</em>
                    </div>
                </li>
            );
        })}
    </ul>
);

function AttachmentsPane(props) {
    const queryClient = useQueryClient();
    const { path } = useRouteMatch();
    const [show, setShow] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedRow, setSelectedRow] = useState(null);
    const { state, dispatch } = useContext(AuthContext);
    const { t } = useTranslation();

    const removeAttachmentMutation = useMutation((id) => removeAttachment(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries("attachments");
            setTimeout(() => {
                setShow(false);
                removeAttachmentMutation.reset();
            }, 2000);
        },
    });

    const categories = useQuery(
        ["categories"],
        () =>
            client
                .service("categories")
                .find({
                    query: {
                        section: "sfm",
                    },
                })
                .then((response) => {
                    const { data } = response;
                    return data.map((entry) => {
                        return {
                            id: entry.id,
                            name: entry.category,
                            value: entry.id,
                        };
                    });
                }),
        {
            onSuccess: (data) => {
                if (data.length > 0) {
                    setSelectedCategory(data[0].id);
                }
            },
        },
    );

    //Enabled allows us to trigger the query with condition
    const attachments = useQuery(
        ["attachments", selectedCategory, props.selectedUnit.subunitId],
        () =>
            client
                .service("attachments")
                .find({
                    query: {
                        category_id: selectedCategory,
                        subunit_id: props.selectedUnit.subunitId,
                    },
                })
                .then(({ data }) => data),
        {
            enabled: !!selectedCategory,
        },
    );

    const columns = useMemo(
        () => [
            {
                name: "ID",
                selector: (row) => row.id,
                width: "60px",
                center: true,
                sortable: true,
            },
            {
                name: t("manual_input:document_id"),
                selector: (row) => row.attachmentId,
                omit: true,
            },

            {
                name: t("manual_input:name"),
                selector: (row) => row.name,
                grow: 4,
            },
            {
                name: t("manual_input:start_date"),
                selector: (row) => row.startDate,
                grow: 3,
                sortable: true,
                sortFunction: (a, b) => {
                    return dayjs(a.startDate).isAfter(dayjs(b.startDate)) ? 1 : -1;
                },
                format: (row) => dayjs(row.startDate).format("LL"),
            },
            {
                name: t("manual_input:end_date"),
                selector: (row) => row.endDate,
                grow: 3,
                sortable: true,
                sortFunction: (a, b) => {
                    return dayjs(a.endDate).isAfter(dayjs(b.endDate)) ? 1 : -1;
                },
                format: (row) => dayjs(row.endDate).format("LL"),
            },
            {
                name: t("manual_input:created_by"),
                selector: (row) => row.createdBy,
                sortable: true,
            },
            {
                name: t("manual_input:edit"),
                selector: (row) => row.attachmentId,
                center: true,
                cell: (row) => (
                    <div className='d-flex'>
                        <div className='btn btn-link btn-sm'>
                            <Link
                                as={Button}
                                style={{ fontSize: "14px" }}
                                to={`${path}/edit/${row.attachmentId}`}
                            >
                                <FontAwesomeIcon
                                    icon='pencil-alt'
                                    style={{ fontSize: "21px" }}
                                    className='mx-1'
                                />
                            </Link>
                        </div>
                        <div
                            className='btn btn-link btn-sm'
                            onClick={() => {
                                setShow(true);
                                setSelectedAttachment(row.attachmentId);
                            }}
                        >
                            <FontAwesomeIcon
                                icon='trash-alt'
                                style={{
                                    fontSize: "21px",
                                    color: "var(--bs-danger)",
                                }}
                                className='mx-1'
                            />
                        </div>
                    </div>
                ),
            },
        ],
        [t, path],
    );

    const buttonToggleGroup = categories.data && (
        <ToggleGroup
            buttons={categories.data}
            title={"attachment_categories"}
            onSelected={setSelectedCategory}
            selectedButton={selectedCategory}
            align='left'
        />
    );

    //TODO - Optimize with useMemo or better yer - useQuery onSuccess
    const attachmentsData = attachments?.data
        ? attachments.data
              .filter((doc) => {
                  if (state.user.role.role == "admin") return true;
                  return state.user.id == doc.userId || doc.userId == null;
              })
              .map((doc, index) => {
                  return {
                      id: index + 1,
                      attachmentId: doc.id,
                      name: doc.name,
                      startDate: doc.startDate,
                      endDate: doc.endDate,
                      active: doc.active,
                      subunit: doc.subunitId,
                      category: doc.categoryId,
                      createdBy: doc.user?.username ? doc.user.username : "",
                      files: doc.uploads.map((upload) => ({
                          id: upload.id,
                          name: upload.name,
                          path: upload.path,
                          size: upload.size,
                      })),
                  };
              })
        : [];

    const searchPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("manual_input:attachments")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        i='subunit'
                        value={props.selectedUnit}
                        options={props.units}
                        onChange={(selected) => props.setSelectedUnit(selected)}
                    />
                    <label htmlFor='subunit'>{t("manual_input:section")}</label>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        actions={
                            <Link className='btn btn-primary' to={`${path}/add`}>
                                {t("manual_input:add_attachment")}
                            </Link>
                        }
                        title={t("manual_input:all_attachments")}
                        columns={columns}
                        data={attachmentsData}
                        subHeader={true}
                        subHeaderAlign='left'
                        subHeaderComponent={buttonToggleGroup}
                        expandableRows
                        progressPending={attachments.isLoading}
                        expandOnRowDoubleClicked
                        expandableRowsComponent={expandableComponent}
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                    />
                </Col>
            </Row>

            <Modal centered onHide={() => setShow(false)} show={show}>
                <Modal.Body>
                    {removeAttachmentMutation.isSuccess ? (
                        <SubmitMessage isSuccess={true} message='successfully_removed' />
                    ) : (
                        <div className='d-flex flex-column align-items-center'>
                            <h5 className='p-4'>{t("manual_input:removal_prompt")}</h5>
                            <div>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='primary'
                                    onClick={() => setShow(false)}
                                >
                                    {t("labels:cancel")}
                                </Button>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='danger'
                                    onClick={() =>
                                        removeAttachmentMutation.mutate(selectedAttachment)
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

    if (categories.isLoading) return <Spinner isLoading={true}></Spinner>;
    //Pane for adding or edditing documents
    const addPane = (
        <Fragment>
            <Row>
                <Col>
                    <AttachmentsPaneForm
                        setIsAdding={setIsAdding}
                        categories={categories.data}
                        selectedRow={selectedRow}
                        setSelectedRow={setSelectedRow}
                    />
                </Col>
            </Row>
        </Fragment>
    );
    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {searchPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>{addPane}</PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>{addPane}</PrivateRoute>
        </Switch>
    );
}

export default AttachmentsPane;
