import React, { useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Switch, useRouteMatch, Redirect } from "react-router";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { getMachineGroups } from "../../../data/API/Informator/InformatorAPI";
import _ from "lodash";
import PrivateRoute from "../../../routes/PrivateRoute";
import DigitalizationPane from "./DigitalizationPane/DigitalizationPane";

function DigitalizationInput(props) {
    const { path } = useRouteMatch();
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    // * Sets sidebar categories
    useEffect(() => {
        const categories = [
            {
                label: "pictorial_instructions",
                path: `${path}/`,
                allowRoles: ["admin", "quality", "head_of_work_unit", "process_leader", "sfm"],
            },
        ];
        props.setCategories(categories);
    }, []);

    const {
        data: machineGroupsData,
        isError: machineGroupsError,
        isLoading: machineGroupsLoading,
    } = useQuery(["machineGroups", "all"], async () => getMachineGroups());

    return (
        <>
            <Switch>
                <PrivateRoute
                    allowRoles={["admin", "head_of_work_unit", "quality", "process_leader", "sfm"]}
                    path={path + "/"}
                >
                    <DigitalizationPane machineGroups={machineGroupsData} units={unitsLabels} />
                </PrivateRoute>
                <Redirect from='/manual-input/' to='/manual-input/digitalization' />
            </Switch>
        </>
    );
}

export default DigitalizationInput;
