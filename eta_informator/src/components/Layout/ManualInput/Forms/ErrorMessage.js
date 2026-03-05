import styled from "styled-components";

const ErrorMessage = styled.span`
    color: var(--bs-red);
    font-size: 14px;
    margin-left: ${(props) => (props.response ? "0px" : "8px")};
`;

export default ErrorMessage;
