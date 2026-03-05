import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import { Col, Row, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Fragment } from "react";
import GroupCard from "./GroupCard";
import { Switch, useRouteMatch } from "react-router";
import { Link } from "react-router-dom";
import PrivateRoute from "../../../../routes/PrivateRoute";
import GroupsPaneForm from "./GroupsPaneForm";
import { useMachineGroups } from "../../../../data/ReactQuery";

function GroupsPane({ selectedUnit, setSelectedUnit, machineGroups, units, ...props }) {
    const { path } = useRouteMatch();
    const { t } = useTranslation(["manual_input", "shopfloor"]);
    const groupsPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col md={12} xl={8} className='align-content-bottom'>
                    <h3>{t("shopfloor:machine_group", { count: 3 })}</h3>
                </Col>
                <Col className='ms-auto'>
                    <Select
                        i='subunit'
                        value={selectedUnit}
                        options={units}
                        onChange={(selected) => setSelectedUnit(selected)}
                    />
                    <label htmlFor='subunit'>{t("section")}</label>
                </Col>
            </Row>

            <Row className='mb-4 no-gutters justify-content-between'>
                <Col>
                    {!!machineGroups?.length ? (
                        <h4 className='pb-1 pe-4 ps-3 pt-3' style={{ fontSize: "22px" }}>
                            {t("all_groups")}
                        </h4>
                    ) : (
                        <h4 className='pb-1 pe-4 ps-3 pt-3' style={{ fontSize: "22px" }}>
                            {t("no_groups_added")}
                        </h4>
                    )}
                </Col>
                <Col className='d-flex align-items-center justify-content-end'>
                    <Link
                        className='btn btn-primary mt-auto me-2 mb-2'
                        style={{ maxHeight: "38px" }}
                        to={`${path}/add?unit=${selectedUnit.subunitId}`}
                    >
                        {t("add_group")}
                    </Link>
                </Col>
            </Row>
            <Row>
                {machineGroups?.map((machineGroup) => {
                    return <GroupCard key={machineGroup.id} machineGroup={machineGroup} />;
                })}
            </Row>
        </Fragment>
    );
    return (
        <Switch>
            <PrivateRoute exact path={path}>
                {groupsPane}
            </PrivateRoute>
            <PrivateRoute path={`${path}/add`}>
                <GroupsPaneForm />
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <GroupsPaneForm />
            </PrivateRoute>
        </Switch>
    );
}

export default GroupsPane;
