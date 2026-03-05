import { Col, Row, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

function AccidentsTable(props) {
    const { t } = useTranslation(["manual_input", "labels"]);
    const transMonth = "01/" + props.month;
    const body = props.accidents?.map((accident, index) => {
        return (
            <tr key={index}>
                <td>{dayjs(accident.accidentDate).format("LLLL")}</td>
                <td>{accident.subunit.name}</td>
                <td>{t("labels:" + accident.accident_cause.cause)}</td>
                <td>{accident.description}</td>
            </tr>
        );
    });
    return (
        <>
            <Row>
                <Col>{/* <h3>{dayjs(transMonth, "DD/MM/YYYY").format("MMMM YYYY")}</h3> */}</Col>
            </Row>
            <Row>
                <Col>
                    <Table responsive>
                        <thead>
                            <tr>
                                <th style={{ width: "15%" }} scope='col' key='date'>
                                    {t("date")}
                                </th>
                                <th style={{ width: "10%" }} scope='col' key='subunit'>
                                    {t("subunit")}
                                </th>
                                <th style={{ width: "25%" }} scope='col' key='cause'>
                                    {t("cause")}
                                </th>
                                <th style={{ width: "50%" }} scope='col' key='description'>
                                    {t("description")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>{body}</tbody>
                    </Table>
                </Col>
            </Row>
        </>
    );
}

export default AccidentsTable;
