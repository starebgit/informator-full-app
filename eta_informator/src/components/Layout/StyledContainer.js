import { Container, Row } from "react-bootstrap";
import styled from "styled-components";

const StyledContainer = styled(Container)`
    overflow: hidden;
    max-width: 95%;
    padding-top: 1rem;
`;

const StyledRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

export { StyledContainer, StyledRow };
