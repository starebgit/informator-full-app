import styled from "styled-components";
import { PulseLoader } from "react-spinners";

const Card = styled.div`
+   width: 100%;
    border-radius: ${({ size }) => (size === "small" ? "0.5rem" : "1rem")};
    background-color: var(--bs-gray-100);
    box-shadow: var(--bs-box-shadow-sm);
    transition: all 0.2s ease-in-out;
    cursor: ${({ $disabled }) => ($disabled ? "wait" : "pointer")};
    opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
    &:hover {
        box-shadow: var(--bs-box-shadow);
        margin-left: 0.2rem;
        margin-right: -0.2rem;
    }
`;

const FormCard = ({ id, code, title, onClickHandler, size, isLoading }) => {
    return (
        <Card
            size={size}
            $disabled={!!isLoading}
            className={
                size === "small"
                    ? "p-1 px-2 d-flex justify-content-between align-items-center"
                    : "p-3"
            }
            aria-busy={!!isLoading}
            onClick={() => onClickHandler(id)}
        >
            <div className='me-3'>
                {code && <div className='font-monospace small'>{code}</div>}
                <div>{title}</div>
            </div>

            {isLoading && (
                <div className='d-flex align-items-center gap-2'>
                    <PulseLoader size={8} margin={4} />
                    <span className='small text-muted'>
                        Prenašam, to lahko traja tudi minuto ali več...
                    </span>
                </div>
            )}
        </Card>
    );
};

export default FormCard;
