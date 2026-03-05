import { Redirect, Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../routes/PrivateRoute";
import { useTranslation } from "react-i18next";
import { Tab, Row, Col, Nav } from "react-bootstrap";
import ShopfloorInput from "./ShopfloorInput/ShopfloorInput";
import NoticesInput from "./NoticesInput/NoticesInput";
import styled from "styled-components";
import React, { useEffect, useState, useContext } from "react";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { NavLink, useLocation } from "react-router-dom";
import _ from "lodash";
import InformatorInput from "./InformatorInput/InformatorInput";
import QualityInput from "./QualityInput/QualityInput";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import DigitalizationInput from "./DigitalizationInput/DigitalizationInput";

const Body = styled.div`
    display: flex;
    flex-direction: column;
    padding: var(--s4) var(--s4);
`;

function ManualInput(props) {
    const location = useLocation();
    const [categories, setCategories] = useState([]);
    const [selectedTab, setSelectedTab] = useState(null);
    const setNavigationContext = useContext(SetNavigationContext);
    const { t } = useTranslation("manual_input");
    const { path } = useRouteMatch();
    const { state } = useContext(AuthContext);

    useEffect(() => {
        const shopfloorNav = {
            shopfloor: {
                title: "shopfloor",
                path: "/manual-input/shopfloor",
                notification: 0,
                disallowRoles: ["human_resources", "sfm"],
            },
            notices: {
                title: "notices",
                path: "/manual-input/inform",
                notification: 0,
                disallowRoles: ["human_resources", "sfm"],
            },
            informator: {
                title: "informator",
                path: "/manual-input/informator",
                notification: 0,
                disallowRoles: ["sfm"],
            },
            quality: {
                title: "quality",
                path: "/manual-input/quality",
                notification: 0,
                disallowRoles: ["sfm"],
            },
            digitalization: {
                title: "pictorial_instructions",
                path: "/manual-input/digitalization",
                notification: 0,
            },
        };
        setNavigationContext.setNavigationHandler(shopfloorNav);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setSelectedTab(categories[0]);
    }, [categories]);

    const setCategoriesHandler = (categories) => {
        setCategories(categories);
    };
    // Če je uporabnik sfm in NI D2, vedno redirect na digitalization, razen če je že tam
    if (
        state.user.role.role === "sfm" &&
        state.user.username === "D2" &&
        !location.pathname.startsWith("/manual-input/digitalization")
    ) {
        return <Redirect to='/manual-input/digitalization' />;
    }

    const sideMenu = categories.map((category) => {
        return (
            _.includes(category.allowRoles, props.user.role.role) && (
                <Nav.Item
                    key={category.label}
                    style={
                        category?.label == t("machines") || category?.label === t("flaw_codelist")
                            ? { marginLeft: "1rem" }
                            : {}
                    }
                >
                    <Nav.Link
                        as={NavLink}
                        to={category.path}
                        style={{ textDecoration: "none" }}
                        eventKey={category.label}
                    >
                        <h6 className='mb-0 text-uppercase'>{t(category.label)}</h6>
                    </Nav.Link>
                </Nav.Item>
            )
        );
    });
    //TODO - add styled-components for sidebar and content panes
    return (
        <div className='mt-3 mx-xs-0 mx-md-5'>
            <Tab.Container
                id='left-tabs-example'
                transition={false}
                onSelect={(selectedTab) => setSelectedTab(selectedTab)}
                activeKey={selectedTab}
            >
                <Row className='border no-gutters p-4'>
                    <Col xs={12} sm={12} lg={12} xl={2} className='border-lg-right pe-lg-3 py-4'>
                        <h6 className='p-1 mt-3' style={{ color: "var(--bs-secondary)" }}>
                            {t("categories")}
                        </h6>
                        <Nav variant='pills' className='flex-column'>
                            {sideMenu}
                        </Nav>
                    </Col>
                    <Col className='px-xs-4' xs={12} sm={12} lg={12} xl={10}>
                        <Body>
                            <Tab.Content>
                                <Switch>
                                    <PrivateRoute path={`${path}/shopfloor`}>
                                        <ShopfloorInput setCategories={setCategoriesHandler} />
                                    </PrivateRoute>
                                    <PrivateRoute path={`${path}/inform`}>
                                        <NoticesInput setCategories={setCategoriesHandler} />
                                    </PrivateRoute>
                                    <PrivateRoute path={`${path}/informator`}>
                                        <InformatorInput setCategories={setCategoriesHandler} />
                                    </PrivateRoute>
                                    <PrivateRoute path={`${path}/quality`}>
                                        <QualityInput setCategories={setCategoriesHandler} />
                                    </PrivateRoute>
                                    <PrivateRoute path={`${path}/digitalization`}>
                                        <DigitalizationInput setCategories={setCategoriesHandler} />
                                    </PrivateRoute>
                                    <Redirect
                                        to={
                                            state.user.role.role == "human_resources"
                                                ? "/manual-input/informator/documents"
                                                : "/manual-input/shopfloor"
                                        }
                                    />
                                </Switch>
                            </Tab.Content>
                        </Body>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
}
export default ManualInput;
