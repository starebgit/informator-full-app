import React, { useState } from "react";
import MachineGroupGraph from "../MachineGroupGraph/MachineGroupGraph";
import { Card } from "../../components/UI/ShopfloorCard/ShopfloorCard";
import ToggleGroup from "../ToggleGroup/ToggleGroup";

const toggleButtons = [
    { name: "skupno", value: "sum" },
    { name: "po_izmenah", value: "shift" },
    { name: "po_strojih", value: "machine" },
];
/**
 *
 * @param {} property - Value property
 * @param {boolean} goals - Flag for goals
 * @param {} machineGroup -
 *
 * @returns component
 */
function DynamicCard({
    property = "total",
    properties = ["sum", "shift"],
    goals,
    type,
    machineGroup = {},
    index,
    machines = ["125", "127"],
    ...props
}) {
    const [selectedDataset, setSelectedDataset] = useState("sum");
    const setSelectedDatasetHandler = (value) => {
        setSelectedDataset(value);
    };
    return (
        <Card>
            <Card.Header>
                <div className='d-flex justify-content-between flex-wrap'>
                    <h3 className='m-0 p-0'>{machineGroup.name}</h3>
                    <ToggleGroup
                        buttons={toggleButtons}
                        selectedButton={selectedDataset}
                        onSelected={setSelectedDatasetHandler}
                        title={"dynamic_card_dataset"}
                    />
                </div>
            </Card.Header>
            <Card.Body>
                <MachineGroupGraph
                    selectedMonth={props.selectedMonth}
                    sinaproData={props.sinaproData}
                    machines={machines}
                    index={machineGroup.id}
                    type={type}
                    goals={goals}
                    selectedDataset={selectedDataset}
                    property={property}
                />
            </Card.Body>
        </Card>
    );
}

export default DynamicCard;
