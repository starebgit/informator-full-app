import { useContext } from "react";
import styled from "styled-components";
import Item from "./NavigationItem/NavigationItem";
import { NavigationContext } from "../../../context/NavigationContext/NavigationContext";
import { Nav } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext/AuthContext";

const Items = styled(Nav)`
    display: flex;
    flex-direction: ${(props) => (props.column ? "column" : "row")};
    width: 100%;
    padding: 0;
    list-style: none;
    align-items: ${(props) => (props.column ? "flex-end" : "center")};
    justify-content: flex-end;

    & a {
        text-decoration: none;
    }
`;

function NavigationItems(props) {
    const navigationContext = useContext(NavigationContext);
    const itemArray = navigationContext.navigation;
    const { state } = useContext(AuthContext);

    const items = itemArray
        ? Object.keys(itemArray)
              .filter((nav) => {
                  if (itemArray[nav]?.allowRoles && state?.user?.role) {
                      return itemArray[nav].allowRoles.includes(state.user.role.role);
                  }
                  if (itemArray[nav]?.disallowRoles && state?.user?.role) {
                      return !itemArray[nav].disallowRoles.includes(state.user.role.role);
                  }
                  return true;
              })
              .map((navKey) => {
                  return (
                      <Item
                          column={props.column}
                          onClick={props.onClick}
                          key={itemArray[navKey].title}
                          title={itemArray[navKey].title}
                          to={itemArray[navKey].path}
                          dot={itemArray[navKey].notification}
                      ></Item>
                  );
              })
        : null;

    return (
        <Items column={props.column} ref={props.refs}>
            {items}
        </Items>
    );
}

export default NavigationItems;
