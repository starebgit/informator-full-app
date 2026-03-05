import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { FormControl, Row, Col, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useQueryClient } from "react-query";
import { getNoticesByQuery } from "../../../data/API/Informator/InformatorAPI";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import findSubunitByKeyword from "../../../utils/finders";
import Notice from "./Notice";
import styled from "styled-components";
import ReactSelect from "react-select";
import _ from "lodash";
import { PulseLoader } from "react-spinners";
import parse from "html-react-parser";
import { useDebounce } from "@uidotdev/usehooks";

const SpacedRow = styled(Row)`
    min-height: 38px;
    margin-top: var(--s4);
    margin-bottom: var(--s4);
`;

function Notices(props) {
    const { t } = useTranslation(["documentation", "labels"]);
    const { state } = useContext(AuthContext);

    // States
    const [material, setMaterial] = useState(undefined);
    const debouncedMaterial = useDebounce(material, 300);
    const [form, setForm] = useState(undefined);
    const debouncedForm = useDebounce(form, 300);
    const [selectedUnit, setSelectedUnit] = useState(undefined);
    const [selectedKeyword, setSelectedKeyword] = useState(undefined);
    const [showAll, setShowAll] = useState(false);
    const [showAllInUnit, setShowAllInUnit] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [sort, setSort] = useState(-1);

    // Queries
    const queryClient = useQueryClient();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const selectedUnitSubunitIds = useMemo(
        () =>
            unitsLabels
                ?.find((unit) => unit.id == selectedUnit?.unitId)
                ?.options.map((subunit) => subunit.subunitId),
        [unitsLabels, selectedUnit],
    );

    const keywordsLabels = queryClient.getQueryData("keywordsLabels");
    const notices = useQuery(
        [
            "notices",
            showAll ? "all" : showAllInUnit ? selectedUnitSubunitIds : selectedUnit?.subunitId,
            page,
            perPage,
            sort,
            debouncedMaterial,
            debouncedForm,
            selectedKeyword?.value,
        ],
        () =>
            getNoticesByQuery(page, perPage, sort, {
                ...(!showAll && {
                    subunitId: showAllInUnit
                        ? {
                              $in: unitsLabels
                                  .find((unit) => unit.id == selectedUnit.unitId)
                                  .options.map((subunit) => subunit.subunitId),
                          }
                        : selectedUnit?.subunitId,
                }),
                ...(debouncedMaterial && {
                    $or: [
                        {
                            materialCode: {
                                $like: `%${debouncedMaterial}%`,
                            },
                        },
                        {
                            materialCode: {
                                $like: `%${debouncedMaterial}`,
                            },
                        },
                        {
                            description: {
                                $like: `%${debouncedMaterial}%`,
                            },
                        },
                        {
                            description: {
                                $like: `%${debouncedMaterial}`,
                            },
                        },
                    ],
                }),
                ...(debouncedForm && {
                    formCode: {
                        $like: `%${debouncedForm}%`,
                    },
                }),
                ...(selectedKeyword && {
                    keywordId: selectedKeyword?.value,
                }),
            }).then((result) => result),
        {
            enabled: !!selectedUnit || !!showAll,
        },
    );

    const settings = queryClient.getQueryData(["userSettings", state?.user.id]);

    // Handlers

    const selectUnitHandler = (selected) => {
        setSelectedUnit(selected);
    };

    const selectKeywordHandler = (selected) => {
        setSelectedKeyword(selected);
    };

    // Effects

    useEffect(() => {
        if (selectedUnit === undefined) {
            const label = findSubunitByKeyword(unitsLabels, settings.defaultSubunit.value);
            selectUnitHandler(label);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const noticesFiltered = useMemo(
        () =>
            notices?.data?.data?.map((notice, i) => {
                const regex =
                    material != "" && material != undefined
                        ? new RegExp("(" + material.trim().split(" ").join("|") + ")", "gi")
                        : new RegExp(null, "gi");
                const highlightedDescription = notice.description.replace(
                    regex,
                    `<span style="background-color:yellow">$&</span>`,
                );

                const description = parse(highlightedDescription);
                return {
                    id: i + 1,
                    noticeId: notice.id,
                    name: notice.title,
                    code: notice.materialCode,
                    formCode: notice.formCode,
                    subunit: notice.subunit.name,
                    description: description,
                    createdBy: notice.userId,
                    status: notice.active,
                    timestamp: notice.createdAt,
                    images: notice.uploads,
                    keywords: notice.keywords.map((keyword) => keyword.keyword),
                };
            }),
        [notices?.data, material],
    );

    return (
        <>
            <Row>
                <h2>{t("notices")}</h2>
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
                        value={material}
                        onChange={(value) => setMaterial(value.target.value)}
                        type='text'
                        placeholder={t("search")}
                    />
                </Col>
                {selectedUnit?.subunitId == "11" ? (
                    <Col xs={12} md={12} lg={12} xl={2}>
                        <FormControl
                            className='mb-1'
                            value={form}
                            onChange={(value) => setForm(value.target.value)}
                            type='text'
                            placeholder={t("labels:form_code")}
                        />
                    </Col>
                ) : null}
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
                        isClearable
                        options={keywordsLabels}
                        value={selectedKeyword}
                        placeholder={t("keywords")}
                        onChange={(selected) => selectKeywordHandler(selected)}
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
                <Notice
                    data={noticesFiltered}
                    unitsLabels={unitsLabels}
                    selectedUnit={selectedUnit}
                    material={material}
                    isLoading={notices.isLoading}
                    total={notices?.data?.total}
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

export default Notices;
