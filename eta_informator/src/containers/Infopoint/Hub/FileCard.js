import styled from "styled-components";
import { BsFillPatchExclamationFill } from "react-icons/bs";
import dayjs from "dayjs";

const Card = styled.div`
    border-radius: 0.5rem;
    background-color: white;
    padding: 0.5rem 1rem;
    box-shadow: var(--bs-box-shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: black;
    transition: all 0.2s ease-in-out;
    flex-wrap: wrap;
    font-size: clamp(0.75rem, -0.5vw + 1.25rem, 0.875rem);
    &:hover {
        box-shadow: var(--bs-box-shadow);
        margin-left: 0.2rem;
        margin-right: -0.2rem;
    }
`;

const Filecard = ({ file, onClick, isNew }) => {
    return (
        <Card onClick={onClick}>
            <h6
                style={{ fontSize: "clamp(0.813rem, -0.5vw + 1.25rem, 0.875rem)" }}
                className='mb-0'
            >
                {file.name}
            </h6>
            <div className='d-flex align-items-center justify-content-end gap-2 ms-auto'>
                <div>{dayjs(file.startDate).format("LL")}</div>
                {isNew && <BsFillPatchExclamationFill size={20} color='var(--bs-warning)' />}
            </div>
        </Card>
    );
};

export default Filecard;
