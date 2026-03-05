import React, { useState } from "react";
import styles from "./SidebarDropdown.module.scss";
import { Accordion, Nav } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

const Dropdown = styled.div`
    width: 100%;
    background-color: rgba(255, 255, 255, 0.1);
`;

const Title = styled.div``;

const Children = styled.div`
    transform: ${(props) => (props.show ? "scaleY(1)" : "scaleY(0)")};
    opacity: ${(props) => (props.show ? 1 : 0)};
    transform-origin: top center;
    transition:
        transform 0.2s ease-in-out,
        opacity 0.2s ease-in-out;
`;

function NavDropdown(props) {
    const [collapsed, setCollapsed] = useState(true);

    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    };

    const { icon, title } = props;

    return (
        <Dropdown className={[collapsed ? "open" : null]}>
            <Title onClick={() => toggleNavbar()}>
                <FontAwesomeIcon icon={icon} size='lg' pull='left' fixedWidth />
                {title}
                <FontAwesomeIcon icon={collapsed ? faCaretDown : faCaretUp} className='float-end' />
            </Title>
            <Children show={collapsed}> {props.children}</Children>
        </Dropdown>
    );
}

export default NavDropdown;
