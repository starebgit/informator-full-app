import { Fragment } from "react";
import { Button, Col, Row } from "react-bootstrap";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useState } from "react";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import Table from "../../../../components/Tables/Table";
import { Link } from "react-router-dom";
import FlawLocationAddForm from "./FlawLocationAddForm";
import { useFlawLocations, useInputLocations } from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import FlawsPane from "./FlawsPane";
import { generateLocationsLabels } from "../../../../data/Formaters/Informator";
import { useFlaws } from "../../../../data/ReactQuery";

function CodelistPane(props) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { path, ...rest } = useRouteMatch();
    const { t } = useTranslation("manual_input");
    const flawLocations = useFlawLocations();
    const locations = useInputLocations();
    const allFlaws = useFlaws();

    const columns = useMemo(
        () => [
            {
                name: t("flaw_location"),
                selector: (row) => row.name,
                wrap: true,
                cell: (row) => {
                    const flawsForLocation =
                        allFlaws?.data?.filter((f) => f.flawLocationId === row?.id) || [];
                    return (
                        <div>
                            <div>{row?.name}</div>
                            {flawsForLocation?.map((flaw) => (
                                <div key={flaw?.id} style={{ marginLeft: "1.5rem", color: "#666" }}>
                                    {flaw?.name}
                                </div>
                            ))}
                        </div>
                    );
                },
            },
            {
                name: "",
                right: true,
                cell: (row) => (
                    <div className='d-flex gap-2'>
                        <div className='btn btn-info btn-sm'>
                            <Link
                                className='d-flex align-items-center'
                                as={Button}
                                style={{
                                    fontSize: "16px",
                                    color: "white",
                                    textDecoration: "none",
                                }}
                                to={`${path}/flaw?location=${row.locationId}&flawLocation=${row.id}`}
                            >
                                {t("edit_flaw")}
                                <FontAwesomeIcon
                                    icon='plus'
                                    className='ms-2'
                                    style={{ fontSize: "18px" }}
                                />
                            </Link>
                        </div>
                        <div className='btn btn-warning btn-sm'>
                            <Link
                                className='d-flex align-items-center'
                                as={Button}
                                style={{
                                    fontSize: "14px",
                                    color: "white",
                                    textDecoration: "none",
                                }}
                                to={`${path}/location/edit/${row.id}`}
                            >
                                {t("edit")}
                                <FontAwesomeIcon
                                    icon='pencil-alt'
                                    className='ms-2'
                                    style={{ fontSize: "18px" }}
                                />
                            </Link>
                        </div>
                    </div>
                ),
            },
        ],
        [path, t, allFlaws],
    );

    const onChangeLocationHandler = (id) => {
        setSelectedLocation(id);
    };

    if (flawLocations.isLoading || locations.isLoading) {
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

    const codelistPane = (
        <>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("flaw_codelist")}</h3>
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
                <Col>{t("codelist_description")}</Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        responsive
                        actions={
                            <Link
                                className='btn btn-primary'
                                to={`${path}/location/add?location=${selectedLocation?.value}`}
                            >
                                {t("add_flaw_location")}
                            </Link>
                        }
                        title={t("flaw_location", { count: 2 })}
                        columns={columns}
                        progressPending={false}
                        data={flawLocations.data?.filter((entry) => {
                            return entry.locationId == selectedLocation?.id;
                        })}
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                    ></Table>
                </Col>
            </Row>
        </>
    );

    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {codelistPane}
            </PrivateRoute>
            <PrivateRoute path={[`${path}/location/add`, `${path}/location/edit/:id`]}>
                <FlawLocationAddForm />
            </PrivateRoute>
            <PrivateRoute path={`${path}/flaw`}>
                <FlawsPane />
            </PrivateRoute>
        </Switch>
    );
}

export default CodelistPane;
