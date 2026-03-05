import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Nav } from "react-bootstrap";
import styles from "./DropdownItem.module.scss";
import { NavLink } from "react-router-dom";

function DropdownItem(props) {
    return (
        <div className={styles.DropdownItemLink}>
            <NavLink to={props.to} className={styles.DropdownItem}>
                <FontAwesomeIcon icon={props.icon} pull='left' fixedWidth />
                {props.title}
            </NavLink>
        </div>
    );
}

export default DropdownItem;
