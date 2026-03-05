import Logo from "../../components/Logo/Logo";
import Change from "./Change/Change";
import Activate from "./Activate/Activate";
import Reset from "./Reset/Reset";
import styled from "styled-components";
import { Switch } from "react-router";
import { Route, useRouteMatch } from "react-router-dom";
import Login from "./Login/Login";
import { Container, Row, Col, Badge } from "react-bootstrap";
import PrivateRoute from "../../routes/PrivateRoute";

function Entrance(props) {
    const { path } = useRouteMatch();
    return (
        <>
            <div
                className='d-flex align-items-center'
                style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    padding: "12px",
                }}
            >
                <Badge bg='warning'>{process.env.REACT_APP_MODE}</Badge>
                <Logo height={64} />
            </div>

            <Container className='vh-100'>
                <Row className='vh-100'>
                    <Col className='d-flex justify-content-center align-items-center'>
                        <Switch>
                            <PrivateRoute exact path={`${path}/change`}>
                                <Change />
                            </PrivateRoute>
                            <Route path={[`${path}/activate/:token`]}>
                                <Activate />
                            </Route>
                            <Route exact path={[`${path}/reset`, `${path}/reset/:token`]}>
                                <Reset />
                            </Route>
                            <Route>
                                <Login />
                            </Route>
                        </Switch>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default Entrance;
