import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FormControl, Row, Col, Form, Container } from "react-bootstrap";
import { Document, Page, pdfjs } from "react-pdf";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useQueryClient } from "react-query";
import { getDigitalizationByQuery } from "../../../data/API/Informator/InformatorAPI";
import styled from "styled-components";
import _ from "lodash";
import parse from "html-react-parser";
import { useDebounce } from "@uidotdev/usehooks";
import Element from "./Element";
import { Field } from "formik";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ToastContext } from "../../../context/ToastContext/ToastContext";
import { matchPath, Redirect, Switch, useRouteMatch, withRouter } from "react-router-dom";
import { SetNavigationContext } from "../../../context/NavigationContext/NavigationContext";
import { AuthContext } from "../../../context/AuthContext/AuthContext";

const StyledContainer = styled(Container)`
    overflow: hidden;
    max-width: 95%;
    padding-top: 1rem;
    min-height: 50vh;
`;

const SpacedRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

function Digitalization(props) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
    const { t } = useTranslation(["documentation", "labels"]);

    // PDF
    const [pdfPage, setPdfPage] = useState(1);
    const [numPages, setNumPages] = useState(null);

    const onPdfLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPdfPage(1);
    };
    // 1. State za trenutno sliko
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // States
    const [material, setMaterial] = useState(undefined);
    const debouncedMaterial = useDebounce(material, 300);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const { showToast } = useContext(ToastContext);
    const { path, url } = useRouteMatch();
    const setNavigationContext = useContext(SetNavigationContext);
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const { history } = props;

    // --- Data from QueryClient ---
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const unitsLabels = queryClient.getQueryData("unitsLabels");

    // --- State ---
    const [selectedUnit, setSelectedUnit] = useState(null);

    // --- Routing ---
    const match = matchPath(history.location.pathname, {
        path: path + "/:unit/:subpage",
    });
    const images = useMemo(() => {
        if (!selectedRow || !selectedRow.images) return [];
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

    // --- Navigation Tabs ---
    // --- Set navigation and default selected unit on mount or change ---
    useEffect(() => {
        if (unitsLabels && (!selectedUnit || selectedUnit.subunitId !== 3)) {
            const digitalizationUnit = unitsLabels.find((u) => u.subunitId === 3);
            if (digitalizationUnit && selectedUnit !== digitalizationUnit) {
                setSelectedUnit(digitalizationUnit);
            }
        }
    }, [unitsLabels, selectedUnit, setSelectedUnit]);
    useEffect(() => {
        if (!isLightboxOpen || !images.length) return;

        const current = images[lightboxIndex];
        let timer;

        if (current.type === "pdf" && numPages > 1) {
            // PDF: prva stran 15s, ostale 5s
            const duration = pdfPage === 1 ? 15000 : 5000;
            timer = setTimeout(() => {
                setPdfPage((prev) => {
                    if (prev < numPages) return prev + 1;
                    // Če je zadnja stran, začni znova na prvi strani
                    return 1;
                });
            }, duration);
        } else {
            // Slike: prva 15s, ostale 5s
            const duration = lightboxIndex === 0 ? 15000 : 5000;
            timer = setTimeout(() => {
                setLightboxIndex((prev) => {
                    if (prev + 1 >= images.length) {
                        return 0;
                    }
                    return prev + 1;
                });
            }, duration);
        }

        return () => clearTimeout(timer);
    }, [isLightboxOpen, images, lightboxIndex, pdfPage, numPages]);
    useEffect(() => {
        setPdfPage(1);
        setNumPages(null);
    }, [lightboxIndex, isLightboxOpen]);
    const selectUnitHandler = (selected) => {
        if (selected?.subunitId !== 3) {
            props.history.push("/documentation/plm");
        } else {
            setSelectedUnit(selected);
        }
    };

    // --- Prepare options for ReactSelect ---
    const mappedUnitLabels = useMemo(
        () =>
            state?.user?.role?.role === "sfm"
                ? unitsLabels?.map((unit) => ({
                      ...unit,
                      options: unit.options.map((option) => ({
                          ...option,
                          isDisabled: selectedUnit?.unitId !== unit.id,
                      })),
                  }))
                : unitsLabels,
        [unitsLabels, selectedUnit?.unitId, state?.user?.role?.role],
    );

    /* useQuery clients*/
    const digitalization = useQuery(
        ["digitalization", page, perPage, sort, debouncedMaterial],
        () =>
            getDigitalizationByQuery(page, perPage, sort, {
                ...(debouncedMaterial && {
                    $or: [
                        { title: { $like: `%${debouncedMaterial}%` } },
                        { title: { $like: `%${debouncedMaterial}` } },
                    ],
                }),
            }).then((result) => result),
    );

    //const settings = queryClient.getQueryData(["userSettings", state?.user.id]); pobriši

    const digitalizationFiltered = useMemo(
        () =>
            digitalization?.data?.data?.map((element, i) => {
                const regex =
                    material != "" && material != undefined
                        ? new RegExp("(" + material.trim().split(" ").join("|") + ")", "gi")
                        : new RegExp(null, "gi");
                const highlightedTitle = element.title.replace(
                    regex,
                    `<span style="background-color:yellow">$&</span>`,
                );
                const title = parse(highlightedTitle);
                return {
                    id: i + 1,
                    elementId: element.id,
                    name: element.title,
                    title, // React element za prikaz
                    title: element.title, // <-- dodaj to!
                    /*createdBy: 137,/*element.userId,*/
                    timestamp: element.createdAt,
                    images: element.uploads,
                };
            }),
        [digitalization?.data, material],
    );

    const handleSearch = (e) => {
        e.preventDefault();
        const found = Array.isArray(digitalizationFiltered)
            ? digitalizationFiltered.find(
                  (element) =>
                      typeof element.title === "string" &&
                      element.title.toLowerCase() === material?.toLowerCase(),
              )
            : undefined;
        if (found) {
            setSelectedRow(found);
            setIsLightboxOpen(true);
        } else {
            setSelectedRow(null);
            setIsLightboxOpen(false);
            showToast(
                t("documentation:warning"),
                t("documentation:no_pictorial_instructions_available"),
                "warning",
            );
        }
    };

    // 2. Efekt za avtomatsko menjavo z različnim časom za prvo in ostale slike
    useEffect(() => {
        if (isLightboxOpen && images.length > 1) {
            // Če je prva slika, čakaj 15s, sicer 5s
            const timeout = setTimeout(
                () => {
                    setLightboxIndex((prev) => {
                        // Če smo na zadnji sliki, naslednja je prva (index 0)
                        if (prev + 1 >= images.length) {
                            return 0;
                        }
                        return prev + 1;
                    });
                },
                lightboxIndex === 0 ? 15000 : 5000,
            ); // 15s za prvo, 5s za ostale
            return () => clearTimeout(timeout);
        }
    }, [isLightboxOpen, images.length, lightboxIndex]);

    // 3. Reset indexa, ko se odpre nova slika
    useEffect(() => {
        if (isLightboxOpen) setLightboxIndex(0);
    }, [isLightboxOpen, selectedRow]);

    return (
        <>
            <Row>
                <Col>
                    <h2>{t("pictorial_instructions")}</h2>
                </Col>
            </Row>
            <Row>
                <Col>
                    <p>{t("pictorial_instructions_page_text")}</p>
                </Col>
            </Row>
            <div className='border border-1 rounded p-5 d-flex flex-column align-items-center justify-content-center gap-4'>
                <div className={"mx-auto"}>
                    <SpacedRow className='justify-content-center align-items-center'>
                        <Col
                            xs={12}
                            sm={10}
                            md={8}
                            lg={6}
                            xl={4}
                            className='d-flex flex-column align-items-center w-100'
                            style={{ maxWidth: 400 }}
                        >
                            <form
                                onSubmit={handleSearch}
                                className='w-100 d-flex flex-column align-items-center'
                            >
                                <FormControl
                                    style={{ maxWidth: "300px", width: "100%" }}
                                    value={material}
                                    onChange={(value) => setMaterial(value.target.value)}
                                    type='text'
                                    placeholder={t("search")}
                                />
                                <div className='w-100 text-start'>
                                    <label className='mb-1'>{t("search_by_variant_number")}</label>
                                </div>
                                <button
                                    type='submit'
                                    className='btn btn-primary mb-1 w-100'
                                    style={{ maxWidth: "300px" }}
                                >
                                    {t("search")}
                                </button>
                            </form>
                        </Col>
                    </SpacedRow>
                    {/*<SpacedRow></SpacedRow>
                    <SpacedRow>
                        <Col>
                        </Col>
                        <Col
                            className='d-flex align-items-center justify-content-end'
                            xs={14}
                            md={12}
                            lg={12}
                            xl={3}
                        >
                        </Col>
                        <Col xs={16} md={12} lg={12} xl={4}>
                            <FormControl
                                className='mb-1'
                                value={material}
                                onChange={(value) => setMaterial(value.target.value)}
                                type='text'
                                placeholder={t("search")}
                            />
                        </Col>
                    </SpacedRow>
                    <Row>
                        <Element
                            data={digitalizationFiltered}
                            isLoading={digitalization.isLoading}
                            total={digitalization?.data?.total}
                            handlePageChange={(value) => setPage(value)}
                            handlePerPageChange={(value) => setPerPage(value)}
                            handleSort={(column, sortDirection) =>
                                setSort(sortDirection == "desc" ? -1 : 1)
                            }
                        />
                    </Row>*/}
                </div>
            </div>
            {selectedRow && isLightboxOpen && (
                <Lightbox
                    open={isLightboxOpen}
                    close={() => setIsLightboxOpen(false)}
                    slides={images}
                    index={lightboxIndex}
                    on={{
                        view: ({ index }) => setLightboxIndex(index),
                    }}
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
                                            <button
                                                onClick={() =>
                                                    setPdfPage((p) => Math.max(1, p - 1))
                                                }
                                                disabled={pdfPage <= 1}
                                            >
                                                &lt;
                                            </button>
                                            <span style={{ margin: "0 10px", color: "#fff" }}>
                                                {pdfPage} / {numPages}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setPdfPage((p) => Math.min(numPages, p + 1))
                                                }
                                                disabled={pdfPage >= numPages}
                                            >
                                                &gt;
                                            </button>
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
            )}
        </>
    );
}

export default Digitalization;
