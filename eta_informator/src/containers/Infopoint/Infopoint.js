import { useContext } from "react";
import { StyledContainer } from "../../components/Layout/StyledContainer";
import Hub from "./Hub/Hub";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { useEffect } from "react";
import { Redirect, Switch, useRouteMatch, withRouter, Route } from "react-router-dom";
import PrivateRoute from "../../routes/PrivateRoute";
import Forms from "./Forms/Forms";

const InfoPoint = ({ ...props }) => {
    const { path, url } = useRouteMatch();
    const setNavigationContext = useContext(SetNavigationContext);

    const infopointNav = {
        hub: { title: "documents", path: `${path}/hub`, notification: 0 },
        forms: { title: "forms", path: `${path}/forms`, notification: 0 },
        //rewo: {title: 'rewo', path: `${path}/rewo`, notification: 0 }
    };

    useEffect(() => {
        setNavigationContext.setNavigationHandler(infopointNav);
    }, []);

    return (
        <StyledContainer>
            <Switch>
                <Route exact path='/infopoint/hub'>
                    <Hub />
                </Route>
                <Route path='/infopoint/forms'>
                    <Forms />
                </Route>
            </Switch>
            <Redirect to='/infopoint/hub' />
        </StyledContainer>
    );
};

export default InfoPoint;
