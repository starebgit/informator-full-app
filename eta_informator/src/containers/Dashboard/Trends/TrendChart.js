import dayjs from "dayjs";
import styled from "styled-components";
import Time from "../../../components/Charts/Time/Time";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { indicatorColor } from "../../../theme/ChartColors";
const Chart = styled.div`
    width: 100%;
    height: 80px;
    background: rgba(255, 255, 255, 0.6);
`;

function TrendChart({ data, indicator, timeUnit, ...props }) {
    const { t } = useTranslation("labels");
    const datas = data?.data?.map((entry) => {
        const value = indicator == "bad" ? entry?.bad / entry?.good : entry?.[indicator];
        return {
            x:
                timeUnit == "quarter"
                    ? dayjs().year(entry.year).quarter(entry.quarter).format("Q/YYYY")
                    : dayjs()
                          .year(entry.year)
                          .month(entry.month - 1)
                          .format("MM/YYYY"),
            y: indicator == "bad" || indicator == "oee" ? value * 100 : value,
        };
    });
    if (data?.isIdle) return null;
    const label =
        indicator == "bad" ? t("scrap") : indicator == "oee" ? t("OEE") : t("number_parts");
    return (
        <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: "6px" }}>
            <Time
                data={datas}
                label={label}
                timeUnit={timeUnit}
                stepSize={indicator == "bad" ? 0.1 : null}
                yTitle={indicator == "bad" ? t("percentage") : t("number_parts")}
                color={indicatorColor(indicator)}
                indicator={indicator}
                tooltip={"LLLL yyyy"}
                suggestedMin={90000}
            />
        </div>
    );
}

export default TrendChart;
