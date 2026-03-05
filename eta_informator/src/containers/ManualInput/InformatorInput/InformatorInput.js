import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch, useRouteMatch } from "react-router";
import { Redirect } from "react-router-dom";
import PrivateRoute from "../../../routes/PrivateRoute";
import UsersPane from "./UsersPane/UsersPane";
import DocumentsPane from "./DocumentsPane/DocumentsPane";

function InformatorInput({ setCategories, ...props }) {
    const { path } = useRouteMatch();
    const { t } = useTranslation("manual_input");

    // * Sets sidebar categories

    useEffect(() => {
        const categories = [
            { label: t("users"), path: `${path}/users`, allowRoles: ["admin"] },
            {
                label: t("documents"),
                path: `${path}/documents`,
                allowRoles: ["admin", "cip", "human_resources", "quality"],
            },
        ];
        setCategories(categories);
    }, []);

    return (
        <Switch>
            <PrivateRoute path={`${path}/users`} allowRoles={["admin"]}>
                <UsersPane />
            </PrivateRoute>
            <PrivateRoute
                path={`${path}/documents`}
                allowRoles={["admin", "cip", "human_resources", "quality"]}
            >
                <DocumentsPane />
            </PrivateRoute>
            <Redirect from='/manual-input/informator' to='/manual-input/informator/documents' />
        </Switch>
    );
}

export default InformatorInput;
