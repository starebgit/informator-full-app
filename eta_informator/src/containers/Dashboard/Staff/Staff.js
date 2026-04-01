import { useMemo } from "react";
import { Card, Container, Row, Col, Tab, Nav, Modal, Table } from "react-bootstrap";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import { spicaClient } from "../../../feathers/feathers";
import UnitStaffCard from "./UnitStaffCard";
import _ from "lodash";
import { useState } from "react";
import { PulseLoader } from "react-spinners";
import { eventCategories } from "../../../data/Formaters/Informator";
import OverallCard from "./OverallCard";

const StyledContainer = styled(Container)`
    max-width: 95%;
    padding-top: 1rem;
    overflow: hidden;
    min-height: 850px;
    height: 100%;
`;

const UnitCardWrap = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const UnitSelector = styled(Nav.Link)`
    border-radius: 15px !important;
    padding: 0.25rem 1rem !important;
    border: 1px solid var(--bs-primary);
    margin-right: 0.5rem;
    &:hover {
        color: black;
    }
`;

function Staff({
    selectedUnit,
    selectedDate,
    selectedSubunit,
    selectedIndicator,
    setSelectedIndicator,
    setSelectedSubunit,
    selectSubunitHandler,
    open,
    setOpen,
    ...props
}) {
    const { t } = useTranslation("labels");
    const queryClient = useQueryClient();
    const unitLabels = queryClient.getQueryData("unitsLabels");
    const [selected, setSelected] = useState("thermo");

    const columns = [
        {
            name: t("unit"),
            selector: "unit",
            omit: true,
        },
        {
            name: t("foreman"),
            selector: "foreman",
            format: (row) => {
                const re = /\D+/g;
                const [match] = row.foreman.match(re);
                return match?.trim();
            },
        },
        {
            name: t("plan"),
            selector: "plan",
        },
        {
            name: t("physical_attendance"),
            selector: "physical_attendance",
        },
        {
            name: t("remote"),
            selector: "remote",
        },
        {
            name: t("leave"),
            selector: "leave",
        },
        {
            name: t("sick"),
            selector: "sick",
        },
        {
            name: t("partial_sick"),
            selector: "partial_sick",
        },
        {
            name: t("hour_use"),
            selector: "hour_use",
        },
        {
            name: t("partial_hour_use"),
            selector: "partial_hour_use",
        },
        {
            name: t("waiting"),
            selector: "waiting",
        },
        {
            name: t("maternity"),
            selector: "maternity",
        },
        {
            name: t("special_leave"),
            selector: "special_leave",
        },
    ];

    const dailyEventsQuery = useQuery(["dailyevents", selectedDate.format("YYYY-MM-DD")], () => {
        return spicaClient
            .service("daily-events")
            .find({ query: { date: selectedDate.format("YYYY-MM-DD") } });
    });

    if (dailyEventsQuery.isLoading) {
        <StyledContainer>
            <h5>{t("overview_by_units")}</h5>
            <Card style={{ width: "100%", padding: "0.5rem 2rem" }}>
                <div>loada</div>
            </Card>
        </StyledContainer>;
    }

    const UnitCards = useMemo(() => {
        return (
            dailyEventsQuery?.data &&
            Object.keys(dailyEventsQuery?.data)?.map((entry) => {
                return <UnitStaffCard unit={entry} foremans={dailyEventsQuery?.data?.[entry]} />;
            })
        );
    }, [dailyEventsQuery]);

    const TableData = useMemo(() => {
        return _.flatten(
            dailyEventsQuery?.data &&
                Object.keys(dailyEventsQuery?.data)
                    ?.filter((entry) => {
                        if (selected != null) {
                            return entry.toLowerCase() == selected.toLowerCase();
                        }
                        return true;
                    })
                    .map((unit) => {
                        const foremans = dailyEventsQuery?.data[unit];
                        return Object.keys(foremans).map((foreman) => {
                            const events = foremans[foreman];
                            let mEvents = {};

                            for (const [idE, value] of Object.entries(events)) {
                                const id =
                                    eventCategories[idE] == undefined
                                        ? "other"
                                        : eventCategories[idE];
                                //const id = idE
                                if (mEvents[id] == undefined) mEvents[id] = value;
                                else mEvents[id] = mEvents[id] + value;
                            }
                            return {
                                unit: unit,
                                foreman: foreman,
                                ...mEvents,
                            };
                        });
                    }),
        );
    }, [dailyEventsQuery, selected]);

    const overallData = useMemo(() => {
        return (
            dailyEventsQuery?.data &&
            Object.keys(dailyEventsQuery?.data)?.reduce((acc, cur) => {
                const foremans = dailyEventsQuery?.data[cur];
                for (const [key, events] of Object.entries(foremans)) {
                    if (acc[key] != undefined) {
                        const { plan, presences, absences } = acc[key];
                        for (const [event, value] of Object.entries(events)) {
                            acc[key][event] =
                                acc[key][event] != undefined ? acc[key][event] + value : value;
                        }
                        //acc[key] = {...acc[key], ...events, plan: plan + events.plan, presences: presences + events.presences, absences: absences + events.absences }
                    } else {
                        acc[key] = { ...events };
                    }
                }
                return acc;
            }, {})
        );
    }, [dailyEventsQuery]);

    return (
        <StyledContainer>
            <h5>{t("overall_overview")}</h5>
            <Card style={{ width: "100%", padding: "0.5rem 2rem" }}>
                {dailyEventsQuery.isLoading ? (
                    <div
                        className='d-flex flex-column justify-content-center align-items-center'
                        style={{ width: "100%", minHeight: "300px" }}
                    >
                        <PulseLoader color='#2c3e50' size={15} margin={10} />
                        {t("data_is_loading")}
                    </div>
                ) : (
                    <div>
                        <OverallCard foremans={overallData} />
                    </div>
                )}
            </Card>
            <h5 className='mt-3'>{t("overview_by_units")}</h5>
            <Card style={{ width: "100%", padding: "0.5rem 2rem" }}>
                {dailyEventsQuery.isLoading ? (
                    <div
                        className='d-flex flex-column justify-content-center align-items-center'
                        style={{ width: "100%", minHeight: "300px" }}
                    >
                        <PulseLoader color='#2c3e50' size={15} margin={10} />
                        {t("data_is_loading")}
                    </div>
                ) : (
                    <UnitCardWrap>{UnitCards}</UnitCardWrap>
                )}
            </Card>
            <h5 className='mt-3'>{t("overview_by_foremans")}</h5>
            <Nav
                defaultActiveKey='thermo'
                variant='pills'
                className='mb-2'
                onSelect={(val) => {
                    setSelected(val);
                }}
            >
                {unitLabels?.map((unit) => {
                    return (
                        <Nav.Item style={{ cursor: "pointer" }}>
                            <UnitSelector eventKey={unit.keyword}>{t(unit.keyword)}</UnitSelector>
                        </Nav.Item>
                    );
                })}
            </Nav>
            <Card className='p-4'>
                <DataTable
                    noDataComponent={t("no_data")}
                    noHeader
                    columns={columns}
                    data={TableData}
                    pagination
                    dense
                />
            </Card>
        </StyledContainer>
    );
}

export default Staff;
