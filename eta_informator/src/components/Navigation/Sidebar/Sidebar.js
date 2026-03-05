import React, { useContext, useEffect, useState } from "react";
import Header from "./SidebarHeader/Header";
import Footer from "./SidebarFooter/SidebarFooter";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import Clock from "react-clock";
import dayjs from "dayjs";
import { useRouteMatch } from "react-router-dom";

const StyledNav = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledNavLink = styled(NavLink)`
    width: 100%;
    padding: var(--s4) var(--s3);
    border-left: 3px solid transparent;

    &:hover {
        background-color: #314659;
    }

    &.active {
        border-left: 3px solid var(--bs-red);
    }
`;

const SidebarDiv = styled.div`
    width: ${(props) => (props.mobile ? "100%" : "290px")};
    position: ${(props) => (props.mobile ? "inherit" : "fixed")};
    color: white;
    top: 0;
    left: 0;
    display: flex;
    height: ${(props) => (props.mobile ? "100%" : "100vh")};
    flex-direction: column;
    z-index: 200;
    background-color: var(--bs-primary);
    transition: var(--transition);
    font-size: var(--body);
    margin-left: ${(props) => (props.active ? "-290px" : null)};
    overflow: auto;

    & span,
    svg {
        color: white;
    }

    & a {
        text-decoration: none !important;
    }

    & a:hover {
        color: gray;
    }

    @media only screen and (max-width: 576px) {
        width: ${(props) => (props.active ? "0%" : "100%")};
    }
`;

const StyledExternalLink = styled.a`
    width: 100%;
    padding: var(--s4) var(--s3);
    display: flex;
    align-items: center;
    text-decoration: none;
    margin-top: auto;

    &:hover {
        background-color: #314659;
    }
`;

function Sidebar({ mobile, setShowSidebar, ...props }) {
    const [value, setValue] = useState(new Date());
    const { t } = useTranslation(["navigation", "labels"]);
    const authContext = useContext(AuthContext);

    useEffect(() => {
        const interval = setInterval(() => setValue(new Date()), 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const documentationNav = checkRole(authContext.state.user, ["human_resources"], true) && (
        <StyledNavLink to='/documentation' onClick={mobile ? () => setShowSidebar(false) : null}>
            <FontAwesomeIcon icon='search' pull='left' size='lg' fixedWidth />
            <span>{t("documentation")}</span>
        </StyledNavLink>
    );

    const shopfloorNav = checkRole(authContext.state.user, ["human_resources"], true) && (
        <StyledNavLink to='/shopfloor' onClick={mobile ? () => setShowSidebar(false) : null}>
            <FontAwesomeIcon icon='calendar-day' size='lg' pull='left' fixedWidth />
            <span>{t("shopfloor")}</span>
        </StyledNavLink>
    );
    const manualInputNav =
        checkRole(authContext.state.user, ["sfm"], true) ||
        authContext.state.user?.username === "D2" ? (
            <StyledNavLink
                style={{ marginTop: "auto" }}
                to='/manual-input'
                onClick={mobile ? () => setShowSidebar(false) : null}
            >
                <FontAwesomeIcon icon='hand-point-up' size='lg' pull='left' fixedWidth />
                <span>{t("manual_input")}</span>
            </StyledNavLink>
        ) : null;

    const dataDownloadNav = checkRole(authContext.state.user, [
        "sfm",
        "toolshop",
        "human_resources",
    ]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/data-download'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='download' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("download")}</span>{" "}
        </StyledNavLink>
    );

    const trendsNav = checkRole(authContext.state.user, ["sfm", "foreman", "human_resources"]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/trends'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='chart-line' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("trends")}</span>{" "}
        </StyledNavLink>
    );

    const toolshopNav = checkRole(authContext.state.user, [
        "admin",
        "head_of_work_unit",
        "toolshop",
    ]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/toolshop'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='industry' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("toolshop")}</span>{" "}
        </StyledNavLink>
    );

    const dashboardNav = checkRole(authContext.state.user, [
        "admin",
        "head_of_work_unit",
        "human_resources",
        "cip",
    ]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/dashboard'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='tv' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("dashboard_nav")}</span>{" "}
        </StyledNavLink>
    );

    const guidelinesNav = (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/guidelines'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='clipboard-list' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("guidelines")}</span>{" "}
        </StyledNavLink>
    );
    const qaNav = checkRole(authContext.state.user, ["admin", "quality", "head_of_work_unit"]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/quality-assurance'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            {" "}
            <FontAwesomeIcon icon='certificate' size='lg' pull='left' fixedWidth />{" "}
            <span>{t("quality_service")}</span>{" "}
        </StyledNavLink>
    );

    const infopointNav = (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/infopoint'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            <FontAwesomeIcon icon='info' size='lg' pull='left' fixedWidth />
            <span>{t("infopoint")}</span>
        </StyledNavLink>
    );

    const match = useRouteMatch("/shopfloor/:unit");
    const selectedUnit = match?.params?.unit;

    const emergencyNav = checkRole(authContext.state.user, ["human_resources"], true) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to={`/shopfloor/${selectedUnit}/safety?tab=emergency`}
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            <FontAwesomeIcon icon='exclamation-triangle' size='lg' pull='left' fixedWidth />
            <span>{t("emergency")}</span>
        </StyledNavLink>
    );

    const sharePointNav = checkRole(authContext.state.user, [
        "admin",
        "quality",
        "sfm",
        "foreman",
        "process_leader",
        "head_of_work_unit",
        "security_officer",
    ]) && (
        <StyledExternalLink
            href='https://blancfischer.sharepoint.com/sites/QRQC'
            target='_blank'
            rel='noopener noreferrer'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            <FontAwesomeIcon icon='link' size='lg' pull='left' fixedWidth />
            <span>{t("corrective_actions")}</span>
        </StyledExternalLink>
    );

    const maintenanceNav = checkRole(authContext.state.user, [
        "admin",
        "sfm",
        "foreman",
        "process_leader",
        "head_of_work_unit",
        "cip",
        "quality",
        "toolshop",
    ]) && (
        <StyledNavLink
            style={{ marginTop: "auto" }}
            to='/maintenance'
            onClick={mobile ? () => setShowSidebar(false) : null}
        >
            <FontAwesomeIcon icon='tools' size='lg' pull='left' fixedWidth />
            <span>{t("maintenance")}</span>
        </StyledNavLink>
    );

    return (
        <SidebarDiv active={props.showSidebar} mobile={mobile}>
            <Header setShowSidebar={setShowSidebar} />
            <StyledNav className='flex-column'>
                {shopfloorNav}
                {dashboardNav}
                {documentationNav}
                {dataDownloadNav}
                {manualInputNav}
                {/*{guidelinesNav}*/}
                {qaNav}
                {infopointNav}
                {emergencyNav}
                {sharePointNav}
                {maintenanceNav}
            </StyledNav>

            <div className='h-100 d-flex flex-column align-items-center justify-content-end'>
                <Clock value={value} />
                <h6 style={{ color: "lightgray", marginTop: "1em" }}>
                    {dayjs(value).format("LLL")}
                </h6>
                <h6 style={{ color: "lightgray" }}>{`${dayjs(value).format("dddd, W")}. ${t(
                    "labels:week",
                )}`}</h6>
            </div>
            <Footer mobile={mobile} setShowSidebar={setShowSidebar} />
        </SidebarDiv>
    );
}

export default React.memo(Sidebar);

function checkRole(user, roles, reverted = false) {
    if (!user) return false;
    if (reverted) return !roles.includes(user.role.role);
    return roles.includes(user.role.role);
}
