import { Card } from "react-bootstrap";
import styled from "styled-components";

const TileDiv = styled(Card)`
    height: 100%;
    border: 0;
    color: white;
    box-shadow: var(--shadow-regular);
    background: ${(props) => {
        switch (props.color) {
            case "red":
                return "linear-gradient(45deg, #db3a3a, #b74343)";
            case "green":
                return "linear-gradient(45deg, #3adb4c, #43b762)";
            case "orange":
                return "linear-gradient(45deg, #f9cf0f, #d5b829)";
            default:
                return "linear-gradient(10deg,rgba(240, 250, 255, 1) 0%,rgba(245, 245, 245, 1) 100%);";
        }
    }};
`;

const Tile = ({ children, style, color = "default" }) => {
    return (
        <TileDiv color={color} style={{ ...style }} body>
            {children}
        </TileDiv>
    );
};

export default Tile;
