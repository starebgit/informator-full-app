import { Accordion } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function OrderCard({ title, icon, children }) {
    return (
        <Accordion className='h-100 w-100' defaultActiveKey='0'>
            <Accordion.Item className='h-100' eventKey='0'>
                <Accordion.Body className='h-100'>
                    <div className='d-flex gap-3 align-items-baseline mb-2'>
                        <FontAwesomeIcon icon={icon} />
                        <h5 className='mb-0'>{title}</h5>
                    </div>
                    {children}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

export default OrderCard;
