import { Row, Col, Modal, Button } from "react-bootstrap";
import client from "../../../../feathers/feathers";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { useTranslation } from "react-i18next";
import { Fragment, useContext, useMemo, useState } from "react";
import { Switch, useRouteMatch, Link } from "react-router-dom";
import PrivateRoute from "../../../../routes/PrivateRoute";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import ToggleGroup from "../../../../components/ToggleGroup/ToggleGroup";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import Table from "../../../../components/Tables/Table";
import DocumentsPaneForm from "./DocumentsPaneForm";
import { removeDocument } from "../../../../data/API/Informator/InformatorAPI";

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

function DocumentsPane({ selectedUnit, setSelectedUnit, ...props }) {
    const { path } = useRouteMatch();
    const { t } = useTranslation(["manual_input", "labels"]);
    const { state, dispatch } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const [show, setShow] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedDocument, setSelectedDocument] = useState(false);

    const categories = useQuery(
        ["categories", "general"],
        () =>
            client
                .service("categories")
                .find({
                    query: {
                        section: "general",
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

    const subcategories = useQuery(["subcategories"], () =>
        client
            .service("subcategories")
            .find()
            .then((response) => {
                const { data } = response;
                return data?.map((entry) => {
                    return entry;
                });
            }),
    );

    //Enabled allows us to trigger the query with condition
    const documents = useQuery(
        ["documents", selectedCategory],
        () =>
            client
                .service("documents")
                .find({
                    query: {
                        category_id: selectedCategory,
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
                name: t("manual_input:document_id"),
                selector: (row) => row.documentId,
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
                selector: (row) => row.documentId,
                center: true,
                cell: (row) => (
                    <div className='d-flex'>
                        <div className='btn btn-link btn-sm'>
                            <Link
                                as={Button}
                                style={{ fontSize: "14px" }}
                                to={`${path}/edit/${row.documentId}`}
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
                                setSelectedDocument(row.documentId);
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
            title={"document_categories"}
            onSelected={setSelectedCategory}
            selectedButton={selectedCategory}
            align='left'
        />
    );

    //TODO - Optimize with useMemo
    const documentsData = documents?.data
        ? documents.data
              .filter((doc) => {
                  if (state.user.role.role == "admin" || state.user.role.role == "human_resources")
                      return true;
                  return state.user.id == doc.userId || doc.userId == null;
              })
              .map((doc, index) => {
                  return {
                      id: index + 1,
                      documentId: doc.id,
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
                    <h3>{t("manual_input:documents")}</h3>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        actions={
                            <Link className='btn btn-primary' to={`${path}/add`}>
                                {t("manual_input:add_document")}
                            </Link>
                        }
                        title={t("manual_input:all_documents")}
                        columns={columns}
                        data={documentsData}
                        subHeader={true}
                        subHeaderAlign='left'
                        subHeaderComponent={buttonToggleGroup}
                        expandableRows
                        progressPending={documents.isLoading}
                        expandOnRowDoubleClicked
                        expandableRowsComponent={expandableComponent}
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                    />
                </Col>
            </Row>

            <Modal centered onHide={() => setShow(false)} show={show}>
                <Modal.Body>
                    {false ? (
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
                                        removeDocument(selectedDocument).then((res) => {
                                            if (res) {
                                                setShow(false);
                                                queryClient.invalidateQueries("documents");
                                            }
                                        })
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

    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {searchPane}
            </PrivateRoute>
            <PrivateRoute path={path + "/add"}>
                <DocumentsPaneForm
                    categories={categories?.data}
                    subcategories={subcategories?.data}
                />
            </PrivateRoute>
            <PrivateRoute path={path + "/edit/:id"}>
                <DocumentsPaneForm
                    categories={categories?.data}
                    subcategories={subcategories?.data}
                />
            </PrivateRoute>
        </Switch>
    );
}

export default DocumentsPane;
