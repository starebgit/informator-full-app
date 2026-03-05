import Logo from "../../../Logo/Logo";
import ToggleButton from "../../ToggleButton/ToggleButton";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import styled from "styled-components";
import { useContext } from "react";
import { useQueryClient } from "react-query";
import { Badge } from "react-bootstrap";

const StyledHeader = styled.div`
    min-height: 84px;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 10px;
    padding: 0px 6px;

    @media only screen and (max-width: 576px) {
        justify-content: space-between;
    }
`;

function Header(props) {
    const queryClient = useQueryClient();
    return (
        <div>
            <StyledHeader>
                <Logo
                    type='logo'
                    height='64px'
                    onClick={() => {
                        window.location.reload();
                        queryClient.invalidateQueries();
                    }}
                />

                <ToggleButton setShowSidebar={props.setShowSidebar} />
                {process.env.REACT_APP_MODE ? (
                    <Badge className='ms-3 mb-3' bg='warning'>
                        {process.env.REACT_APP_MODE}
                    </Badge>
                ) : null}
            </StyledHeader>
        </div>
    );
}

export default Header;
