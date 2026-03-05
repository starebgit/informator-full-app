import dayjs from "dayjs";
import styled from "styled-components";

/*
    Status:
        0 - Weekend
        1 - No goal
        2 - Not reached
        3 - Partially
        4 - Reached
        5 - Future 
*/

const ColorBox = styled.div`
    background-color: ${(props) => {
        return props.status == 0
            ? "gray"
            : props.status == 1
            ? "var(--bs-cyan)"
            : props.status == 2
            ? "rgba(251, 0, 34, 0.9)"
            : props.status == 3
            ? "rgba(255, 206, 0, 1)"
            : props.status == 4
            ? "rgba(4, 170, 56, 1)"
            : props.status == 5
            ? "rgba(4, 170, 56, 1)"
            : "gray";
    }};
`;

function GoalBox(props) {
    const date = dayjs(props.date);
    const day = date.date();
    const status = date.day() == 5 || date.day() == 6 ? 0 : props.status;
    return (
        <div
            className='mx-1 '
            style={{ flex: 1, minWidth: "32px", maxWidth: "32px" }}
            onClick={() => props.setSelectedDate(date.toDate())}
        >
            <div className='d-flex flex-column align-items-center'>
                <ColorBox status={status} style={{ width: "100%", minHeight: "20px" }} />
                <div style={{ fontWeight: 700 }}>{day}</div>
            </div>
        </div>
    );
}

export default GoalBox;
