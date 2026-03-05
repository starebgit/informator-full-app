import TrendCard from "./TrendCard";
import { Row, Col } from "react-bootstrap";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import client, { sinaproClient } from "../../../feathers/feathers";
import {
    oeeDataMerger,
    productionDataMerger,
    staffDataMerger,
} from "../../../data/Formaters/Informator";
import DetailModal from "./DetailModal";
import StaffCard from "./StaffCard";

function Trends({
    selectedUnit,
    startDate,
    endDate,
    selectedTimeUnit,
    selectedSubunit,
    selectedIndicator,
    setSelectedIndicator,
    setSelectedSubunit,
    selectSubunitHandler,
    open,
    setOpen,
    ...props
}) {
    //TODO - add date dependency
    const query = useQuery(
        ["production", selectedTimeUnit, startDate, endDate, selectedUnit?.label],
        () => {
            return sinaproClient
                .service("machine-production")
                .find({
                    query: {
                        start: dayjs(startDate).format("YYYY-MM-DD"),
                        end: dayjs(endDate).endOf(selectedTimeUnit).format("YYYY-MM-DD"),
                        ted: selectedUnit?.value.toString(),
                        aggregate: true,
                    },
                })
                .then((result) => {
                    return result;
                });
        },
    );

    const oeeQuery = useQuery(
        ["oee", selectedTimeUnit, startDate, endDate, selectedUnit?.label],
        () => {
            return sinaproClient.service("oee").find({
                query: {
                    start: dayjs(startDate).format("YYYY-MM-DD"),
                    end: dayjs(endDate).endOf(selectedTimeUnit).format("YYYY-MM-DD"),
                    id: selectedUnit?.value.toString(),
                    aggregate: true,
                },
            });
        },
    );

    /*   const eventsQuery = useQuery(["events", startDate, endDate], () => {
    return spicaClient.service('events')
    .find({
      query: {
        dateTime: {
          $gte: dayjs(startDate)
            .startOf("month")
            .format("YYYY-MM-DD HH:mm:ss.SSS"),
          $lt: dayjs(endDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss.SSS"),
        },
        eventId: { $gt: 0 },
      },
    }).then(res => res)
  }) */

    const eventsQuery = useQuery(
        ["events", startDate, endDate, selectedUnit?.label],
        () => {
            return client
                .service("events")
                .find({
                    query: {
                        unitId: selectedUnit?.id,
                        date: { $gte: startDate, $lte: endDate },
                    },
                })
                .then(({ data }) => data);
        },
        {
            enabled: !!selectedUnit,
        },
    );

    const mergedEventsQuery = useQuery(
        ["events", selectedTimeUnit, startDate, endDate, "merged", selectedUnit?.label],
        () => {
            return staffDataMerger(eventsQuery?.data, "month", startDate, endDate);
        },

        {
            enabled: !eventsQuery.isLoading,
        },
    );

    const mergedQuery = useQuery(
        ["production", selectedTimeUnit, startDate, endDate, "merged", selectedUnit?.label],
        () => {
            return productionDataMerger(query?.data, selectedTimeUnit);
        },

        {
            enabled: !query.isLoading,
        },
    );

    const mergedOeeQuery = useQuery(
        ["oee", selectedTimeUnit, startDate, endDate, "merged", selectedUnit?.label],
        () => {
            return oeeDataMerger(oeeQuery?.data, selectedTimeUnit);
        },

        {
            enabled: !oeeQuery.isLoading,
        },
    );

    const tedQuery = useQuery(
        ["production", selectedTimeUnit, startDate, endDate, selectedUnit?.label, "byTed"],
        () => {
            const dict = {};
            selectedUnit?.value.forEach((ted) => {
                const data = query?.data.filter((entry) => +entry.ted == +ted);
                dict[+ted] = productionDataMerger(data, selectedTimeUnit) || [];
            });
            return dict;
        },
        {
            enabled: !query.isLoading,
        },
    );

    const tedOeeQuery = useQuery(
        ["oee", selectedTimeUnit, startDate, endDate, selectedUnit?.label, "byTed"],
        () => {
            const dict = {};
            selectedUnit?.value.forEach((ted) => {
                const data = oeeQuery?.data.filter((entry) => +entry.ted == +ted);
                dict[+ted] = oeeDataMerger(data, selectedTimeUnit) || [];
            });
            return dict;
        },
        {
            enabled: !oeeQuery.isLoading,
        },
    );

    const oeeUnitMonthDifference = useQuery(
        ["oee", selectedTimeUnit, startDate, endDate, selectedUnit?.label, "difference"],
        () => {
            const dict = {};
            const data = tedOeeQuery?.data;
            selectedUnit?.value.forEach((ted) => {
                const tedData = data[+ted];
                const currentMonth = tedData.at(-1);
                const lastMonth = tedData.at(-2);
                dict[+ted] = {
                    oee: currentMonth.oee - lastMonth.oee,
                };
            });
            return dict;
        },
        { enabled: !oeeQuery.isLoading && !tedOeeQuery.isLoading },
    );

    const unitMonthDifference = useQuery(
        ["production", selectedTimeUnit, startDate, endDate, selectedUnit?.label, "difference"],
        () => {
            const dict = {};
            const data = tedQuery?.data;
            selectedUnit?.value.forEach((ted) => {
                const tedData = data[+ted];
                const currentMonth = tedData.at(-1);
                const lastMonth = tedData.at(-2);
                dict[+ted] = {
                    total: currentMonth.total / lastMonth.total - 1,
                    good: currentMonth.good / lastMonth.good - 1,
                    bad: currentMonth.bad / lastMonth.bad - 1,
                    scrap:
                        currentMonth.bad / currentMonth.total -
                        currentMonth.bad / currentMonth.total,
                };
            });
            return dict;
        },
        { enabled: !query.isLoading && !tedQuery.isLoading },
    );

    return (
        <>
            <Row>
                <Col className='my-1' xs={12} xl={6}>
                    <TrendCard
                        name='Realizacija'
                        indicator='total'
                        mergedQuery={mergedQuery}
                        unitMonthDifference={unitMonthDifference}
                        timeUnit={selectedTimeUnit}
                        selectSubunitHandler={selectSubunitHandler}
                    />
                </Col>
                <Col className='my-1' xs={12} xl={6}>
                    <TrendCard
                        name='Kvaliteta'
                        indicator='bad'
                        mergedQuery={mergedQuery}
                        unitMonthDifference={unitMonthDifference}
                        timeUnit={selectedTimeUnit}
                        selectSubunitHandler={selectSubunitHandler}
                        inverted
                    />
                </Col>
            </Row>
            <Row>
                <Col className='my-1' xs={12} xl={6}>
                    <TrendCard
                        name='OEE'
                        indicator='oee'
                        mergedQuery={mergedOeeQuery}
                        unitMonthDifference={oeeUnitMonthDifference}
                        timeUnit={selectedTimeUnit}
                        selectSubunitHandler={selectSubunitHandler}
                    />
                </Col>
                <Col className='my-1' xs={12} xl={6}>
                    <StaffCard
                        name='Staff'
                        mergedQuery={mergedEventsQuery}
                        timeUnit={selectedTimeUnit}
                    />
                </Col>
            </Row>
            <DetailModal
                query={selectedIndicator == "oee" ? oeeQuery : query}
                open={open}
                setOpen={setOpen}
                selectedSubunit={selectedSubunit}
                setSelectedSubunit={setSelectedSubunit}
                selectedIndicator={selectedIndicator}
                setSelectedIndicator={setSelectedIndicator}
                selectedTimeUnit={selectedTimeUnit}
            />
        </>
    );
}

export default Trends;
