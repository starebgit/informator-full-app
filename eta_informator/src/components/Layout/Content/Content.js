import styled from "styled-components";

const StyledContent = styled.div`
    min-height: 100vh;
    transition: all 0.3s ease-in-out;
    position: absolute;
    overflow-x: hidden;
    top: 0;
    right: 0;
    width: ${(props) => (props.showSidebar ? "100%" : `calc(100% - 290px)`)};
    @media only screen and (max-width: 992px) {
        width: 100%;
    }
`;

function Content(props) {
    return <StyledContent {...props}>{props.children}</StyledContent>;
}

export default Content;
