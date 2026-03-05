import { Modal, Row, Col } from "react-bootstrap";
import MachineGroupGraph from "../../MachineGroupGraph/MachineGroupGraph";
import GraphSwitchCard from "../../GraphSwitchCard/GraphSwitchCard";
import _ from "lodash";
import { useTranslation } from "react-i18next";

const typesOrder = ["Izločeno na umerjanju", "Izločeno neskladno", "Izločeno na pakiranju"];

const typesAssemblyOrder = [
    "Diastat",
    "REOS/REMA",
    "Pokrov sestav",
    "Podnožje sestav",
    "Termostat cel",
];

const typesPackagingOrder = ["Diastat", "Pokrov sestav", "Podnožje sestav", "Termostat cel"];

const faultsPackagingOrder = [
    "Podnožje poškodovano",
    "Termostat brez napak",
    "Regulacijska os zasuk",
    "Čutilo poškodovano",
    "Termostat ohmska upornost",
    "Kapilara navitje poškodovano",
    "Kapilara poškodovano",
    "Sponka faston poškodovano",
    "Regulacijska os drsa",
    "Termostat višek",
];

function MontazaModal({ machineGroup, data, dataAssembly, dataPackaging, selectedMonth, props }) {
    const { t } = useTranslation("shopfloor");
    const machineGroupKeys = machineGroup?.machines.map((machineGroup) => ({
        key: machineGroup.machineAltKey,
        name: machineGroup.name,
    }));

    const types = data.reduce((acc, entry) => {
        const typeLabel = entry.typeLabel;
        const typeId = entry.typeId;
        if (_.findIndex(acc, { label: typeLabel }) == -1) {
            acc.push({ label: typeLabel, id: typeId });
        }
        return acc;
    }, []);

    const typesAssembly = dataAssembly.reduce((acc, entry) => {
        const typeLabel = entry.typeLabel;
        const typeId = entry.typeId;
        if (_.findIndex(acc, { label: typeLabel }) == -1) {
            acc.push({ label: typeLabel, id: typeId });
        }
        return acc;
    }, []);

    const typesPackaging = dataPackaging
        .filter((entry) => entry.typeLabel != null)
        .reduce((acc, entry) => {
            const typeLabel = entry.typeLabel;
            const typeId = entry.typeId;
            if (_.findIndex(acc, { label: typeLabel }) == -1) {
                acc.push({ label: typeLabel, id: typeId });
            }
            return acc;
        }, []);

    const faultsPackaging = dataPackaging
        .filter((entry) => entry.faultLabel != null)
        .reduce((acc, entry) => {
            const faultLabel = entry.faultLabel;
            const faultId = entry.faultId;
            if (_.findIndex(acc, { label: faultLabel }) == -1) {
                acc.push({ label: faultLabel, id: faultId });
            }
            return acc;
        }, []);

    const machineGroupData = data?.filter((entry) =>
        _.find(machineGroupKeys, { key: +entry.machineIdAlt }),
    );

    const machineGroupDataAssembly = dataAssembly.filter((entry) =>
        _.find(machineGroupKeys, { key: +entry.machineIdAlt }),
    );

    const machineGroupDataPackaging = dataPackaging.filter((entry) =>
        _.find(machineGroupKeys, { key: +entry.machineIdAlt }),
    );

    return (
        <Modal.Body>
            <Row className='d-flex justify-content-between align-items-center mx-2'>
                <h3>Montaža</h3>
            </Row>
            <Row className='mb-4' style={{ minHeight: "400px" }}>
                <Col>
                    <GraphSwitchCard
                        categories={["sum", "machine", "shift", "type"]}
                        types={_.orderBy(typesAssembly, (o) => typesAssemblyOrder.indexOf(o.label))}
                        selectable
                        machineGroup={machineGroup}
                        sort={true}
                        title={t("scrap_assembly")}
                    >
                        <MachineGroupGraph
                            goals={false}
                            machineGroup={machineGroup}
                            selectedMonth={selectedMonth}
                            machineGroupData={machineGroupDataAssembly}
                            scrap
                            source='assembly'
                            height='350px'
                        />
                    </GraphSwitchCard>
                </Col>
            </Row>
            <Row className='mx-2'>
                <h3>Umerjanje</h3>
            </Row>
            <Row className='mb-4' style={{ minHeight: "400px" }}>
                <Col>
                    <GraphSwitchCard
                        categories={["sum", "machine", "shift", "type"]}
                        types={_.orderBy(types, (o) => typesOrder.indexOf(o.label))}
                        selectable
                        machineGroup={machineGroup}
                        sort={false}
                        title={t("scrap_calibration")}
                    >
                        <MachineGroupGraph
                            goals={false}
                            machineGroup={machineGroup}
                            selectedMonth={selectedMonth}
                            machineGroupData={machineGroupData}
                            scrap
                            source='sinapro'
                            height='350px'
                        />
                    </GraphSwitchCard>
                </Col>
            </Row>
            <Row className='mx-2'>
                <h3>Pakiranje</h3>
            </Row>
            <Row className='mb-4' style={{ minHeight: "400px" }}>
                <Col>
                    <GraphSwitchCard
                        categories={["sum", "machine", "shift", "type", "fault"]}
                        types={_.orderBy(typesPackaging, (o) =>
                            typesPackagingOrder.indexOf(o.label),
                        )}
                        faults={_.orderBy(faultsPackaging, (o) =>
                            faultsPackagingOrder.indexOf(o.label),
                        )}
                        selectable
                        machineGroup={machineGroup}
                        sort={false}
                        title={t("scrap_packaging")}
                    >
                        <MachineGroupGraph
                            goals={false}
                            machineGroup={machineGroup}
                            selectedMonth={selectedMonth}
                            machineGroupData={machineGroupDataPackaging}
                            source='packaging'
                            scrap
                            height='350px'
                        />
                    </GraphSwitchCard>
                </Col>
            </Row>
        </Modal.Body>
    );
}

export default MontazaModal;
