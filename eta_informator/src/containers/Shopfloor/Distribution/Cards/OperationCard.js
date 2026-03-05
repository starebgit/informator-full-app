import styled from "styled-components";

const Card = styled.div`
    background: rgb(212, 227, 228);
    background: linear-gradient(256deg, rgba(212, 227, 228, 1) 0%, rgba(215, 232, 241, 1) 100%);
    display: flex;
    padding: 0rem 1rem 0.5rem 1rem;
    flex-direction: column;
    flex-wrap: wrap;

    > * {
        &:only-child {
            padding-top: 0.2rem;
        }
    }
`;

function OperationCard({ name, children, empty, ...props }) {
    return (
        <Card>
            <div className='fw-bold' style={{ color: "#444444", fontSize: "14px" }}>
                {name}
            </div>
            {empty && children}
        </Card>
    );
}

export default OperationCard;
