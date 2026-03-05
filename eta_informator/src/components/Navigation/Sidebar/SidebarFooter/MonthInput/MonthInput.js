import React, { forwardRef } from "react";
import styled from "styled-components";

const StyledButton = styled.button`
    background-color: transparent;
    width: 100%;
    padding: 4px 16px;
    color: white;
    box-shadow: unset;
    border: unset;
    text-align: center;
    text-transform: uppercase;
    color: var(--bs-light);
    font-size: var(--body);

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
`;

function MonthInput(props, ref) {
    return <StyledButton onClick={props.onClick}>{props.value}</StyledButton>;
}

export default forwardRef(MonthInput);
