import styled from "styled-components";
import egoLogoWhite from "../../assets/images/ego_logo_white.png";
import egoLogo from "../../assets/images/ego_logo.png";

const StyledLogo = styled.div`
    padding: 8px;
    opacity: 1;

    & img {
        height: 100%;
    }
`;

function Logo(props) {
    return (
        <StyledLogo style={{ height: props.height, cursor: "pointer" }} onClick={props.onClick}>
            <img src={props.type === "logo" ? egoLogoWhite : egoLogo} alt='logo' />
        </StyledLogo>
    );
}

export default Logo;
