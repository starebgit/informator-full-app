import { Row, Col, Modal } from "react-bootstrap";
import styled from "styled-components";
import { useContext, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { useQuery } from "react-query";
import _ from "lodash";
import { PulseLoader } from "react-spinners";
import { ToastContext } from "../../../../context/ToastContext/ToastContext";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

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

function Material(props) {
    const [pdfTs, setPdfTs] = useState(null); //pdf timestamp for cache busting
    const selectedMaterial = props.match.params.id;
    const history = useHistory();
    const { t } = useTranslation(["shopfloor", "labels", "documentation"]);
    const [show, setShow] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const { showToast } = useContext(ToastContext);

    const handleClose = () => {
        setShow(false);
        setSelectedDocument(null);
        history.push("/documentation");
    };

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

    if (materialFiles.isLoading)
        //if (true)
        return (
            <div
                style={{ minHeight: "50vh" }}
                className='d-flex h-100 justify-content-center align-items-center'
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );

    let categories = new Set();

    materialFiles?.data?.dokumente.forEach((doc) => {
        categories.add(doc.kategorie);
    });

    const documentGroups = Array.from(categories).map((category, index) => {
        const listArray = materialFiles;
        const listItems = listArray?.data?.dokumente
            .filter((doc) => doc.kategorie === category)
            .map((doc, i) => (
                <Item
                    key={doc.kategorie + i}
                    selected={doc.dateiname === selectedDocument?.dateiname}
                    onClick={() => {
                        setSelectedDocument(doc);
                        setPdfTs(Date.now()); // <-- cache-buster generated only once
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

    const pdfFrame = (
        <div className='d-flex justify-content-center align-items-center h-100'>
            {selectedMaterial ? (
                materialFiles?.data ? (
                    selectedDocument ? (
                        <StyledIframe
                            width='100%'
                            src={`https://plmordersearch-0004.bfits.com//data-sap-part/${selectedMaterial}/${selectedDocument?.dateiname}?ts=${pdfTs}`}
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

    return (
        <div>
            <StyledModal centered size='xl' show={show} onHide={handleClose}>
                <Modal.Body style={{ height: "90vh" }} className='px-4'>
                    <Row className='h-100'>
                        <Col md={2} style={{ height: "min-content" }}>
                            <h4>{t("documentation:document_list")}</h4>
                            {materialFiles?.data ? documentGroups ?? null : null}
                            {}
                        </Col>
                        <Col md={10} className='sm:h-100 border-start border-1'>
                            {pdfFrame}
                        </Col>
                    </Row>
                </Modal.Body>
            </StyledModal>
        </div>
    );
}

export default withRouter(Material);
