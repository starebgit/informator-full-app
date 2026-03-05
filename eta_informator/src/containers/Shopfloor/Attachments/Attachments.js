import dayjs from "dayjs";
import { Fragment, useState, useRef, useEffect } from "react";
import { Row, Col, Tab, Nav, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import styled from "styled-components";
import client from "../../../feathers/feathers";
import CategoryPane from "./CategoryPane";
import { useLocation } from "react-router-dom";

const StyledContainer = styled.div`
    ${"" /* box-shadow: 0px 5px 15px lightgray; */}
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
    { key: "misc", label: "miscellaneous" },
    { key: "dezurstvo_vn", label: "dezurstvo_vn" }, //added dezurstvo
];

const TAB_KEYS = new Set(categories.map((c) => c.key));

function Attachments({ selectedUnit, selectedMonth }) {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("misc");

    // set from URL/state only when a non-empty value is provided;
    // ignore subsequent navigations that don't specify a tab (prevents reset)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const fromQuery = (params.get("cat") || params.get("category") || params.get("tab") || "")
            .trim()
            .toLowerCase();
        const fromState = (
            (location.state &&
                (location.state.tab || location.state.cat || location.state.selectTab)) ||
            ""
        )
            .trim()
            .toLowerCase();

        const requested = fromState || fromQuery;
        if (!requested) return; // don't override current tab with empty/cleared URL

        const allowed = categories.some((c) => c.key === requested) ? requested : "misc";
        setActiveTab(allowed);
    }, [location.key]); // runs once per navigation, not on every render

    // Auto-select the first attachment of the active tab
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const { t } = useTranslation(["shopfloor", "labels", "maintenance"]);
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
    }, [activeTab]);

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
                .then((response) => {
                    const { data } = response;
                    return data;
                }),
    );

    const onClickHandler = (doc) => {
        setSelectedAttachment(doc);
        scrollToBottom();
    };

    // Auto-select the first attachment of the active tab
    useEffect(() => {
        if (activeTab !== "dezurstvo_vn") return; // <- only auto-select on this tab
        if (!attachments?.data) return;

        const catLabel = categories.find((c) => c.key === activeTab)?.label;

        const list = attachments.data.filter((doc) => {
            if (doc?.category?.category !== catLabel) return false;

            if (!dayjs(selectedMonth).isSame(dayjs(), "month")) return true;

            return (
                dayjs(doc.startDate).isSameOrBefore(dayjs(), "day") &&
                dayjs(doc.endDate).isSameOrAfter(dayjs(), "day")
            );
        });

        if (!selectedAttachment && list.length > 0) {
            setSelectedAttachment(list[0]);
            setTimeout(() => bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
    }, [attachments?.data, activeTab, selectedMonth, selectedAttachment]);

    return (
        <Fragment>
            <Tab.Container
                id='tabs'
                activeKey={activeTab}
                onSelect={(k) => {
                    if (k !== activeTab) setActiveTab(k);
                }}
            >
                <StyledContainer>
                    <StyledNav variant='tabs'>
                        {(selectedUnit?.subunitId === 11
                            ? [...categories, { key: "Plani", label: "Plani" }]
                            : categories
                        ).map((category) => {
                            return (
                                <Nav.Item key={category.key}>
                                    <Nav.Link eventKey={category.key}>
                                        {category.key === "dezurstvo_vn"
                                            ? t("maintenance:duty")
                                            : t(`labels:${category.label}`)}
                                    </Nav.Link>
                                </Nav.Item>
                            );
                        })}
                    </StyledNav>
                    <Tab.Content
                        className='h-100'
                        style={{
                            boxShadow: "2px 2px 10px -2px #cccccc",
                            minHeight: "250px",
                        }}
                    >
                        {(selectedUnit?.subunitId === 11
                            ? [...categories, { key: "Plani", label: "Plani" }]
                            : categories
                        ).map((category) => {
                            return (
                                <Tab.Pane className='h-100' eventKey={category.key}>
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
                                                            doc.category.category ==
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
                                                    return doc.category.category == category.label;
                                                })}
                                                selectedAttachment={selectedAttachment}
                                                onClickHandler={onClickHandler}
                                            />
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                            );
                        })}
                        <div ref={bottomScrollRef} />
                    </Tab.Content>
                </StyledContainer>
            </Tab.Container>
        </Fragment>
    );
}

export default Attachments;
