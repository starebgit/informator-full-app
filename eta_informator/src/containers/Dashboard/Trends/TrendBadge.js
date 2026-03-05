import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

const Badge = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: ${(props) =>
        props.trend == -1
            ? "rgba(137,5,7,0.5)"
            : props.trend == 0
            ? "rgba(137,87,5,0.7)"
            : props.trend == 1
            ? "rgba(59,137,5,0.2)"
            : ""};
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.25);
    font-weight: 600;
`;

const Icon = styled(FontAwesomeIcon)`
    color: ${(props) =>
        props.trend == -1
            ? "rgba(177,5,7)"
            : props.trend == 0
            ? "rgba(160,100,5)"
            : props.trend == 1
            ? "rgba(59,137,5)"
            : ""};
`;

const IconType = (trend) => {
    switch (trend) {
        case -1:
            return "angle-down";
        case 0:
            return "angle-right";
        case 1:
            return "angle-up";
        default:
            return "angle-down";
    }
};

//TODO - add useMemos for optimization

function TrendBadge({ value, inverted, trend, indicator, ...props }) {
    const iTrend = inverted ? trend * -1 : trend;
    const displayValue = value < 0 ? value * -1 : value;
    const format =
        indicator == "bad"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 1,
              }).format(displayValue)
            : indicator == "oee"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
              }).format(displayValue)
            : new Intl.NumberFormat("sl").format(displayValue);

    return (
        <Badge trend={iTrend}>
            <Icon trend={iTrend} icon={IconType(trend)} size='3x' />
            <div>{`${value > 0 ? "+ " : value < 0 ? "- " : ""} ${format}`}</div>
        </Badge>
    );
}

export default TrendBadge;
