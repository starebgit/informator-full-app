import { Card as bCard, Nav } from "react-bootstrap";
import styled from "styled-components";

export const StyledNav = styled(Nav)`
    font-size: var(--body) !important;

    *.active {
        color: white !important;
        background-color: var(--bs-primary) !important;
        font-weight: bold;
    }
    .nav-tabs .nav-link.active,
    .nav-tabs .nav-item.show .nav-link {
        color: green;
        background-color: #fff;
        minheight: 48px !important;
        padding: 12px 0px !important;
    }
`;

export const StyledContainer = styled.div`
    ${"" /* box-shadow: 0px 5px 15px lightgray; */}
    margin-bottom: var(--s1);
`;

export const ChartWrap = styled.div`
    position: relative;
    margin: auto;
    height: 100%;
    width: 100%;
`;

export const GridItem = styled.div`
    box-shadow: 0px 0px 12px #eeeeee;
`;

export const Header = styled(bCard.Header)`
    background-color: white;
    border: unset;
`;

export const Card = styled(bCard)`
    height: 100%;

    .card-header {
        background-color: white;
        border: unset;
    }

    .card-body {
        padding: unset;
    }
`;
