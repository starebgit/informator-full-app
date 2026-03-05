import { useContext, useEffect, useMemo, useState } from "react";
import { Col, Collapse, Container, Row } from "react-bootstrap";
import BfLogo from "../../assets/images/b&f_logo.png";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";

const GuidelineMark = styled.div`
    height: 3rem;
    min-width: 3rem;
    background-color: ${(props) => props.color};
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    color: white;
    margin: 0rem 1rem 0rem 0rem;
`;

const GuidelinesCard = styled.div`
    border-radius: 1rem;
    background-color: #fcfcfc;
    box-shadow: var(--shadow-regular);
    width: 100%;
`;

const guidelinesText = [
    "act_as_role_models",
    "take_responsibility_and_set_goals",
    "environment_of_trust",
    "constructive_feedback",
    "drive_change",
    "learn_from_mistakes",
    "support_diversity_and_integration",
    "think_and_act_holistic",
];

const colors = [
    "#5A7181",
    "#F26363",
    "#5D98A6",
    "#8C7549",
    "#A2A2A2",
    "#595456",
    "#2C4A60",
    "#CABD9F",
];

const Collapser = styled(Collapse)`
    transition: height 280ms cubic-bezier(0.4, 0, 0.2, 1);
`;

function Guidelines(props) {
    const [selected, setSelected] = useState(0);
    const { t } = useTranslation("guidelines");
    const setNavigationContext = useContext(SetNavigationContext);
    const guidelines = useMemo(() => {
        return guidelinesText.map((guideline, i) => {
            return (
                <div key={guideline}>
                    <div className='d-flex align-items-center justify-content-start my-2'>
                        <GuidelineMark color={colors[i % guidelinesText.length]}>
                            {i + 1}
                        </GuidelineMark>
                        <h5 className='mb-0'>{t(guideline)}</h5>
                    </div>
                    <Collapser in={true} appear={true}>
                        <div>{t(guideline + "_desc")}</div>
                    </Collapser>
                </div>
            );
        });
    }, [t]);

    useEffect(() => {
        setNavigationContext.setNavigationHandler({});
        const interval = setInterval(() => {
            setSelected((selected) => {
                const i = selected + 1;
                return i % guidelinesText.length;
            });
        }, 15000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <Container fluid>
            <Row className='justify-content-center'>
                <Col xs={12} md={9}>
                    <div className='d-flex flex-column justify-content-center align-items-center mt-5'>
                        <div className='d-flex align-items-center'>
                            <h3 className='mb-0'>{t("b&f_guidelines")}</h3>
                            <img className='ms-5' height='80px' src={BfLogo}></img>
                        </div>
                        <GuidelinesCard className='mt-2 mt-sm-4 p-2 p-sm-5'>
                            {guidelines}
                        </GuidelinesCard>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default Guidelines;
