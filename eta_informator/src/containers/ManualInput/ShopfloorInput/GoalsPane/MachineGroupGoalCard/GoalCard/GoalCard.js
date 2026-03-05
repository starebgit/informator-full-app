import { Col } from "react-bootstrap";
import styled from "styled-components";

const Goal = styled.div`
    display: flex;
    padding: var(--s4) var(--s2);
    background-color: var(--bs-cyan);
    justify-content: space-between;
    color: white;
    border-radius: 2px;
`;

const Item = styled(Col)``;

const columns = [
    {
        name: "start_date",
        selector: "startDate",
    },
    {
        name: "end_date",
        selector: "endDate",
    },
    {
        name: "realization_goal",
        selector: "realizationGoal",
    },
    {
        name: "quality_goal",
        selector: "qualityGoal",
    },
    {
        name: "dodal",
        selector: "userId",
    },
];

function GoalCard({ goal, ...props }) {
    return (
        <Goal>
            <div>{goal.startDate + " - " + goal.endDate}</div>
            <div>{goal.realizationGoal}</div>
            <div>{goal.qualityGoal}</div>
            <div>{goal.userId}</div>
        </Goal>
    );
}
export default GoalCard;
