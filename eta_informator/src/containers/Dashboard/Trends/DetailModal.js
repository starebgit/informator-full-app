import { Modal, Row, Col, ToggleButton } from "react-bootstrap";
import styled from "styled-components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import Time from "../../../components/Charts/Time/Time";
import { oeeDataMerger, productionDataMerger } from "../../../data/Formaters/Informator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import { indicatorColor } from "../../../theme/ChartColors";
import { findSubunitByTed } from "../../../utils/finders";
import { useEffect } from "react";
import ToggleGroup from "../../../components/ToggleGroup/ToggleGroup";

const IndicatorButton = styled(ToggleButton)`
    background-color: white !important;
    border: unset;
    border-bottom: 1px solid white;
    border-radius: 0px;
    padding: 0px 4px;
    margin: 0em 0.5em;
    color: black !important;
    transition: border-bottom 0.25s ease;
    &:hover {
        background-color: white;
        color: gray;
        border-bottom: 1px solid var(--bs-primary) !important;
        transition: border-bottom 1s ease;
    }

    &.active {
        background-color: white !important;
        color: black !important;
        border-bottom: 1px solid var(--bs-primary);
        box-shadow: unset !important;
    }

    &.focus {
        box-shadow: unset !important;
        color: black !important;
        border-bottom: 1px solid var(--bs-primary) !important;
    }
`;

const BigModal = styled(Modal)`
    .modal-dialog {
        min-width: 70vw;
        height: 90vh;
    }
`;

//TODO - make it clickable, ICON

function DetailModal({
    query,
    open,
    setOpen,
    selectedSubunit,
    setSelectedSubunit,
    selectedIndicator,
    selectedTimeUnit,
    setSelectedIndicator,
    props,
}) {
    const { t } = useTranslation("labels");
    const [timeUnit, setTimeUnit] = useState(selectedTimeUnit);
    const queryClient = useQueryClient();

    useEffect(() => setTimeUnit(selectedTimeUnit), [selectedTimeUnit]);

    const tedQuery = useQuery(
        [selectedIndicator == "oee" ? "oee" : "production", timeUnit, "byTed", selectedSubunit],
        () => {
            const data = query?.data.filter((entry) => +entry.ted == +selectedSubunit);
            return selectedIndicator == "oee"
                ? oeeDataMerger(data, timeUnit) || []
                : productionDataMerger(data, timeUnit) || [];
        },
        {
            enabled: !query.isLoading,
        },
    );

    const indicatorToggleButtons = [
        { name: t("realization"), value: "total" },
        { name: t("quality"), value: "bad" },
        { name: t("oee"), value: "oee" },
        { name: t("staff"), value: "staff" },
    ];

    const data = tedQuery?.data?.map((entry) => {
        const value =
            selectedIndicator == "bad"
                ? (entry?.bad / entry?.good) * 100
                : entry?.[selectedIndicator];
        if (isNaN(value)) return undefined;
        return {
            x:
                timeUnit == "quarter"
                    ? dayjs().year(entry.year).quarter(entry.quarter).format("Q/YYYY")
                    : dayjs()
                          .year(entry.year)
                          .month(entry.month - 1)
                          .format("MM/YYYY"),
            y: value,
        };
    });

    const subunitLabels = queryClient.getQueryData("unitsLabels");
    const selectedSubunitEntry = findSubunitByTed(subunitLabels, selectedSubunit);

    return (
        <BigModal show={open} onHide={() => setOpen(false)}>
            <div className='p-4'>
                <Row className='g-0'>
                    <Col xs={3}>
                        <div className='h2'>{selectedSubunitEntry?.label}</div>
                    </Col>
                    <Col />
                    <Col xs={2}></Col>
                    <Col xs={2} className='d-flex justify-content-end align-items-center'>
                        <ToggleGroup
                            buttons={indicatorToggleButtons}
                            customButton={IndicatorButton}
                            selectedButton={selectedIndicator}
                            onSelected={setSelectedIndicator}
                            title='detail_modal_indicator'
                        />
                        <FontAwesomeIcon icon='cog' />
                    </Col>
                </Row>
                <Row style={{ minHeight: "300px" }}>
                    <Time
                        data={data}
                        legend={false}
                        label='Unit average per shift'
                        timeUnit={timeUnit}
                        stepSize={selectedIndicator == "bad" ? 0.1 : null}
                        yTitle={
                            selectedIndicator == "bad"
                                ? t("percentage")
                                : selectedIndicator == "oee"
                                ? t("percentage_oee")
                                : t("number_parts")
                        }
                        color={indicatorColor(selectedIndicator)}
                        indicator={selectedIndicator}
                        suggestedMin={90000}
                    />
                </Row>
            </div>
        </BigModal>
    );
}

export default DetailModal;
