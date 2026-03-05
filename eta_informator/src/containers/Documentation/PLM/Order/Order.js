import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import OrderCard from "../../../../components/UI/OrderCard/OrderCard";
import Documents from "./DocumentsCard/DocumentsCard";
import Operations from "./OperationsCard/OperationsCard";
import Parts from "./PartsCard/PartsCard";
import styled from "styled-components";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { getNotice } from "../../../../data/API/Informator/InformatorAPI";
import { useQuery } from "react-query";
import Notice from "../../Notices/Notice";
import dayjs from "dayjs";
import client from "../../../../feathers/feathers";
import _ from "lodash";
import { useMachinesAll } from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { FaRegFileAlt, FaPrint } from "react-icons/fa";
import { ToastContext } from "../../../../context/ToastContext/ToastContext";
import { translateUnit } from "../../../../utils/utils";
import { transformToSAPCode, useOrderNavigator } from "../../../../utils/utils";
import ReactDOM from "react-dom";
import PrintableOrder from "./PrintableOrder";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { FaExternalLinkAlt } from "react-icons/fa";
import Barcode from "react-barcode";
import { Dropdown } from "react-bootstrap"; // add this at the top

const StyledModal = styled(Modal)`
    .modal-dialog {
        max-width: 90vw;
    }
`;

const StyledIframe = styled.iframe`
    border: unset;
    height: 85vh;
    width: 100%;
    transition: var(--transition);
    @media (max-width: 576px) {
        height: 75vh;
    }
`;

const List = styled.div`
    div + div {
        border-top: 1px solid lightgray;
    }
    width: 100%;

    div:first-child {
        border-radius: 0.5rem 0.5rem 0rem 0rem;
    }

    div:last-child {
        border-radius: 0rem 0rem 0.5rem 0.5rem;
    }
`;
const Item = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    font-size: 16px;
    background-color: ${(props) => (props.selected ? "aliceblue" : "inherit")};
    font-weight: "500"
    width: 100%;
    transition: var(--transition);
    &:hover {
        background: whitesmoke;
        opacity: ${(props) => (props.selected ? 0.9 : 1)};
    }
`;

function Order(props) {
    // const useNewSapFlow = typeof window !== "undefined" && localStorage.getItem("useNewSapFlow") === "true";

    //cache busters for pdf iframes
    const [pdfTs, setPdfTs] = useState(null);
    const [orderPdfTs, setOrderPdfTs] = useState(null);
    const [filePdfTs, setFilePdfTs] = useState(null);

    const [filterTag, setFilterTag] = useState("VSE");
    const [partsWithDocuments, setPartsWithDocuments] = useState({});
    const [sapOps, setSapOps] = useState([]);

    const orderNumber = props.match.params.id;
    const paddedNumber = orderNumber.padStart(12, "0");
    const orderPath = "https://plmordersearch-0004.bfits.com//data/" + paddedNumber + "/";
    const { t } = useTranslation(["shopfloor", "labels", "documentation"]);
    const [show, setShow] = useState(false);
    const [material, setMaterial] = useState(null);
    const [machine, setMachine] = useState(null);
    const [operationMachines, setOperationMachines] = useState([]);
    const [showOrder, setShowOrder] = useState(false);
    const [showFile, setShowFile] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const { showToast } = useContext(ToastContext);
    const goToOrderIfExists = useOrderNavigator({ history: props.history, showToast, t });
    const [orderQuantity, setOrderQuantity] = useState(null);
    const [enrichedParts, setEnrichedParts] = useState([]);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const { state } = useContext(AuthContext);
    const { selectedUnit, unitKey } = props;
    // unified barcode modal trigger (no trimming here)
    const showBarcode = (value) => {
        if (value == null) return;
        setSelectedBarcode(String(value));
        setShowBarcodeModal(true);
    };

    const [opConfirmations, setOpConfirmations] = useState([]);
    useEffect(() => {
        if (!orderNumber) return;
        const ac = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_INFORMATORSAP}/api/operations/${orderNumber}/operation-confirmations`,
                    { signal: ac.signal },
                );
                if (!res.ok) throw new Error("Failed to fetch operation confirmations");

                const data = await res.json();
                const normalized = (Array.isArray(data) ? data : []).map((c) => ({
                    ...c,
                    ConfirmationDisplay: c?.ConfirmationDisplay
                        ? String(c.ConfirmationDisplay).startsWith("CL")
                            ? String(c.ConfirmationDisplay)
                            : `CL${c.ConfirmationDisplay}`
                        : "",
                }));
                setOpConfirmations(normalized);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            }
        })();

        return () => ac.abort();
    }, [orderNumber]);

    // barcode button functionality
    const [selectedBarcode, setSelectedBarcode] = useState(null);

    const showBarcodeForMaterial = (egoCode, trim = true) => {
        const mat = transformToSAPCode(egoCode);
        const value = trim ? mat.slice(4, -4) : mat;
        showBarcode(value);
    };
    // barcode button functionality end

    // barcode button functionality end

    /////////////////////////////////// open orders functionality
    const [showOpenOrders, setShowOpenOrders] = useState(false);
    const [openOrdersLoading, setOpenOrdersLoading] = useState(false);
    const [openOrders, setOpenOrders] = useState([]); // [{aufnr, aufnrDisplay}]
    const [openOrdersMaterial, setOpenOrdersMaterial] = useState(null);
    const [openOrdersMaterialName, setOpenOrdersMaterialName] = useState(null);

    const handleOpenOrders = async (egoCode, materialName) => {
        const sapMat = transformToSAPCode(egoCode); // you already use this util
        setOpenOrdersMaterial(sapMat);
        setOpenOrdersMaterialName(materialName ?? null);
        setOpenOrders([]);
        setOpenOrdersLoading(true);
        setShowOpenOrders(true);

        try {
            const res = await fetch(
                `${
                    process.env.REACT_APP_INFORMATORSAP
                }/api/plan/open-orders-by-material?material=${encodeURIComponent(
                    sapMat,
                )}&take=50&includeDisplayInfo=true`,
            );
            if (!res.ok) throw new Error("Failed to fetch open orders");
            const data = await res.json();
            setOpenOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setOpenOrders([]);
        } finally {
            setOpenOrdersLoading(false);
        }
    };

    // open orders selection -> validate before navigating
    const [selectingOrder, setSelectingOrder] = useState(null);

    const openOrderFromModal = async (aufnrDisplay) => {
        try {
            setSelectingOrder(aufnrDisplay);
            const ok = await goToOrderIfExists(aufnrDisplay);
            if (ok) setShowOpenOrders(false);
        } finally {
            setSelectingOrder(null);
        }
    };

    /////////////////////////////////// open orders functionality end

    useEffect(() => {
        if (!orderNumber) return;
        const ac = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_INFORMATORSAP}/api/orders/operations?orderNumber=${orderNumber}`,
                    { signal: ac.signal },
                );
                if (!res.ok) throw new Error("Failed to fetch operations");
                const data = await res.json();
                data.sort((a, b) => parseInt(a.Operation) - parseInt(b.Operation));
                if (!ac.signal.aborted) setSapOps(data);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            }
        })();

        return () => ac.abort();
    }, [orderNumber]);

    useEffect(() => {
        if (!orderNumber) return;
        const ac = new AbortController();

        const fetchOrderQuantity = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_INFORMATORSAP}/api/orders/total-quantity?orderNumber=${orderNumber}`,
                    { signal: ac.signal },
                );
                if (!res.ok) throw new Error("Failed to fetch total quantity");
                const data = await res.json();
                if (!ac.signal.aborted) setOrderQuantity(data);
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
            }
        };

        fetchOrderQuantity();
        return () => ac.abort();
    }, [orderNumber]);

    const machines = useMachinesAll();
    const handleClose = () => {
        setShow(false);
        setMachine(null);
        setSelectedDocument(null);
        setSelectedMaterial(null);
    };
    const handleOrderClose = () => setShowOrder(false);
    const handleFileClose = () => {
        setShowFile(false);
        setSelectedDocument(null);
    };
    const handleShow = (operationMachines = [], machine = null, material = null, type) => {
        if (type == "operation") {
            if (machine != null) {
                const [machineEntry] = machines?.data.filter(
                    (o) => o.idAlt == machine.machineAltKey,
                );
                const label = machineEntry
                    ? `${machine.machineAltKey} - ${machineEntry.nameShort}`
                    : machine.machineAltKey;
                setMachine({ label: label, value: machine.machineKey });
            }

            setOperationMachines(operationMachines);
        }
        const transformedMaterial = transformToSAPCode(material);
        setSelectedMaterial(transformedMaterial);
    };

    const handleFileShow = (file) => {
        setSelectedDocument(file);
        setFilePdfTs(Date.now());
        setShowFile(true);
    };

    const orders = useQuery(
        ["order", orderNumber],
        () => {
            // 🔹 NEW FLOW: direct from SAP via InformatorSAP
            // if (useNewSapFlow) {
            return axios
                .get(`${process.env.REACT_APP_INFORMATORSAP}/api/orderdetails/details`, {
                    params: { code: orderNumber },
                })
                .then((res) => res.data);
            // }

            // 🔸 OLD FLOW: Feathers /orders
            // return client
            //     .service("orders")
            //     .find({
            //         query: {
            //             code: orderNumber,
            //         },
            //     })
            //     .then((response) => {
            //         const { data } = response;
            //         const [order] = data;

            //         // keep your debug logs for the old flow
            //         console.log("OLD ORDER RAW:", order);
            //         console.log(
            //             "OLD PART DIMENSIONS:",
            //             order?.parts?.map((p) => ({
            //                 egoCode: p.egoCode,
            //                 dimension: p.dimension,
            //             })),
            //         );

            //         return order;
            //     });
        },
        {
            onSuccess: async (d) => {
                setMaterial(d?.materialCode?.split("/")[0]);
                if (d?.parts?.length > 0) {
                    const checks = await Promise.all(
                        d.parts.map(async (part) => {
                            const transformed = transformToSAPCode(part?.egoCode);
                            try {
                                const res = await axios.get(
                                    `https://plmordersearch-0004.bfits.com//data-sap-part/${transformed}/${transformed}.json`,
                                );
                                const hasDocuments = res?.data?.dokumente?.length > 0;
                                return [part?.egoCode, hasDocuments];
                            } catch (err) {
                                return [part?.egoCode, false];
                            }
                        }),
                    );

                    const docMap = Object.fromEntries(checks);
                    setPartsWithDocuments(docMap);
                }
            },
        },
    );

    const printParts = (includeOperations = false) => {
        const newWindow = window.open("", "_blank", "width=1000,height=800");

        if (newWindow) {
            newWindow.document.write("<div id='print-root'></div>");
            newWindow.document.title = t("documentation:parts");

            const style = newWindow.document.createElement("style");
            style.innerHTML = `
                body {
                    font-family: sans-serif;
                    padding: 20px;
                }
            `;
            newWindow.document.head.appendChild(style);

            ReactDOM.render(
                <PrintableOrder
                    orderRow={orderRow}
                    parts={enrichedParts.length > 0 ? enrichedParts : orders.data.parts}
                    orderNumber={orderNumber}
                    operations={includeOperations ? orders?.data?.operations || [] : []}
                    sapOps={includeOperations ? sapOps || [] : []}
                    confirmations={includeOperations ? opConfirmations || [] : []}
                    selectedUnit={selectedUnit}
                    unitKey={unitKey}
                    materialBarcode={transformToSAPCode(orders?.data?.materialCode)}
                />,
                newWindow.document.getElementById("print-root"),
            );

            setTimeout(() => {
                newWindow.print();
                newWindow.close();
            }, 500);
        }
    };

    useEffect(() => {
        // if there are no parts for this order, clear and bail early
        if (!orders?.data?.parts || orders.data.parts.length === 0) {
            setEnrichedParts([]);
            return;
        }

        const ac = new AbortController();

        // capture snapshots so we don't read changing refs mid-flight
        const currentOrder = orderNumber;
        const partsSnapshot = orders.data.parts;

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_INFORMATORSAP}/api/orders/components?orderNumber=${currentOrder}`,
                    { signal: ac.signal },
                );
                if (!res.ok) throw new Error("Failed to fetch components");

                const data = await res.json();
                if (ac.signal.aborted) return;

                const componentMap = Object.fromEntries(data.map((comp) => [comp.Component, comp]));

                const updated = partsSnapshot.map((part) => {
                    const key = transformToSAPCode(part.egoCode);
                    const match = componentMap[key];
                    return match
                        ? {
                              ...part,
                              quantityRequired: match.QuantityRequired,
                              availableQuantity: match.AvailableQuantity,
                              unit: match.Unit,
                          }
                        : part;
                });

                if (!ac.signal.aborted) setEnrichedParts(updated);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Failed to enrich parts with SAP data", err);
                }
            }
        })();

        return () => ac.abort();
    }, [orders?.data?.parts, orderNumber]);

    const notices = useQuery(
        ["notices", material],
        () => getNotice(material).then((result) => result),
        {
            enabled: !!orders && !!material,
        },
    );

    const files = useQuery(
        ["files", orderNumber, material],
        () => {
            return axios.get(orderPath + paddedNumber + ".json").then(async (res) => {
                const { data } = res;
                if (!!!_.find(data.dokumente, ["kategorie", "drawings"])) {
                    const regex = /[.-]/gi;
                    if (!!material) {
                        const transformedMaterial =
                            material.split("-")[0].replaceAll(".", "").padStart(10, "0") + ".pdf";
                        const response = await axios
                            .get(`http://${process.env.REACT_APP_DRAWINGS}/` + transformedMaterial)
                            .then((res) => {
                                if (res.status == 404) return;
                                return {
                                    dateiname: transformedMaterial,
                                    kategorie: "drawings_local",
                                    path: `http://${process.env.REACT_APP_DRAWINGS}/`,
                                    titel: t("documentation:drawing_from_glt"),
                                };
                            })
                            .catch((err) => {
                                return undefined;
                            });
                        if (!!response) data.dokumente.push(response);
                    }
                }
                return data;
            });
        },
        {
            onSuccess: (data) => {},
        },
        { enabled: material != null },
    );

    const machineFiles = useQuery(
        ["machineFiles", machine?.value],
        () => {
            return axios
                .get(
                    "https://plmordersearch-0004.bfits.com//data-equipment/" +
                        machine.value +
                        "/" +
                        machine.value +
                        ".json",
                )
                .then((res) => {
                    const { data } = res;
                    return data;
                })
                .catch((e) => console.log(e));
        },
        { enabled: !!machine, onSuccess: (data) => setShow(true) },
    );

    const materialFiles = useQuery(
        ["materialFiles", selectedMaterial],
        () => {
            return axios
                .get(
                    "https://plmordersearch-0004.bfits.com//data-sap-part/" +
                        selectedMaterial +
                        "/" +
                        selectedMaterial +
                        ".json",
                )
                .then((res) => {
                    const { data } = res;
                    return data;
                })
                .catch((e) => {
                    console.error(e);
                    showToast(
                        t("documentation:warning"),
                        t("documentation:no_documents_available"),
                        "warning",
                    );
                });
        },
        {
            enabled: !!selectedMaterial,
            onSuccess: (data) => {
                if (data?.dokumente.length > 0) setShow(true);
                else
                    showToast(
                        t("documentation:warning"),
                        t("documentation:no_documents_available"),
                        "warning",
                    );
            },
        },
    );

    if (orders.isLoading)
        return (
            <div
                style={{ minHeight: "50vh" }}
                className='d-flex h-100 justify-content-center align-items-center'
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );

    let categories = new Set();
    machineFiles?.data?.dokumente.forEach((doc) => {
        categories.add(doc.kategorie);
    });
    materialFiles?.data?.dokumente.forEach((doc) => {
        categories.add(doc.kategorie);
    });

    const documentGroups = Array.from(categories).map((category, index) => {
        const listArray = !!machine ? machineFiles : materialFiles;
        const listItems = listArray?.data?.dokumente
            .filter((doc) => {
                const matchesCategory = doc.kategorie === category;
                const matchesTag =
                    filterTag === "VSE" || doc.titel?.toUpperCase().includes(filterTag);
                return matchesCategory && matchesTag;
            })
            .map((doc, i) => (
                <Item
                    key={doc.kategorie + i}
                    selected={doc.dateiname === selectedDocument?.dateiname}
                    onClick={() => {
                        setSelectedDocument(doc);
                        setPdfTs(Date.now());
                    }}
                >
                    {doc.titel}
                </Item>
            ));

        return (
            <div key={category + index}>
                <div className='text-muted'>{t(`documentation:${category}`)}</div>
                <List>{listItems}</List>
            </div>
        );
    });

    const noticeData = notices?.data?.map((notice, i) => {
        return {
            id: i + 1,
            name: notice.title,
            code: notice.materialCode,
            subunit: notice.subunit.name,
            description: notice.description,
            status: notice.active,
            timestamp: dayjs(notice.createdAt),
            images: notice.uploads,
        };
    });

    const path = orders?.data?.uploads[0]?.path;
    const converted = `http://${process.env.REACT_APP_INFORMATOR}` + path?.split("public")[1];

    const pdfFrame = (
        <div className='d-flex justify-content-center align-items-center h-100'>
            {machine || selectedMaterial ? (
                machineFiles?.data || materialFiles?.data ? (
                    selectedDocument ? (
                        <StyledIframe
                            width='100%'
                            src={
                                machine
                                    ? `https://plmordersearch-0004.bfits.com//data-equipment/${machine.value}/${selectedDocument?.dateiname}?ts=${pdfTs}`
                                    : `https://plmordersearch-0004.bfits.com//data-sap-part/${selectedMaterial}/${selectedDocument?.dateiname}?ts=${pdfTs}`
                            }
                        ></StyledIframe>
                    ) : (
                        <h4>{t("labels:select_document_from_list")}</h4>
                    )
                ) : (
                    <h4>{t("labels:no_documents_for_selected_machine")}</h4>
                )
            ) : (
                <h4>{t("labels:select_machine_from_list")}</h4>
            )}
        </div>
    );
    const barcodeValue = orders?.data?.materialCode ? orders.data.materialCode.slice(4, -4) : "";

    const orderRow = orders.data ? (
        <div className='d-flex flex-column align-items-baseline w-100'>
            <div className='d-flex align-items-center justify-content-between w-100'>
                <h3 className='mb-0 text-primary me-3'>
                    {t("workorder")}: {orderNumber}
                </h3>
                {orderQuantity && (
                    <div className='text-muted d-flex align-items-center gap-3'>
                        <span>
                            Za izdelavo:{" "}
                            <strong>
                                {orderQuantity.Quantity} {translateUnit(orderQuantity.Unit)}
                            </strong>
                        </span>

                        <span>
                            {" "}
                            Dobavljeno:{" "}
                            <strong>
                                {orderQuantity.Delivered}{" "}
                                {translateUnit(orderQuantity.DeliveredUnit)}
                            </strong>
                        </span>
                    </div>
                )}
            </div>
            <div className='d-flex gap-2 align-items-baseline w-100'>
                <div className='d-flex flex-column'>
                    <h4>{orders?.data.name}</h4>
                </div>
                <h5 className='text-muted mb-0' style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                    {orders?.data.materialCode}
                </h5>
                <div className='d-flex ms-auto gap-2 align-items-center'>
                    <Button
                        variant='link'
                        className='text-decoration-none'
                        onClick={() => showBarcode(barcodeValue)}
                    >
                        <span className='me-2'>{t("documentation:barcode_nmbr_material")}</span>
                        <FaRegFileAlt className='h3' />
                    </Button>
                    <Button
                        variant='link'
                        className='text-decoration-none'
                        onClick={() => {
                            setShowOrder(true);
                            setOrderPdfTs(Date.now());
                        }}
                    >
                        <span className='me-2'>{t("documentation:accompanying_sheet")}</span>
                        <FaRegFileAlt className='h3' />
                    </Button>
                    <Dropdown align='end'>
                        <Dropdown.Toggle
                            variant='link'
                            className='text-decoration-none d-flex align-items-center'
                            id='print-dropdown'
                        >
                            <span className='me-2'>{t("documentation:print")}</span>
                            <FaPrint className='h3 mb-0' />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => printParts(false)}>
                                {t("documentation:print_parts_only")}
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => printParts(true)}>
                                {t("documentation:print_parts_and_operations")}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
        </div>
    ) : null;

    const documentsRow = files.data ? (
        <Row className='g-2 mb-2'>
            {notices?.data?.length > 0 && (
                <Col xs={12} xl={4}>
                    <OrderCard title={t("documentation:notices")} icon='exclamation-triangle'>
                        <Notice data={noticeData} />
                    </OrderCard>
                </Col>
            )}

            <Col xs={12} xl='auto' className='flex-grow-1'>
                <OrderCard title={t("documentation:files")} icon='file-alt'>
                    {files?.data ? (
                        <Documents
                            documents={files?.data}
                            clicked={handleFileShow}
                            path={orderPath}
                        />
                    ) : null}
                </OrderCard>
            </Col>
        </Row>
    ) : null;

    const operationsRow = orders.data ? (
        <Col>
            <OrderCard title={t("documentation:operation", { count: 3 })} icon='cogs'>
                {orders.data.operations && opConfirmations ? (
                    <Operations
                        operations={orders.data.operations}
                        clicked={handleShow}
                        sapOps={sapOps}
                        confirmations={opConfirmations}
                        onShowBarcode={showBarcode}
                    />
                ) : null}
            </OrderCard>
        </Col>
    ) : null;

    const partsRow = orders.data ? (
        <Col>
            <OrderCard title={t("documentation:parts")} icon='box'>
                {orders.data.parts ? (
                    <Parts
                        parts={enrichedParts.length > 0 ? enrichedParts : orders.data.parts}
                        clicked={handleShow}
                        documentPresence={partsWithDocuments}
                        orderNumber={orderNumber}
                        onOpenOrders={handleOpenOrders} // open orders functionality
                        onShowBarcode={showBarcodeForMaterial}
                    />
                ) : null}
            </OrderCard>
        </Col>
    ) : null;

    const operationsAndPartsRow = orders.data ? (
        <Row className='g-2'>
            {operationsRow}
            {partsRow}
        </Row>
    ) : null;

    const machineLabels = operationMachines?.map((machine) => {
        const [machineEntry] = machines.data.filter((o) => o.idAlt == machine.machineAltKey);
        const label = machineEntry
            ? `${machine.machineAltKey} - ${machineEntry.nameShort}`
            : machine.machineAltKey;
        return { label: label, value: machine.machineKey };
    });

    return (
        <div>
            <Container fluid className={"p-4"}>
                {orderRow}
                {documentsRow}
                {operationsAndPartsRow}
            </Container>
            <StyledModal centered size='xl' show={showOrder} onHide={handleOrderClose}>
                <Modal.Body className='d-flex justify-content-center'>
                    <Row style={{ width: "100%" }}>
                        <Col>
                            <StyledIframe
                                style={{ height: "85vh" }}
                                width='100%'
                                src={`${converted}?ts=${orderPdfTs}`}
                            ></StyledIframe>
                        </Col>
                    </Row>
                </Modal.Body>
            </StyledModal>
            <StyledModal centered size='xl' show={showFile} onHide={handleFileClose}>
                <Modal.Body className='d-flex justify-content-center'>
                    <Row style={{ width: "100%" }}>
                        <Col>
                            <StyledIframe
                                style={{ height: "85vh" }}
                                width='100%'
                                src={`${selectedDocument}?ts=${filePdfTs}`}
                            ></StyledIframe>
                        </Col>
                    </Row>
                </Modal.Body>
            </StyledModal>
            <StyledModal centered size='xl' show={show} onHide={handleClose}>
                <Modal.Body style={{ height: "90vh" }} className='px-4'>
                    <Row className='h-100'>
                        <Col
                            md={2}
                            style={{
                                maxHeight: "calc(90vh - 40px)",
                                overflowY: "auto",
                                paddingRight: "8px",
                            }}
                        >
                            <h4>{t("documentation:document_list")}</h4>
                            {!selectedMaterial && (
                                <div>
                                    <label>{t("machine")}</label>
                                    <Select
                                        defaultValue={
                                            machineLabels?.length > 0 ? machineLabels[0] : null
                                        }
                                        onChange={(value) => {
                                            setMachine(value);
                                        }}
                                        placeholder={t("select_machine")}
                                        options={machineLabels}
                                    />
                                    <div className='my-3'>
                                        <div className='d-flex gap-2 flex-wrap'>
                                            {["VSE", "VZD", "TEP", "NNS", "MP", "NVD"].map(
                                                (tag) => (
                                                    <Button
                                                        key={tag}
                                                        size='sm'
                                                        variant={
                                                            filterTag === tag
                                                                ? "primary"
                                                                : "outline-primary"
                                                        }
                                                        onClick={() => setFilterTag(tag)}
                                                    >
                                                        {tag}
                                                    </Button>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {machineFiles?.data || materialFiles?.data
                                ? documentGroups ?? null
                                : null}
                            {}
                        </Col>
                        <Col md={10} className='sm:h-100 border-start border-1'>
                            {pdfFrame}
                        </Col>
                    </Row>
                </Modal.Body>
            </StyledModal>
            <Modal
                show={showBarcodeModal}
                onHide={() => {
                    setShowBarcodeModal(false);
                    setSelectedBarcode(null);
                }}
                centered
                style={{ minWidth: 400 }}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{"Barkoda"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className='d-flex flex-column align-items-center'>
                    <Barcode
                        value={selectedBarcode || barcodeValue}
                        width={2}
                        height={50}
                        fontSize={16}
                    />
                </Modal.Body>
            </Modal>
            <StyledModal
                centered
                size='md'
                show={showOpenOrders}
                onHide={() => setShowOpenOrders(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Odprti nalogi</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {openOrdersLoading ? (
                        <div
                            className='d-flex justify-content-center align-items-center'
                            style={{ minHeight: 120 }}
                        >
                            <PulseLoader size={12} margin={8} />
                        </div>
                    ) : openOrders.length === 0 ? (
                        <div className='text-muted'>
                            Za material {openOrdersMaterial} ne najdem odprtih nalogov .
                        </div>
                    ) : (
                        <div className='d-flex flex-column gap-2'>
                            {openOrders.map((o) => (
                                <div
                                    key={o.Aufnr}
                                    className='border rounded px-3 py-2 d-flex flex-column gap-1'
                                >
                                    {/* Row 1: order (display only) + material name (left) + button (right) */}
                                    <div className='d-flex align-items-center justify-content-between gap-3'>
                                        <div className='d-flex align-items-center gap-2 text-truncate'>
                                            <span className='font-monospace'>{o.AufnrDisplay}</span>
                                            <span className='text-muted'>—</span>
                                            <span
                                                className='fw-semibold text-truncate'
                                                title={openOrdersMaterialName || ""}
                                            >
                                                {openOrdersMaterialName || "—"}
                                            </span>
                                        </div>

                                        <Button
                                            size='sm'
                                            variant='outline-primary'
                                            title={`Odpri nalog ${o.AufnrDisplay}`}
                                            onClick={() => openOrderFromModal(o.AufnrDisplay)}
                                            className='d-inline-flex align-items-center flex-shrink-0'
                                        >
                                            <FaExternalLinkAlt
                                                className='me-2'
                                                aria-hidden='true'
                                            />
                                            <span className='d-none d-sm-inline'>Odpri nalog</span>
                                        </Button>
                                    </div>

                                    {/* Row 2: quantities (left) */}
                                    {(o.Quantity != null || o.Delivered != null) && (
                                        <div className='small text-muted'>
                                            <span>
                                                Za izdelavo:{" "}
                                                <strong>
                                                    {o.Quantity ?? "-"} {translateUnit(o.Unit)}
                                                </strong>
                                            </span>
                                            <span className='ms-3'>
                                                Dobavljeno:{" "}
                                                <strong>
                                                    {o.Delivered ?? 0}{" "}
                                                    {translateUnit(o.DeliveredUnit || o.Unit)}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </StyledModal>
        </div>
    );
}

export default withRouter(Order);
