import { Button, Container, Popover, Toast } from "react-bootstrap";
import {
    useFlaws,
    useInputLocations,
    useMachines,
    usePaginatedScraps,
    useScraps,
} from "../../../data/ReactQuery";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import dayjs from "dayjs";
import useURL from "../../../routes/useURL";
import DataTable from "react-data-table-component";
import { useMemo } from "react";
import ToggleGroup from "../../../components/ToggleGroup/ToggleGroup";
import DatePicker from "../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { useEffect } from "react";
import writeXlsxFile from "write-excel-file";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getScraps } from "../../../data/API/Informator/InformatorAPI";

const shiftToggleButtons = [
    { name: "all", value: "all" },
    { name: "shift_1", value: 1 },
    { name: "shift_2", value: 2 },
    { name: "shift_3", value: 3 },
];

const toggleButton = [
    { name: "skupno", value: "sum" },
    { name: "po_izmenah", value: "shift" },
    { name: "po_strojih", value: "machine" },
];

function DataOverview({ selectedSubunit, ...props }) {
    const { t } = useTranslation(["manual_input", "labels"]);
    const unitMachines = useMachines(selectedSubunit.ted);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState("all");
    const [selectedTimewindow, setSelectedTimewindow] = useState({
        timewindow: "all",
        date: dayjs().toDate(),
        startDate: dayjs().startOf("week").toDate(),
        endDate: dayjs().toDate(),
    });
    const [selectedInputLocation, setSelectedInputLocation] = useState("all");
    const [toast, setToast] = useState(null);
    const [scrapType, setScrapType] = useState("all");

    //* USE EFFECT
    useEffect(() => {
        setSelectedInputLocation("all");
    }, [selectedSubunit]);

    // * PAGINATION
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState(-1);
    const location = useURL().get("location");

    // * POPOVERS
    const daterangePopover = (
        <Popover className='border-0 shadow' id='popover-basic'>
            <Popover.Header className='bg-white' as='h3'>
                {t("select_date_range")}
            </Popover.Header>
            <Popover.Body>
                <div>
                    <div>
                        <DatePicker
                            selected={selectedTimewindow.startDate}
                            onSelect={(date) =>
                                setSelectedTimewindow((prev) => ({
                                    ...prev,
                                    startDate: date,
                                }))
                            }
                            selectsStart
                            startDate={selectedTimewindow.startDate}
                            endDate={selectedTimewindow.endDate}
                            showWeekNumbers
                            dateFormat={"PP"}
                        />
                        <label>{t("range_start")}</label>
                    </div>
                    <DatePicker
                        selected={selectedTimewindow.endDate}
                        onSelect={(date) =>
                            setSelectedTimewindow((prev) => ({
                                ...prev,
                                endDate: date,
                            }))
                        }
                        selectsEnd
                        startDate={selectedTimewindow.startDate}
                        endDate={selectedTimewindow.endDate}
                        minDate={selectedTimewindow.startDate}
                        showWeekNumbers
                        dateFormat={"PP"}
                    />
                    <label>{t("range_end")}</label>
                </div>
            </Popover.Body>
        </Popover>
    );

    const datePopover = (
        <Popover className='border-0 shadow' id='popover-basic'>
            <Popover.Header className='bg-white' as='h3'>
                {t("select_date")}
            </Popover.Header>
            <Popover.Body>
                <div>
                    <div>
                        <DatePicker
                            selected={selectedTimewindow.date}
                            onSelect={(date) =>
                                setSelectedTimewindow((prev) => ({
                                    ...prev,
                                    date: date,
                                }))
                            }
                            showWeekNumbers
                            dateFormat={"PP"}
                        />
                        <label>{t("date")}</label>
                    </div>
                </div>
            </Popover.Body>
        </Popover>
    );

    const timeframeButtons = [
        {
            name: "all",
            value: "all",
        },
        {
            name:
                selectedTimewindow.timewindow == "date"
                    ? dayjs(selectedTimewindow.date).format("L")
                    : "date",
            value: "date",
            type: "popover",
            popover: datePopover,
            placement: "bottom",
        },
        {
            name:
                selectedTimewindow.timewindow == "custom_range"
                    ? `${dayjs(selectedTimewindow.startDate).format("L")} - ${dayjs(
                          selectedTimewindow.endDate,
                      ).format("L")}`
                    : "custom_range",
            value: "custom_range",
            type: "popover",
            popover: daterangePopover,
            placement: "bottom",
        },
    ];

    const scrapTypeButtons = [
        { name: t("all"), value: "all" },
        { name: t("scrap"), value: "scrap" },
        { name: t("material_component"), value: "material_component" },
    ];

    //* Queries
    const flaws = useFlaws(
        ["subunit", selectedSubunit?.subunitId, location],
        { query: { $limit: 1000 } },
        (data) => {
            return data.filter(
                (flaw) =>
                    flaw.flawLocation.location.subunitId == selectedSubunit?.subunitId &&
                    flaw.flawLocation.locationId == location,
            );
        },
        { enabled: !!selectedSubunit?.subunitId && selectedSubunit?.subunitId !== null },
    );

    const inputLocations = useInputLocations(selectedSubunit.subunitId);

    const inputLocationButtons = inputLocations.data
        ? inputLocations.data.map((entry) => {
              return {
                  name: entry.name,
                  value: entry.id,
              };
          })
        : [];

    //* Scraps queries and mutations
    const scraps = usePaginatedScraps(
        [
            dayjs(selectedDate).format("YYYY-MM-DD"),
            page,
            perPage,
            sort,
            selectedShift,
            selectedTimewindow,
            selectedInputLocation,
            inputLocationButtons,
            scrapType,
        ],
        {
            query: {
                $skip: (page - 1) * perPage,
                $limit: perPage,
                $sort: {
                    date: sort,
                },
                ...(selectedShift !== "all" && {
                    shift: selectedShift,
                }),
                ...(selectedTimewindow.timewindow == "custom_range" && {
                    date: {
                        $gte: dayjs(selectedTimewindow.startDate).format("YYYY-MM-DD"),
                        $lte: dayjs(selectedTimewindow.endDate).format("YYYY-MM-DD"),
                    },
                }),
                ...(selectedTimewindow.timewindow == "date" && {
                    date: dayjs(selectedTimewindow.date).format("YYYY-MM-DD"),
                }),
                ...(selectedInputLocation !== "all"
                    ? {
                          locationId: selectedInputLocation,
                      }
                    : {
                          locationId: { $in: inputLocationButtons.map((entry) => entry.value) },
                      }),
                ...(scrapType === "scrap" && { material_component: false }),
                ...(scrapType === "material_component" && { material_component: true }),
            },
        },
        {
            enaled: !!selectedSubunit,
        },
    );

    //* Columns
    const columns = useMemo(
        () => [
            {
                name: t("date"),
                selector: (row) => row.date,
                cell: (entry) => dayjs(entry.date).format("l"),
                wrap: true,
                sortable: true,
            },
            {
                name: t("shift"),
                selector: (row) => row.shift,
                wrap: true,
            },
            {
                name: t("location"),
                selector: (row) => row.location?.name,
                wrap: true,
            },
            {
                name: t("machine"),
                selector: (row) => row.machineName,
                wrap: true,
            },
            {
                name: t("material"),
                selector: (row) => row.productCode,
                wrap: true,
            },
            {
                name: t("scrap_type"),
                selector: (row) =>
                    row.materialComponent === 1 ||
                    row.materialComponent === true ||
                    row.material_component === 1 ||
                    row.material_component === true
                        ? t("material_component")
                        : t("scrap"),
                wrap: true,
            },
            {
                name: t("flaw"),
                selector: (row) => row.flaw?.name + " - " + row.flaw?.flawLocation,
                wrap: true,
            },
            {
                name: t("quantity"),
                selector: (row) => row.value,
                wrap: true,
            },
            {
                name: t("comment"),
                selector: (row) => row.comment,
                wrap: true,
            },
        ],
        [t],
    );

    const schema = useMemo(
        () => [
            {
                column: t("date"),
                type: Date,
                format: "YYYY-MM-DD",
                value: (entry) => dayjs(entry.date).toDate(),
            },
            {
                column: t("shift"),
                type: Number,
                value: (row) => row.shift,
            },
            {
                column: t("location"),
                type: String,
                value: (row) => row.location.name,
                width: 15,
            },
            {
                column: t("machine"),
                type: String,
                value: (row) => row.machineName,
            },
            {
                column: t("material"),
                type: String,
                value: (row) => row.productCode,
            },
            {
                column: t("flaw"),
                type: String,
                value: (row) => row.flaw.name + " - " + row.flaw.flawLocation,
                width: 30,
            },
            {
                column: t("quantity"),
                type: Number,
                value: (row) => row.value,
            },
            {
                column: t("comment"),
                type: String,
                value: (row) => row.comment,
            },
        ],
        [t],
    );

    const handleExport = async (schema) => {
        const exportData = await getScraps({
            query: {
                $sort: {
                    date: sort,
                },
                ...(selectedShift !== "all" && {
                    shift: selectedShift,
                }),
                ...(selectedTimewindow.timewindow == "custom_range" && {
                    date: {
                        $gte: dayjs(selectedTimewindow.startDate).format("YYYY-MM-DD"),
                        $lte: dayjs(selectedTimewindow.endDate).format("YYYY-MM-DD"),
                    },
                }),
                ...(selectedTimewindow.timewindow == "date" && {
                    date: dayjs(selectedTimewindow.date).format("YYYY-MM-DD"),
                }),
                ...(selectedInputLocation !== "all"
                    ? {
                          locationId: selectedInputLocation,
                      }
                    : {
                          locationId: { $in: inputLocationButtons.map((entry) => entry.value) },
                      }),
            },
        });
        if (!exportData) setToast({ text: t("labels:data_download_fail"), bg: "warning" });
        const mappedData = exportData?.map((entry) => {
            const machine = unitMachines?.data.find(
                (machine) => machine.idAlt == entry.machineCode,
            );
            return {
                ...entry,
                machineName: machine.nameShort,
            };
        });

        if (!mappedData) setToast({ text: t("labels:data_download_fail"), bg: "warning" });

        await writeXlsxFile(mappedData, {
            schema,
            fileName: dayjs().format("DD-MM-YYYY_") + "quality.xlsx",
        });
        setToast({ text: t("labels:data_download_success"), bg: "default" });
    };

    const mappedData = useMemo(
        () =>
            scraps?.data?.data.map((entry) => {
                const machine = unitMachines?.data.find(
                    (machine) => machine.idAlt == entry.machineCode,
                );
                return {
                    ...entry,
                    machineName: machine?.nameShort,
                };
            }) || [],
        [scraps, unitMachines],
    );

    return (
        <Container className='mt-4 mb-5'>
            <div className='d-flex gap-4'>
                <div className='d-flex flex-column justify-start'>
                    <label>{t("labels:shift")}</label>
                    <ToggleGroup
                        buttons={shiftToggleButtons}
                        selectedButton={selectedShift}
                        onSelected={setSelectedShift}
                        title='shift_toggle_group'
                        align='left'
                        size='sm'
                    />
                </div>
                <div className='d-flex flex-column justify-start align-items-start'>
                    <label className='ms-1'>{t("labels:timewindow")}</label>
                    <ToggleGroup
                        buttons={timeframeButtons}
                        selectedButton={selectedTimewindow.timewindow}
                        onSelected={(selected) => {
                            setSelectedTimewindow((prev) => ({
                                ...prev,
                                timewindow: selected,
                            }));
                        }}
                        title='timewindow'
                        align='right'
                        size='sm'
                    />
                </div>
                <div className='d-flex flex-column justify-start align-items-start'>
                    <label className='ms-1'>{t("labels:input_location")}</label>
                    <ToggleGroup
                        buttons={[{ name: "all", value: "all" }, ...inputLocationButtons]}
                        selectedButton={selectedInputLocation}
                        onSelected={setSelectedInputLocation}
                        title='inputLocation'
                        align='right'
                        breakpoint='xs'
                        size='sm'
                    />
                </div>
                <div className='d-flex flex-column justify-start align-items-start'>
                    <label className='ms-1'>{t("labels:scrap_type")}</label>
                    <ToggleGroup
                        buttons={scrapTypeButtons}
                        selectedButton={scrapType}
                        onSelected={setScrapType}
                        title='scrapType'
                        align='right'
                        breakpoint='xs'
                        size='sm'
                    />
                </div>
                <div className='ms-auto mt-auto'>
                    <Button type='button' variant='outline' onClick={() => handleExport(schema)}>
                        <FontAwesomeIcon icon='download' color='gray' />
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mappedData}
                pagination
                paginationServer
                paginationTotalRows={scraps?.data?.total}
                onChangePage={(value) => setPage(value)}
                onChangeRowsPerPage={(value) => setPerPage(value)}
                sortServer
                onSort={(column, sortDirection) => setSort(sortDirection == "desc" ? -1 : 1)}
                dense
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
                        <strong className='me-auto'>{t("notification")}</strong>
                    </Toast.Header>
                    <Toast.Body>{toast?.text}</Toast.Body>
                </Toast>
            </div>
        </Container>
    );
}
export default DataOverview;
