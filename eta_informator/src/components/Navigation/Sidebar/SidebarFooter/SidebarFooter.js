import styled from "styled-components";
import React, { useContext } from "react";
import "react-datepicker/dist/react-datepicker.css";
import UserInfo from "./UserInfo/UserInfo";
import IconBar from "./IconBar/IconBar";
import client from "../../../../feathers/feathers";
import { useHistory, useLocation } from "react-router";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useTranslation } from "react-i18next";

const StyledFooter = styled.div`
    display: flex;
    flex-direction: column;
    position: block;
    justify-content: center;
    margin-top: auto;
    text-align: center;
`;

const StyledBottomRow = styled.div`
    display: flex;
    width: 100%;
    align-content: center;
    padding: 0px var(--s3);
    padding-bottom: var(--s4);
`;

function SidebarFooter(props) {
    const authContext = useContext(AuthContext);
    const history = useHistory();
    const location = useLocation();
    const { t } = useTranslation("labels");
    const { isAuth } = authContext?.state;
    const logoutHandler = () => {
        client.logout();
        authContext.dispatch({ type: "LOGOUT" });
        history.push({
            pathname: "/login",
            state: { from: location },
        });
    };
    const username = authContext.state
        ? isAuth
            ? authContext.state.user.name
                ? authContext.state.user.name + " " + authContext.state.user.lastname
                : authContext.state.user.username
            : t("guest")
        : null;
    const role = authContext.state ? (isAuth ? authContext.state.user.role.role : null) : null;
    return (
        <StyledFooter>
            <StyledBottomRow>
                <UserInfo user={username} role={t(role)}></UserInfo>
                <IconBar isAuth={isAuth} logoutHandler={logoutHandler} />
            </StyledBottomRow>
        </StyledFooter>
    );
}

export default SidebarFooter;
