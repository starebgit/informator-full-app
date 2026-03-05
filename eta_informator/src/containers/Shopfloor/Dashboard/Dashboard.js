import StatWrap from "../../../components/Stats/StatWrap/StatWrap";
import { Row, Col } from "react-bootstrap";
import { Fragment, useState } from "react";
import dayjs from "dayjs";
import StatProvider from "./StatProvider";
import { useHistory } from "react-router";
import { useQuery } from "react-query";
import client, { sinaproClient } from "../../../feathers/feathers";
import { useAccidents, useAllAccidents } from "../../../data/ReactQuery";
import _ from "lodash";
import Bar from "../../../components/UI/Bar/Bar";
function Dashboard({ selectedDate, machineGroups, selectedUnit, ...props }) {
    const [anyAccident, setAnyAccident] = useState([]);
    const history = useHistory();

    //* Data fetching
    const sinaproData = useQuery(
        ["production", selectedDate.format("MM-YYYY"), selectedUnit.ted],
        () => {
            return sinaproClient.service("machine-production").find({
                query: {
                    start: selectedDate.startOf("month").format("YYYY-MM-DD"),
                    end: selectedDate.endOf("month").format("YYYY-MM-DD"),
                    ted: selectedUnit.ted + "",
                },
            });
        },
    );

    const staticData = useQuery(["static", selectedDate.format("MM-YYYY")], () => {
        return client
            .service("production-data-static")
            .find({
                query: {
                    date: {
                        $lte: selectedDate.endOf("month"),
                        $gte: selectedDate.startOf("month"),
                    },
                },
            })
            .then((response) => {
                const { data } = response;
                return data;
            });
    });

    const accidentsData = useAllAccidents(selectedUnit.subunitId, {
        onSuccess: (res) => {
            if (res.length > 0) {
                // Get the last accident date in ETA
                const lastAccidentDate = dayjs(res[0]?.accidentDate);
                const daysSince = dayjs().diff(lastAccidentDate, "day");

                //Get the last accident date in subunit
                const subunitAccidents = res.filter(
                    (accident) => accident.subunitId == selectedUnit.subunitId,
                );
                const lastSubunitAccidentDate =
                    subunitAccidents.length > 0 ? dayjs(subunitAccidents[0].accidentDate) : null;
                const daysSinceSubunit =
                    subunitAccidents.length > 0
                        ? dayjs().diff(lastSubunitAccidentDate, "day")
                        : null;

                setAnyAccident([
                    { value: daysSince, timestamp: lastAccidentDate },
                    { value: daysSinceSubunit, timestamp: lastSubunitAccidentDate },
                ]);
            }
        },
    });

    return (
        <Fragment>
            {
                <Row className='mb-2'>
                    <Col>
                        <div className='d-flex'>
                            <Bar
                                title='last_accident'
                                content={anyAccident}
                                path='safety'
                                isLoading={accidentsData.isLoading}
                            ></Bar>
                        </div>
                    </Col>
                </Row>
            }
            <Row className='justify-content-center mb-3'>
                <Col>
                    <StatWrap title='realization' icon='chart-bar'>
                        {machineGroups.map((machineGroup) => {
                            const machineNumbers = machineGroup.static
                                ? machineGroup.machineGroupsGroups.map((m) => m.groupId)
                                : machineGroup.machines.map((m) => m.machineAltKey);
                            return machineGroup.realization && machineGroup.dashboard ? (
                                <StatProvider
                                    valueType={
                                        !machineGroup.hourly
                                            ? "total"
                                            : machineGroup.hourly == 1
                                            ? "effectively"
                                            : "machineNorm"
                                    }
                                    indicator='realization'
                                    key={machineGroup.id}
                                    machineGroup={machineGroup}
                                    selectedDate={selectedDate}
                                    data={
                                        machineGroup.static
                                            ? staticData?.data?.filter((row) => {
                                                  return machineNumbers.some(
                                                      (num) =>
                                                          Number(num) ==
                                                          Number(row?.groupsStaticId),
                                                  );
                                              })
                                            : sinaproData?.data?.filter((row) => {
                                                  return machineNumbers.some(
                                                      (num) =>
                                                          Number(num) == Number(row?.machineKeyAlt),
                                                  );
                                              })
                                    }
                                    staticGroup={machineGroup.static}
                                    onClick={() => {
                                        history.push("realization");
                                    }}
                                />
                            ) : null;
                        })}
                    </StatWrap>
                </Col>
            </Row>
            <Row style={{ justifyContent: "center", marginBottom: "1rem" }}>
                <Col>
                    <StatWrap title='quality' icon='star'>
                        {machineGroups.map((machineGroup) => {
                            const machineNumbers = machineGroup.static
                                ? machineGroup.machineGroupsGroups.map((m) => m.groupId)
                                : machineGroup.machines.map((m) => m.machineAltKey);
                            return machineGroup.quality && machineGroup.dashboard == 1 ? (
                                <StatProvider
                                    valueType='percentage'
                                    indicator='quality'
                                    key={machineGroup.id}
                                    machineGroup={machineGroup}
                                    selectedDate={selectedDate}
                                    data={
                                        machineGroup.static
                                            ? staticData?.data?.filter((row) => {
                                                  return machineNumbers.some(
                                                      (num) =>
                                                          Number(num) ==
                                                          Number(row?.groupsStaticId),
                                                  );
                                              })
                                            : sinaproData?.data?.filter((row) => {
                                                  return machineNumbers.some(
                                                      (num) =>
                                                          Number(num) == Number(row?.machineKeyAlt),
                                                  );
                                              })
                                    }
                                    staticGroup={machineGroup.static}
                                    onClick={() => {
                                        history.push("quality");
                                    }}
                                />
                            ) : null;
                        })}
                    </StatWrap>
                </Col>
            </Row>
        </Fragment>
    );
}
export default Dashboard;
