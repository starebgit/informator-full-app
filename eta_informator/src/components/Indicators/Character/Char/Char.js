import styled from "styled-components";

const ColorChar = styled.div`
    color: ${(props) => {
        return props.color == 0
            ? "gray"
            : props.color == 1
            ? "rgba(251, 0, 34, 0.9)"
            : props.color == 2
            ? "rgba(4, 170, 56, 1)"
            : "gray";
    }};
    font-size: 128px;
    font-weight: 900;
    line-height: 1.05;
`;
function Char({ color, char, ...props }) {
    return <ColorChar color={color}>{char}</ColorChar>;
}
export default Char;
