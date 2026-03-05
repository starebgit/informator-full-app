import styled from "styled-components";

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    align-content: baseline;
`;

const Heading = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: var(--s4);
`;

const Title = styled.div`
    font-size: var(--body);
    margin-right: var(--s3);
`;

const Caption = styled.div`
    font-size: var(--caption);
    color: var(--muted);
`;

function SettingItem(props) {
    return (
        <Wrap className='pt-3'>
            <Heading>
                <Title>{props.title}</Title>
                <Caption>{props.caption}</Caption>
            </Heading>
            {props.children}
        </Wrap>
    );
}

export default SettingItem;
