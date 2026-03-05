import { Container, Tab, Row, Col, Nav } from "react-bootstrap";
import styled from "styled-components";
import Select from "react-select";
import { useTranslation } from "react-i18next";

const Body = styled.div`
    display: flex;
    flex-direction: column;
    padding: var(--s4) var(--s4);
`;

function SettingsLayout(props) {
    const { t } = useTranslation("manual_input");
    const sideMenu = props.panes.map((pane) => {
        return (
            <Nav.Item key={pane.name}>
                <Nav.Link eventKey={pane.name}>
                    <h6 className='mb-0 text-uppercase'>{t(pane.name)}</h6>
                </Nav.Link>
            </Nav.Item>
        );
    });

    const panes = props.panes.map((pane) => {
        return <Tab.Pane eventKey={pane.name}>{pane.render}</Tab.Pane>;
    });

    return (
        <Container className={"mt-3"}>
            <Tab.Container
                id='left-tabs-example'
                defaultActiveKey={props.panes ? props.panes[0].name : null}
                transition={false}
            >
                <Row className='border no-gutters p-4'>
                    <Col xs={12} sm={12} lg={3} xl={2} className='border-lg-right pe-lg-3'>
                        <Select
                            options={props.units}
                            onChange={(selected) => props.setSelectedUnit(selected)}
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary25: window
                                        .getComputedStyle(document.documentElement)
                                        .getPropertyValue("--p25"),
                                    primary50: window
                                        .getComputedStyle(document.documentElement)
                                        .getPropertyValue("--p50"),
                                    primary75: window
                                        .getComputedStyle(document.documentElement)
                                        .getPropertyValue("--p75"),
                                    primary: window
                                        .getComputedStyle(document.documentElement)
                                        .getPropertyValue("--p100"),
                                    danger: window
                                        .getComputedStyle(document.documentElement)
                                        .getPropertyValue("--danger"),
                                },
                            })}
                            defaultValue={props.selectedUnit}
                        ></Select>
                        <h6 className='p-2' style={{ color: "var(--bs-secondary)" }}>
                            {t("categories")}
                        </h6>
                        <Nav variant='pills' className='flex-column'>
                            {sideMenu}
                        </Nav>
                    </Col>
                    <Col xs={12} sm={12} lg={9} xl={10}>
                        <Body>
                            <Tab.Content>{panes}</Tab.Content>
                        </Body>
                    </Col>
                </Row>
            </Tab.Container>
        </Container>
    );
}

export default SettingsLayout;
