import React, { useEffect, useMemo, useReducer } from "react";
import Layout from "./components/Layout/Layout";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "simplebar/dist/simplebar.min.css";
import "./App.scss";
import { Route, Switch, Redirect, useHistory } from "react-router-dom";
import ShopFloor from "./containers/Shopfloor/Shopfloor";
import Documentation from "./containers/Documentation/Documentation";
import client from "./feathers/feathers";
import ManualInput from "./containers/ManualInput/ManualInput";
import Settings from "./containers/Settings/Settings";
import { AuthContext } from "./context/AuthContext/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import { ReactQueryDevtools } from "react-query/devtools";
import ClipLoader from "react-spinners/ClipLoader";
import { Col, Row, Container } from "react-bootstrap";
import {
    useKeywordsLabels,
    useRolesLabels,
    useSettings,
    useTypesLabels,
    useSubunitsLabels,
    useUnitsLabels,
} from "./data/ReactQuery";
import i18n from "./i18n/i18n";
import Maintenance from "./containers/Maintenance/Maintenance";
import ScrollButton from "./components/ScrollButton/ScrollButton";
import Entrance from "./containers/Entrance/Entrance";
import DataDownload from "./containers/DataDownload/DataDownload";
import Dashboard from "./containers/Dashboard/Dashboard";
import NoPage from "./components/NoPage/NoPage";
import Toolshop from "./containers/Orders/Orders";
import dayjs from "dayjs";
import Guidelines from "./containers/Guidelines/Guidelines";
import QualityAssurance from "./containers/QualityAssurance/QualityAssurance";
import InfoPoint from "./containers/Infopoint/Infopoint";
import { ToastProvider } from "./context/ToastContext/ToastContext";
import Toast from "./components/Toast/Toast";

// Solid Font awesome icons added to library
library.add(fas);

const initialAuthState = {
    isAuth: null,
    user: null,
    token: null,
    settings: [],
};

const reducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            return {
                ...state,
                isAuth: true,
                user: action.payload.user,
                token: action.payload.accessToken,
            };
        case "LOGOUT":
            return {
                ...state,
                isAuth: false,
                user: null,
                token: null,
                settings: null,
            };
        case "USER-SETTINGS":
            return {
                ...state,
                settings: action.payload,
            };
        case "CHANGE-SETTING":
            /* const newSettings = state.settings.map((setting) => {
        if (setting.id !== action.payload.id) return setting;
        return { ...setting, value: action.payload.value };
      }); */
            const newSettings = {
                [action.payload.setting]: action.payload.value,
                ...state.settings,
            };
            return {
                ...state,
                settings: newSettings,
            };

        default:
            return state;
    }
};

function App() {
    const [state, dispatch] = useReducer(reducer, initialAuthState);
    const userSettings = useSettings(state?.user?.id, {
        staleTime: Infinity,
    });
    const subunitsLabels = useSubunitsLabels({ staleTime: Infinity });
    const history = useHistory();
    const unitsLabels = useUnitsLabels({
        staleTime: Infinity,
        enabled: !!state.isAuth,
    });
    const typesLabels = useTypesLabels({
        staleTime: Infinity,
        enabled: !!state.isAuth,
    });
    const keywordsLabels = useKeywordsLabels({
        staleTime: Infinity,
        enabled: !!state.isAuth,
    });
    const rolesLabels = useRolesLabels({
        staleTime: Infinity,
        enabled: !!state.isAuth,
    });

    useEffect(() => {
        /* setInterval(() => {
            const now = dayjs();
            // Preusmeri samo, če ima uporabnik role "sfm"
            if (
                state?.user?.role?.role === "sfm" &&
                (
                    (now.hour() === 5 && now.minute() === 45) ||
                    (now.hour() === 11 && now.minute() === 58)
                )
            ) {
                history.push("/shopfloor/default/distribution");
            }
        }, 60000);*/

        client
            .reAuthenticate()
            .then((response) => {
                client
                    .service("user-settings")
                    .find({ query: { merged: true, id: response.user.id } })
                    .then((settingsRes) => {
                        dispatch({ type: "LOGIN", payload: response });
                    });
            })
            .catch(() => {
                dispatch({
                    type: "LOGOUT",
                });
            });
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
    }, []);

    useEffect(() => {
        if (!!userSettings) i18n.changeLanguage(userSettings?.data?.language?.value);
    }, [userSettings]);

    useEffect(() => {
        if (
            state.isAuth &&
            state.user &&
            state.user.role?.role === "sfm" &&
            state.user.username !== "livarna"
        ) {
            const intervalId = setInterval(() => {
                const now = dayjs();
                if (
                    (now.hour() === 5 && now.minute() === 45) ||
                    (now.hour() === 13 && now.minute() === 45)
                ) {
                    history.push("/shopfloor/default/distribution");
                }
            }, 60000);

            // Počisti interval ob unmountu ali spremembi userja
            return () => clearInterval(intervalId);
        }
    }, [state.isAuth, state.user, history]);

    const contextValue = useMemo(() => {
        return { state, dispatch };
    }, [state, dispatch]);

    if (state.isAuth === null || userSettings.isLoading || subunitsLabels.isLoading)
        return (
            <Container
                fluid
                className='d-flex align-items-center justify-content-center'
                style={{ minHeight: "100vh" }}
            >
                <Row>
                    <Col>
                        <ClipLoader loading={state.isAuth === null} size={150} />
                    </Col>
                </Row>
            </Container>
        );

    if (userSettings.isSuccess || state.isAuth !== null) {
        return (
            <AuthContext.Provider value={contextValue}>
                <ToastProvider>
                    <Switch>
                        <Route path={"/login"}>
                            <Entrance />
                        </Route>
                        <Route
                            path={[
                                "/infopoint",
                                "/infopoint/*",
                                "/guidelines",
                                "/guidelines/*",
                                "/settings",
                            ]}
                        >
                            <Layout>
                                <Switch>
                                    <Route path='/infopoint'>
                                        <InfoPoint />
                                    </Route>
                                    <Route path='/guidelines'>
                                        <Guidelines />
                                    </Route>
                                    <Route path='/settings'>
                                        <Settings />
                                    </Route>
                                </Switch>
                            </Layout>
                        </Route>
                        <PrivateRoute
                            exact
                            path={[
                                "/",
                                "/documentation",
                                "/documentation/*",
                                "/shopfloor",
                                "/shopfloor/*",
                                "/manual-input",
                                "/manual-input/*",
                                "/maintenance",
                                "/maintenance/*",
                                "/data-download",
                                "/dashboard",
                                "/dashboard/*",
                                "/toolshop",
                                "/toolshop/*",
                                "/guidelines",
                                "/quality-assurance",
                                "/quality-assurance/*",
                                "/infopoint",
                                "/infopoint/*",
                            ]}
                        >
                            <Layout>
                                <Switch>
                                    <PrivateRoute exact path='/'>
                                        {state?.user?.role?.role == "human_resources" ? (
                                            <Redirect to='/dashboard' />
                                        ) : (
                                            <Redirect to='/shopfloor' />
                                        )}
                                    </PrivateRoute>
                                    <PrivateRoute path='/documentation'>
                                        <Documentation />
                                    </PrivateRoute>
                                    <PrivateRoute path='/shopfloor'>
                                        <ShopFloor />
                                    </PrivateRoute>
                                    <PrivateRoute path='/dashboard'>
                                        <Dashboard />
                                    </PrivateRoute>
                                    <PrivateRoute
                                        path='/manual-input'
                                        allowRoles={[
                                            "foreman",
                                            "process_leader",
                                            "head_of_work_unit",
                                            "cip",
                                            "admin",
                                            "quality",
                                            "human_resources",
                                            "security_officer",
                                            ...(state?.user?.role?.role === "sfm" &&
                                            state?.user?.username === "D2"
                                                ? ["sfm"]
                                                : []),
                                        ]}
                                    >
                                        <ManualInput user={state?.user} />
                                    </PrivateRoute>
                                    <PrivateRoute path='/maintenance'>
                                        <Maintenance />
                                    </PrivateRoute>
                                    <PrivateRoute path='/data-download'>
                                        <DataDownload />
                                    </PrivateRoute>
                                    <PrivateRoute path='/quality-assurance'>
                                        <QualityAssurance />
                                    </PrivateRoute>
                                </Switch>
                            </Layout>
                        </PrivateRoute>
                        <Route path='*'>
                            <NoPage />
                        </Route>
                    </Switch>
                    <ReactQueryDevtools initialIsOpen={false} />
                    <ScrollButton />
                    <Toast />
                </ToastProvider>
            </AuthContext.Provider>
        );
    }
}

export default App;
