import { Col, Row } from "react-bootstrap";
import Select, { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import Table from "../../../../components/Tables/Table";
import { Link } from "react-router-dom";
import queryClient, {
    useInputLocationMachines,
    useInputLocations,
    useMachines,
} from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { generateLocationsLabels } from "../../../../data/Formaters/Informator";
import MachinesPaneAddForm from "./MachinesPaneAddForm";

function MachinesPane(props) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { path } = useRouteMatch();
    const { t } = useTranslation("manual_input");
    const locations = useInputLocations();
    const unitsLabels = queryClient.getQueryData("unitsLabels");

    const ted = findOptionByValue(unitsLabels, selectedLocation?.subunitId)?.ted;

    const machines = useMachines(ted, { enabled: !!ted });
    const inputLocationMachines = useInputLocationMachines(selectedLocation?.id, {
        enabled: !!selectedLocation,
    });

    const columns = useMemo(
        () => [
            {
                name: t("id"),
                selector: (row) => row.idAlt,
                sortable: true,
            },
            {
                name: t("machine_name"),
                selector: (row) => row.name,
                wrap: true,
                sortable: true,
            },
            {
                name: "",
                right: true,
                cell: (row) => (
                    <div className='d-flex gap-2'>
                        <FontAwesomeIcon
                            icon='trash-alt'
                            onClick={() => {
                                console.log(row.id);
                            }}
                            style={{
                                fontSize: "20px",
                                color: "var(--bs-danger)",
                                cursor: "pointer",
                            }}
                        />
                    </div>
                ),
            },
        ],
        [t],
    );

    const onChangeLocationHandler = (id) => {
        setSelectedLocation(id);
    };

    if (locations.isLoading) {
        <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ width: "100%", minHeight: "300px" }}
        >
            <PulseLoader color='#2c3e50' size={15} margin={10} />
            {t("data_is_loading")}
        </div>;
    }

    const locationsOptions = generateLocationsLabels(locations.data, t);

    if (locationsOptions.length > 0 && !selectedLocation) {
        setSelectedLocation(locationsOptions[0]);
    }

    const locationPane = (
        <>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("machines")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        options={locationsOptions}
                        onChange={onChangeLocationHandler}
                        value={selectedLocation}
                        id='location'
                    />
                    <label htmlFor='location'>{t("input_location")}</label>
                </Col>
            </Row>
            <Row>
                <Col>
                    <p>{t("location_machine_description")}</p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        responsive
                        actions={
                            <Link
                                className='btn btn-primary'
                                to={`${path}/add?location=${selectedLocation?.id}`}
                            >
                                {t("add_machine")}
                            </Link>
                        }
                        columns={columns}
                        progressPending={false}
                        //We filter machines that are not in inputLocationMachines
                        data={machines.data?.filter((machine) =>
                            inputLocationMachines.data?.find(
                                (inputMachine) => inputMachine.machineCode === machine.idAlt,
                            ),
                        )}
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                        dense={true}
                    />
                </Col>
            </Row>
        </>
    );

    if (locations.isLoading) {
        <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ width: "100%", minHeight: "300px" }}
        >
            <PulseLoader color='#2c3e50' size={15} margin={10} />
            {t("data_is_loading")}
        </div>;
    }

    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {locationPane}
            </PrivateRoute>
            <PrivateRoute path={[`${path}/add`, `${path}/edit/:id`]}>
                <MachinesPaneAddForm />
            </PrivateRoute>
        </Switch>
    );
}

export default MachinesPane;
