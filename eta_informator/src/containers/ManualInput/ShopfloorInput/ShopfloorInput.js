import React, { useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Switch, useRouteMatch, Redirect } from "react-router";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { getMachineGroups } from "../../../data/API/Informator/InformatorAPI";
import _ from "lodash";
import PrivateRoute from "../../../routes/PrivateRoute";
import AttachmentsPane from "./AttachmentsPane/AttachmentsPane";
import GoalsPane from "./GoalsPane/GoalsPane";
import GroupsPane from "./GroupsPane/GroupsPane";
import SafetyPane from "./SafetyPane/SafetyPane";
import DistributionPane from "./DistributionPane/DistributionPane";
import ConditionsPane from "./ConditionsPane/ConditionsPane";

function ShopfloorInput(props) {
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
                label: "goals",
                path: `${path}/goals`,
                allowRoles: ["head_of_work_unit", "process_leader", "cip", "admin"],
            },
            {
                label: "attachments",
                path: `${path}/attachments`,
                allowRoles: [
                    "head_of_work_unit",
                    "cip",
                    "process_leader",
                    "admin",
                    "quality",
                    "security_officer",
                ],
            },
            {
                label: "safety",
                path: `${path}/safety`,
                allowRoles: [
                    "foreman",
                    "cip",
                    "admin",
                    "process_leader",
                    "head_of_work_unit",
                    "security_officer",
                ],
            },
            {
                label: "groups",
                path: `${path}/groups`,
                allowRoles: ["admin", "cip"],
            },
            {
                label: "conditions",
                path: `${path}/conditions`,
                allowRoles: ["admin"],
            },
            {
                label: "worker_distribution",
                path: `${path}/distribution`,
                allowRoles: ["admin", "foreman", "process_leader"],
            },
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
                    allowRoles={["head_of_work_unit", "process_leader", "cip", "admin"]}
                    path={path + "/goals"}
                >
                    <GoalsPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        machineGroups={machineGroupsData}
                        units={unitsLabels}
                    />
                </PrivateRoute>
                <PrivateRoute
                    allowRoles={[
                        "cip",
                        "process_leader",
                        "admin",
                        "quality",
                        "head_of_work_unit",
                        "security_officer",
                    ]}
                    path={path + "/attachments"}
                >
                    <AttachmentsPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        units={unitsLabels}
                    />
                </PrivateRoute>
                <PrivateRoute
                    allowRoles={[
                        "foreman",
                        "cip",
                        "admin",
                        "process_leader",
                        "head_of_work_unit",
                        "quality",
                        "security_officer",
                    ]}
                    path={path + "/safety"}
                >
                    <SafetyPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        units={unitsLabels}
                    />
                </PrivateRoute>
                <PrivateRoute allowRoles={["admin", "cip"]} path={path + "/groups"}>
                    <GroupsPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        machineGroups={machineGroupsData}
                        units={unitsLabels}
                    />
                </PrivateRoute>
                <PrivateRoute
                    allowRoles={["admin", "foreman", "process_leader"]}
                    path={path + "/distribution"}
                >
                    <DistributionPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        machineGroups={machineGroupsData}
                        units={unitsLabels}
                    />
                </PrivateRoute>

                <PrivateRoute allowRoles={["admin"]} path={path + "/conditions"}>
                    <ConditionsPane
                        selectedUnit={selectedUnit}
                        setSelectedUnit={setSelectedUnit}
                        machineGroups={machineGroupsData}
                        units={unitsLabels}
                    />
                </PrivateRoute>

                <Redirect
                    from='/manual-input/shopfloor'
                    to={
                        state.user.role.role == "foreman" ||
                        state.user.role.role == "security_officer"
                            ? "/manual-input/shopfloor/safety"
                            : state.user.role.role == "quality"
                            ? "/manual-input/shopfloor/documents"
                            : "/manual-input/shopfloor/goals"
                    }
                />
            </Switch>
        </>
    );
}

export default ShopfloorInput;
