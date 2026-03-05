import styled from "styled-components";
import { useTranslation } from "react-i18next";

const Usero = styled.div`
    width: 100%;
    border-radius: 12px;
    background-color: white;
    padding: 0px 5px;
    margin: 2px;
    box-shadow: 1px 1px 2px 1px #d0d0d0;
    cursor: ${(props) => (props.editing && props.available ? "move" : "inherit")};
`;
const List = styled.div`
    div + div {
        border-top: 1px solid lightgray;
    }
    width: 100%;
`;
const Item = styled.div`
    padding: 5px 10px;
    font-size: 16px;
    color: ${(props) => (props.empty ? "gray" : "darkslategray")};
    font-weight: ${(props) => (props.empty ? "400" : "600")};
    width: 100%;
`;

function EmployeesCard({ employees, ...props }) {
    const { t } = useTranslation("shopfloor");
    return (
        <Usero className='d-flex align-items-center justify-content-between'>
            <List>
                {employees && employees.length > 0 ? (
                    employees.map((user) => {
                        return <Item key={user.id}>{user.firstname + " " + user.lastname}</Item>;
                    })
                ) : (
                    <Item empty>{t("no_employees")}</Item>
                )}
            </List>
        </Usero>
    );
}

export default EmployeesCard;
