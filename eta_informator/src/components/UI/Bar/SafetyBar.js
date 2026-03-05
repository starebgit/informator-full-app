import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ClipLoader from "react-spinners/ClipLoader";
import dayjs from "dayjs";

const StyledBar = styled.div`
    display: flex;
    color: white;
    width: min-content;
    gap: 5rem;
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

function SafetyBar({ companyAccidents, subunitAccidents, isLoading, ...props }) {
    const { t } = useTranslation(["shopfloor", "labels"]);

    return (
        <StyledBar className='d-flex align-items-center justify-content-center' color='cyan'>
            <div className='d-flex flex-column text-nowrap'>
                <div className='fs-5'>{t("number_of_accidents")}</div>
                <FontAwesomeIcon size='lg' icon='plus-square' />
            </div>
            {isLoading ? (
                <ClipLoader className='ms-3' size={25} color='white' />
            ) : (
                <div className='d-flex'>
                    <div className='d-flex flex-column align-items-end justify-content-between'>
                        <h5>ETA</h5>
                        <div className='ms-3 fw-bold mb-0'>{companyAccidents}</div>
                    </div>
                    <div className='d-flex flex-column align-items-end justify-content-between ms-3'>
                        <h5>{t("labels:subunit")}</h5>
                        <div className='ms-3 fw-bold mb-0'>{subunitAccidents}</div>
                    </div>
                </div>
            )}
        </StyledBar>
    );
}

export default SafetyBar;
