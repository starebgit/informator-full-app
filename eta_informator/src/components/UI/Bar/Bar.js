import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import styled from "styled-components";
import ClipLoader from "react-spinners/ClipLoader";
import dayjs from "dayjs";

const StyledBar = styled.div`
    display: flex;
    color: white;
    background: ${(props) => {
        switch (props.color) {
            case "red":
                return "rgb(181, 1, 89)";
            case "green":
                return "rgb(1, 181, 52)";
            case "orange":
                return "rgb(255, 124, 0)";
            default:
                return "var(--bs-cyan)";
        }
    }};
    background: ${(props) => {
        switch (props.color) {
            case "red":
                return `linear-gradient(29deg, rgba(181, 1, 89, 1) 0%, rgba(251, 0, 34, 1) 100%)`;
            case "green":
                return "linear-gradient(15deg, rgb(12, 157, 53) 0%, rgb(4, 213, 56) 100%)";
            case "orange":
                return "linear-gradient(45deg, rgba(255, 124, 0, 1) 0%, rgba(255, 206, 0, 1) 100%)";
            default:
                return "var(--bs-cyan)";
        }
    }};
    padding: 12px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.5s ease-out allow-discrete;
`;

function Bar({ type, title, content = [], path, isLoading, ...props }) {
    const { t } = useTranslation(["shopfloor", "labels"]);
    const [company, subunit] = content;
    const history = useHistory();
    if (!content) {
        return null;
    }
    return (
        <StyledBar
            className='d-flex align-items-center justify-content-center gap-3'
            onClick={() => history.push(path)}
            color={company?.value < 15 ? "red" : company?.value < 32 ? "orange" : "green"}
        >
            <div className='d-flex flex-column'>
                <div className='fs-5'>{t(title, { count: company?.value })}</div>
                <FontAwesomeIcon size='lg' icon='plus-square' />
            </div>
            {isLoading ? (
                <ClipLoader className='ms-3' size={25} color='white' />
            ) : (
                <div className='d-flex gap-4'>
                    <div className='d-flex flex-column align-items-end justify-content-between'>
                        <h5>ETA</h5>
                        <div>{company?.timestamp?.format("LL")}</div>
                        <div className='ms-3 fw-bold mb-0'>
                            {dayjs(company?.timestamp).fromNow()}
                        </div>
                    </div>
                    <div className='d-flex flex-column align-items-end justify-content-between'>
                        <h5>{t("labels:subunit")}</h5>
                        {
                            // If subunit is not null, display the subunit timestamp
                            subunit?.timestamp ? (
                                <>
                                    <div>{subunit?.timestamp?.format("LL")}</div>
                                    <div className='ms-3 fw-bold mb-0'>
                                        {dayjs(subunit?.timestamp).fromNow()}
                                    </div>
                                </>
                            ) : (
                                <div className='ms-3 fw-bold mb-0'>{t("no_accidents")}</div>
                            )
                        }
                    </div>
                </div>
            )}
        </StyledBar>
    );
}

export default Bar;
