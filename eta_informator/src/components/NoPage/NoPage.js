import { useTranslation } from "react-i18next";

function NoPage(props) {
    const { t } = useTranslation("shopfloor");
    return (
        <div className='d-flex justify-content-center align-items-center vh-100'>
            <div className='h4'>{t("page_does_not_exist")}</div>
        </div>
    );
}

export default NoPage;
