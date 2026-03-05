import React, { useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Switch, useRouteMatch, Redirect } from "react-router";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { getMachineGroups } from "../../../data/API/Informator/InformatorAPI";
import _ from "lodash";
import PrivateRoute from "../../../routes/PrivateRoute";
import VideoInstructionsPane from "./VideoInstructionsPane/VideoInstructionsPane";

function VideoInstructionsInput(props) {
    const { state } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const { path } = useRouteMatch();

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
                label: "video_instructions",
                path: `${path}`,
                allowRoles: ["admin", "quality", "head_of_work_unit", "security_officer"],
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
        <Switch>
            <PrivateRoute
                allowRoles={["admin", "head_of_work_unit", "quality", "process_leader", "foreman"]}
                path={path + "/video-instructions"}
            />
            <VideoInstructionsPane
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                machineGroups={machineGroupsData}
                units={unitsLabels}
            />
        </Switch>
    );
}
export default VideoInstructionsInput;
