import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

function SubmitMessage(props) {
    const { t } = useTranslation("labels");
    const success = props.isSuccess === true;
    return (
        <Row className='justify-conter-center'>
            <Col className='text-center'>
                <div
                    style={{
                        color: success ? "var(--bs-green)" : "var(--bs-red)",
                    }}
                    className='p-3 d-flex flex-column'
                >
                    <h3>{t(props.message)}</h3>
                    <FontAwesomeIcon
                        className='mx-auto'
                        icon={success ? "check-circle" : "times-circle"}
                        size='4x'
                    />
                </div>
            </Col>
        </Row>
    );
}

export default SubmitMessage;
