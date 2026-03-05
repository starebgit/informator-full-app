import dayjs from "dayjs";
import { Fragment, useState, useRef, useEffect } from "react";
import { Row, Col, Tab, Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import styled from "styled-components";
import client from "../../../feathers/feathers";
import CategoryPane from "../Attachments/CategoryPane";
import EaseTab from "./EaseTab";

const StyledContainer = styled.div`
    margin-bottom: var(--s1);
`;

const StyledNav = styled(Nav)`
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
        min-height: 48px !important;
        padding: 12px 0px !important;
        border-color: #dee2e6 #dee2e6 #fff;
        min-width: 125px !important;
    }
`;

const categories = [
    { key: "5S", label: "5S" },
    { key: "IM", label: "IM" },
    { key: "LPA", label: "LPA" },
    { key: "TPM", label: "TPM" },
    { key: "EASE", label: "EASE" },
];

function Lean({ selectedUnit, selectedMonth }) {
    const { t } = useTranslation(["shopfloor", "labels"]);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [activeTab, setActiveTab] = useState("5S");
    const bottomScrollRef = useRef(null);

    const scrollToBottom = () => {
        if (selectedAttachment) {
            bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            setTimeout(() => {
                bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 200);
        }
    };

    useEffect(() => {
        setSelectedAttachment(null);
    }, [selectedMonth]);

    const attachments = useQuery(
        ["attachments", selectedUnit.subunitId, selectedMonth.format("MM")],
        () =>
            client
                .service("attachments")
                .find({
                    query: {
                        subunitId: selectedUnit.subunitId,
                        startDate: { $lte: selectedMonth.endOf("month") },
                        endDate: { $gte: selectedMonth.startOf("month") },
                    },
                })
                .then((response) => response.data),
    );

    const onClickHandler = (doc) => {
        setSelectedAttachment(doc);
        scrollToBottom();
    };

    return (
        <Fragment>
            <Tab.Container
                id='tabs'
                defaultActiveKey='EASE'
                activeKey={activeTab || "EASE"}
                onSelect={setActiveTab}
            >
                <StyledContainer>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <StyledNav
                            variant='tabs'
                            onSelect={(key) => {
                                setSelectedAttachment(null);
                                setActiveTab(key);
                            }}
                        >
                            {categories.map((category) => (
                                <Nav.Item key={category.key}>
                                    <Nav.Link eventKey={category.key}>
                                        {t("labels:" + category.label)}
                                    </Nav.Link>
                                </Nav.Item>
                            ))}
                        </StyledNav>
                    </div>

                    <Tab.Content
                        className='h-100'
                        style={{
                            boxShadow: "2px 2px 10px -2px #cccccc",
                            minHeight: "250px",
                        }}
                    >
                        {categories.map((category) => (
                            <Tab.Pane className='h-100' eventKey={category.key} key={category.key}>
                                {category.key === "EASE" ? (
                                    <EaseTab
                                        selectedUnit={selectedUnit}
                                        selectedMonth={selectedMonth}
                                    />
                                ) : (
                                    <Row>
                                        <Col>
                                            <CategoryPane
                                                attachments={attachments?.data?.filter((doc) => {
                                                    if (
                                                        dayjs(selectedMonth).isSame(
                                                            dayjs(),
                                                            "month",
                                                        )
                                                    ) {
                                                        return (
                                                            doc.category.category ===
                                                                category.label &&
                                                            dayjs(doc.startDate).isSameOrBefore(
                                                                dayjs(),
                                                                "day",
                                                            ) &&
                                                            dayjs(doc.endDate).isSameOrAfter(
                                                                dayjs(),
                                                                "day",
                                                            )
                                                        );
                                                    }

                                                    return doc.category.category === category.label;
                                                })}
                                                selectedAttachment={selectedAttachment}
                                                onClickHandler={onClickHandler}
                                            />
                                        </Col>
                                    </Row>
                                )}
                            </Tab.Pane>
                        ))}
                        <div ref={bottomScrollRef} />
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </Fragment>
    );
}

export default Lean;
