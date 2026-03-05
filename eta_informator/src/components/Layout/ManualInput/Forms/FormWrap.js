import { Container } from "react-bootstrap";
import styled from "styled-components";

const StyledWrap = styled(Container)`
    max-width: 976px;
    height: 100%;
`;
function FormWrap(props) {
    return <StyledWrap {...props}>{props.children}</StyledWrap>;
}
export default FormWrap;
