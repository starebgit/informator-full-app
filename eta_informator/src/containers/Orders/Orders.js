import { useContext, useEffect } from "react";
import { Redirect, Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { Row, Container, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import PrivateRoute from "../../routes/PrivateRoute";
import Overview from "./Overview/Overview";
import Archive from "./Archive/Archive";

const StyledRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;
const StyledContainer = styled(Container)`
    max-width: 95%;
    padding-top: 1rem;
    overflow: hidden;
    min-height: 850px;
    height: 100%;
`;

function Toolshop(props) {
    const setNavigationContext = useContext(SetNavigationContext);
    const { path } = useRouteMatch();
    const location = useLocation();
    const { t } = useTranslation("shopfloor");

    /*   const toolshopNav = {
    overview: {
      title: t("overview"),
			path: `${path}/overview`,
			notification: 0,
		},
		archive: {
      title: t("archive"),
			path: `${path}/archive`,
			notification: 0,
		},
	};
  	// * USE EFFECTS
	useEffect(() => {
		setNavigationContext.setNavigationHandler(toolshopNav);
	}, []); */

    return (
        <StyledContainer>
            <Switch>
                <Route exact path={path}>
                    <Redirect from={path} to={`${path}/overview`} />
                </Route>
                <PrivateRoute path={`${path}/overview`}>
                    <Overview />
                </PrivateRoute>
                <PrivateRoute path={`${path}/archive`}>
                    <Archive />
                </PrivateRoute>
            </Switch>
        </StyledContainer>
    );
}

export default Toolshop;
