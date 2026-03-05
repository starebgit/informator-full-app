import React, { useMemo } from "react";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import _ from "lodash";
import { sinaproClient } from "../../feathers/feathers";
import MachineGroupGraph from "../MachineGroupGraph/MachineGroupGraph";
import { filteredMachineGroupNames, useScrapData } from "../../utils/utils";

function ScrapGroupGraph({
    category,
    selectedMonth,
    machineGroup,
    selectedUnit,
    height = "250px",
    filterTooltip = true,
    ...props
}) {
    const scrapData = useScrapData(selectedMonth, machineGroup, selectedUnit);
    console.log("[ScrapGroupGraph] scrapData:", scrapData);

    // 2) Convert machineIdAlt to a number (just like in DefaultModal)
    const processedScrapData = useMemo(() => {
        if (!scrapData?.data) return [];
        const processed = scrapData.data.map((entry) => ({
            ...entry,
            machineIdAlt: entry.machineIdAlt ? +entry.machineIdAlt : null,
        }));
        console.log("[ScrapGroupGraph] processedScrapData:", processed);
        return processed;
    }, [scrapData?.data]);

    const finalScrapData = useMemo(() => {
        if (!processedScrapData.length) return [];

        function filterScrapDataByLocation(scrapList, machineGroupName) {
            const flawLocation = machineGroupName
                ? filteredMachineGroupNames[machineGroupName]
                : null;
            return flawLocation
                ? scrapList.filter((item) => item.flawlocation === flawLocation)
                : scrapList;
        }

        const finalData = filterScrapDataByLocation(processedScrapData, machineGroup?.name);
        console.log("[ScrapGroupGraph] finalScrapData:", finalData);
        return finalData;
    }, [processedScrapData, machineGroup?.name]);

    // 5) Show loading or graph
    if (scrapData.isLoading) {
        return <div>Loading scrap data...</div>;
    }

    // 6) Render MachineGroupGraph with the final scrap data
    return (
        <MachineGroupGraph
            goals={false}
            machineGroup={machineGroup}
            selectedMonth={selectedMonth}
            machineGroupData={finalScrapData}
            scrap
            height={height}
            filterTooltip={filterTooltip}
            category={category}
            showModal={props.showModal}
            setShowModal={props.setShowModal}
            selectedMachineGroup={props.selectedMachineGroup}
            indicator={props.indicator}
            valueType={props.valueType}
            machines={props.machines}
            isScrapGraph={true}
        />
    );
}

export default ScrapGroupGraph;
