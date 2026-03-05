import { Badge, Col, Container, Modal, Row } from "react-bootstrap";
import { NavLink, useHistory, useParams, useRouteMatch } from "react-router-dom";
import withBreadcrumbs from "react-router-breadcrumbs-hoc";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Parameter from "./Parameter";
import dayjs from "dayjs";
import { AiOutlineWarning } from "react-icons/ai";
import DataTable from "react-data-table-component";
import { BsArrowLeft } from "react-icons/bs";
import styled from "styled-components";
import { Gantt, ViewMode } from "gantt-task-react";
import CustomGanttTooltip from "./CustomGanttTooltip";
import { generateOrderGanttData, generateReportGanttData } from "../../data/Formaters/Informator";
import { useReports } from "../../data/ReactQuery";
import ToggleGroup from "../../components/ToggleGroup/ToggleGroup";

const BackButton = styled(BsArrowLeft)`
    padding: 4px;
    border-radius: 8px;
    transition: box-shadow 0.3s ease;
    cursor: pointer;
    &:hover {
        box-shadow: var(--shadow-regular);
    }
    &:active,
    &:focus {
        box-shadow: var(--shadow-inner);
    }
`;

const BigModal = styled(Modal)`
    .modal-dialog {
        min-width: 90vw;
        height: 90vh;
    }
`;

const orderDetailToggleButtons = [
    { name: "all_items", value: 0 },
    { name: "only_active", value: 1 },
    { name: "only_finished", value: 2 },
];

const timeWindowToggleButtons = [
    { name: "day", value: "day", width: 50 },
    { name: "week", value: "week", width: 70 },
    { name: "month", value: "month", width: 100 },
];

const paginationComponentOptions = {
    rowsPerPageText: "Število vrstic",
    rangeSeparatorText: "od",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Vse",
};

function DetailModal({ base, selectedRow, ...props }) {
    const history = useHistory();
    const path = useRouteMatch();
    const { t } = useTranslation(["shopfloor", "labels"]);
    const [selectedDetail, setSelectedDetail] = useState(0);
    const [selectedTimeframe, setSelectedTimeframe] = useState("day");
    const toolshopReports = useReports();

    const reportsColumns = useMemo(
        () => [
            {
                name: t("date"),
                selector: (row) => row.date,
                format: (row) => {
                    return dayjs(row.date, "YYYYMMDD").format("LL");
                },
            },
            {
                name: t("employee"),
                selector: (row) => row.employeeName,
            },
            {
                name: t("hours"),
                selector: (row) => row.hours,
            },
            {
                name: t("operation"),
                selector: (row) => row.operation,
            },
        ],
        [t],
    );

    const positionColumns = useMemo(
        () => [
            {
                name: t("position"),
                selector: (row) => row.pozicija,
                maxWidth: "1000px",
            },
            {
                name: t("in_progress"),
                selector: (row) => {
                    if (!row.tehnoloskiListi) return 0;
                    return row.tehnoloskiListi.filter((tl) => {
                        return tl.statusTL == "V izvajanju";
                    }).length;
                },
                maxWidth: "30px",
                right: true,
            },
            {
                name: t("finished"),
                selector: (row) => {
                    if (!row.tehnoloskiListi) return 0;
                    return row.tehnoloskiListi.filter((tl) => {
                        return tl.statusTL == "Izdelan" || tl.statusTL == "Zaključen";
                    }).length;
                },
                maxWidth: "30px",
                right: true,
            },
            {
                name: t("#"),
                selector: (row) => {
                    if (!row.tehnoloskiListi) return 0;
                    return row.tehnoloskiListi.length;
                },
                maxWidth: "30px",
                right: true,
            },
            {
                name: t("title"),
                selector: (row) => row.nazivIzdelka,
                grow: 3,
            },
            {
                name: t("quantity"),
                selector: (row) => row.kolicina,
            },
        ],
        [t],
    );

    const techSheetColumns = useMemo(
        () => [
            {
                name: t("title"),
                selector: (row) => row.naziv,
            },
            {
                name: t("id"),
                selector: (row) => row.TL,
                format: (row) => {
                    const dashIndex = row.TL?.lastIndexOf("-");
                    if (dashIndex == -1) return row.TL;
                    return "TL" + row.TL?.slice(dashIndex);
                },
            },
            {
                name: t("status"),
                selector: (row) => row.statusTL,
            },
        ],
        [t],
    );

    const activityColumns = useMemo(
        () => [
            {
                name: t("title"),
                selector: (row) => row.naziv,
            },
            {
                name: t("plannedHours"),
                selector: (row) => row.planUr,
            },
            {
                name: t("realizedHours"),
                selector: (row) => row.realUr,
            },
            {
                name: t("status"),
                selector: (row) => row.status,
            },
        ],
        [t],
    );

    const routes = useMemo(() => {
        const findOrder = ({ match: { params } }) => {
            if (!selectedRow) return null;
            if (params?.activity) {
                const { pozicije } = selectedRow;
                const { tehnoloskiListi } = pozicije[params.position];
                const { aktivnosti } = tehnoloskiListi[params.techSheet];
                return aktivnosti[params.activity]?.naziv.slice(4);
            } else if (params?.techSheet) {
                const { pozicije } = selectedRow;
                if (!pozicije) return null;
                const { tehnoloskiListi } = pozicije[params?.position] || {};
                if (!tehnoloskiListi) return null;
                return tehnoloskiListi?.[params?.techSheet]?.naziv || {};
            } else if (params?.position) {
                const { pozicije } = selectedRow;
                return pozicije[params.position]?.pozicija;
            } else {
                return decodeURIComponent(params.order);
            }
        };

        return [
            { path: base + "/detail/:order", breadcrumb: findOrder },
            { path: base + "/detail/:order/:position", breadcrumb: findOrder },
            {
                path: base + "/detail/:order/:position/:techSheet",
                breadcrumb: findOrder,
            },
            {
                path: base + "/detail/:order/:position/:techSheet/:activity",
                breadcrumb: findOrder,
            },
        ];
    }, [base, selectedRow]);

    const { position, techSheet, activity, order } = useParams();
    const Breadcrumbs = withBreadcrumbs(routes, { disableDefaults: true })(({ breadcrumbs }) => (
        <h4 className='text-muted'>
            {breadcrumbs.map(({ match, breadcrumb }, i) => {
                return (
                    <span key={match.url}>
                        <NavLink to={match.url}>{breadcrumb}</NavLink>
                        {i != breadcrumbs.length - 1 ? <span>{" > "}</span> : null}
                    </span>
                );
            })}
        </h4>
    ));

    const detailLevel = activity
        ? "activity"
        : techSheet
        ? "techSheet"
        : position
        ? "position"
        : "order";

    const badgesTitle =
        detailLevel == "order"
            ? "positions"
            : detailLevel == "position"
            ? "techSheets"
            : detailLevel == "techSheet"
            ? "activities"
            : "";

    const destructData = (detailLevel, selectedRow) => {
        if (!selectedRow) return [];
        if (detailLevel == "order") {
            return selectedRow;
        } else if (detailLevel == "position") {
            const positions = selectedRow?.pozicije[position];
            if (positions == undefined) return [];
            return positions;
        } else if (detailLevel == "techSheet") {
            const tehnoloskiListi = selectedRow?.pozicije[position]?.tehnoloskiListi[techSheet];
            if (tehnoloskiListi == undefined) return [];
            return tehnoloskiListi;
        } else if (detailLevel == "activity") {
            const aktivnosti =
                selectedRow?.pozicije[position]?.tehnoloskiListi[techSheet]?.aktivnosti[activity];
            if (aktivnosti == undefined) return [];
            return aktivnosti;
        }
    };

    const displayData = useMemo(() => {
        return destructData(detailLevel, selectedRow);
    }, [detailLevel, selectedRow]);

    const parseName = (value) => {
        if (value === null || value === undefined) return "";
        const eqIndex = value.indexOf("=") + 1;
        const slashIndex = value.indexOf("/");
        return eqIndex == 0
            ? slashIndex == -1
                ? value
                : value.slice(0, slashIndex).toLowerCase()
            : value.slice(eqIndex, slashIndex).toLowerCase();
    };

    const statusColor = (status) => {
        switch (status) {
            case "Lansirana":
            case "Obdelava":
                return "secondary";
            case "V izvajanju":
                return "info";
            case "Potrditev dir. orod":
            case "Direktor DE":
                return "warning";
            case "Oddana":
            case "Zaključena":
            case "Izdelan":
                return "success";
            default:
                return "primary";
        }
    };

    const columns = () => {
        switch (detailLevel) {
            case "order":
                return positionColumns;
            case "position":
                return techSheetColumns;
            case "techSheet":
                return activityColumns;
            default:
                return null;
        }
    };

    const tableData = useMemo(() => {
        switch (detailLevel) {
            case "order":
                return displayData?.pozicije?.map((data, index) => ({
                    index: index,
                    ...data,
                }));
            case "position":
                return displayData?.tehnoloskiListi?.map((data, index) => ({
                    index: index,
                    ...data,
                }));
            case "techSheet":
                return displayData?.aktivnosti
                    ?.slice(0, -1)
                    .map((data, index) => ({ index: index, ...data }));
            default:
                return null;
        }
    }, [detailLevel, displayData]);

    const reportTableData = useMemo(() => {
        if (!selectedRow || !position || !techSheet) return [];
        if (detailLevel == "techSheet") {
            const keyTL = selectedRow?.pozicije[position]?.tehnoloskiListi[techSheet]?.keyTL;
            return toolshopReports?.data
                ?.filter((report) => {
                    return report.tlKey == keyTL;
                })
                .map((report) => {
                    return {
                        date: report.date,
                        employeeName: report.employeeName,
                        hours: report.hours,
                        operation: report.operation,
                    };
                });
        }
        return [];
    }, [selectedRow, position, techSheet, detailLevel]);

    const ganttData = useMemo(() => {
        return generateOrderGanttData(selectedRow, selectedDetail);
    }, [selectedRow, selectedDetail]);

    const reportGanttData = useMemo(() => {
        if (!selectedRow || !position || !techSheet) return [];
        if (detailLevel == "techSheet") {
            const keyTL = selectedRow?.pozicije[position]?.tehnoloskiListi[techSheet]?.keyTL;
            const techSheetReports = toolshopReports?.data?.filter((report) => {
                return report.tlKey == keyTL;
            });
            return generateReportGanttData(techSheetReports);
        }
    }, [selectedRow, position, techSheet, detailLevel, toolshopReports]);
    const dataContent = useMemo(
        () => (
            <div>
                <Row>
                    <Col xs={10}>
                        <Row className='my-1'>
                            <Col className='d-flex align-items-center flex-wrap'>
                                <Parameter
                                    property={t("title")}
                                    value={displayData.naziv}
                                    title={detailLevel === "activity"}
                                />
                                <Parameter
                                    property={t("techSheet")}
                                    value={displayData.TL}
                                    title={detailLevel === "techSheet"}
                                />
                                <Parameter
                                    property={t("orderId")}
                                    value={displayData.stNarocila}
                                    title={detailLevel === "order"}
                                />
                                <Parameter property={t("purpose")} value={displayData.namen} />
                                <Parameter
                                    property={t("position")}
                                    value={displayData.pozicija}
                                    title
                                />
                                <Parameter property={t("order")} value={displayData.DN} />
                                <Parameter
                                    property={t("product")}
                                    value={displayData.nazivIzdelka}
                                />
                            </Col>
                        </Row>
                        <Row className='my-1'>
                            <Col className='d-flex align-items-center flex-wrap'>
                                <Parameter
                                    property={t("author")}
                                    value={parseName(displayData.avtor)}
                                />
                                <Parameter
                                    property={t("admin")}
                                    value={parseName(displayData.skrbnik)}
                                />
                                {displayData.kontaktnaOseba && (
                                    <Parameter
                                        property={t("client")}
                                        value={`${parseName(displayData.kontaktnaOseba)} / ${
                                            displayData.narocnik
                                        }`}
                                    />
                                )}
                                <Parameter property={t("blueprint")} value={displayData.nacrt} />
                                {displayData.kolicina && (
                                    <Parameter
                                        property={t("quantity")}
                                        value={`${displayData.kolicina} ${displayData["$1"]}`}
                                    />
                                )}
                                {displayData.oddanaKol && (
                                    <Parameter
                                        property={t("placedQuantity")}
                                        value={`${displayData.oddanaKol} ${displayData["$1"]}`}
                                    />
                                )}
                            </Col>
                        </Row>
                        <Row className='my-1'>
                            <Col className='d-flex align-items-center'>
                                <Parameter
                                    property={t("startDate")}
                                    value={
                                        displayData.datumZacetek === "" ||
                                        displayData.datumZacetek === undefined
                                            ? ""
                                            : dayjs(displayData.datumZacetek, "YYYYMMDD").format(
                                                  "LL",
                                              )
                                    }
                                />
                                <Parameter
                                    property={t("deadline")}
                                    value={
                                        displayData.potrjenRok === "" ||
                                        displayData.potrjenRok === undefined
                                            ? ""
                                            : dayjs(displayData.potrjenRok, "YYYYMMDD").format("LL")
                                    }
                                />
                                <Parameter
                                    property={t("desiredDeadline")}
                                    value={
                                        displayData.zeljenRok === "" ||
                                        displayData.zeljenRok === undefined
                                            ? ""
                                            : dayjs(displayData.zeljenRok, "YYYYMMDD").format("LL")
                                    }
                                />
                                <Parameter
                                    property={t("desiredDeadline")}
                                    value={
                                        displayData.rokIzdelave === "" ||
                                        displayData.rokIzdelave === undefined
                                            ? ""
                                            : dayjs(displayData.rokIzdelave, "YYYYMMDD").format(
                                                  "LL",
                                              )
                                    }
                                />
                                <Parameter
                                    property={t("plannedHours")}
                                    value={displayData.planUr}
                                />
                                <Parameter
                                    property={t("realizedHours")}
                                    value={displayData.realUr}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col
                        className='d-flex flex-column align-items-end justify-content-start'
                        xs={12}
                        sm={2}
                    >
                        {displayData.utez != "" && displayData.utez != undefined ? (
                            <div className='h4'>
                                <Badge
                                    className='text-center fw-normal d-flex align-items-start'
                                    size='lg'
                                    bg={
                                        displayData.utez === "Standardno"
                                            ? "secondary"
                                            : displayData.utez === "Urgentno"
                                            ? "danger"
                                            : "warning"
                                    }
                                >
                                    {displayData.utez == "Urgentno" ? (
                                        <AiOutlineWarning className='me-1' />
                                    ) : null}
                                    {displayData.utez}
                                </Badge>
                            </div>
                        ) : null}
                        <Badge
                            className='fw-normal'
                            style={{ fontSize: "16px" }}
                            bg={statusColor(displayData.status)}
                        >
                            {displayData.status}
                        </Badge>
                        <Badge
                            className='fw-normal'
                            style={{ fontSize: "16px" }}
                            bg={statusColor(displayData.statusTL)}
                        >
                            {displayData.statusTL}
                        </Badge>
                    </Col>
                </Row>
                <Row className='mt-5'>
                    <Col xs={12}>
                        <h6>{t(badgesTitle)}</h6>
                        {detailLevel != "activity" && (
                            <DataTable
                                data={tableData}
                                columns={columns()}
                                dense
                                noDataComponent={t("labels:no_data")}
                                noHeader
                                highlightOnHover
                                pagination
                                paginationComponentOptions={paginationComponentOptions}
                                paginationPerPage={20}
                                onRowClicked={(row, event) => {
                                    history.push(`${path.url}/${row.index}`);
                                }}
                            />
                        )}
                    </Col>
                </Row>
                {detailLevel == "techSheet" && (
                    <Row>
                        <Col xs={12}>
                            <h6>{t("reported_hours")}</h6>
                            <DataTable
                                data={reportTableData}
                                columns={reportsColumns}
                                dense
                                noDataComponent={t("labels:no_data")}
                                noHeader
                                highlightOnHover
                                pagination
                                paginationComponentOptions={paginationComponentOptions}
                                paginationPerPage={20}
                            />
                        </Col>
                    </Row>
                )}
            </div>
        ),
        [detailLevel, displayData],
    );

    if (decodeURIComponent(order?.trim()) !== selectedRow.stNarocila?.trim()) return null;

    return (
        <BigModal show onHide={() => history.push(base)}>
            <Container className='pt-5'>
                <Row>
                    <Col xs={12} md={11}>
                        <Breadcrumbs />
                    </Col>
                    <Col xs={12} md={1}>
                        <div className='d-flex align-items-start' style={{ fontSize: "40px" }}>
                            <BackButton onClick={() => history.goBack()} />
                        </div>
                    </Col>
                </Row>
                <Row className='mt-4'>
                    <Col>
                        <Row>
                            <Col>{/* To add different layout */}</Col>
                        </Row>
                        <Row>
                            <Col>{dataContent}</Col>
                        </Row>
                        {detailLevel == "techSheet" && reportGanttData?.length > 0 && (
                            <div>
                                <div className='d-flex justify-content-around align-items-start my-4'>
                                    <h6>{t("reported_hours_graph")}</h6>
                                    <ToggleGroup
                                        buttons={timeWindowToggleButtons}
                                        selectedButton={selectedTimeframe}
                                        onSelected={setSelectedTimeframe}
                                        title={"orders_time_frame"}
                                    />
                                </div>
                                <Gantt
                                    style={{ overflowX: "scroll" }}
                                    viewMode={
                                        selectedTimeframe == "day"
                                            ? ViewMode.Day
                                            : selectedTimeframe == "week"
                                            ? ViewMode.Week
                                            : ViewMode.Month
                                    }
                                    tasks={reportGanttData}
                                    listCellWidth={false}
                                    columnWidth={
                                        selectedTimeframe == "day"
                                            ? 60
                                            : selectedTimeframe == "week"
                                            ? 75
                                            : 100
                                    }
                                    rowHeight={30}
                                    fontSize={12}
                                    todayColor='#00000000'
                                    locale='slv'
                                    TooltipContent={CustomGanttTooltip}
                                />
                            </div>
                        )}

                        {detailLevel == "order" && (
                            <Row>
                                <div
                                    className='d-flex flex-column align-items-center justify-content-center w-100'
                                    style={{ overflowX: "auto" }}
                                >
                                    <div className='mb-3'>
                                        <ToggleGroup
                                            buttons={orderDetailToggleButtons}
                                            selectedButton={selectedDetail}
                                            onSelected={setSelectedDetail}
                                            title={"orders_detail"}
                                        />
                                    </div>
                                    {ganttData && (
                                        <Gantt
                                            ganttHeight={500}
                                            viewMode={ViewMode.Hour}
                                            tasks={ganttData}
                                            listCellWidth={false}
                                            headerHeight={0}
                                            columnWidth={60}
                                            rowHeight={25}
                                            fontSize={12}
                                            todayColor='#00000000'
                                            TooltipContent={CustomGanttTooltip}
                                        />
                                    )}
                                </div>
                            </Row>
                        )}
                    </Col>
                </Row>
            </Container>
        </BigModal>
    );
}

export default DetailModal;
