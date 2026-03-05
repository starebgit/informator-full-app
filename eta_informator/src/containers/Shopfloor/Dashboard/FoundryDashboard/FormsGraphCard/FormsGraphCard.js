import Indicator from "../../../../../components/Indicators/Indicator";
import { fetchChartDataset } from "../../../../../utils/shopfloor/dataConvert";
import { useTranslation } from "react-i18next";

const GOAL_VALUE = 970;
const ACTIVE_SHIFTS = 2;

function FormsGraphCard({ data, category, selectedMonth }) {
    const { t } = useTranslation("shopfloor");
    const goalsData = () => {
        let startDate = selectedMonth.startOf("month");
        const endDate = selectedMonth.endOf("month").startOf("day");
        //Iterate over all dates from start till end date and reduce the data to get array of goals with {x: date, y: goal}
        const goals = [];
        while (startDate.isBefore(endDate)) {
            const date = startDate.format("DD/MM/YYYY");
            const goal = category === "shift" ? GOAL_VALUE : GOAL_VALUE * ACTIVE_SHIFTS;
            //Check if the date is not a weekend
            if (startDate.day() !== 0 && startDate.day() !== 6) goals.push({ x: date, y: goal });
            else goals.push({ x: date, y: null });
            startDate = startDate.add(1, "day");
        }
        return goals;
    };

    const goalsDataset = [
        {
            label: t("goal"),
            id: "goal",
            type: "line",
            data: goalsData(),
            borderColor: "rgba(32,234,100, 0.5)",
            borderWidth: 3,
            borderDash: [5, 5],
            spanGaps: false,
            radius: 0,
            index: "goal",
        },
    ];

    const chartdata = fetchChartDataset(data, null, {
        indicator: "forms",
        category: category,
        startDate: selectedMonth.startOf("month"),
        endDate: selectedMonth.endOf("month").startOf("day"),
        valueType: "quantity",
    });
    const dataset = {
        datasets: [...chartdata, ...goalsDataset],
    };
    return (
        <>
            <Indicator type={category == "shift" ? "bar" : "line"} datasets={dataset} />
        </>
    );
}

export default FormsGraphCard;

function generateLabels(startDay, endDay) {
    const weeks = [];
    const labels = [];

    let copyStartDay = startDay;
    while (copyStartDay.isBefore(endDay)) {
        labels.push(copyStartDay.format("DD/MM/YYYY"));
        const week = copyStartDay.isoWeek();
        if (!weeks.includes(week)) weeks.push(week);
        copyStartDay = copyStartDay.add(1, "day");
    }
    return { labels, weeks };
}
