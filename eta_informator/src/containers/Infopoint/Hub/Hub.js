import { useQuery } from "react-query";
import client from "../../../feathers/feathers";
import CategoryCard from "./CategoryCard";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import EmptyPage from "../../../assets/images/no_documents.png";
import { Col, Modal, Row, FormControl, Form } from "react-bootstrap";
import { useState, useMemo } from "react";

const Hub = ({ ...props }) => {
    const [pdfTs, setPdfTs] = useState(null); // cache-buster for PDFs
    const { t } = useTranslation(["infopoint", "labels"]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [query, setQuery] = useState("");
    const [showArchive, setShowArchive] = useState(false);
    const hasText = query.trim().length > 0;

    const categories = useQuery(["categories"], () =>
        client
            .service("categories")
            .find()
            .then((response) => {
                const { data } = response;
                return data.map((entry) => {
                    return {
                        id: entry.id,
                        name: entry.category,
                        value: entry.id,
                        section: entry.section,
                    };
                });
            }),
    );

    const documents = useQuery(["documents"], () =>
        client
            .service("documents")
            .find()
            .then((response) => {
                const { data } = response;
                return data.reduce((acc, curr) => {
                    if (acc[curr.category.category]) {
                        acc[curr.category.category].push(curr);
                    } else {
                        acc[curr.category.category] = [curr];
                    }
                    return acc;
                }, {});
            }),
    );

    const isSearching = query.trim().length >= 3;

    const filteredDocuments = useMemo(() => {
        if (!documents.data) return {};
        if (!isSearching) return documents.data;

        const q = query.trim().toLowerCase();

        const getText = (d) =>
            [
                d.name,
                d.title,
                d.filename,
                d.fileName,
                d.originalname,
                d.description,
                d.code,
                d.category?.category,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

        const result = Object.entries(documents.data)
            .map(([cat, docs]) => [cat, docs.filter((d) => getText(d).includes(q))])
            .filter(([, docs]) => docs.length > 0);

        return Object.fromEntries(result);
    }, [documents.data, isSearching, query]);

    const currentDocs = isSearching ? filteredDocuments : documents.data || {};

    // Hardcodan link so stroškovnih mest - nahaja se pod finance in računovodstvo
    const stroskovnaMestaDoc = {
        id: "stroskovna-mesta",
        name: "Stroškovna mesta",
        title: "Stroškovna mesta",
        uploads: [],
        createdAt: new Date(),
    };

    if (
        currentDocs["Finance in računovodstvo"] &&
        !currentDocs["Finance in računovodstvo"].some((doc) => doc.name === "Stroškovna mesta")
    ) {
        currentDocs["Finance in računovodstvo"].push(stroskovnaMestaDoc);
    }

    const onClickHandler = (url) => {
        setSelectedDocument(url);
        setPdfTs(Date.now());
        setIsOpen(true);
    };

    if (categories.isLoading || documents.isLoading)
        return (
            <div
                className='d-flex flex-column justify-content-center align-items-center'
                style={{ width: "100%", minHeight: "300px" }}
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
                {t("data_is_loading")}
            </div>
        );

    return (
        <>
            <Row className='mb-2'>
                <Col md={6} lg={5} xl={4}>
                    <FormControl
                        placeholder={"Vnesi vsaj 3 znake za iskanje"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </Col>
                {/*<Col className='d-flex justify-content-end align-items-center'>
                    <label className='me-2 mb-0'>Pokaži arhiv</label>
                    <Form.Check
                        type='switch'
                        id='show-archive-switch'
                        checked={showArchive}
                        onChange={() => setShowArchive((prev) => !prev)}
                    />
                </Col>*/}
            </Row>
            <Row>
                <h1>{t("hub")}</h1>
            </Row>
            <Row className='mt-2'>
                {Object.keys(currentDocs).length === 0 ? (
                    <div
                        className='d-flex flex-column justify-content-center align-items-center'
                        style={{ minHeight: "70vh" }}
                    >
                        <img src={EmptyPage} alt='empty_page_image' />
                        <h3 className='text-muted'>{"Ni rezultatov iskanja"}</h3>
                    </div>
                ) : (
                    <>
                        <div className='d-flex flex-column'>
                            {currentDocs["Splošni akti"]?.length > 0 && (
                                <CategoryCard
                                    category={"Splošni akti"}
                                    documents={currentDocs["Splošni akti"]}
                                    onClickHandler={onClickHandler}
                                    expandAll={hasText}
                                />
                            )}

                            {currentDocs["Informacijske tehnologije"]?.length > 0 && (
                                <CategoryCard
                                    category={"Informacijske tehnologije - IT"}
                                    documents={currentDocs["Informacijske tehnologije"]}
                                    onClickHandler={onClickHandler}
                                    expandAll={hasText}
                                />
                            )}
                        </div>

                        <div className='d-flex flex-column'>
                            {currentDocs["Kadri in splošne zadeve"]?.length > 0 && (
                                <CategoryCard
                                    category={"Kadri in splošne zadeve"}
                                    documents={currentDocs["Kadri in splošne zadeve"]}
                                    onClickHandler={onClickHandler}
                                    expandAll={hasText}
                                />
                            )}
                        </div>

                        <div className='d-flex flex-column'>
                            {Object.keys(currentDocs)
                                .filter((category) =>
                                    [
                                        "Varnost in zdravje pri delu",
                                        "CIP",
                                        "Finance in računovodstvo",
                                    ].includes(category),
                                )
                                .map((category) => (
                                    <CategoryCard
                                        key={category}
                                        category={category}
                                        documents={currentDocs[category]}
                                        onClickHandler={onClickHandler}
                                        expandAll={hasText}
                                    />
                                ))}
                        </div>

                        {showArchive && (
                            <div className='d-flex flex-column'>
                                <CategoryCard
                                    category={"Arhiv"}
                                    documents={currentDocs["Arhiv"] ?? []}
                                    onClickHandler={onClickHandler}
                                    expandAll={hasText}
                                />
                            </div>
                        )}
                    </>
                )}
            </Row>
            <Modal
                show={isOpen}
                onHide={() => {
                    setIsOpen(0);
                }}
                size='xl'
            >
                <div className='p-4' style={{ height: "95vh" }}>
                    <iframe
                        title='pdf_wraper'
                        src={`${selectedDocument}?ts=${pdfTs}`}
                        target='_parent'
                        height={"100%"}
                        width={"100%"}
                    />
                </div>
            </Modal>
        </>
    );
};

export default Hub;
