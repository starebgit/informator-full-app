import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch, useRouteMatch } from "react-router";
import { Redirect } from "react-router-dom";
import PrivateRoute from "../../../routes/PrivateRoute";
import CodelistPane from "./CodelistPane/CodelistPane";
import { qualityClient } from "../../../feathers/feathers";
import LocationPane from "./LocationPane/LocationPane";
import MachinesPane from "./MachinesPane/MachinesPane";

function QualityInput(props) {
    const { path } = useRouteMatch();
    const { t } = useTranslation("manual_input");

    qualityClient
        .service("flaw-location")
        .find()
        .then((res) => console.log(res));

    // * Sets sidebar categories

    useEffect(() => {
        const categories = [
            {
                label: t("input_location", { count: 2 }),
                path: `${path}/locations`,
                allowRoles: ["admin", "quality"],
            },
            {
                label: t("machines"),
                path: `${path}/machines`,
                allowRoles: ["admin", "quality"],
            },
            {
                label: t("flaw_codelist"),
                path: `${path}/flaw-codelist`,
                allowRoles: ["admin", "quality"],
            },
        ];
        props.setCategories(categories);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Switch>
            <PrivateRoute allowRoles={["admin", "quality"]} path={`${path}/flaw-codelist`}>
                <CodelistPane />
            </PrivateRoute>
            <PrivateRoute allowRoles={["admin", "quality"]} path={`${path}/locations`}>
                <LocationPane />
            </PrivateRoute>
            <PrivateRoute allowRoles={["admin", "quality"]} path={`${path}/machines`}>
                <MachinesPane />
            </PrivateRoute>
            <Redirect from='/manual-input/quality' to='/manual-input/quality/flaw-codelist' />
        </Switch>
    );
}

export default QualityInput;
