import React, { useEffect, useState } from "react";
import Sidebar from "../Navigation/Sidebar/Sidebar";
import Toolbar from "../Navigation/Toolbar/Toolbar";
import Content from "./Content/Content";
import styled from "styled-components";
import {
    NavigationContext,
    SetNavigationContext,
} from "../../context/NavigationContext/NavigationContext";
import { Offcanvas } from "react-bootstrap";

const StyledLayout = styled.div`
    display: flex;
    width: 100vh;
`;

function Layout(props) {
    const [showSidebar, setShowSidebar] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [navigation, setNavigation] = useState(null);
    const [subunit, setSubunit] = useState(null);

    const setNavigationHandler = React.useCallback((navigationItems) => {
        setNavigation(navigationItems);
    }, []);

    const setSubunitHandler = React.useCallback((subunitItem) => {
        setSubunit(subunitItem);
    }, []);

    useEffect(() => {
        if (typeof Event === "function") {
            // modern browsers
            setTimeout(() => {
                window.dispatchEvent(new Event("resize"));
            }, 300);
        } else {
            // for IE and other old browsers
            // causes deprecation warning on modern browsers
            var evt = window.document.createEvent("UIEvents");
            evt.initUIEvent("resize", true, false, window, 0);
            setTimeout(() => {
                window.dispatchEvent(evt);
            }, 300);
        }
    });

    /**
     * navigationItem -> Navigation element
     * status -> Notification status:
     *      0 = no notification
     *      1 = warning
     *      2 = urgent
     */
    const setNavigationNotificationHandler = React.useCallback(
        (navigationItem, status) => {
            const navigationItems = { ...navigation };
            navigationItems[navigationItem]["notification"] = status;
            setNavigation(navigationItems);
        },
        [navigation],
    );

    const showOffcanvasHandler = React.useCallback(() => {
        setShowOffcanvas(!showOffcanvas);
    }, [showOffcanvas]);

    const showSidebarHandler = React.useCallback(() => {
        setShowSidebar(!showSidebar);
    }, [showSidebar]);

    return (
        <React.Fragment>
            <StyledLayout>
                <div className='d-none d-lg-block'>
                    <Sidebar
                        mobile={false}
                        showSidebar={showSidebar}
                        setShowSidebar={showSidebarHandler}
                    />
                </div>
                <Offcanvas
                    className='h-auto'
                    show={showOffcanvas}
                    placement='start'
                    onHide={() => setShowOffcanvas(false)}
                >
                    <Offcanvas.Body className='p-0'>
                        <Sidebar
                            mobile={true}
                            showSidebar={false}
                            setShowSidebar={showOffcanvasHandler}
                        />
                    </Offcanvas.Body>
                </Offcanvas>
                <Content showSidebar={showSidebar}>
                    <NavigationContext.Provider value={{ navigation, subunit }}>
                        <Toolbar
                            setShowSidebar={showSidebarHandler}
                            setShowOffcanvas={showOffcanvasHandler}
                        ></Toolbar>
                    </NavigationContext.Provider>
                    <SetNavigationContext.Provider
                        value={{
                            setNavigationHandler,
                            setNavigationNotificationHandler,
                            setSubunitHandler,
                        }}
                    >
                        <main>{props.children}</main>
                    </SetNavigationContext.Provider>
                </Content>
            </StyledLayout>
        </React.Fragment>
    );
}

export default React.memo(Layout);
