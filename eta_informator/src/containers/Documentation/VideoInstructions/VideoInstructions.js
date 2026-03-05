import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FormControl, Row, Col, Form, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useQueryClient } from "react-query";
import styled from "styled-components";
import _ from "lodash";
import parse from "html-react-parser";
import { useDebounce } from "@uidotdev/usehooks";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import ReactSelect from "react-select";
import findSubunitByKeyword from "../../../utils/finders";
import { getNoticesByQuery } from "../../../data/API/Informator/InformatorAPI";
import VideoInstruction from "./VideoInstruction";
import { getVideoInstructionsByQuery } from "../../../data/API/Informator/InformatorAPI";

const StyledContainer = styled(Container)`
    overflow: hidden;
    max-width: 95%;
    padding-top: 1rem;
    min-height: 50vh;
`;

const SpacedRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

function VideoInstructions(props) {
    const { t } = useTranslation(["documentation", "labels"]);
    const { state } = useContext(AuthContext);

    // States
    const [showAll, setShowAll] = useState(false);
    const [searchText, setSearchText] = useState(undefined);
    const [selectedUnit, setSelectedUnit] = useState(undefined);
    const [showAllInUnit, setShowAllInUnit] = useState(false);
    const debouncedSearchText = useDebounce(searchText, 300);
    const [form, setForm] = useState(undefined);
    const debouncedForm = useDebounce(form, 300);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);

    // Queries
    const queryClient = useQueryClient();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);
    const selectedUnitSubunitIds = useMemo(
        () =>
            unitsLabels
                ?.find((unit) => unit.id == selectedUnit?.unitId)
                ?.options.map((subunit) => subunit.subunitId),
        [unitsLabels, selectedUnit],
    );
    const video_instructions = useQuery(
        [
            "video_instructions",
            showAll ? "all" : showAllInUnit ? selectedUnitSubunitIds : selectedUnit?.subunitId,
            page,
            perPage,
            sort,
            debouncedSearchText,
            debouncedForm,
        ],
        () =>
            getVideoInstructionsByQuery(page, perPage, sort, {
                ...(!showAll && {
                    subunitId: showAllInUnit
                        ? {
                              $in: unitsLabels
                                  .find((unit) => unit.id == selectedUnit.unitId)
                                  .options.map((subunit) => subunit.subunitId),
                          }
                        : selectedUnit?.subunitId,
                }),
                ...(debouncedSearchText && {
                    $or: [
                        {
                            materialCode: {
                                $like: `%${debouncedSearchText}%`,
                            },
                        },
                        {
                            materialCode: {
                                $like: `%${debouncedSearchText}`,
                            },
                        },
                        {
                            description: {
                                $like: `%${debouncedSearchText}%`,
                            },
                        },
                        {
                            description: {
                                $like: `%${debouncedSearchText}`,
                            },
                        },
                    ],
                }),
                ...(debouncedForm && {
                    formCode: {
                        $like: `%${debouncedForm}%`,
                    },
                }),
            }).then((result) => result),
        {
            enabled: !!selectedUnit || !!showAll,
        },
    );

    // Handlers
    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };

    // Effects
    useEffect(() => {
        if (selectedUnit === undefined) {
            const label = findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            selectUnitHandler(label);
        }
    }, []);

    const video_instructionsFiltered = useMemo(
        () =>
            video_instructions?.data?.data?.map((video_instruction, i) => {
                const regex =
                    searchText != "" && searchText != undefined
                        ? new RegExp("(" + searchText.trim().split(" ").join("|") + ")", "gi")
                        : new RegExp(null, "gi");
                const highlightedDescription = video_instruction.description.replace(
                    regex,
                    `<span style="background-color:yellow">$&</span>`,
                );

                const description = parse(highlightedDescription);
                return {
                    id: i + 1,
                    video_instructionId: video_instruction.id,
                    name: video_instruction.title,
                    subunit: video_instruction.subunit.name,
                    description: description,
                    createdBy: video_instruction.userId,
                    status: video_instruction.active,
                    timestamp: video_instruction.createdAt,
                    images: video_instruction.uploads,
                    machineCode: video_instruction.machineCode,
                };
            }),
        [video_instructions?.data, searchText],
    );

    return (
        <>
            <Row>
                <h2>{t("video_instructions")}</h2>
            </Row>
            <SpacedRow>
                <Col></Col>
                <Col
                    className='d-flex align-items-center justify-content-end'
                    xs={12}
                    md={12}
                    lg={12}
                    xl={3}
                >
                    <Form className='mx-1'>
                        <Form.Switch
                            id='show-all'
                            label={t("labels:show_all_sections")}
                            onChange={(value) => setShowAll(!showAll)}
                        />
                    </Form>
                    <Form className='ms-1'>
                        <Form.Switch
                            id='show-all_unit'
                            label={t("labels:show_all_inside_unit")}
                            disabled={showAll}
                            onChange={(value) => setShowAllInUnit(!showAllInUnit)}
                        />
                    </Form>
                </Col>
                <Col xs={12} md={12} lg={12} xl={2}>
                    <FormControl
                        className='mb-1'
                        value={searchText}
                        onChange={(value) => setSearchText(value.target.value)}
                        type='text'
                        placeholder={t("search")}
                    />
                </Col>
                <Col xs={12} md={12} lg={12} xl={2}>
                    <ReactSelect
                        styles={{
                            // Fixes the overlapping problem of the component
                            menu: (provided) => ({ ...provided, zIndex: 9999 }),
                        }}
                        components={{
                            DropdownIndicator: () => null,
                            IndicatorSeparator: () => null,
                        }}
                        isDisabled={showAll}
                        options={unitsLabels}
                        value={selectedUnit}
                        placeholder={t("section")}
                        onChange={(selected) => selectUnitHandler(selected)}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary25: window
                                    .getComputedStyle(document.documentElement)
                                    .getPropertyValue("--p25"),
                                primary50: window
                                    .getComputedStyle(document.documentElement)
                                    .getPropertyValue("--p50"),
                                primary75: window
                                    .getComputedStyle(document.documentElement)
                                    .getPropertyValue("--p75"),
                                primary: window
                                    .getComputedStyle(document.documentElement)
                                    .getPropertyValue("--p100"),
                                danger: window
                                    .getComputedStyle(document.documentElement)
                                    .getPropertyValue("--danger"),
                            },
                        })}
                    />
                </Col>
            </SpacedRow>
            <Row>
                <VideoInstruction
                    data={video_instructionsFiltered}
                    unitsLabels={unitsLabels}
                    selectedUnit={selectedUnit}
                    material={searchText}
                    isLoading={video_instructions.isLoading}
                    total={video_instructions?.data?.total}
                    handlePageChange={(value) => setPage(value)}
                    handlePerPageChange={(value) => setPerPage(value)}
                    handleSort={(column, sortDirection) =>
                        setSort(sortDirection == "desc" ? -1 : 1)
                    }
                />
            </Row>
        </>
    );
}

export default VideoInstructions;
