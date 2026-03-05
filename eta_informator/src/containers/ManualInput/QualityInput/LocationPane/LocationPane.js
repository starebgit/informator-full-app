import { Fragment } from "react";
import { Button, Col, Row } from "react-bootstrap";
import Select, { findOptionByValue } from "../../../../components/Forms/CustomInputs/Select/Select";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useState } from "react";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import Table from "../../../../components/Tables/Table";
import { Link } from "react-router-dom";
import queryClient, { useFlawLocations, useInputLocations } from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import LocationPaneAddForm from "./LocationPaneAddForm";
import { useMutation } from "react-query";
import { removeInputLocation } from "../../../../data/API/Informator/InformatorAPI";

function LocationPane(props) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const { path } = useRouteMatch();
    const { t } = useTranslation("manual_input");
    const locations = useInputLocations();

    const removeInputLocationMutation = useMutation((id) => removeInputLocation(id), {
        onSuccess: () => {
            queryClient.invalidateQueries("inputLocations");
        },
        onError: (error) => {
            console.log(error);
        },
    });

    const columns = useMemo(
        () => [
            {
                name: t("subunit"),
                selector: (row) => row.subunitId,
                cell: (row) => {
                    return findOptionByValue(unitsLabels, row.subunitId)?.label;
                },
                sortable: true,
            },
            {
                name: t("location_name"),
                selector: (row) => row.name,
                wrap: true,
                sortable: true,
            },
            {
                name: "",
                right: true,
                cell: (row) => (
                    <div className='d-flex gap-2'>
                        <div className='btn btn-warning btn-sm'>
                            <Link
                                className='d-flex align-items-center'
                                as={Button}
                                style={{
                                    fontSize: "14px",
                                    color: "white",
                                    textDecoration: "none",
                                }}
                                to={`${path}/edit/${row.id}`}
                            >
                                {t("edit")}
                                <FontAwesomeIcon
                                    icon='pencil-alt'
                                    className='ms-2'
                                    style={{ fontSize: "18px" }}
                                />
                            </Link>
                        </div>
                        <div
                            className='btn btn-danger btn-sm'
                            onClick={() => {
                                removeInputLocationMutation.mutate(row.id);
                            }}
                        >
                            <FontAwesomeIcon
                                icon='trash-alt'
                                style={{
                                    fontSize: "21px",
                                    color: "white",
                                }}
                            />
                        </div>
                    </div>
                ),
            },
        ],
        [path, t, unitsLabels],
    );

    const onChangeLocationHandler = (id) => {
        setSelectedLocation(id);
    };

    const locationPane = (
        <>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("input_location", { count: 2 })}</h3>
                </Col>
            </Row>
            <Row>
                <Col>{t("input_location_description")}</Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        responsive
                        actions={
                            <Link className='btn btn-primary' to={`${path}/add`}>
                                {t("add_location")}
                            </Link>
                        }
                        columns={columns}
                        progressPending={false}
                        data={locations.data}
                        defaultSortField={"id"}
                        defaultSortAsc={false}
                    ></Table>
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
                <LocationPaneAddForm />
            </PrivateRoute>
        </Switch>
    );
}

export default LocationPane;
