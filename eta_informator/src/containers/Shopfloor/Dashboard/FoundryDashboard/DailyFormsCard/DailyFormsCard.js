import { useTranslation } from "react-i18next";
import Tile from "../../../../../components/Tile/Tile";
import styled from "styled-components";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useFoundryForms } from "../../../../../data/ReactQuery";
import { PulseLoader } from "react-spinners";

const Subtitle = styled.h5`
    color: #fff;
    margin-bottom: 0;
`;

const GOAL_VALUE = 970;
const ACTIVE_SHIFTS = 2;

function DailyFormsCard(props) {
    const { t, i18n } = useTranslation("shopfloor");
    const previousDay =
        dayjs().day() == 1 ? dayjs().subtract(3, "day") : dayjs().subtract(1, "day");

    const yesterdayForms = useFoundryForms(previousDay, previousDay);
    const numberFormater = new Intl.NumberFormat(i18n.language, {
        signDisplay: "exceptZero",
    });

    if (yesterdayForms.isLoading) {
        <Tile>
            <div
                className='d-flex justify-content-center align-items-center flex-column'
                style={{
                    zIndex: 100,
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%",
                }}
            >
                <PulseLoader loading={yesterdayForms.isLoading} color='gray' />
                <p className='lead' style={{ fontWeight: "500" }}>
                    {t("data_is_loading")}
                </p>
            </div>
        </Tile>;
    }

    const dailyData = useMemo(() => {
        return {
            sum: yesterdayForms?.data?.reduce((acc, cur) => (acc += cur.quantity), 0) || 0,
            s1: yesterdayForms?.data?.find((entry) => entry.shift == 1)?.quantity || 0,
            s2: yesterdayForms?.data?.find((entry) => entry.shift == 2)?.quantity || 0,
            s3: yesterdayForms?.data?.find((entry) => entry.shift == 3)?.quantity || 0,
        };
    }, [yesterdayForms]);

    const goalReached = useMemo(() => {
        // If less than 90% is reached return -1, if between 90% and 100% return 0, if more than 100% return 1
        const percentage = dailyData.sum / (GOAL_VALUE * ACTIVE_SHIFTS);
        if (percentage < 0.9) return -1;
        if (percentage > 1) return 1;
        return 0;
    }, [dailyData]);

    return (
        <Tile
            className='d-flex align-items-around'
            color={goalReached === -1 ? "red" : goalReached === 0 ? "orange" : "green"}
        >
            <div className='d-flex flex-wrap justify-content-between align-items-start'>
                <h3 className='mb-3'>{t("previous_day_forms")}</h3>
                <Subtitle>{previousDay?.format("LL")}</Subtitle>
            </div>
            <div className='d-flex flex-wrap justify-content-between align-items-end  '>
                <div className='d-flex flex-column'>
                    <div className='d-flex align-items-end gap-2'>
                        <h1 className='display-3 mb-0'>{dailyData.sum}</h1>
                        <h4 className=''>
                            {numberFormater.format(dailyData.sum - GOAL_VALUE * 3)}
                        </h4>
                    </div>
                    <Subtitle>{t("total")}</Subtitle>
                </div>
                <div className='d-flex gap-3'>
                    <div className='d-flex flex-column'>
                        <div className='d-flex gap-1'>
                            <h3 className='mb-0'>{dailyData.s1}</h3>
                            <div>{numberFormater.format(dailyData.s1 - GOAL_VALUE)}</div>
                        </div>
                        <Subtitle>{t("shift_1")}</Subtitle>
                    </div>
                    <div className='d-flex flex-column'>
                        <div className='d-flex gap-1'>
                            <h3 className='mb-0'>{dailyData.s2}</h3>
                            <div>{numberFormater.format(dailyData.s2 - GOAL_VALUE)}</div>
                        </div>
                        <Subtitle>{t("shift_2")}</Subtitle>
                    </div>
                    <div className='d-flex flex-column'>
                        <div className='d-flex gap-1'>
                            <h3 className='mb-0'>{dailyData.s3}</h3>
                            <div>{numberFormater.format(dailyData.s3 - GOAL_VALUE)}</div>
                        </div>
                        <Subtitle>{t("shift_3")}</Subtitle>
                    </div>
                </div>
            </div>
        </Tile>
    );
}

export default DailyFormsCard;
