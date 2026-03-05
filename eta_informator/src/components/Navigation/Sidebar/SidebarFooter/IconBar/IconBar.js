import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHistory } from "react-router";
import styled from "styled-components";

const Wrap = styled.div`
    display: flex;
    align-content: center;
    margin-left: auto;
`;

const Icon = styled(FontAwesomeIcon)`
    display: flex;
    height: auto;
    align-content: center;
    margin-right: var(--s4);
    margin-left: var(--s4);

    :first-of-type {
        margin-left: 0rem;
    }

    :last-of-type {
        margin-right: 0rem;
    }

    :hover {
        color: var(--bs-dark);
    }
`;

function IconBar({ isAuth, logoutHandler }) {
    const history = useHistory();

    const settings = () => {
        history.push("/settings");
    };

    return (
        <Wrap>
            <Icon onClick={() => settings()} icon='cog' size='lg' fixedWidth />
            {isAuth ? (
                <Icon onClick={() => logoutHandler()} icon='sign-out-alt' size='lg' fixedWidth />
            ) : (
                <Icon onClick={() => logoutHandler()} icon='sign-in-alt' size='lg' fixedWidth />
            )}
        </Wrap>
    );
}

export default IconBar;
