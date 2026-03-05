import styled from "styled-components";
import { Row, Col } from "react-bootstrap";
import Dot from "./GoalReachDot";

//background: rgba(185, 209, 228, 0.3);
const Card = styled.div`
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 5px 20px;
    max-width: 300px;
    width: 95%;
    margin: 0.3rem 0.5rem;
    font-family: "Inter";
    transition: box-shadow 0.2s ease;
    box-shadow: var(--shadow-regular);
    cursor: default;
    &:hover {
        box-shadow: var(--shadow-dark);
    }
    @media only screen and (min-width: 720px) {
        min-width: 400px;
    }
`;

const DotWrap = styled.div`
    display: inline-grid;
    grid-auto-flow: row;
    grid-template-columns: repeat(3, 22px);
`;

function UnitGoalReach({ unit, groups, indicator, ...props }) {
    if (groups.length == 0) return null;
    return (
        <Card>
            <Row className='g-0 d-flex align-items-center'>
                <Col>
                    <div style={{ color: "#030303" }}>{unit}</div>
                </Col>
                <Col className='d-flex justify-content-end align-items-center'>
                    <div className='ms-auto'>
                        <DotWrap>
                            {groups?.map((group) => {
                                return (
                                    <Dot
                                        key={indicator + "_" + group.label}
                                        indicator={indicator}
                                        label={group.label}
                                        reached={group[indicator]}
                                    />
                                );
                            })}
                        </DotWrap>
                    </div>
                </Col>
            </Row>
        </Card>
    );
}

export default UnitGoalReach;
