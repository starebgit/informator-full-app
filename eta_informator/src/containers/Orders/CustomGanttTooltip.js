import styled from "styled-components";
import React from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const Tooltip = styled.div`
    background: #fff;
    border-radius: 1rem;
    padding: 1rem 2rem;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.16),
        0 3px 6px rgba(0, 0, 0, 0.23);
    min-width: 300px;
`;

const Title = styled.div`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 1rem;
`;

const Body = styled.div``;

const Property = styled.div`
    text-transform: uppercase;
    font-size: 10px;
`;

const CustomGanttTooltip = ({ task, fontSize, fontFamily }) => {
    const { t } = useTranslation("shopfloor");
    const style = {
        fontSize,
        fontFamily,
        zIndex: 2,
    };

    const activityBody = (
        <div>
            <div className='d-flex justify-content-between align-items-end'>
                <div>
                    <div className='fw-bold'>{task?.hours?.planned + " " + t("hours")}</div>
                    <Property>{t("planned")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task?.hours?.realized + " " + t("hours")}</div>
                    <Property>{t("realized")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task.status}</div>
                    <Property>{t("status")}</Property>
                </div>
            </div>
        </div>
    );

    //Technological sheet
    const tlBody = (
        <div>
            <div className='d-flex justify-content-between align-items-end'>
                <div>
                    <div className='fw-bold'>{task?.activities?.finished}</div>
                    <Property>{t("finished")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task?.activities?.inprogress}</div>
                    <Property>{t("remaining")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task.status}</div>
                    <Property>{t("status")}</Property>
                </div>
            </div>
        </div>
    );

    const reportBody = (
        <div>
            <div className='mb-1'>
                <div className='fw-bold'>{dayjs(task?.start).format("LL")}</div>
                <Property>{t("date")}</Property>
            </div>
            <div
                className='d-flex justify-content-between align-items-end flex-wrap'
                style={{ gap: "1rem" }}
            >
                <div>
                    <div className='fw-bold'>{task?.employee}</div>
                    <Property>{t("employee")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task?.operation}</div>
                    <Property>{t("operation")}</Property>
                </div>
                <div>
                    <div className='fw-bold'>{task?.hours}</div>
                    <Property>{t("hours")}</Property>
                </div>
            </div>
        </div>
    );

    const positionBody = <div></div>;
    return (
        <Tooltip className='tooltipDefaultContainer' style={style}>
            <div className='tooltipDefaultContainerParagraph'>
                <Title>{task.name}</Title>
                <Body>
                    {task.type == "activity"
                        ? activityBody
                        : task.type == "tl"
                        ? tlBody
                        : task.type == "report"
                        ? reportBody
                        : positionBody}
                </Body>
            </div>
        </Tooltip>
    );
};

export default CustomGanttTooltip;
