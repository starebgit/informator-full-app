import styled from "styled-components";

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: var(--s2);
    padding-bottom: var(--s1);
    border-bottom: 1px solid var(--p25);
`;

const Title = styled.div`
    font-size: var(--h3);
    color: var(--bs-primary);
    text-transform: uppercase;
`;

function SettingCategory({ isAuth = true, last, title, children, ...props }) {
    return isAuth ? (
        <Wrap className='settings-wrap'>
            <Title>{title}</Title>
            {children}
        </Wrap>
    ) : null;
}

export default SettingCategory;
