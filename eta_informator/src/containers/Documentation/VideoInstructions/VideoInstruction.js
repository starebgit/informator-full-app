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

function VideoInstruction({
    data,
    total,
    search,
    edit,
    searchText,
    setSearchText,
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
                name: t("video_instructionId"),
                selector: (row) => row.video_instructionId,
                omit: true,
            },
            {
                name: t("title"),
                selector: (row) => row.title,
                wrap: true,
                grow: 1,
            },
            {
                name: t("description"),
                selector: (row) => row.description,
                wrap: true,
            },
            {
                name: t("machine_code"),
                selector: (row) => row.machine_code,
                omit: false,
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
                    const allowed =
                        state.user.id == row.createdBy.id || state.user.role.role == "admin";
                    return (
                        <div className='d-flex'>
                            <Button variant='link' disabled={!allowed} size='sm'>
                                <Link
                                    style={{ fontSize: "14px" }}
                                    to={
                                        allowed
                                            ? "/manual-input/inform/video-instructions/edit/" +
                                              row.video_instructionId
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
                                    allowed && clicked(row.video_instructionId);
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
                            search && edit ? (
                                <div>
                                    <Link className='btn btn-primary' to={path}>
                                        {t("labels:add_video_instruction")}
                                    </Link>
                                </div>
                            ) : null
                        }
                        subHeader={edit}
                        subHeaderAlign='left'
                        subHeaderComponent={
                            search && edit ? (
                                <FormControl
                                    value={searchText}
                                    onChange={(value) => setSearchText(value.target.value)}
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
                </Col>
            </Row>
        </Container>
    );
}
export default VideoInstruction;
