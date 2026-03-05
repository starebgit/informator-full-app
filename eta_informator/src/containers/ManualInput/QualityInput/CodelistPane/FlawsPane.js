import { Button, Col, Row } from "react-bootstrap";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Switch, useRouteMatch } from "react-router";
import PrivateRoute from "../../../../routes/PrivateRoute";
import Table from "../../../../components/Tables/Table";
import { Link } from "react-router-dom";
import { useFlawLocations, useFlaws } from "../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { generateFlawLocationsLabels } from "../../../../data/Formaters/Informator";
import FlawAddForm from "./FlawAddForm";
import useURL from "../../../../routes/useURL";
import { AiOutlineStar, AiOutlineTool } from "react-icons/ai";
import { useMutation, useQueryClient } from "react-query";
import { removeFlaw } from "../../../../data/API/Informator/InformatorAPI";

function FlawsPane(props) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const queryClient = useQueryClient();
    const { path, ...rest } = useRouteMatch();
    const { t } = useTranslation("manual_input");
    const flawLocationParam = useURL().get("flawLocation");
    const locationParam = useURL().get("location");
    const flawLocations = useFlawLocations();
    const flaws = useFlaws([selectedLocation?.value], {
        query: { flawLocationId: selectedLocation?.value },
    });

    const removeFlawMutation = useMutation((id) => removeFlaw(id), {
        onSuccess: () => {
            queryClient.invalidateQueries("flaws", selectedLocation?.value);
        },
    });

    const columns = useMemo(
        () => [
            {
                name: t("flaw_name"),
                selector: (row) => row.name,
                wrap: true,
                sortable: true,
            },
            {
                name: t("highlight_flaw"),
                selector: (row) => row.highlight,
                center: true,
                cell: (row) => {
                    return (
                        <div>
                            {row.highlight ? (
                                <AiOutlineStar
                                    style={{
                                        fontSize: "1.5rem",
                                        color: "var(--bs-warning)",
                                    }}
                                />
                            ) : (
                                ""
                            )}
                        </div>
                    );
                },
                sortable: true,
            },
            {
                name: t("color"),
                selector: (row) => row.color,
                cell: (row) => {
                    return (
                        <div
                            style={{
                                width: "40px",
                                height: "20px",
                                backgroundColor: row.color,
                                borderRadius: "8px",
                            }}
                        ></div>
                    );
                },
            },
            {
                name: t("material_component"),
                selector: (row) => row.material_component,
                center: true,
                cell: (row) => {
                    return (
                        <div>
                            {row.material_component ? (
                                <AiOutlineTool
                                    style={{
                                        fontSize: "1.5rem",
                                        color: "var(--bs-warning)",
                                    }}
                                />
                            ) : (
                                ""
                            )}
                        </div>
                    );
                },
                sortable: true,
            },
            {
                name: "",
                right: true,
                width: "350px",
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
                                removeFlawMutation.mutate(row.id);
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
        [path, t, removeFlawMutation],
    );

    const onChangeLocationHandler = (id) => {
        setSelectedLocation(id);
    };

    if (flawLocations.isLoading || flaws.isLoading) {
        <div
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ width: "100%", minHeight: "300px" }}
        >
            <PulseLoader color='#2c3e50' size={15} margin={10} />
            {t("data_is_loading")}
        </div>;
    }

    const flawLocationLabels = generateFlawLocationsLabels(
        (flawLocations.data ?? []).filter((f) => Number(f.locationId) === Number(locationParam)),
        t,
    );
    if (flawLocationParam && selectedLocation == undefined) {
        const selectedLocationLabel = flawLocationLabels.find((loc) => {
            return loc?.value == +flawLocationParam;
        });
        if (selectedLocationLabel) {
            setSelectedLocation(selectedLocationLabel);
        }
    }

    const flawsPane = (
        <>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8}>
                    <h3>{t("flaw_codelist")}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        id='flaws_pane_flaw_location'
                        options={flawLocationLabels}
                        onChange={onChangeLocationHandler}
                        value={selectedLocation}
                    />
                    <label htmlFor='flaw_location'>{t("flaw_location")}</label>
                </Col>
            </Row>
            <Row>
                <Col>{t("flaw_description")}</Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        responsive
                        actions={
                            <Link
                                className='btn btn-primary'
                                to={`${path}/add?location=${selectedLocation?.value}`}
                            >
                                {t("add_flaw")}
                            </Link>
                        }
                        title={t("flaw", { count: 2 })}
                        columns={columns}
                        progressPending={false}
                        data={flaws.data?.filter(
                            (flaw) => flaw.flawLocationId === selectedLocation?.value,
                        )}
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
                {flawsPane}
            </PrivateRoute>
            <PrivateRoute path={[`${path}/add`, `${path}/edit/:id`]}>
                <FlawAddForm />
            </PrivateRoute>
            <PrivateRoute path={`${path}/flaw`}>{flawsPane}</PrivateRoute>
        </Switch>
    );
}

export default FlawsPane;
