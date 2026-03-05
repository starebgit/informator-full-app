import { AuthContext } from "../context/AuthContext/AuthContext";
import React, { useContext } from "react";
import { Redirect, Route } from "react-router";
import _ from "lodash";

function PrivateRoute({
    children,
    allowRoles = [
        "sfm",
        "editor",
        "admin",
        "foreman",
        "process_leader",
        "head_of_work_unit",
        "cip",
        "quality",
        "toolshop",
        "human_resources",
        "security_officer",
    ],
    ...rest
}) {
    const authContext = useContext(AuthContext);
    const { isAuth } = authContext?.state;
    let role = null;
    if (isAuth) {
        role = authContext.state.user.role.role;
    }
    return (
        <Route
            {...rest}
            render={({ location }) =>
                isAuth ? (
                    _.includes(allowRoles, role) ? (
                        children
                    ) : (
                        <Redirect
                            to={{
                                pathname: "/shopfloor",
                                state: { from: location },
                            }}
                        />
                    )
                ) : (
                    <Redirect to={{ pathname: "/login", state: { from: location } }} />
                )
            }
        />
    );
}
export default PrivateRoute;
