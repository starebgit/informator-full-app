import axios from "axios";
import { useQuery } from "react-query";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";
import dayjs from "dayjs";
import { matchPath, Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import { Button, Form, Toast } from "react-bootstrap";
import DetailModal from "../DetailModal";
import { useContext, useState } from "react";
import ReactSwitch from "react-switch";
import styled from "styled-components";
import { useOrders } from "../../../data/ReactQuery";
import AnalysisModal from "./AnalysisModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../../../context/AuthContext/AuthContext";

const paginationComponentOptions = {
    rowsPerPageText: "Število vrstic",
    rangeSeparatorText: "od",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Vse",
};

const SwitchWrap = styled.div`
    display: flex;
    align-items: center;
    margin-right: 3rem;
`;

function Archive(props) {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [condition1, setCondition1] = useState(false);
    const [condition2, setCondition2] = useState(false);
    const [condition3, setCondition3] = useState(false);
    const [condition4, setCondition4] = useState(false);
    const [condition5, setCondition5] = useState(false);
    const authContext = useContext(AuthContext);
    const [toast, setToast] = useState(null);
    const { t } = useTranslation(["shopfloor", "manual_input"]);
    const { path } = useRouteMatch();
    const [selected, setSelected] = useState(null);
    const history = useHistory();
    const match = matchPath(history.location.pathname, {
        path: path + "/detail/:order",
    });
    const role = authContext.state ? authContext.state.user.role.role : null;

    const columns = [
        {
            name: t("orderId"),
            selector: (row) => row.zaporednaSt,
            sortable: true,
        },
        {
            name: t("workorder"),
            wrap: true,
            grow: 2,
            cell: (row) => {
                if (row.pozicije.length > 0) {
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
            format: (row) => (row.namen !== "" ? row.namen.slice(4) : ""),
            wrap: true,
        },
        {
            name: t("client"),
            selector: (row) => row.narocnik,
            sortable: true,
            wrap: true,
        },
        {
            name: t("startDate"),
            selector: (row) => row.datumZacetek,
            format: (row) => dayjs(row.datumZacetek, "YYYYMMDD").format("LL"),
            sortable: true,
            wrap: true,
        },
        {
            name: t("deadline"),
            selector: (row) => row.potrjenRok,
            format: (row) =>
                row.potrjenRok !== "" ? dayjs(row.potrjenRok, "YYYYMMDD").format("LL") : "",
            sortable: true,
            wrap: true,
        },
        {
            name: t("endDate"),
            selector: (row) => row.datumKonec,
            format: (row) =>
                row.datumKonec !== "" ? dayjs(row.datumKonec, "YYYYMMDD").format("LL") : "",
            sortable: true,
            wrap: true,
        },

        {
            name: t("status"),
            selector: (row) => row.status,
            sortable: true,
            width: "100px",
        },
        {
            name: t("weight"),
            selector: (row) => row.teza,
            sortable: true,
            omit: true,
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

    const orderQuery = useOrders(true, {
        onSuccess: (data) => {
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
        history.push(`${path}/detail/${encodeURIComponent(row.stNarocila)}`);
    };

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

    const filteredData = orderQuery?.data?.filter((entry) => {
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

    function filterData(data) {
        let dataset = [...data];
        if (condition1) {
            dataset = data.filter(
                (entry) =>
                    entry.narocnik == "PTC2" ||
                    entry.narocnik == "TERMOREGULATOR" ||
                    entry.narocnik == "PLOŠČA" ||
                    entry.narocnik == "LIVARNA" ||
                    entry.narocnik == "ORODJARNA",
            );
        }
        if (condition2 && !condition1) {
            dataset = data.filter(
                (entry) =>
                    !(
                        entry.narocnik == "PTC2" ||
                        entry.narocnik == "TERMOREGULATOR" ||
                        entry.narocnik == "PLOŠČA" ||
                        entry.narocnik == "LIVARNA" ||
                        entry.narocnik == "ORODJARNA"
                    ),
            );
        }

        if (condition3) {
            dataset = data.filter((entry) =>
                dayjs(entry?.datumKonec, "YYYYMMDD").isAfter(dayjs(entry.potrjenRok, "YYYYMMDD")),
            );
        }
        return dataset;
    }

    const subheaderComponent = (
        <div className='d-flex justify-content-between w-100'>
            <div className='d-flex flex-column align-items-start mb-3'>
                <Form.Label className='m-0'>{t("search")}</Form.Label>
                <Form.Control
                    size='sm'
                    style={{ width: "225px" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("order_or_workorder")}
                />
            </div>
            <div className='d-flex'>
                <SwitchWrap>
                    <label className='mb-0 me-2'>{t("only_internal")}</label>
                    <ReactSwitch
                        onChange={(current) => setCondition1(current)}
                        checked={condition1}
                        onColor='#86d3ff'
                        onHandleColor='#2693e6'
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                        activeBoxShadow='0px 0px 1px 10px rgba(0, 0, 0, 0.2)'
                        height={15}
                        width={40}
                    />
                </SwitchWrap>
                <SwitchWrap>
                    <label className='mb-0 me-2'>{t("only_external")}</label>
                    <ReactSwitch
                        onChange={(current) => setCondition2(current)}
                        checked={condition2}
                        onColor='#86d3ff'
                        onHandleColor='#2693e6'
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                        activeBoxShadow='0px 0px 1px 10px rgba(0, 0, 0, 0.2)'
                        height={15}
                        width={40}
                    />
                </SwitchWrap>
                <SwitchWrap>
                    <label className='mb-0 me-2'>{t("only_late")}</label>
                    <ReactSwitch
                        onChange={(current) => setCondition3(current)}
                        checked={condition3}
                        onColor='#86d3ff'
                        onHandleColor='#2693e6'
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow='0px 1px 5px rgba(0, 0, 0, 0.6)'
                        activeBoxShadow='0px 0px 1px 10px rgba(0, 0, 0, 0.2)'
                        height={15}
                        width={40}
                    />
                </SwitchWrap>
                {role != "sfm" && (
                    <div className='d-flex justify-content-center align-items-center'>
                        <Button onClick={() => setShowModal(true)} disabled={orderQuery.isLoading}>
                            {t("analysis")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div>
                <DataTable
                    columns={columns}
                    data={filterData(filteredData)}
                    dense
                    pagination
                    defaultSortField='datumZacetek'
                    defaultSortAsc={false}
                    onRowClicked={(row) => clickHandler(row)}
                    highlightOnHover
                    noHeader
                    subHeader
                    subHeaderComponent={subheaderComponent}
                    paginationComponentOptions={paginationComponentOptions}
                    paginationPerPage={20}
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
            <AnalysisModal
                diasbled={orderQuery.isLoading}
                show={showModal}
                setShow={setShowModal}
                ordersQuery={orderQuery}
                setToast={setToast}
            />
            <div className='position-fixed bottom-0 end-0 m-4'>
                <Toast
                    onClose={() => setToast(null)}
                    show={!!toast}
                    delay={3000}
                    autohide
                    bg={toast?.bg || "default"}
                >
                    <Toast.Header className='d-flex gap-2'>
                        <FontAwesomeIcon icon='info-circle' />
                        <strong className='me-auto'>{t("manual_input:notification")}</strong>
                    </Toast.Header>
                    <Toast.Body>{toast?.text}</Toast.Body>
                </Toast>
            </div>
        </div>
    );
}

export default Archive;
