// src/pages/Maintenance/index.jsx
import React from "react";
import { Col } from "react-bootstrap";
import { StyledContainer, StyledRow } from "../../components/Layout/StyledContainer";

export default function Maintenance() {
    return (
        <StyledContainer fluid>
            <StyledRow className='my-2'>
                <Col xs={12}>
                    <h2>Vzdrževanje</h2>
                    <p className='text-muted'>Stran je trenutno prazna.</p>
                </Col>
            </StyledRow>
        </StyledContainer>
    );
}
