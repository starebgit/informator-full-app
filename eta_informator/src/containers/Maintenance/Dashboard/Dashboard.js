import axios from "axios";
import { useQuery } from "react-query";
import Table from "../../../components/Tables/Table";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import styled from "styled-components";
import { Col, Row } from "react-bootstrap";

const dummyMain = [
    {
        Plant: "0401",
        "Sort field": "82007",
        Status: "20",
        Priority: "3",
        Location: "ETA-0402-2103",
        "Last modified": "2020-01-24T20:12:30",
        Created: "2020-01-24T20:11:38",
        "Year created": "2020",
        "Month created": "1",
        "Notification id": "000009035",
        "Order id": "008000024163",
        "Order description": "TN-TRAK ŠAMOTIRNI FI 180    ŠT.1",
        "Location description": "ŠAMOTIRNICA",
        "Equipment id": "10001778",
        "Equipment description": "TRAK ŠAMOTIRNI FI 180    ŠT.1",
        "Completed / Last changed": "24. 01. 2020",
        "Duration (h)": 0,
        "Main work center": "VZPLO",
        "Workers picked": "",
        "Workers assigned": ["MATEJ RAZPET", "SAŠO TUŠAR"],
        "Notification short description": "Stroj ne dela",
        "Notification long description": "popraviti včeraj :-)",
        "Notes document UNID": "7281A6AFD7A199DFC12584F9006983F4",
    },
    {
        Plant: "0401",
        "Sort field": "82007",
        Status: "20",
        Priority: "3",
        Location: "ETA-0402-2103",
        "Last modified": "2020-01-29T06:26:13",
        Created: "2020-01-29T06:24:32",
        "Year created": "2020",
        "Month created": "1",
        "Notification id": "000009040",
        "Order id": "008000024163",
        "Order description": "TN-TRAK ŠAMOTIRNI FI 180    ŠT.1",
        "Location description": "ŠAMOTIRNICA",
        "Equipment id": "10001778",
        "Equipment description": "TRAK ŠAMOTIRNI FI 180    ŠT.1",
        "Completed / Last changed": "29. 01. 2020",
        "Duration (h)": 0,
        "Main work center": "VZPLO",
        "Workers picked": "",
        "Workers assigned": "M-Elektronik Matjaž Lapanja",
        "Notification short description": "ŠMAT 1 ne dela",
        "Notification long description":
            "Je samo test... probaj zapreti in mi poslati SMS in mail.   - testiraj v testnem okolju !",
        "Notes document UNID": "E7DDF97BAC6826F3C12584FE001DDDF2",
    },
];

const StyledUl = styled.ul`
    list-style-type: none;
`;

const MaintenanceCard = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${(props) => (props.priority == "3" ? "red" : "blue")};
    padding: 12px;
    color: white;
`;

function Dashboard({ selectedUnit, machines, ...props }) {
    const { t } = useTranslation("manual_input");
    const statuses = {
        10: t("open"),
        20: t("reactivated"),
        30: t("assigned"),
        40: t("in_progress"),
        50: t("finished"),
    };

    const priorites = {
        1: t("urgent"),
        2: t("high"),
        3: t("medium"),
        4: t("low"),
        5: t("no_priority"),
    };
    const data = dummyMain.map((order) => {
        return {
            status: statuses[order.Status],
            priority: priorites[order.Priority],
            createdAt: dayjs(order.Created).format("LL"),
            equipmentDescription: order["Equipment description"],
            assigned: Array.isArray(order["Workers assigned"])
                ? order["Workers assigned"].join(", ")
                : order["Workers assigned"],
            notification: order["Notification long description"],
        };
    });

    const columns = [
        { name: t("status"), selector: "status" },
        {
            name: t("priority"),
            selector: "priority",
            cell: (row) => (
                <span style={{ color: row.priority == "3" ? "red" : "blue" }}>{row.priority}</span>
            ),
        },
        { name: t("created_at"), selector: "createdAt" },
        { name: t("equipment_description"), selector: "equipmentDescription" },
        {
            name: t("assigned"),
            selector: "assigned",
            cell: (row) => <div styke={{ textTransform: "lowercase" }}>{row.assigned}</div>,
        },
        { name: t("notification"), selector: "notification", wrap: true },
    ];

    const expander = ({ data }) => {
        return (
            <div style={{ boxShadow: "inset 0px 0px 2px #EEEEEE" }}>
                <StyledUl>
                    <li>{"Status: " + data.status}</li>
                    <li>{"Prioriteta: " + data.priority}</li>
                    <li>{"Notification: " + data.createdAt}</li>
                </StyledUl>
            </div>
        );
    };

    return (
        <div>
            <Row className='d-none'>
                <Col>
                    <MaintenanceCard priority='2'>
                        <h1>Test</h1>
                        <p>
                            Je samo test... probaj zapreti in mi poslati SMS in mail. - testiraj v
                            testnem okolju !
                        </p>
                        <p className='ms-auto'>23.6.2021</p>
                    </MaintenanceCard>
                </Col>
                <Col>
                    <MaintenanceCard priority='2'>
                        <h1>Test</h1>
                        <p>
                            Je samo test... probaj zapreti in mi poslati SMS in mail. - testiraj v
                            testnem okolju !
                        </p>
                        <p className='ms-auto'>23.6.2021</p>
                    </MaintenanceCard>
                </Col>
                <Col>
                    <MaintenanceCard priority='2'>
                        <h1>Test</h1>
                        <p>
                            Je samo test... probaj zapreti in mi poslati SMS in mail. - testiraj v
                            testnem okolju !
                        </p>
                        <p className='ms-auto'>23.6.2021</p>
                    </MaintenanceCard>
                </Col>
                <Col>
                    <MaintenanceCard priority='2'>
                        <h1>Test</h1>
                        <p>
                            Je samo test... probaj zapreti in mi poslati SMS in mail. - testiraj v
                            testnem okolju !
                        </p>
                        <p className='ms-auto'>23.6.2021</p>
                    </MaintenanceCard>
                </Col>
                <Col>
                    <MaintenanceCard priority='2'>
                        <h1>Test</h1>
                        <p>
                            Je samo test... probaj zapreti in mi poslati SMS in mail. - testiraj v
                            testnem okolju !
                        </p>
                        <p className='ms-auto'>23.6.2021</p>
                    </MaintenanceCard>
                </Col>
            </Row>

            <Table
                expandableRows
                expandOnRowClicked
                expandableRowsComponent={expander}
                columns={columns}
                data={data}
            />
        </div>
    );
}

export default Dashboard;
