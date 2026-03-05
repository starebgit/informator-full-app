import { Row } from "react-bootstrap";
import styled from "styled-components";

const StyledRow = styled(Row)`
    padding-top: var(--s4);
    padding-bottom: var(--s4);
`;

function FormRow({ children, ...props }) {
    return <StyledRow {...props}>{children}</StyledRow>;
}
export default FormRow;
