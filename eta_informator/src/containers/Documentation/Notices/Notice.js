import { useContext, useMemo, useState } from "react";
import { Container, Row, Col, FormControl, Button, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Table from "../../../components/Tables/Table";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import { useQuery } from "react-query";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import styled from "styled-components";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";

const StyledRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

function Notice({
    data,
    total,
    search,
    edit,
    material,
    setMaterial,
    createdBy = false,
    path,
    selectedUnit,
    clicked,
    isLoading = false,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    ...props
}) {
    const { t } = useTranslation(["documentation", "labels", "manual_input"]);
    const { state } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const columns = useMemo(
        () => [
            {
                name: "ID",
                selector: (row) => row.id,
                width: "60px",
                center: true,
                omit: true,
            },
            {
                name: t("noticeId"),
                selector: (row) => row.noticeId,
                omit: true,
            },
            {
                name: t("description"),
                selector: (row) => row.description,
                wrap: true,
                grow: 2,
            },
            { name: t("ego_code"), selector: (row) => row.code, grow: 2 },
            {
                name: t("labels:form_code"),
                selector: (row) => row.formCode,
                omit: selectedUnit?.subunitId != 11,
            },
            { name: t("section"), selector: (row) => row.subunit },
            { name: t("status"), selector: (row) => row.status, omit: true },
            {
                name: t("timestamp"),
                selector: (row) => row.timestamp,
                sortable: true,
                minWidth: "150px",
                format: (row, index) => {
                    return dayjs(row.timestamp).format("LL");
                },
            },
            { name: t("images"), selector: (row) => row.images, omit: true },
            {
                name: t("keywords"),
                selector: (row) => row.keywords,
                grow: 3,
                maxWidth: "250px",
                cell: (row) => {
                    return (
                        <div
                            key={row.id}
                            className='d-flex flex-column align-items-center justify-content-center w-100 gap-1 my-1'
                        >
                            {row.keywords?.map((keyword) => {
                                return (
                                    <div
                                        className='d-flex align-items-center fs-6'
                                        key={keyword + row.id}
                                    >
                                        <Badge
                                            size='sm'
                                            style={{
                                                cursor: "auto",
                                            }}
                                            bg='info'
                                        >
                                            {keyword.toUpperCase()}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    );
                },
            },
            {
                name: t("manual_input:created_by"),
                selector: (row) => row.createdBy.name + " " + row.createdBy.lastname,
                omit: !createdBy,
            },
            {
                name: t("labels:edit"),
                right: true,
                omit: !edit,
                cell: (row) => {
                    // Check if user is allowed to edit notice
                    const allowed =
                        state.user.id == row.createdBy.id || state.user.role.role == "admin";
                    return (
                        <div className='d-flex'>
                            <Button variant='link' disabled={!allowed} size='sm'>
                                <Link
                                    style={{ fontSize: "14px" }}
                                    to={
                                        allowed
                                            ? "/manual-input/inform/notices/edit/" + row.noticeId
                                            : ""
                                    }
                                >
                                    <FontAwesomeIcon icon='pencil-alt' className='mx-1 fs-5' />
                                </Link>
                            </Button>

                            <Button
                                variant='link'
                                size='sm'
                                disabled={!allowed}
                                onClick={() => {
                                    allowed && clicked(row.noticeId);
                                }}
                            >
                                <FontAwesomeIcon
                                    icon='trash-alt'
                                    style={{
                                        color: "var(--bs-danger)",
                                    }}
                                    className='mx-1 fs-5'
                                />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [t, selectedUnit, clicked, createdBy, edit, state.user],
    );

    const images = useQuery(
        ["images", selectedRow?.noticeId],
        () => {
            const imagePath = new URL(`http://${process.env.REACT_APP_INFORMATOR}/`);
            return selectedRow.images.map((image) => {
                imagePath.pathname = image.path.split("public")[1];
                return {
                    src: imagePath.toString(),
                    description: selectedRow.description,
                };
            });
        },
        {
            enabled: !!selectedRow,
        },
    );

    const clickHandler = (data) => {
        setSelectedRow(data);
        setIsOpen(true);
    };

    return (
        <Container fluid>
            <Row>
                <Col>
                    <Table
                        actions={
                            search ? (
                                edit ? (
                                    <div>
                                        <Link className='btn btn-primary' to={path}>
                                            {t("labels:add_notice")}
                                        </Link>
                                    </div>
                                ) : (
                                    <div>
                                        <FormControl
                                            className='mb-1'
                                            value={material}
                                            onChange={(value) => setMaterial(value.target.value)}
                                            type='text'
                                            placeholder={t("ego_code")}
                                        />
                                    </div>
                                )
                            ) : null
                        }
                        subHeader={edit}
                        subHeaderAlign='left'
                        subHeaderComponent={
                            search && edit ? (
                                <FormControl
                                    value={material}
                                    onChange={(value) => setMaterial(value.target.value)}
                                    type='text'
                                    placeholder={t("ego_code")}
                                />
                            ) : null
                        }
                        highlightOnHover
                        defaultSortField='timestamp'
                        defaultSortAsc={false}
                        columns={columns}
                        data={data}
                        noHeader={!search}
                        compact
                        onRowClicked={(data) => clickHandler(data)}
                        pagination
                        paginationServer
                        progressPending={isLoading}
                        paginationTotalRows={total}
                        onChangeRowsPerPage={handlePerPageChange}
                        onChangePage={handlePageChange}
                        sortServer
                        onSort={handleSort}
                        paginationRowsPerPageOptions={[10, 15, 20, 25, 100]}
                    />
                    <Lightbox
                        plugins={[Captions, Counter]}
                        open={isOpen}
                        close={() => setIsOpen(false)}
                        slides={images?.data || []}
                    ></Lightbox>
                </Col>
            </Row>
        </Container>
    );
}

export default Notice;
