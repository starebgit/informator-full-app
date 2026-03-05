import randomColor from "randomcolor";
import styled from "styled-components";

const Card = styled.div`
    border-radius: 0.5rem;
    background-color: ${(props) => props.bg || "white"};
    padding: 0.5rem;
    box-shadow: var(--bs-box-shadow-sm);
    color: ${(props) => props.text || "black"};
`;

const TagCard = ({ tag, children }) => {
    const bg = randomColor({
        luminosity: "light",
        seed: tag,
        format: "rgba",
        alpha: 0.6,
    });
    const text = randomColor({
        luminosity: "dark",
        seed: tag,
    });
    return (
        <Card bg={bg} text={text}>
            <h6>{tag}</h6>
            <div className='d-flex flex-column gap-2 mx-2'>{children}</div>
        </Card>
    );
};

export default TagCard;
