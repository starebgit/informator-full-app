import styled from "styled-components";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export const Dot = styled.div`
    width: 18px;
    height: 12px;
    border-radius: 2px;
    background: ${(props) =>
        props.reached === -3
            ? "var(--bs-cyan)"
            : props.reached === -2
            ? "gray"
            : props.reached == 0
            ? "rgb(255, 124, 0)"
            : props.reached == 1
            ? "#32a659"
            : "crimson"};
    margin: 2px 2px;
`;
// #4F9D69

function GoalReachDot({ reached, label, indicator, ...props }) {
    return (
        <OverlayTrigger placement='top' overlay={<Tooltip>{label}</Tooltip>}>
            <Dot reached={reached} />
        </OverlayTrigger>
    );
}

export default GoalReachDot;
