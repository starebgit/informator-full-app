import React, { useState } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ToggleGroup from "../../../../../components/ToggleGroup/ToggleGroup";

const Tile = styled(Card)`
    border: 0;
    box-shadow: var(--shadow-regular);
    background: rgb(243, 255, 254);
    background: linear-gradient(10deg, rgba(240, 250, 255, 1) 0%, rgba(245, 245, 245, 1) 100%);
`;

const TimeframeCard = ({ toggleButtons, name, children, ...props }) => {
    const { t } = useTranslation("shopfloor");
    const [timewindow, setTimewindow] = useState("late");
    const childrenWithProps = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { timewindow: timewindow });
        }
        return child;
    });

    return (
        <Tile body>
            <div className='mb-3 d-flex'>
                <ToggleGroup
                    buttons={toggleButtons}
                    selectedButton={timewindow}
                    onSelected={setTimewindow}
                    title={"timewindow" + name}
                />
            </div>

            <Row>
                <Col xs={12} md={12}>
                    {childrenWithProps}
                </Col>
            </Row>
        </Tile>
    );
};

export default TimeframeCard;
