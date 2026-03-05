import React from "react";
import styled from "styled-components";
import Backdrop from "../Backdrop/Backdrop";

const StyledModal = styled.div`
    color: black !important;
    border-radius: 0.125rem;
    position: fixed;
    z-index: 500;
    background-color: white;
    width: 70%;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    padding: 16px 32px;
    left: 15%;
    top: 30%;
    transition: all 0.2s ease-out;

    & * {
        color: black;
    }

    @media (min-width: 600px) {
        width: 500px;
        left: calc(50% - 250px);
    }
`;

function Modal(props) {
    return (
        <React.Fragment>
            <Backdrop show={props.show} clicked={props.modalClosed}></Backdrop>
            <StyledModal style={{ opacity: props.show ? 1 : 0 }}>{props.children}</StyledModal>
        </React.Fragment>
    );
}

export default Modal;
