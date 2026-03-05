import styled from "styled-components";

const Card = styled.div`
    width: 100%;
    min-width: 318px;
    padding: 0.25rem 1rem;
    border-radius: 10px;
    box-shadow: var(--shadow-regular);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
    margin: 0.3rem 0rem;
    transition: box-shadow 0.2s ease;
    box-shadow: var(--shadow-regular);
    cursor: default;
    &:hover {
        box-shadow: var(--shadow-dark);
    }
`;
const ColorBar = styled.div`
    height: 75%;
    width: 10px;
    border-radius: 5px;
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
    margin-left: 8px;
    box-shadow: var(--shadow-regular);
`;

function GroupGoalReach({ name, unit, value, goal, indicator, reached, ...props }) {
    return (
        <Card>
            <div className='d-flex flex-column align-items-start'>
                <div style={{ fontSize: "14px" }}>{name}</div>
                <div style={{ fontSize: "12px" }}>{unit}</div>
            </div>

            <div className='d-flex' style={{ minHeight: "45px" }}>
                <div className='d-flex flex-column align-items-end'>
                    <div style={{ marginBottom: "-4px" }} className='fw-bold'>
                        {indicator == "quality"
                            ? new Intl.NumberFormat("sl", {
                                  style: "percent",
                                  minimumFractionDigits: 2,
                              }).format(value)
                            : value}
                    </div>
                    <div classnmae='text-muted'>
                        {indicator == "quality"
                            ? new Intl.NumberFormat("sl", {
                                  style: "percent",
                                  minimumFractionDigits: 2,
                              }).format(goal)
                            : goal}
                    </div>
                </div>
                <div className='d-flex justify-content-center align-items-center'>
                    <ColorBar reached={reached} />
                </div>
            </div>
        </Card>
    );
}

export default GroupGoalReach;
