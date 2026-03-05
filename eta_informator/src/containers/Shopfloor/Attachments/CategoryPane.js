import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import PdfWrap from "../../../components/Pdf/PdfWrap";

const DocBadge = styled(Badge)`
    transition: background 0.1s ease;
    background: ${(props) =>
        props?.selected ? "var(--bs-info) !important" : "var(--bs-dark) !important"};
    font-size: 12px;
    cursor: pointer;
    &:hover {
        background: ${(props) => {
            return props?.selected ? "var(--bs-info)" : "rgba(101,112,113,1) !important";
        }};
    }
`;

function CategoryPane({ attachments, onClickHandler, selectedAttachment, ...props }) {
    const { t } = useTranslation("shopfloor");
    return (
        <div>
            {attachments?.length ? (
                <div
                    style={{
                        backgroundColor: "var(--bs-light)",
                        color: "white",
                        padding: "12px 12px",
                    }}
                    className='d-flex flex-wrap align-items-center'
                >
                    {/* <div className='me-1 text-dark text-uppercase'>Aktivni dokumenti</div> */}
                    {attachments.map((doc, index) => {
                        return (
                            <DocBadge
                                className={"me-1 my-1"}
                                style={{
                                    fontSize: "18px",
                                    borderRadius: "8px",
                                }}
                                key={index}
                                onClick={() => onClickHandler(doc)}
                                bg='dark'
                                size='xs'
                                selected={doc.name == selectedAttachment?.name}
                            >
                                {doc.name}
                            </DocBadge>
                        );
                    })}
                </div>
            ) : null}
            <div
                className='d-flex align-items-center justify-content-center'
                style={{ minHeight: "225px" }}
            >
                {attachments?.length ? (
                    selectedAttachment ? (
                        <PdfWrap selectedAttachment={selectedAttachment} />
                    ) : (
                        <h4 className='text-muted'>{t("select_attachment")}</h4>
                    )
                ) : (
                    <h4 className='text-muted'>{t("no_added_attachments")}</h4>
                )}
            </div>
        </div>
    );
}

export default CategoryPane;
