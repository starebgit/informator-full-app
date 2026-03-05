import { useTranslation } from "react-i18next";
import styled from "styled-components";

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
`;

const Name = styled.span`
    text-align: left;
    font-size: var(--h4);
`;

const Role = styled.span`
    margin-top: calc(-1 * var(--s4));
    text-align: left;
    text-transform: uppercase;
    font-size: var(--caption);
    color: var(--muted) !important;
`;

function UserInfo(props) {
    const { t } = useTranslation("labels");
    return (
        <Wrap>
            <Name>{props.user}</Name>
            <Role>{t(props.role)}</Role>
        </Wrap>
    );
}

export default UserInfo;
