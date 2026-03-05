import styled from "styled-components";

const Card = styled.div`
    background: white;
    display: flex;
    padding: 1em;
    flex-direction: column;
    box-shadow: 0px 0px 10px 3px #00000018;
    flex-wrap: wrap;
    width: 100%;
`;

const Children = styled.div`
    > * {
        &:first-child {
            padding-top: 1rem;
            border-radius: 4px 4px 0px 0px;
        }
        &:last-child {
            padding-bottom: 1rem;
            border-radius: 0px 0px 4px 4px;
        }
        &:only-child {
            border-radius: 4px;
        }
    }
`;

function MachineDistributionCard({ name, ...props }) {
    return (
        <Card>
            <div className='h5 text-capitalize'>{name}</div>
            <Children>{props.children}</Children>
        </Card>
    );
}

export default MachineDistributionCard;
