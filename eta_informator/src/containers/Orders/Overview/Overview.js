import axios from "axios";
import { useQuery } from "react-query";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import dayjs from "dayjs";
import { matchPath, Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import { Form } from "react-bootstrap";
import DetailModal from "../DetailModal";
import { useEffect, useState } from "react";
import ReactSwitch from "react-switch";
import Filter from "../Filter";
import { useOrders } from "../../../data/ReactQuery";

const paginationComponentOptions = {
    rowsPerPageText: "Število vrstic",
    rangeSeparatorText: "od",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Vse",
};

const unitOptions = [
    { key: "PTC2", label: "PTC2" },
    { key: "TERMOREGULATOR", label: "TERMOREGULATOR" },
    { key: "PLOŠČA", label: "PLOŠČA" },
    { key: "LIVARNA", label: "LIVARNA" },
    { key: "STROKOVNE SLUŽBE", label: "STROKOVNE SLUŽBE" },
];

const statusOptions = [
    { key: "launched", label: "Lansirana" },
    { key: "in_progress", label: "V izvajanju" },
    { key: "turned_in", label: "Oddana" },
    { key: "head_unit", label: "Direktor DE" },
    { key: "confirmed_leader", label: "Potrditev dir. orod" },
    { key: "finished", label: "Zaključena" },
];

const deadlineOptions = [
    { key: "over_deadline", label: "Čez rok" },
    { key: "less_week", label: "Manj kot teden do roka" },
    { key: "less_month", label: "Manj kot mesec do roka" },
];

function Overview(props) {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        customer: [],
        priority: [],
        unit: [],
        status: [],
        deadline: [],
    });
    const [filteredData, setFilteredData] = useState([]);
    const { t } = useTranslation(["shopfloor", "labels"]);
    const { path } = useRouteMatch();
    const [selected, setSelected] = useState(null);
    const history = useHistory();
    const match = matchPath(history.location.pathname, {
        path: path + "/detail/:order",
    });

    //* FILTER HANDLERS

    const setFilterHandler = (filterArray, property) => {
        setFilters((oldFilters) => {
            const newFilters = { ...oldFilters, [property]: filterArray };
            return newFilters;
        });
    };

    const columns = [
        {
            name: t("orderId"),
            selector: (row) => row.zaporednaSt,
            sortable: true,
        },
        {
            name: t("workorder"),
            wrap: true,
            grow: 4,
            cell: (row) => {
                if (row.pozicije?.length > 0) {
                    let string = "";
                    row.pozicije.forEach((pozicija) => {
                        const dashIndex = pozicija.DN.indexOf("-");
                        string =
                            string +
                            pozicija.DN.slice(0, dashIndex).trim() +
                            " - " +
                            pozicija.nazivIzdelka.trim() +
                            "\n";
                    });
                    return (
                        <div className='py-1' data-tag='allowRowEvents'>
                            {string?.split("\n").map((order) => {
                                return <div data-tag='allowRowEvents'>{order}</div>;
                            })}
                        </div>
                    );
                }
                return "";
            },
        },
        {
            name: t("purpose"),
            selector: (row) => row.namen,
            format: (row) => (row.namen !== "" ? row.namen?.slice(4) : ""),
            wrap: true,
        },
        {
            name: t("client"),
            selector: (row) => row.narocnik,
            sortable: true,
        },
        {
            name: t("startDate"),
            selector: (row) => row.datumZacetek,
            format: (row) => dayjs(row.datumZacetek, "YYYYMMDD").format("LL"),
            sortable: true,
        },
        {
            name: t("deadline"),
            selector: (row) => row.potrjenRok,
            format: (row) =>
                row.potrjenRok !== "" ? dayjs(row.potrjenRok, "YYYYMMDD").format("LL") : "",
            sortable: true,
        },
        {
            name: t("endDate"),
            selector: (row) => row.datumKonec,
            format: (row) =>
                row.datumKonec !== "" ? dayjs(row.datumKonec, "YYYYMMDD").format("LL") : "",
            sortable: true,
            omit: true,
        },

        {
            name: t("status"),
            selector: (row) => row.status,
            sortable: true,
        },
        {
            name: t("weight"),
            selector: (row) => row.utez,
            sortable: true,
        },
    ];

    const conditionalRowStyles = [
        {
            when: (row) => dayjs().isAfter(dayjs(row.potrjenRok)),
            style: {
                backgroundColor: "#f0808055",
                "&:hover": {
                    backgroundColor: "#de7272",
                    outlineColor: "#de7272",
                    borderBottomColor: "#de7272",
                },
            },
        },
    ];

    const orderQuery = useOrders(false, {
        onSuccess: (data) => {
            setFilteredData(data);
            if (match?.params?.order !== undefined) {
                const matchRow = data.find(
                    (item) => item.stNarocila?.trim() == match.params.order?.trim(),
                );
                setSelected(matchRow);
            }
        },
    });

    const clickHandler = (row) => {
        setSelected(row);
        history.push(`${path}/detail/${encodeURIComponent(row.stNarocila?.trim())}`);
    };

    useEffect(() => {
        if (orderQuery.isSuccess) {
            const fData = filterData(filters);
            setFilteredData(fData);
        }
    }, [filters, orderQuery.status]);

    if (orderQuery.isLoading) {
        return (
            <div
                className='d-flex justify-content-center align-items-center flex-column'
                style={{
                    zIndex: 100,
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%",
                }}
            >
                <PulseLoader loading={orderQuery.isLoading} color='gray' />
                <p className='lead' style={{ fontWeight: "500" }}>
                    {t("data_is_loading")}
                </p>
            </div>
        );
    }

    const searchedData = filteredData?.filter((entry) => {
        if (search == "") return true;
        let orders = "";
        if (entry.pozicije.length > 0) {
            entry.pozicije.forEach((pozicija) => {
                const dashIndex = pozicija.DN.indexOf("-");
                orders = orders + pozicija.DN.slice(0, dashIndex) + "\n";
            });
        }
        if (entry.zaporednaSt.includes(search) || orders.includes(search)) return true;
        else return false;
    });

    function filterData(filters) {
        let dataset = [];
        //if all filters are unset return dataset
        if (Object.values(filters).every((filter) => filter.length == 0))
            return [...orderQuery?.data];
        for (const [filter, value] of Object.entries(filters)) {
            if (value?.length == 0) continue;

            let filteredRows = [];
            const dataSource = dataset.length == 0 ? orderQuery?.data : dataset;

            switch (filter) {
                case "unit":
                    filters[filter].forEach((entry) => {
                        if (entry == "PTC2") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.narocnik == "PTC2"),
                            ];
                        }
                        if (entry == "TERMOREGULATOR") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.narocnik == "TERMOREGULATOR"),
                            ];
                        }
                        if (entry == "PLOŠČA") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.narocnik == "PLOŠČA"),
                            ];
                        }
                        if (entry == "LIVARNA") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.narocnik == "LIVARNA"),
                            ];
                        }
                        if (entry == "ORODJARNA") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.narocnik == "ORODJARNA"),
                            ];
                        }
                        if (entry == "STROKOVNE SLUŽBE") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) => entry.narocnik == "STROKOVNE SLUŽBE",
                                ),
                            ];
                        }
                    });
                    break;
                case "customer":
                    filters[filter].forEach((entry) => {
                        if (entry == "internal") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) =>
                                        entry.narocnik == "PTC2" ||
                                        entry.narocnik == "TERMOREGULATOR" ||
                                        entry.narocnik == "PLOŠČA" ||
                                        entry.narocnik == "LIVARNA" ||
                                        entry.narocnik == "ORODJARNA",
                                ),
                            ];
                        }
                        if (entry == "external") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) =>
                                        !(
                                            entry.narocnik == "PTC2" ||
                                            entry.narocnik == "TERMOREGULATOR" ||
                                            entry.narocnik == "PLOŠČA" ||
                                            entry.narocnik == "LIVARNA" ||
                                            entry.narocnik == "ORODJARNA"
                                        ),
                                ),
                            ];
                        }
                    });
                    break;
                case "weight":
                    filters[filter].forEach((priority) => {
                        if (priority == "urgent") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.utez == "Urgentno"),
                            ];
                        } else if (priority == "priority") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.utez == "Prednostno"),
                            ];
                        } else if (priority == "standard") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.utez == "Standardno"),
                            ];
                        }
                    });
                    break;
                case "status":
                    filters[filter].forEach((status) => {
                        if (status == "in_progress") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.status == "V izvajanju"),
                            ];
                        }
                        if (status == "confirmed_leader") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) => entry.status == "Potrditev dir. orod",
                                ),
                            ];
                        }
                        if (status == "turned_in") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.status == "Oddana"),
                            ];
                        }
                        if (status == "launched") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.status == "Lansirana"),
                            ];
                        }
                        if (status == "head_unit") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) => entry.status == "Direktor DE"),
                            ];
                        }
                    });
                    break;
                case "deadline":
                    filters[filter].forEach((deadline) => {
                        if (deadline == "over_deadline") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter((entry) =>
                                    dayjs().isAfter(dayjs(entry.potrjenRok, "YYYYMMDD")),
                                ),
                            ];
                        }
                        if (deadline == "less_week") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) =>
                                        dayjs()
                                            .add(1, "week")
                                            .isAfter(dayjs(entry.potrjenRok, "YYYYMMDD")) &&
                                        dayjs().isBefore(dayjs(entry.potrjenRok, "YYYYMMDD")),
                                ),
                            ];
                        }
                        if (deadline == "less_month") {
                            filteredRows = [
                                ...filteredRows,
                                ...dataSource.filter(
                                    (entry) =>
                                        dayjs()
                                            .add(1, "month")
                                            .isAfter(dayjs(entry.potrjenRok, "YYYYMMDD")) &&
                                        dayjs().isBefore(dayjs(entry.potrjenRok, "YYYYMMDD")),
                                ),
                            ];
                        }
                    });
                    break;
                default:
                    break;
            }
            dataset = filteredRows;
            if (filteredRows.length == 0) break;
        }
        return dataset;
    }

    const subheaderComponent = (
        <div className='d-flex  flex-wrap justify-content-between w-100 mb-3'>
            <div className='d-flex flex-column align-items-start justify-content-between me-2'>
                <Form.Label className='mb-0'>{t("search")}</Form.Label>
                <Form.Control
                    size='md'
                    style={{ width: "12rem", border: "2px solid lightgray" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("order_or_workorder")}
                />
            </div>
            <div className='d-flex  flex-wrap'>
                <Filter
                    property={"unit"}
                    defaultValue={t("all_units")}
                    setSelected={setFilterHandler}
                    options={unitOptions}
                />
                <Filter
                    property={"customer"}
                    defaultValue={t("all_customers")}
                    setSelected={setFilterHandler}
                    options={[
                        { key: "internal", label: t("internal") },
                        { key: "external", label: t("external") },
                    ]}
                />
                <Filter
                    property={"weight"}
                    defaultValue={t("all_priorities")}
                    setSelected={setFilterHandler}
                    options={[
                        { key: "urgent", label: t("urgent") },
                        { key: "priority", label: t("priority") },
                        { key: "standard", label: t("standard") },
                    ]}
                />
                <Filter
                    property={"status"}
                    defaultValue={t("all_statuses")}
                    setSelected={setFilterHandler}
                    options={statusOptions}
                />
                <Filter
                    property={"deadline"}
                    defaultValue={t("all_deadlines")}
                    setSelected={setFilterHandler}
                    options={deadlineOptions}
                />
            </div>
        </div>
    );

    return (
        <div>
            <div>
                <DataTable
                    columns={columns}
                    data={searchedData}
                    dense
                    pagination
                    defaultSortField='datumZacetek'
                    defaultSortAsc={false}
                    onRowClicked={(row) => clickHandler(row)}
                    noDataComponent={t("labels:no_data")}
                    highlightOnHover
                    noHeader
                    subHeader
                    subHeaderComponent={subheaderComponent}
                    paginationComponentOptions={paginationComponentOptions}
                    paginationPerPage={20}
                    conditionalRowStyles={conditionalRowStyles}
                />
            </div>
            <Switch>
                <Route
                    path={[
                        path + "/detail/:order/:position/:techSheet/:activity",
                        path + "/detail/:order/:position/:techSheet",
                        path + "/detail/:order/:position",
                        path + "/detail/:order",
                    ]}
                >
                    <DetailModal base={path} selectedRow={selected} />
                </Route>
            </Switch>
        </div>
    );
}

export default Overview;
