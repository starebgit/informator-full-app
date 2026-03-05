import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import ChartColors from "../../../theme/ChartColors";

const Tab = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    color: white;
    width: 100%;
    padding: 0.25rem 1rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
    transition: background 0.1s ease;
    cursor: pointer;
    &:hover {
        background: rgba(200, 200, 200, 0.1);
    }
`;

function UnitDetail({ unit, value, property, inverted, onClick, ...props }) {
    const icon = (property) => {
        switch (property) {
            case "Best":
                return "crown";
            case "Worst":
                return "trash";
            case "Largest improvement":
                return "arrow-up";
            case "Largest drawback":
                return "arrow-down";
            default:
                return "crown";
        }
    };

    const arrow = (property) => {
        if (property < 0) {
            return "arrow-down";
        } else if (property == 0) {
            return "equals";
        } else {
            return "arrow-up";
        }
    };

    const arrowColor = (property) => {
        if (inverted ? property > 0 : property < 0) {
            return ChartColors["red"];
        } else if (property == 0) {
            return "darkorange";
        } else {
            return "green";
        }
    };

    const color = (property) => {
        switch (property) {
            case "Best":
                return "gold";
            case "Worst":
                return "firebrick";
            case "Largest improvement":
                return "green";
            case "Largest drawback":
                return "firebrick";
            default:
                return "gold";
        }
    };
    return (
        <div className='ps-3' onClick={onClick}>
            <div className='d-flex justify-content-end align-items-center'>
                <div className='text-whitem me-1'>{property}</div>
                {/* <FontAwesomeIcon color={color(property)} icon={icon(property)} size='xs'/> */}
            </div>
            <Tab>
                <div className=''>{unit}</div>
                <div className='d-flex align-items-center'>
                    <div className='fw-bold'>
                        {new Intl.NumberFormat("sl", {
                            style: "percent",
                        }).format(value)}
                    </div>
                    <FontAwesomeIcon
                        className='ms-2'
                        icon={arrow(value)}
                        color={arrowColor(value)}
                    />
                </div>
            </Tab>
        </div>
    );
}

export default UnitDetail;
