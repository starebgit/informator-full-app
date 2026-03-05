import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

const StyledNavLink = styled(NavLink)`
    height: 100%;
    padding: ${(props) => (props.column ? "4px 0px" : "16px 10px")};
    border-bottom: 4px solid transparent;
    box-sizing: border-box;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    border-top: 4px solid transparent;
    transition: var(--transition);
    &.nav_link:hover {
        -webkit-text-stroke-width: 0.7px;
    }

    &:active,
    &.active {
        background-color: ${(props) => (props.column ? "transparent" : "#dee2e6")};
        border-top: ${(props) =>
            props.column ? "4px solid transparent" : "4px solid var(--bs-primary)"};
        color: var(--bs-primary);
        -webkit-text-stroke-width: 0.7px;
    }
`;

const StyledDot = styled(FontAwesomeIcon)`
    color: ${(props) => {
        switch (props.dot) {
            case 1:
                return `var(--bs-yellow)`;
            case 2:
                return `var(--bs-red)`;
            default:
                return "transparent";
        }
    }};
    display: ${(props) => {
        if (props.dot == 0) return "none";
    }};
    margin-bottom: 16px;
`;

function SidebarItem(props) {
    const { t } = useTranslation("navigation");
    return (
        <>
            <StyledNavLink
                column={props.column}
                className='nav_link'
                onClick={props.onClick}
                to={props.to}
            >
                {t(props.title)}
                <StyledDot icon='circle' size='xs' dot={props.dot} />
            </StyledNavLink>
        </>
    );
}

export default SidebarItem;
