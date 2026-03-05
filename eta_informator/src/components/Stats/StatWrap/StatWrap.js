import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import GoalBar from "../../GoalBar/GoalBar";

function StatWrap(props) {
    const { t } = useTranslation("shopfloor");

    const anyChildren = props.children.some((child) => child !== null);

    return (
        <>
            {anyChildren ? (
                <Card
                    style={{
                        width: "100%",
                        boxShadow: "var(--shadow-regular)",
                    }}
                >
                    <Card.Body>
                        <div className='d-flex'>
                            <h4
                                style={{
                                    color: "GrayText",
                                    marginRight: "12px",
                                }}
                            >
                                {<FontAwesomeIcon icon={props.icon} />}
                            </h4>
                            <h4 style={{ color: "var(--bs-primary)" }}>{t(props.title)}</h4>
                        </div>
                        {props.goalBar ? (
                            <div
                                style={{
                                    display: "flex",
                                    backgroundColor: "#F1F1F1",
                                    marginBottom: "12px",
                                    padding: "8px 8px 0px 8px",
                                    color: "gray",
                                    boxShadow: "2px 2px 8px #CCCCCC",
                                    borderRadius: "12px",
                                }}
                            >
                                <GoalBar
                                    setSelectedDate={props.setSelectedDate}
                                    char={props.char}
                                />
                            </div>
                        ) : null}
                        <Row className='gy-2 gx-2'>{props.children}</Row>
                    </Card.Body>
                </Card>
            ) : null}
        </>
    );
}

export default StatWrap;
