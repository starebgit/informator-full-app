import {
    Button,
    Card,
    Col,
    Container,
    Form,
    FormControl,
    FormLabel,
    Row,
    Tab,
    Tabs,
    InputGroup,
    Modal,
} from "react-bootstrap";
import queryClient, {
    useFlaws,
    useInputLocationMachines,
    useInputLocations,
    useMachines,
    useScraps,
} from "../../../data/ReactQuery";
import { useTranslation } from "react-i18next";
import FlawInputField from "./FlawInputField/FlawInputField";
import { PulseLoader } from "react-spinners";
import DatePicker from "../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { useRef, useState, useMemo } from "react";
import ToggleGroup from "../../../components/ToggleGroup/ToggleGroup";
import dayjs from "dayjs";
import { useMutation } from "react-query";
import { Link, useHistory } from "react-router-dom";
import {
    createScrap,
    patchScrap,
    fetchMaterials,
    fetchMaterialsInfoBulk,
} from "../../../data/API/Informator/InformatorAPI";
import { useQuery } from "react-query";
import Keyboard from "react-simple-keyboard";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { usePopper } from "react-popper";
import useURL from "../../../routes/useURL";
import { generateMachinesLabelsShort } from "../../../data/Formaters/Informator";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { BsArrowLeft, BsBookmarkFill, BsCardList } from "react-icons/bs";
import randomColor from "randomcolor";
import styled from "styled-components";
import { getFromLS, saveToLS } from "../../../utils/utils";
import { Alert } from "react-bootstrap";

const toggleButtons = [
    { name: "shift_1", value: 1 },
    { name: "shift_2", value: 2 },
    { name: "shift_3", value: 3 },
];

const numpadLayout = {
    default: ["1 2 3", "4 5 6", "7 8 9", "/ 0 .", "{bksp} {enter}"],
};

const sloveneFullLayout = {
    default: [
        "1 2 3 4 5 6 7 8 9 0 /",
        "q w e r t z u i o p š đ",
        "a s d f g h j k l č ć ž",
        "y x c v b n m , . -",
        "{space} {bksp} {enter}",
    ],
};

const Bookmark = styled(BsBookmarkFill)`
    color: ${(props) => (props.$active ? "var(--bs-primary)" : "var(--bs-light)")};
    transition: color 0.2s ease-in-out;
    &:hover {
        color: var(--bs-primary);
    }
    cursor: pointer;
`;

const DailyEntryButton = styled(Button)`
    .hoverable-text {
        transition: color 0.2s;
    }
    &:hover .hoverable-text {
        color: #e0e0e0 !important;
    }
`;

function ScrapInput({ selectedSubunit, ...props }) {
    const { t } = useTranslation(["manual_input", "labels"]);
    const { state } = useContext(AuthContext);
    const history = useHistory();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState(1);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [anchorRef, setAnchorRef] = useState(null);
    const [flawFields, setFlawFields] = useState([]);
    const [selectedFlawLocation, setSelectedFlawLocation] = useState(null);
    const [bookmarkedQALocation, setBookmarkedQALocation] = useState(
        getFromLS("bookmarkedQALocation"),
    );
    const [materialComponentFields, setMaterialComponentFields] = useState([]);
    const allowedDates = useMemo(
        () =>
            Array.from({ length: 31 }, (_, i) =>
                dayjs().subtract(i, "day").startOf("day").toDate(),
            ),
        [],
    );
    const [saveInfo, setSaveInfo] = useState({ show: false, variant: "success", text: "" });
    const [isSaving, setIsSaving] = useState(false);

    const [materialOptions, setMaterialOptions] = useState([]);
    const [showHistory, setShowHistory] = useState(true);
    const [filteredDailyScraps, setFilteredDailyScraps] = useState([]);
    const { data: dailyMaterialInfos, isLoading: materialInfosLoading } = useQuery(
        ["materialsInfo", filteredDailyScraps],
        () => fetchMaterialsInfoBulk(filteredDailyScraps),
        { enabled: showHistory && filteredDailyScraps.length > 0 },
    );
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const allowNavigationRef = useRef(false);

    const infoByCode = useMemo(() => {
        const m = {};
        (dailyMaterialInfos || []).forEach((i) => {
            // i has { Code, Name, OrderNumber }
            m[i.Code] = { name: i.Name, orderNumber: i.OrderNumber };
        });
        return m;
    }, [dailyMaterialInfos]);

    const fmtDN = (s) => (s ? s.replace(/^0+/, "") : "");
    const fmtDT = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm") : "");
    const getLatestUpdatedAt = (scrapEntries) => {
        let latest = null;
        let latestMs = -Infinity;

        (scrapEntries || []).forEach((s) => {
            const ts = s?.updatedAt || s?.createdAt;
            if (!ts) return;

            const ms = dayjs(ts).valueOf();
            if (!Number.isFinite(ms)) return;

            if (ms > latestMs) {
                latestMs = ms;
                latest = ts;
            }
        });

        return latest;
    };

    const skipOnce = useRef(false);

    const keyboard = useRef();
    const product = useRef();

    const location = useURL().get("location");

    const { control, register, setValue, errors, reset, watch, getValues } = useForm({
        defaultValues: {
            shift: selectedShift,
            selectedMachine: selectedMachine,
            productCode: null,
        },
    });
    async function upsertScrapForFlaw(flaw, value, commentValue) {
        if (!flaw?.id) return;

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return;

        const scrapEntry = scraps.data?.find(
            (s) =>
                s.flawId === flaw.id &&
                Number(s.material_component) === Number(Boolean(flaw.material_component)),
        );

        const mutationData = {
            flawId: Number(flaw.id),
            value: numericValue,
            material_component: Boolean(flaw.material_component),
            comment: commentValue ?? scrapEntry?.comment ?? "",
        };

        if (scrapEntry) {
            return await patchScrapMutation.mutateAsync({
                id: Number(scrapEntry.id),
                ...mutationData,
            });
        } else {
            return await addScrapMutation.mutateAsync(mutationData);
        }
    }
    const handleSaveClick = async () => {
        try {
            setIsSaving(true);
            setIsOpen(false);

            if (!flaws.data || !scraps.data) {
                await scraps.refetch();
            }

            const allFlaws = [
                ...Object.values(flawFields || {}).flatMap((g) => [
                    ...(g?.highlighted || []),
                    ...(g?.nonHighlighted || []),
                ]),
                ...Object.values(materialComponentFields || {}).flatMap((g) => [
                    ...(g?.highlighted || []),
                    ...(g?.nonHighlighted || []),
                ]),
            ];

            const seen = new Set();
            const uniqueFlaws = allFlaws.filter((f) => {
                const key = `${f.id}_${Number(Boolean(f.material_component))}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            await Promise.all(
                uniqueFlaws.map(async (flaw) => {
                    const fieldName = flaw.name;
                    const commentFieldName = `${flaw.name}__comment`;

                    const raw = getValues(fieldName);
                    const rawComment = getValues(commentFieldName);

                    if (raw === undefined || raw === null || raw === "") return;

                    await upsertScrapForFlaw(flaw, raw, rawComment);
                }),
            );

            await queryClient.invalidateQueries("scraps");
            await scraps.refetch();
            await allScraps.refetch();

            setHasUnsavedChanges(false);

            setSaveInfo({ show: true, variant: "success", text: "Shranjeno ✅" });
            window.setTimeout(() => setSaveInfo((p) => ({ ...p, show: false })), 2500);

            return true;
        } catch (e) {
            setSaveInfo({
                show: true,
                variant: "danger",
                text: "Shranjevanje ni uspelo. Poskusi znova.",
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!hasUnsavedChanges) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const unblock = history.block((location) => {
            if (!hasUnsavedChanges || allowNavigationRef.current) {
                return true;
            }

            setPendingNavigation(location);
            setShowLeaveModal(true);
            return false;
        });

        return () => unblock();
    }, [history, hasUnsavedChanges]);

    useEffect(() => {
        if (skipOnce.current) {
            return void (skipOnce.current = false);
        }

        const productCode = getValues("productCode");
        if (productCode && productCode.length >= 5) {
            fetchMaterials(productCode)
                .then((results) => {
                    setMaterialOptions(results || []);
                })
                .catch((err) => {
                    console.error("Fetch failed", err);
                });
        }
    }, [watch("productCode")]);

    useEffect(() => {
        function handleOutsideClick(e) {
            // if the click is outside the product-input box, close the drop-up
            if (product.current && !product.current.contains(e.target)) {
                setMaterialOptions([]); // hide the menu
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const selectedProduct = watch("productCode");

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
    const inputLocationMachines = useInputLocationMachines(location);
    const inputLocations = useInputLocations(selectedSubunit?.subunitId);
    const machines = useMachines(selectedSubunit?.ted);

    //* Scraps queries and mutations
    const scraps = useScraps(
        [
            dayjs(selectedDate).format("YYYY-MM-DD"),
            selectedShift,
            selectedMachine,
            selectedProduct,
            location,
        ],
        {
            query: {
                shift: selectedShift,
                machineCode: selectedMachine,
                productCode: selectedProduct,
                date: dayjs(selectedDate).format("YYYY-MM-DD"),
                locationId: location,
            },
        },
        {
            onSuccess: (data) => {
                if (!flaws.isSuccess) return;
                const mergedFlaws = flaws.data.map((flaw) => {
                    // Pretvori v boolean, če ni že
                    const flawMaterialComponent = Boolean(flaw.material_component);
                    const scrap = data?.find(
                        (scrap) =>
                            scrap.flawId === flaw.id &&
                            Boolean(scrap.material_component) === flawMaterialComponent,
                    );
                    return {
                        ...flaw,
                        material_component: flawMaterialComponent,
                        scrap: { ...scrap },
                    };
                });
                setFlawFieldsHandler(mergedFlaws);
            },
            //enabled: !!selectedMachine && !!selectedProduct && !!location,
            enabled: !!selectedMachine && !!location && !!selectedShift && !!selectedDate,
        },
    );

    useScraps(
        [dayjs(selectedDate).format("YYYY-MM-DD"), selectedShift, selectedMachine, location],
        {
            query: {
                shift: selectedShift,
                machineCode: selectedMachine,
                date: dayjs(selectedDate).format("YYYY-MM-DD"),
                locationId: location,
            },
        },
        {
            enabled: !!selectedMachine && !!location,
            onSuccess: (data) => {
                const sortedData = [...data].sort(
                    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
                );
                const uniqueScraps = sortedData.filter((scrap, index, arr) => {
                    return !arr
                        .slice(0, index)
                        .some(
                            (s) => s.flawId === scrap.flawId && s.productCode === scrap.productCode,
                        );
                });
                const filteredScraps = uniqueScraps.filter((scrap) => scrap.value > 0);
                const productCodes = filteredScraps.map((scrap) => scrap.productCode);
                const uniqueProductCodes = productCodes.filter((code, index, arr) => {
                    return !arr.slice(0, index).some((c) => c === code);
                });
                setFilteredDailyScraps(uniqueProductCodes);
            },
        },
    );

    const addScrapMutation = useMutation(
        (values) =>
            createScrap({
                ...values,
                shift: selectedShift,
                machineCode: selectedMachine,
                productCode: selectedProduct,
                locationId: +location,
                date: dayjs(selectedDate).format("YYYY-MM-DD"),
                value: +values.value,
                subunitId: selectedSubunit?.subunitId,
                userId: state.user.id,
                material_component: Boolean(values.material_component),
                comment: values.comment || "",
            }),
        {
            onSuccess: async () => {
                queryClient.invalidateQueries("scraps");
                scraps.refetch();
            },
        },
    );

    const patchScrapMutation = useMutation((values) => patchScrap(values), {
        onSuccess: async () => {
            queryClient.invalidateQueries("scraps");
            scraps.refetch();
        },
    });

    const allScraps = useScraps(
        [dayjs(selectedDate).format("YYYY-MM-DD"), selectedShift, selectedMachine, location],
        {
            query: {
                shift: selectedShift,
                machineCode: selectedMachine,
                date: dayjs(selectedDate).format("YYYY-MM-DD"),
                locationId: location,
            },
        },
        {
            enabled: !!selectedMachine && !!location,
        },
    );

    const continueNavigation = () => {
        if (!pendingNavigation) return;

        allowNavigationRef.current = true;
        setShowLeaveModal(false);

        history.push(
            `${pendingNavigation.pathname}${pendingNavigation.search}${
                pendingNavigation.hash || ""
            }`,
        );
    };

    const handleStayOnPage = () => {
        setShowLeaveModal(false);
        setPendingNavigation(null);
    };

    const handleLeaveWithoutSaving = () => {
        setHasUnsavedChanges(false);
        continueNavigation();
    };

    const handleSaveAndLeave = async () => {
        const ok = await handleSaveClick();
        if (!ok) return;

        continueNavigation();
    };

    //* Popper
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);
    const { update, styles, attributes } = usePopper(anchorRef, popperElement, {
        modifiers: [{ name: "arrow", options: { element: arrowElement } }],
    });

    const handleRefChange = (ref, name) => {
        setAnchorRef(ref.current);
        setSelectedField(name);
        setIsOpen(true);
    };

    //Popper useEffect - close popper when clicked outside of it and update popper position
    useEffect(() => {
        if (update) {
            update();
        }

        function handleClickOutside(e) {
            if (popperElement && !popperElement.contains(e.target)) {
                setIsOpen(false);

                if (selectedField === "productCode") {
                    scraps.refetch();
                }
            }
        }

        document.addEventListener("click", handleClickOutside, {
            capture: true,
        });

        return () =>
            document.removeEventListener("click", handleClickOutside, {
                capture: true,
            });
    }, [anchorRef, update, popperElement, popperElement, selectedField]);

    useEffect(() => {
        //If bookmarked location is set and different than null
        if (!!bookmarkedQALocation && bookmarkedQALocation != null) {
            history.push(`/quality-assurance/scrap-input?location=${bookmarkedQALocation}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!location) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    //* Handler functions
    const handleChange = (input) => {
        setValue(selectedField, input, { shouldDirty: true });
        if (selectedField !== "productCode") {
            markAsDirty();
        }
    };

    const onKeyPress = (button) => {
        if (button === "{enter}") {
            if (selectedField === "productCode") {
                scraps.refetch();
            }
            setIsOpen(false);
        }
    };

    const onShiftChangeHandler = (value) => {
        setSelectedShift(value);
    };

    const onMachineChangeHandler = (value) => {
        setSelectedMachine(value);
    };

    const setFlawFieldsHandler = (flaws) => {
        const groupedFlaws = {};
        const groupedMaterialComponentFlaws = {};

        flaws?.forEach((flaw) => {
            const locationName = flaw.flawLocation.name;

            // Če je material_component === true in highlight === false
            if (flaw.material_component && !flaw.highlight) {
                if (!groupedMaterialComponentFlaws[locationName]) {
                    groupedMaterialComponentFlaws[locationName] = {
                        highlighted: [],
                        nonHighlighted: [],
                    };
                }
                groupedMaterialComponentFlaws[locationName].highlighted.push(flaw);
                return; // Ne dodaj v običajne flaws!
            }

            // Ostali flaws
            if (!groupedFlaws[locationName]) {
                groupedFlaws[locationName] = { highlighted: [], nonHighlighted: [] };
            }
            if (flaw.highlight) {
                groupedFlaws[locationName].highlighted.push(flaw);
            } else {
                groupedFlaws[locationName].nonHighlighted.push(flaw);
            }
        });

        setFlawFields({ ...groupedFlaws });
        setMaterialComponentFields({ ...groupedMaterialComponentFlaws });
    };

    const markAsDirty = () => {
        setHasUnsavedChanges(true);
    };

    const setBookmark = () => {
        if (bookmarkedQALocation) {
            saveToLS("bookmarkedQALocation", bookmarkedQALocation === location ? null : location);
            setBookmarkedQALocation(bookmarkedQALocation === location ? null : location);
            return;
        }
        if (location) {
            saveToLS("bookmarkedQALocation", location);
            setBookmarkedQALocation(location);
        }
    };

    if (!location)
        return (
            <Container className='mt-4 mb-5'>
                <Card className='border-0 rounded-3 shadow' style={{ height: "70vh" }}>
                    <Card.Body className='p-5 h-100'>
                        <h4>{t("select_input_location")}</h4>
                        <div className='h-100'>
                            <div className='d-flex justify-content-center align-items-center flex-wrap h-100'>
                                {inputLocations.isLoading ? (
                                    <div
                                        className='d-flex flex-column justify-content-center align-items-center'
                                        style={{
                                            width: "100%",
                                            minHeight: "300px",
                                        }}
                                    >
                                        <PulseLoader color='#2c3e50' size={15} margin={10} />
                                        {t("data_is_loading")}
                                    </div>
                                ) : inputLocations.data?.length > 0 ? (
                                    inputLocations.data.map((location) => (
                                        <Link
                                            key={location.id}
                                            as={Button}
                                            to={`/quality-assurance/scrap-input?location=${location.id}`}
                                            className='btn btn-lg btn-outline-primary m-2'
                                        >
                                            {location.name}
                                        </Link>
                                    ))
                                ) : (
                                    <div>
                                        <h5>{t("no_input_locations")}</h5>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        );

    let content = null;
    if (inputLocationMachines.isLoading || machines.isLoading) {
        content = (
            <div
                className='d-flex flex-column justify-content-center align-items-center'
                style={{ width: "100%", minHeight: "300px" }}
            >
                <PulseLoader color='#2c3e50' size={15} margin={10} />
                {t("data_is_loading")}
            </div>
        );
    } else {
        content = (
            <>
                <Row>
                    <Col xs={12} lg={6}>
                        <h4>{t("production_data")}</h4>
                    </Col>
                    <Col></Col>
                    <Col className='d-flex gap-1 align-items-center' xs={12} lg={2}>
                        <Link
                            key={location?.id + "back"}
                            as={Button}
                            to={`/quality-assurance/scrap-input`}
                            className='btn btn-lg btn-outline-primary my-2 my-lg-0 w-100'
                        >
                            {
                                inputLocations.data?.find(
                                    (locationEntry) => locationEntry.id == location,
                                )?.name
                            }
                        </Link>
                        <Bookmark
                            $active={location == bookmarkedQALocation}
                            onClick={setBookmark}
                            className='fs-1'
                        />
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} lg={4}>
                        <FormLabel>{t("date")}</FormLabel>
                        <DatePicker
                            selected={selectedDate}
                            onSelect={(date) => setSelectedDate(date)}
                            dateFormat='PPP'
                            /*disabled={ ... }*/
                            maxDate={new Date()}
                            includeDates={allowedDates}
                        />
                    </Col>
                    <Col className='mt-2 mt-lg-0' xs={12} lg={3}>
                        <div className='d-flex flex-column justify-content-start h-100'>
                            <FormLabel>{t("shift")}</FormLabel>
                            <ToggleGroup
                                buttons={toggleButtons}
                                selectedButton={selectedShift}
                                onSelected={onShiftChangeHandler}
                                title={"shifts"}
                                align='left'
                                size='md'
                            />
                        </div>
                    </Col>
                </Row>
                <Row className='mt-3'>
                    <Col xs={12} lg={4}>
                        <FormLabel>{t("product_id")}</FormLabel>
                        <div
                            ref={product}
                            onClick={() => handleRefChange(product, "productCode")}
                            className='position-relative'
                        >
                            <InputGroup>
                                <FormControl
                                    placeholder='Vnesi kodo ali vsaj 5 znakov za iskanje'
                                    {...register("productCode")}
                                    type='string'
                                    autoComplete='off'
                                />
                                <Button
                                    variant='outline-primary'
                                    className='border'
                                    style={{ borderRadius: "0 .25rem .25rem 0" }}
                                    onClick={() => setValue("productCode", "")}
                                >
                                    Počisti
                                </Button>
                            </InputGroup>
                            {materialOptions.length > 0 && (
                                <div
                                    className='dropdown-menu show dropdown-up'
                                    style={{ maxHeight: "200px", overflowY: "auto" }}
                                >
                                    {materialOptions.map((item, index) => (
                                        <div
                                            key={index}
                                            className='dropdown-item'
                                            onClick={() => {
                                                setValue("productCode", item.Code);
                                                setMaterialOptions([]);
                                                skipOnce.current = true;
                                                scraps.refetch();
                                            }}
                                        >
                                            {item.Code} – {item.Description}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col xs={12} lg={8}>
                        <div className='d-flex flex-column justify-content-start h-100'>
                            <Form.Label>{t("machine")}</Form.Label>
                            <ToggleGroup
                                buttons={generateMachinesLabelsShort(
                                    machines.data?.filter((machine) =>
                                        inputLocationMachines.data?.find(
                                            (inputMachine) =>
                                                inputMachine.machineCode === machine.idAlt,
                                        ),
                                    ) || [],
                                )}
                                selectedButton={selectedMachine}
                                onSelected={onMachineChangeHandler}
                                title='machines'
                                align='left'
                                size='md'
                            />
                        </div>
                    </Col>
                </Row>
                <Row className='mt-3'>
                    <Col xs={12} className='d-flex align-items-center gap-3'>
                        <Button
                            variant='primary'
                            onClick={handleSaveClick}
                            disabled={
                                isSaving ||
                                !selectedMachine ||
                                !location ||
                                !selectedDate ||
                                !selectedShift ||
                                !selectedProduct
                            }
                        >
                            {isSaving ? "Shranjujem..." : "Shrani"}
                        </Button>

                        {saveInfo.show && (
                            <Alert className='mb-0 py-2' variant={saveInfo.variant}>
                                {saveInfo.text}
                            </Alert>
                        )}
                    </Col>
                </Row>
                {!selectedMachine ? (
                    <div className='d-flex justify-content-center'>
                        <h5 className='mt-4'>{t("select_machine")}</h5>
                    </div>
                ) : !selectedProduct ? (
                    <div className='mt-4'>
                        <div className='d-flex align-items-center gap-2 mb-2'>
                            {filteredDailyScraps.length > 0 && (
                                <Button
                                    variant='outline-primary'
                                    className='d-flex align-items-center gap-2'
                                    onClick={() => setShowHistory((prev) => !prev)}
                                    title={t("daily_flaws_list")}
                                >
                                    <BsCardList size={20} />
                                    {showHistory ? t("daily_flaws") : t("daily_flaws")}
                                </Button>
                            )}
                            {(flaws.isLoading || scraps.isLoading) && (
                                <PulseLoader color='#2c3e50' className='ms-3' size={5} margin={3} />
                            )}
                        </div>
                        <Col>
                            {showHistory && (
                                <div className='mt-3'>
                                    {materialInfosLoading && (
                                        <div className='mb-2'>
                                            <PulseLoader size={6} margin={3} />
                                        </div>
                                    )}
                                    {filteredDailyScraps.map((code, index) => {
                                        const info = infoByCode[code] || {};
                                        // Uporabi allScraps.data!
                                        const scrapsForProduct =
                                            allScraps.data?.filter(
                                                (s) => s.productCode === code && s.value > 0,
                                            ) || [];

                                        const latestTs = getLatestUpdatedAt(scrapsForProduct);
                                        const latestDt = fmtDT(latestTs);

                                        const flawsString = scrapsForProduct
                                            .map((s) => {
                                                const flaw = flaws.data?.find(
                                                    (f) => f.id === s.flawId,
                                                );
                                                const flawName = flaw ? flaw.name : s.flawId;
                                                let flawPart = `${flawName}: ${s.value}`;
                                                if (s.comment) flawPart += ` (${s.comment})`;
                                                return flawPart;
                                            })
                                            .join(" • ");

                                        const flawsStringWithDt =
                                            flawsString && latestDt
                                                ? `${flawsString} @ ${latestDt}`
                                                : flawsString;

                                        return (
                                            <DailyEntryButton
                                                key={index}
                                                variant='outline-primary'
                                                className='mb-2 btn-sm d-block text-start'
                                                onClick={() => setValue("productCode", code)}
                                            >
                                                <div className='d-flex flex-row align-items-center flex-wrap'>
                                                    <span className='fw-bold me-2'>{code}</span>
                                                    {info.name && (
                                                        <>
                                                            <span className='mx-2 hoverable-text'>
                                                                •
                                                            </span>
                                                            <span className='fw-normal text-muted hoverable-text'>
                                                                {info.name}
                                                            </span>
                                                        </>
                                                    )}
                                                    {info.orderNumber && (
                                                        <>
                                                            <span className='mx-2 hoverable-text'>
                                                                •
                                                            </span>
                                                            <span className='fw-normal text-muted hoverable-text'>
                                                                DN {fmtDN(info.orderNumber)}
                                                            </span>
                                                        </>
                                                    )}
                                                    {flawsStringWithDt && (
                                                        <>
                                                            <span className='mx-2 hoverable-text'>
                                                                •
                                                            </span>
                                                            <span className='fw-normal text-muted hoverable-text'>
                                                                {flawsStringWithDt}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </DailyEntryButton>
                                        );
                                    })}
                                </div>
                            )}
                        </Col>
                        <div className='d-flex justify-content-center mt-5'>
                            <h5>{t("select_product")}</h5>
                        </div>
                    </div>
                ) : Object.keys(flawFields)?.length > 0 ? (
                    <div className='mt-4'>
                        <div className='d-flex align-items-center gap-2 mb-2'>
                            <h4 className='mb-0'>Napake</h4>
                            {filteredDailyScraps.length > 0 && (
                                <Button
                                    variant='outline-primary'
                                    className='d-flex align-items-center gap-2'
                                    onClick={() => setShowHistory(!showHistory)}
                                    title={t("daily_flaws_list")}
                                >
                                    <BsCardList size={20} />
                                    Dnevni vnosi
                                </Button>
                            )}
                            {(flaws.isLoading || scraps.isLoading) && (
                                <PulseLoader color='#2c3e50' className='ms-3' size={5} margin={3} />
                            )}
                        </div>
                        <Col>
                            {showHistory && (
                                <div className='mt-3'>
                                    {materialInfosLoading && (
                                        <div className='mb-2'>
                                            <PulseLoader size={6} margin={3} />
                                        </div>
                                    )}
                                    {filteredDailyScraps.map((code, index) => {
                                        const info = infoByCode[code] || {};
                                        const scrapsForProduct =
                                            allScraps.data?.filter(
                                                (s) => s.productCode === code && s.value > 0,
                                            ) || [];

                                        const latestTs = getLatestUpdatedAt(scrapsForProduct);
                                        const latestDt = fmtDT(latestTs);

                                        const flawsString = scrapsForProduct
                                            .map((s) => {
                                                const flaw = flaws.data?.find(
                                                    (f) => f.id === s.flawId,
                                                );
                                                const flawName = flaw ? flaw.name : s.flawId;
                                                let flawPart = `${flawName}: ${s.value}`;
                                                if (s.comment) flawPart += ` (${s.comment})`;
                                                return flawPart;
                                            })
                                            .join(" • ");

                                        const flawsStringWithDt =
                                            flawsString && latestDt
                                                ? `${flawsString} @ ${latestDt}`
                                                : flawsString;

                                        return (
                                            <Button
                                                key={index}
                                                variant='outline-primary'
                                                className='mb-2 btn-sm d-block text-start'
                                                onClick={() => setValue("productCode", code)}
                                            >
                                                <div className='d-flex flex-row align-items-center flex-wrap'>
                                                    <span className='fw-bold me-2'>{code}</span>
                                                    {info.name && (
                                                        <>
                                                            <span className='mx-2'>•</span>
                                                            <span className='fw-normal text-muted'>
                                                                {info.name}
                                                            </span>
                                                        </>
                                                    )}
                                                    {info.orderNumber && (
                                                        <>
                                                            <span className='mx-2'>•</span>
                                                            <span className='fw-normal text-muted'>
                                                                DN {fmtDN(info.orderNumber)}
                                                            </span>
                                                        </>
                                                    )}
                                                    {flawsStringWithDt && (
                                                        <>
                                                            <span className='mx-2'>•</span>
                                                            <span className='fw-normal text-muted'>
                                                                {flawsStringWithDt}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </Col>
                        <Tabs
                            defaultActiveKey='highrunners'
                            id='flaws-tabs'
                            className='mb-3'
                            onSelect={() => setSelectedFlawLocation(null)}
                        >
                            <Tab eventKey='highrunners' title={t("highrunners")}>
                                {Object.keys(flawFields)
                                    ?.sort((a, b) => a.localeCompare(b))
                                    .map((flawLocation, i) => {
                                        const bg = randomColor({
                                            luminosity: "dark",
                                            seed: flawLocation + flawLocation,
                                            format: "rgba",
                                            alpha: 0.2,
                                        });
                                        if (flawFields[flawLocation].highlighted.length > 0)
                                            return (
                                                <Row
                                                    style={{ background: bg }}
                                                    className='mx-0 mx-lg-1 p-2 rounded mb-1 pb-3'
                                                    key={"row_" + flawLocation}
                                                >
                                                    <h5 className='mb-0'>{flawLocation}</h5>
                                                    {flawFields[flawLocation].highlighted.map(
                                                        (flaw, i) => (
                                                            <Col
                                                                key={
                                                                    flaw.id +
                                                                    "- " +
                                                                    flaw.scrap.id +
                                                                    "- " +
                                                                    i
                                                                }
                                                                xs={12}
                                                                md={6}
                                                                xxl={2}
                                                            >
                                                                <FlawInputField
                                                                    addScrapMutation={
                                                                        addScrapMutation
                                                                    }
                                                                    patchScrapMutation={
                                                                        patchScrapMutation
                                                                    }
                                                                    flaw={flaw}
                                                                    control={control}
                                                                    register={register}
                                                                    setValue={setValue}
                                                                    getValues={getValues}
                                                                    handleRefChange={
                                                                        handleRefChange
                                                                    }
                                                                    virtualKeyboard={isOpen}
                                                                    markAsDirty={markAsDirty}
                                                                    displayLocation={false}
                                                                />
                                                            </Col>
                                                        ),
                                                    )}
                                                </Row>
                                            );
                                    })}
                            </Tab>
                            <Tab eventKey='all_flaws' title={t("other_flaws")}>
                                {selectedFlawLocation == null ? (
                                    <div className='d-flex justify-content-center align-items-center gap-3 mt-5 flex-wrap'>
                                        {Object.keys(flawFields).map((flawLocation, i) => {
                                            return flawFields[flawLocation]?.nonHighlighted
                                                ?.length > 0 ? (
                                                <Button
                                                    key={"btn_" + flawLocation + "_" + i}
                                                    variant='outline-primary'
                                                    onClick={() =>
                                                        setSelectedFlawLocation(flawLocation)
                                                    }
                                                >
                                                    <div className='fs-6'>{t(flawLocation)}</div>
                                                </Button>
                                            ) : null;
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <Button
                                                key='back_btn'
                                                onClick={() => setSelectedFlawLocation(null)}
                                                variant='outline-primary'
                                                className='d-flex align-items-center gap-2 my-3'
                                                size='sm'
                                            >
                                                <BsArrowLeft className='fs-3' />
                                                <div className='mb-0 fs-6'>
                                                    {t(selectedFlawLocation)}
                                                </div>
                                            </Button>
                                        </div>
                                        <Row className='mx-xs-1 mx-md-3'>
                                            {flawFields[selectedFlawLocation].nonHighlighted
                                                ?.sort((a, b) =>
                                                    a.flawLocation.name.localeCompare(
                                                        b.flawLocation.name,
                                                    ),
                                                )
                                                .map((flaw, i) => (
                                                    <Col
                                                        key={
                                                            flaw.id +
                                                            "- " +
                                                            flaw.scrap.id +
                                                            "- " +
                                                            i
                                                        }
                                                        xs={16}
                                                        md={6}
                                                        xxl={2}
                                                    >
                                                        <FlawInputField
                                                            flaw={flaw}
                                                            register={register}
                                                            addScrapMutation={addScrapMutation}
                                                            patchScrapMutation={patchScrapMutation}
                                                            control={control}
                                                            setValue={setValue}
                                                            getValues={getValues}
                                                            handleRefChange={handleRefChange}
                                                            virtualKeyboard={isOpen}
                                                            markAsDirty={markAsDirty}
                                                            displayLocation={false}
                                                        />
                                                    </Col>
                                                )) || t("no_flaws")}
                                        </Row>
                                    </>
                                )}
                            </Tab>
                            <Tab eventKey='material_component' title={t("material_component")}>
                                {Object.keys(materialComponentFields)
                                    ?.sort((a, b) => a.localeCompare(b))
                                    .map((flawLocation, i) => {
                                        const bg = randomColor({
                                            luminosity: "dark",
                                            seed: flawLocation + flawLocation,
                                            format: "rgba",
                                            alpha: 0.2,
                                        });
                                        if (
                                            materialComponentFields[flawLocation].highlighted
                                                .length > 0
                                        )
                                            return (
                                                <Row
                                                    style={{ background: bg }}
                                                    className='mx-0 mx-lg-1 p-2 rounded mb-1 pb-3'
                                                    key={"row_" + flawLocation}
                                                >
                                                    <h5 className='mb-0'>{flawLocation}</h5>
                                                    {materialComponentFields[
                                                        flawLocation
                                                    ].highlighted.map((flaw, i) => (
                                                        <Col
                                                            key={
                                                                flaw.id +
                                                                "- " +
                                                                flaw.scrap.id +
                                                                "- " +
                                                                i
                                                            }
                                                            xs={12}
                                                            md={6}
                                                            xxl={2}
                                                        >
                                                            <FlawInputField
                                                                addScrapMutation={addScrapMutation}
                                                                patchScrapMutation={
                                                                    patchScrapMutation
                                                                }
                                                                flaw={flaw}
                                                                control={control}
                                                                register={register}
                                                                setValue={setValue}
                                                                getValues={getValues}
                                                                handleRefChange={handleRefChange}
                                                                virtualKeyboard={isOpen}
                                                                markAsDirty={markAsDirty}
                                                                displayLocation={false}
                                                            />
                                                        </Col>
                                                    ))}
                                                </Row>
                                            );
                                    })}
                            </Tab>
                        </Tabs>
                    </div>
                ) : (
                    <div>
                        <h5 className='mt-4'>{t("no_flaws")}</h5>
                    </div>
                )}
            </>
        );
    }

    return (
        <Container fluid className='my-4'>
            <Card className='border-0 rounded-3 shadow'>
                <Card.Body className='p-5'>{content}</Card.Body>
            </Card>

            {isOpen && (
                <div
                    ref={setPopperElement}
                    style={{ ...styles.popper, minWidth: "300px" }}
                    {...attributes.popper}
                    className='p-3 shadow rounded bg-white mt-1'
                >
                    <Keyboard
                        keyboardRef={(r) => (keyboard.current = r)}
                        layout={sloveneFullLayout}
                        display={{
                            "{bksp}": "←",
                            "{enter}": "Enter",
                            "{space}": " ",
                        }}
                        onChange={handleChange}
                        onKeyPress={onKeyPress}
                    />
                </div>
            )}
            <Modal show={showLeaveModal} onHide={handleStayOnPage} centered size='lg'>
                <Modal.Header closeButton className='border-0 pb-0'>
                    <Modal.Title>Neshranjene spremembe</Modal.Title>
                </Modal.Header>
                <Modal.Body className='pt-2'>
                    Imaš neshranjene podatke. Ali jih želiš shraniti pred odhodom?
                </Modal.Body>
                <Modal.Footer className='d-flex justify-content-between align-items-center gap-2 border-0'>
                    <Button variant='secondary' onClick={handleStayOnPage}>
                        Prekliči
                    </Button>

                    <div className='d-flex gap-2 justify-content-end'>
                        <Button variant='outline-danger' onClick={handleLeaveWithoutSaving}>
                            Zapusti brez shranjevanja
                        </Button>

                        <Button variant='primary' onClick={handleSaveAndLeave} disabled={isSaving}>
                            {isSaving ? "Shranjujem..." : "Shrani in zapusti"}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
export default ScrapInput;
