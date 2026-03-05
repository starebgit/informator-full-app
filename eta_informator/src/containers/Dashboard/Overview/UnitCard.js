import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Button } from "react-bootstrap";
import _ from "lodash";
import { useTranslation } from "react-i18next";

const Card = styled.div`
    border-radius: 10px;
    padding: 1rem;
    background: rgba(185, 209, 228, 0.2);
    margin: 1rem;
    width: 350px;
`;

const MoreButton = styled.div`
    background: white;
    margin-top: 0.5rem;
    border-radius: 12px;
    padding: 0.1rem 2rem;
    font-weight: 600;
    transition: box-shadow 0.2s ease;
    box-shadow: var(--shadow-regular);
    &:hover {
        box-shadow: var(--shadow-dark);
        cursor: pointer;
    }
`;

const RedirectButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: lightgray;
    border-radius: 10px;
    height: 30px;
    width: 30px;
    transition: box-shadow 0.2s ease;
    box-shadow: var(--shadow-regular);
    &:hover {
        box-shadow: var(--shadow-dark);
        cursor: pointer;
    }
`;

function UnitCard({ unit, setModalCards, setShow, ...props }) {
    const { t } = useTranslation("labels");

    return _.flatten(props.children).length == 0 ? null : (
        <Card>
            <Row className='g-0 d-flex align-items-center justify-content-between'>
                <h6 className='mb-0'>{t(unit)}</h6>
                <div>
                    {/*           <RedirectButton >
            <FontAwesomeIcon icon='external-link-alt'/>
          </RedirectButton> */}
                </div>
            </Row>
            <Row className='g-0 mt-2'>
                {_.flatten(props.children).length > 3 ? (
                    <div className='d-flex justify-items-end align-items-end flex-column'>
                        {_.flatten(props.children).slice(0, 3)}
                        <MoreButton
                            onClick={() => {
                                setModalCards(_.flatten(props.children));
                                setShow(true);
                            }}
                        >
                            {"+" + (_.flatten(props.children).length - 3)}
                        </MoreButton>
                    </div>
                ) : (
                    props.children
                )}
            </Row>
        </Card>
    );
}

export default UnitCard;
