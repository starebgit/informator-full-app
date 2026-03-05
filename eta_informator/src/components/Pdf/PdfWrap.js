import { useTranslation } from "react-i18next";
import { pdfUrl } from "../../utils/utils";
import { useState } from "react";

function PdfWrap({ subunitId, category, selectedAttachment, ...props }) {
    const [pdfTs] = useState(Date.now());

    const { t } = useTranslation("shopfloor");
    if (selectedAttachment.uploads.length === 0)
        return (
            <div>
                <h4 className='text-muted'>{t("attachment_file_error")}</h4>
            </div>
        );
    return (
        <div style={{ height: "75vh", width: "100%" }}>
            <iframe
                title='pdf_wraper'
                src={pdfUrl(selectedAttachment.uploads[0].path) + `?ts=${pdfTs}`}
                target='_parent'
                height='100%'
                width='100%'
            />
        </div>
    );
}
export default PdfWrap;
