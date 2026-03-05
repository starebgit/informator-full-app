import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Button = styled.div`
    position: fixed;
    width: 50px;
    right: 15px;
    bottom: 40px;
    height: 50px;
    font-size: 2rem;
    z-index: 3000;
    cursor: pointer;
    color: var(--bs-white);
    background-color: var(--bs-secondary);
    border-radius: 50px;
`;

const ScrollButton = () => {
    const [visible, setVisible] = useState(false);

    const toggleVisible = () => {
        const scrolled = document.documentElement.scrollTop;
        if (scrolled > 300) {
            setVisible(true);
        } else if (scrolled <= 300) {
            setVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
            /* you can also use 'auto' behaviour
         in place of 'smooth' */
        });
    };
    useEffect(() => {
        window.addEventListener("scroll", toggleVisible);
        return () => {
            window.removeEventListener("scroll", toggleVisible);
            setVisible(false);
        };
    }, []);

    return (
        <Button style={{ display: visible ? "inline" : "none" }}>
            <FontAwesomeIcon
                className='p-2'
                icon={"arrow-up"}
                onClick={scrollToTop}
                style={{
                    width: "100%",
                    height: "100%",
                    display: visible ? "inline" : "none",
                }}
            />
        </Button>
    );
};

export default ScrollButton;
