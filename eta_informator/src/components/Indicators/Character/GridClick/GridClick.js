import { Row, Col } from "react-bootstrap";
import Box from "./Box/Box";
import _ from "lodash";
import { useState } from "react";

const days = ["P", "T", "S", "Č", "P", "S", "N"];
function GridClick({ maxId, setMaxId, setColor, x, y, defaultValues, ...props }) {
    const a = [...Array(y + 1)].map((e, i) => {
        return (
            <Row
                className='g-0'
                style={{ minHeight: "40px", minWidth: "200px" }}
                xs={x}
                sm={x}
                key={i}
            >
                {[...Array(x)].map((e, j) => {
                    return (
                        <Col>
                            {i == 0 ? (
                                <div className='d-flex h-100 justify-content-center align-items-center'>
                                    {days[j]}
                                </div>
                            ) : (
                                <Box
                                    setMaxId={setMaxId}
                                    maxId={maxId}
                                    defaultValue={
                                        defaultValues ? defaultValues[(i - 1) * x + j] : null
                                    }
                                    setColor={setColor}
                                    id={(i - 1) * x + j}
                                />
                            )}
                        </Col>
                    );
                })}
            </Row>
        );
    });

    return <>{a}</>;
}

export default GridClick;
