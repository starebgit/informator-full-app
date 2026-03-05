import { useContext, useMemo, useState, useEffect, useRef } from "react";
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
import { Document, Page, pdfjs } from "react-pdf";

const StyledRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

function Element({
    data,
    total,
    search,
    edit,
    material,
    setMaterial,
    createdBy = false,
    path,
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

    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

    const [numPages, setNumPages] = useState(null);
    const [pdfPage, setPdfPage] = useState(1);

    const onPdfLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPdfPage(1);
    };

    const columns = useMemo(
        () => [
            {
                name: "ID",
                selector: (row) => row.id,
                width: "60px",
                center: true,
            },
            {
                name: t("variant"),
                selector: (row) => row.title,
                sortable: true,
                wrap: true,
                grow: 2,
            },
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
                name: t("images"),
                selector: (row) => row.images,
                omit: true,
            },
            /*{
                name: t("manual_input:created_by"),
                selector: (row) => row.createdBy.name + " " + row.createdBy.lastname,
                omit: false,
            },*/
            {
                name: t("labels:edit"),
                right: true,
                omit: !edit,
                cell: (row) => {
                    // Check if user is allowed to edit digitalization
                    const allowed =
                        state.user.role.role == "admin" ||
                        state.user.role.role == "sfm" ||
                        state.user.role.role == "quality" ||
                        state.user.role.role == "process_leader" ||
                        state.user.role.role == "head_of_work_unit";
                    return (
                        <div className='d-flex'>
                            <Button variant='link' disabled={!allowed} size='sm'>
                                <Link
                                    style={{ fontSize: "14px" }}
                                    to={
                                        allowed
                                            ? "/manual-input/digitalization//edit/" +
                                              row.digitalizationId
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
                                    allowed && clicked(row.digitalizationId);
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
        [t, clicked, createdBy, edit, state.user],
    );

    const images = useMemo(() => {
        if (!selectedRow) return [];
        return selectedRow.images.map((image) => {
            const imagePath = new URL(`http://${process.env.REACT_APP_INFORMATOR}/`);
            imagePath.pathname = image.path.split("public")[1];
            const isPdf = imagePath.pathname.toLowerCase().endsWith(".pdf");
            return {
                src: imagePath.toString(),
                title: selectedRow.title,
                type: isPdf ? "pdf" : "image",
            };
        });
    }, [selectedRow]);

    const clickHandler = (data) => {
        setSelectedRow(data);
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen || !images.length) return;

        let timer;
        const currentSlide = images.find(
            (img, idx) => idx === (selectedRow?.currentSlideIndex || 0),
        );
        const isPdf = currentSlide?.type === "pdf";

        if (isPdf && numPages > 1) {
            // Prva stran PDF-ja 15s, ostale 5s
            const duration = pdfPage === 1 ? 15000 : 5000;
            timer = setTimeout(() => {
                setPdfPage((prev) => {
                    if (prev < numPages) return prev + 1;
                    // Če je zadnja stran, začni znova na prvi strani
                    return 1;
                });
            }, duration);
        } else {
            // Prvi slide 15s, ostali 5s
            const currentIndex = images.findIndex((img) => img.src === currentSlide?.src);
            const duration = currentIndex === 0 ? 15000 : 5000;
            timer = setTimeout(() => {
                if (currentIndex < images.length - 1) {
                    // Naslednji slide
                    setSelectedRow((prev) => {
                        // Tu moraš imeti logiko za menjavo selectedRow ali slide indexa
                        // Če uporabljaš Lightbox z "currentIndex", nastavi ga tukaj
                        return prev;
                    });
                } else {
                    // Če je zadnji slide, začni znova na prvem
                    setSelectedRow((prev) => {
                        // Reset na prvi slide (implementiraj glede na svojo logiko)
                        return prev;
                    });
                }
            }, duration);
        }

        return () => clearTimeout(timer);
    }, [isOpen, pdfPage, numPages, images, selectedRow]);

    return (
        <Container fluid>
            <Row>
                <Col>
                    <Table
                        actions={
                            search && edit ? (
                                <div>
                                    <Link className='btn btn-primary' to={path}>
                                        {t("labels:add_pictorial_instructions")}
                                    </Link>
                                </div>
                            ) : null
                        }
                        subHeader={edit}
                        subHeaderAlign='left'
                        /*subHeaderComponent={
                            search && edit ? (
                                <FormControl
                                    value={material}
                                    onChange={(value) => setMaterial(value.target.value)}
                                    type='text'
                                    placeholder={t("variant")}
                                />
                            ) : null
                        }*/
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
                        slides={images}
                        render={{
                            slide: ({ slide }) =>
                                slide.type === "pdf" ? (
                                    <div style={{ textAlign: "center", background: "#222" }}>
                                        <Document
                                            file={slide.src}
                                            onLoadSuccess={onPdfLoadSuccess}
                                            onLoadError={console.error}
                                            loading='Nalagam PDF...'
                                        >
                                            <Page pageNumber={pdfPage} width={800} />
                                        </Document>
                                        {numPages && (
                                            <div style={{ marginTop: 8 }}>
                                                <Button
                                                    size='sm'
                                                    onClick={() =>
                                                        setPdfPage((p) => Math.max(1, p - 1))
                                                    }
                                                    disabled={pdfPage <= 1}
                                                >
                                                    &lt;
                                                </Button>
                                                <span style={{ margin: "0 10px", color: "#fff" }}>
                                                    {pdfPage} / {numPages}
                                                </span>
                                                <Button
                                                    size='sm'
                                                    onClick={() =>
                                                        setPdfPage((p) => Math.min(numPages, p + 1))
                                                    }
                                                    disabled={pdfPage >= numPages}
                                                >
                                                    &gt;
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={slide.src}
                                        alt={slide.title}
                                        style={{ maxWidth: "100%", maxHeight: "600px" }}
                                    />
                                ),
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export default Element;
