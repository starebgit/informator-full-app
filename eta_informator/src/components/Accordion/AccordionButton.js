import React, { useState, useContext, useEffect } from "react";
import { useAccordionButton } from "react-bootstrap/AccordionButton";
import AccordionContext from "react-bootstrap/AccordionContext";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Toggle = styled.div`
    padding: 0.5rem 0.5rem;
    border-left: {$props => props.isCurrentEventKey ? '2px solid red' : '2px solid  transparent'}
    
    background-color: var();
    &:hover{
        background-color: var(--bs-light)
    }
`;

function AccordionButton({ children, eventKey, callback }) {
    const currentEventKey = useContext(AccordionContext);

    const decoratedOnClick = useAccordionButton(eventKey, () => callback && callback(eventKey));

    const isCurrentEventKey = currentEventKey === eventKey;

    return (
        <Toggle
            type='button'
            className='d-flex align-items-center'
            style={{
                backgroundColor: isCurrentEventKey ? "lightgray" : "rgb(250,250,250)",
                padding: "0.5rem",
                marginBottom: "8px",
                transition: "background-color 0.5s ease",
                borderRadius: "4px",
            }}
            onClick={decoratedOnClick}
        >
            <div>{children}</div>
            <FontAwesomeIcon
                className='ms-auto'
                icon={isCurrentEventKey ? "angle-double-down" : "angle-double-up"}
            />
        </Toggle>
    );
}

export default AccordionButton;
