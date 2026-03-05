import { Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch } from "react-router-dom";
import styled from "styled-components";

const Operation = styled(Card)`
    min-width: 200px;
    transition: background-color 0.2s ease-out;
    &:hover {
        background-color: whitesmoke;
    }
`;

const OperationTile = ({
    operation,
    operationKey,
    hours,
    base,
    includeLate,
    greenHours,
    ...props
}) => {
    const { t } = useTranslation("shopfloor");
    const { url } = useRouteMatch();
    const history = useHistory();
    return (
        <Operation
            className='d-flex flex-column justify-content-center align-items-center tile py-3'
            onClick={() =>
                history.push(`${url}/queue/${operationKey}${includeLate ? "?late=true" : ""}`)
            }
        >
            <div className='mb-2 d-flex align-items-baseline gap-2'>
                <h4 className='mb-0 fw-bold text-success'>{greenHours}h</h4>
                <h3 className='mb-0 fw-bold'>/ {hours}h</h3>
            </div>
            <h6 className='mb-0'>{t(operation)}</h6>
        </Operation>
    );
};

export default OperationTile;
