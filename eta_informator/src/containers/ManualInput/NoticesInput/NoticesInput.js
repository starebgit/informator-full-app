import React, { useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "react-query";

import { Switch, useRouteMatch, Redirect } from "react-router";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { getMachineGroups } from "../../../data/API/Informator/InformatorAPI";
import _ from "lodash";
import PrivateRoute from "../../../routes/PrivateRoute";
import NoticesPane from "./NoticesPane/NoticesPane";

function NoticesInput(props) {
    const { path } = useRouteMatch();
    const { state } = useContext(AuthContext);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const queryClient = useQueryClient();

    const settings = queryClient.getQueryData(["userSettings", state?.user?.id]);
    const unitsLabels = queryClient.getQueryData("unitsLabels");

    const findSubunitByKeyword = (units, keyword) => {
        let subunit;
        _.forEach(units, (unit) => {
            subunit = _.find(unit.options, ["keyword", keyword]);
            return _.isUndefined(subunit);
        });
        return subunit;
    };

    // * Sets sidebar categories
    useEffect(() => {
        const categories = [
            {
                label: "notices",
                path: `${path}/notices`,
                allowRoles: ["admin", "quality", "head_of_work_unit", "security_officer"],
            },
            { label: "catalog", path: `${path}/catalog` },
            { label: "rewo", path: `${path}/rewo` },
            { label: "notifications", path: `${path}/notifications` },
        ];
        props.setCategories(categories);
        if (selectedUnit === null) {
            const label = findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            setSelectedUnit(label);
        }
    }, []);

    const {
        data: machineGroupsData,
        isError: machineGroupsError,
        isLoading: machineGroupsLoading,
    } = useQuery(
        ["machineGroups", selectedUnit?.subunitId],
        async () => getMachineGroups(selectedUnit?.subunitId),
        {
            enabled: !!selectedUnit?.subunitId,
        },
    );

    if (!selectedUnit?.subunitId) return null;

    return (
        <>
            <Switch>
                <PrivateRoute
                    allowRoles={["admin", "head_of_work_unit", "quality", "security_officer"]}
                    path={path + "/notices"}
                >
                    <NoticesPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        machineGroups={machineGroupsData}
                        units={unitsLabels}
                    />
                </PrivateRoute>
                {/* <PrivateRoute path={path + "/catalog"}>
					<NoticesPaneForm />
				</PrivateRoute>
				<PrivateRoute path={path + "/rewo"}>
					<h2>rewo</h2>
				</PrivateRoute>
				<PrivateRoute path={path + '/notifications'}>
					<h2>notifications</h2>
				</PrivateRoute> */}
                <Redirect from='/manual-input/inform' to='/manual-input/inform/notices' />
            </Switch>
        </>
    );
}

export default NoticesInput;
