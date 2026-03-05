import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

const StyledToggleButton = styled.a`
    padding: 8px 32px;
    display: none;

    @media only screen and (max-width: 576px) {
        & {
            display: inline;
        }
    }
`;

function ToggleButton(props) {
    return (
        <StyledToggleButton onClick={props.setShowSidebar}>
            <FontAwesomeIcon icon='bars' size='lg' />
        </StyledToggleButton>
    );
}

export default ToggleButton;
