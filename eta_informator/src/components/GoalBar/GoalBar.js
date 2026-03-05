import GoalBox from "./GoalBox";
import { Col } from "react-bootstrap";

function GoalBar(props) {
    return (
        <>
            <Col style={{ padding: "unset" }}>
                <div
                    className='d-flex justify-content-center'
                    style={{
                        fontSize: "42px",
                        fontWeight: "800",
                        width: "56px",
                    }}
                >
                    {props.char}
                </div>
            </Col>
            <Col
                style={{
                    display: "flex",
                    flexGrow: 12,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{ display: "flex", width: "100%" }}
                    className='align-items-center flex-wrap justify-content-center'
                >
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-01' status={4} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-02' status={4} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-03' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-04' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-05' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-06' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-07' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-08' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-09' status={4} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-10' status={4} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-11' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-12' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-13' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-14' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-15' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-16' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-17' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-18' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-19' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-20' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-21' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-22' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-23' status={1} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-24' status={3} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-25' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-26' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-27' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-28' status={3} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-29' status={2} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-30' status={3} />
                    <GoalBox setSelectedDate={props.setSelectedDate} date='2021-08-31' status={2} />
                </div>
            </Col>
        </>
    );
}

export default GoalBar;
