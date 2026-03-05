import { Fragment, useState, useMemo } from "react";
import { Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Switch, useRouteMatch } from "react-router-dom";
import Select from "../../../../components/Forms/CustomInputs/Select/Select";
import PrivateRoute from "../../../../routes/PrivateRoute";
import ConditionsPaneForm from "./ConditionsPaneForm";
import GroupSquare from "./GroupSquare";

function ConditionsPane({ selectedUnit, units, setSelectedUnit, machineGroups, ...props }) {
    const [show, setShow] = useState(false);
    const [selectedGroup] = useState(null);
    const { t } = useTranslation("manual_input, shopfloor");
    const { path } = useRouteMatch();

    const machineCards = useMemo(
        () =>
            machineGroups?.map((machine) => {
                return (
                    <GroupSquare
                        key={machine.id}
                        id={machine.id}
                        name={machine.name}
                        conditions={machine.machineConditions.length}
                    />
                );
            }),
        [machineGroups],
    );

    return (
        <Switch>
            <PrivateRoute exact path={path}>
                <Fragment>
                    <Row>
                        <Col md={12} xl={8}>
                            <h3>{t("manual_input:condition", { count: 3 })}</h3>
                        </Col>
                        <Col className='ms-auto'>
                            <Select
                                value={selectedUnit}
                                options={units}
                                onChange={(selected) => setSelectedUnit(selected)}
                            />
                            <label htmlFor='subunit'>{t("shopfloor:section")}</label>
                        </Col>
                    </Row>
                    <Row className='mt-4'>
                        <Col className='d-flex flex-row justify-content-start flex-wrap'>
                            {machineCards}
                        </Col>
                    </Row>
                </Fragment>
            </PrivateRoute>
            <PrivateRoute path={`${path}/edit/:id`}>
                <ConditionsPaneForm machineGroups={machineGroups} conditions={{}} />
            </PrivateRoute>
        </Switch>
    );
}

export default ConditionsPane;
