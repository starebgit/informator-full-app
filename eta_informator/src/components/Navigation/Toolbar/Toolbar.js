import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import Navigation from "../NavigationItems/NavigationItems";
import { useLocation, withRouter } from "react-router-dom";
import styled from "styled-components";
import PrivateRoute from "../../../routes/PrivateRoute";
import { NavigationContext } from "../../../context/NavigationContext/NavigationContext";
import { useTranslation } from "react-i18next";
import { Offcanvas } from "react-bootstrap";

const StyledNavbar = styled(Navbar)`
    padding: 0px 16px !important;
    width: 100%;
    background-color: #f3f3f3;
    overflow: hidden;
    color: var(--bs-blue);
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    z-index: 90;
    transition: var(--transition);
    min-height: 64px;
`;

function Toolbar(props) {
    const location = useLocation();
    const [expandedRight, setExpandedRight] = useState(false);
    const navigationContext = useContext(NavigationContext);
    const subunit = navigationContext.subunit;
    const { t } = useTranslation(["shopfloor", "navigation"]);

    const toggleExpanded = () => {
        setExpandedRight(!expandedRight);
    };

    return (
        <StyledNavbar sticky='top' bg='light' variant='light'>
            <Button
                className='d-none d-lg-block'
                size='lg'
                variant='light'
                onClick={props.setShowSidebar}
            >
                {<FontAwesomeIcon icon='bars' size='lg' />}
            </Button>
            <Button
                className='d-block d-lg-none'
                size='lg'
                variant='light'
                onClick={props.setShowOffcanvas}
            >
                {<FontAwesomeIcon icon='bars' size='lg' />}
            </Button>

            <PrivateRoute path={`/shopfloor/*`}>
                <h3 className='mb-0'>{"eSFM - " + subunit} </h3>
            </PrivateRoute>
            <Button
                className='ms-auto d-lg-none'
                onClick={() => setExpandedRight(true)}
                aria-controls='topbar'
                disabled={Object.keys(navigationContext.navigation || {}).length === 0}
            >
                <div size='lg' variant='light'>
                    {t("navigation:" + location.pathname.split("/").pop())}
                </div>
            </Button>
            <div className='d-none d-lg-flex' style={{ marginLeft: "auto" }}>
                <Navigation />
            </div>

            <Offcanvas show={expandedRight} placement='end' onHide={() => setExpandedRight(false)}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>{t("navigation")}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Navigation onClick={toggleExpanded} column={true} />
                </Offcanvas.Body>
            </Offcanvas>
        </StyledNavbar>
    );
}

export default withRouter(Toolbar);
