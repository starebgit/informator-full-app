import { useQuery } from "react-query";
import client from "../../../feathers/feathers";
import { CloseButton, Col, FormControl, Modal, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import { useMemo, useState } from "react";
import EmptyPage from "../../../assets/images/no_documents.png";
import FormCard from "./FormCard";
import { base64ToBlob } from "../../../utils/utils";
import Table from "../../../components/Tables/Table";
import { useDebounce } from "@uidotdev/usehooks";
const Forms = ({ ...props }) => {
    const [pdfTs, setPdfTs] = useState(null); //cache busting for pdfs

    const { t } = useTranslation(["infopoint", "labels"]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [downloadingId, setDownloadingId] = useState(null);

    const forms = useQuery(["forms", "mdocs"], () =>
        client
            .service("mdocs-documentation")
            .find()
            .then((response) => {
                const { data } = response;
                return data.map((doc) => {
                    // Split by whitespace and remove first and last char of each string
                    const [type, code, title] = doc.title
                        .split("]")
                        .map((str) => str.trim().slice(1));
                    return {
                        ...doc,
                        type,
                        code,
                        title,
                    };
                });
            }),
    );

    const formDocuments = useQuery(
        ["forms", "documents", selectedForm],
        () =>
            client
                .service("mdocs-documentation")
                .get(selectedForm)
                .then((response) => {
                    return response;
                }),
        { enabled: !!selectedForm },
    );

    const formDocument = useQuery(
        ["forms", "document", selectedDocument],
        () =>
            client
                .service("mdocs-documentation")
                .get(selectedForm, { query: { documentId: selectedDocument } })
                .then(({ document }) => {
                    const blob = base64ToBlob(document.data, "application/pdf");
                    return URL.createObjectURL(blob);
                }),
        { enabled: !!selectedDocument },
    );

    const onFormClickHandler = (row) => {
        setSelectedForm(row.id);
        setIsOpen(true);
    };

    const onDocumentClickHandler = async (id) => {
        setPdfTs(Date.now());

        setDownloadingId(id);
        try {
            const { document } = await client
                .service("mdocs-documentation")
                .get(selectedForm, { query: { documentId: id } });

            const blob = base64ToBlob(document.data, "application/pdf");
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = document.name;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Download failed:", e);
            // optional: show your own toast here if you have one
        } finally {
            setDownloadingId(null);
        }
    };

    const columns = useMemo(
        () => [
            {
                name: "id",
                selector: (row) => row.id,
                omit: true,
            },
            {
                name: t("labels:title"),
                selector: (row) => `${row.code} - ${row.title}`,
            },
            {
                name: t("labels:type"),
                selector: (row) => row.type,
            },
        ],
        [t],
    );

    if (forms.isLoading)
        return (
            <div
                className='d-flex flex-column justify-content-center align-items-center'
                style={{ width: "100%", minHeight: "300px" }}
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
                {t("labels:data_is_loading")}
            </div>
        );

    return (
        <>
            <Row>
                <h1>{t("forms")}</h1>
            </Row>
            <Row>
                <Col></Col>
                <Col xs={12} md={12} lg={12} xl={2}>
                    <FormControl
                        className='mb-1'
                        value={search}
                        onChange={(value) => setSearch(value.target.value)}
                        type='text'
                        placeholder={t("labels:search")}
                    />
                </Col>
            </Row>
            <Row className='mt-2'>
                {forms.data?.length == 0 ? (
                    <div
                        className='d-flex flex-column justify-content-center align-items-center'
                        style={{ minHeight: "70vh" }}
                    >
                        <img src={EmptyPage} alt='empty_page_image' />
                        <h3 className='text-muted'>{t("labels:no_documents")}</h3>
                    </div>
                ) : (
                    <>
                        <Table
                            dense
                            data={filterForms(forms.data, debouncedSearch)}
                            columns={columns}
                            onRowClicked={onFormClickHandler}
                            paginationPerPage={10}
                            pointerOnHover
                            highlightOnHover
                        ></Table>
                    </>
                )}
            </Row>
            <Modal
                show={isOpen}
                onHide={() => {
                    setIsOpen(0);
                    setSelectedForm(null);
                    setSelectedDocument(null);
                }}
            >
                {formDocuments.isLoading ? (
                    <div
                        className='d-flex flex-column justify-content-center align-items-center'
                        style={{ width: "100%", minHeight: "200px" }}
                    >
                        <PulseLoader color='#2c3e50' size={15} margin={10} />
                        {t("labels:data_is_loading")}
                    </div>
                ) : !!selectedDocument ? (
                    <div className='p-4' style={{ height: "95vh" }}>
                        <iframe
                            title='form_document'
                            style={{ width: "100%", height: "85vh" }}
                            src={`${formDocument.data}?ts=${pdfTs}`}
                        ></iframe>
                    </div>
                ) : (
                    <div className='p-4'>
                        {formDocuments.data?.documents == null ||
                        formDocuments.data?.documents.length == 0 ? (
                            <div className='d-flex flex-column justify-content-center align-items-center w-100 h-100'>
                                <img width={200} src={EmptyPage} alt='empty_page_image' />
                                <h4 className='text-muted'>{t("labels:no_documents")}</h4>
                            </div>
                        ) : (
                            <>
                                <div className='d-flex justify-content-between mb-2'>
                                    <h6>{t("labels:select_document_from_list")}</h6>
                                    <CloseButton onClick={() => setIsOpen(false)} />
                                </div>

                                <div className='d-flex flex-column gap-2'>
                                    {formDocuments.data?.documents?.map((form) => {
                                        return (
                                            <FormCard
                                                key={form.id + "_form_card"}
                                                onClickHandler={onDocumentClickHandler}
                                                id={form.id}
                                                title={form.name}
                                                size='medium'
                                                isLoading={downloadingId === form.id}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

const filterForms = (forms, searchString) => {
    if (searchString === "") return forms;
    const normalizedSearchString = searchString.trim().toLowerCase();
    return forms.filter((form) => {
        const normalizedCode = form.code.trim().toLowerCase();
        const normalizedTitle = form.title.trim().toLowerCase();
        return (
            normalizedCode.includes(normalizedSearchString) ||
            normalizedTitle.includes(searchString)
        );
    });
};

export default Forms;
