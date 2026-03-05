import { Collapse, Button } from "react-bootstrap";
import React, { useState } from "react";
import { Card } from "../../components/UI/ShopfloorCard/ShopfloorCard";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Table from "../Tables/Table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "../Forms/CustomInputs/Select/Select";
import _ from "lodash";
import ToggleGroup from "../ToggleGroup/ToggleGroup";
import { useEffect } from "react";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "react-bootstrap";

const StyledSearch = styled(FontAwesomeIcon)`
    color: var(--bs-gray-700);
    transition: color 0.1s ease-in-out;
    &:hover {
        color: var(--bs-gray-800);
    }
    cursor: pointer;
`;

const toggleButtons = [
    { name: "total", value: "sum" },
    { name: "per_shift", value: "shift" },
    { name: "per_machine", value: "machine" },
    { name: "per_buyer", value: "buyer" },
    { name: "per_part", value: "type" },
    { name: "per_fault", value: "fault" },
    { name: "month", value: "month" },
    { name: "week", value: "week" },
];
/**
 * HOC component whitch provides category prop to its children
 * @param {} catagories - Categories array of indexes
 * @param {} title - Title of card
 * @param {boolean} sort - If selectable, sort the dropdown list
 * @param {} machineGroup - Group of machines
 * @param {} Selectable - Displays Select input
 * @param {} types - Array of scrap types to select from
 *
 * @returns component
 */
function GraphSwitchCard({
    categories = ["sum", "shift"],
    title,
    showScrapByMaterial = false,
    selectable = false,
    sort = true,
    defaultCategory = "sum",
    materialNameMap,
    ...props
}) {
    const { t, i18n } = useTranslation("shopfloor");
    const [selectedCategory, setSelectedCategory] = useState(
        categories.includes("shift") ? "sum" : "sum",
    );
    const [selectedOption, setSelectedOption] = useState(null);
    const [scrapMaterial, setScrapMaterial] = useState(null);
    const [showScrap, setShowScrap] = useState(false);
    const setSelectedDatasetHandler = (value) => {
        setSelectedCategory(value);
        const optionsList = options(value);

        if (!!optionsList) setSelectedOption(optionsList[0]);
    };
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const [showMaterialComponentCommentModal, setShowMaterialComponentCommentModal] =
        useState(false);
    const [materialComponentComment, setMaterialComponentComment] = useState(null);

    const typeMap = React.useRef(new Map());

    const materialBanerHandler = (data) => {
        console.log("[GraphSwitchCard] Podatki za graf:", data);
        const tableData = [];
        const materialComponentData = [];
        //const typeMap = new Map();
        typeMap.current.clear();

        for (const [material, types] of Object.entries(data)) {
            let quantityByType = {};
            let summedQuantity = 0;
            let total = 0;
            let comments = {}; // <-- shrani komentarje za vsak tip

            for (const [type, object] of Object.entries(types)) {
                typeMap.current.set(type, object.label);

                if (object.materialComponent === 1 || object.materialComponent === true) {
                    const materialCode = parseInt(material, 10);
                    materialComponentData.push({
                        material: materialCode,
                        quantity: object.quantity,
                        materialName:
                            materialNameMap && materialNameMap[materialCode]
                                ? materialNameMap[materialCode]
                                : "",
                        comment: object.comment,
                    });
                    continue;
                }

                quantityByType[type] = object.quantity;
                summedQuantity += object.quantity;
                total = object.total;
                comments[type] = object.comment; // <-- shrani komentar za tip
            }

            if (Object.keys(quantityByType).length > 0) {
                quantityByType["total"] = total;
                quantityByType["relative"] =
                    total > 0
                        ? Intl.NumberFormat(i18n.language, {
                              style: "percent",
                              minimumFractionDigits: 2,
                          }).format(summedQuantity / total)
                        : "0%";
                quantityByType["comments"] = comments; // <-- dodaj v vrstico
                tableData.push({ material: parseInt(material, 10), ...quantityByType });
            }
        }

        // Ugotovi, kateri tipi so dejansko v prvi tabeli
        const usedTypes = new Set();
        tableData.forEach((row) => {
            Object.keys(row).forEach((key) => {
                if (
                    key !== "material" &&
                    key !== "total" &&
                    key !== "relative" &&
                    key !== "comment"
                ) {
                    usedTypes.add(key);
                }
            });
        });

        // Stolpci za prvo tabelo: samo tipi, ki so v prvi tabeli
        const columns = [
            {
                name: t("material"),
                selector: (row) => row.material || row.materialId,
                style: { fontWeight: "bold" },
                width: "150px",
            },
        ];
        typeMap.current.forEach((label, id) => {
            if (usedTypes.has(id)) {
                columns.push({
                    name: <div style={{ textOverflow: "wrap" }}>{t(label)}</div>,
                    selector: (row) => row[id],
                    right: true,
                });
            }
        });
        columns.push({
            name: t("total"),
            selector: (row) => row["total"],
            width: "100px",
            right: true,
        });
        columns.push({
            name: "%",
            selector: (row) => row["relative"],
            width: "100px",
            right: true,
        });
        columns.push({
            name: t("comments"),
            selector: (row) =>
                row.comments && Object.values(row.comments).some((c) => c) ? (
                    <span
                        style={{ cursor: "pointer", color: "#4e79f0ff" }}
                        onClick={() => handleShowComments(row)}
                    >
                        <FontAwesomeIcon icon={faComment} />
                    </span>
                ) : null,
            width: "100px",
            right: true,
        });

        // Prva tabela (navaden izmet)
        const table = (
            <Table noHeader={true} dense pagination={false} columns={columns} data={tableData} />
        );

        // Druga tabela: material, ime in količina
        const materialComponentColumns = [
            {
                name: t("material"),
                selector: (row) => row.material,
                style: { fontWeight: "bold" },
                width: "150px",
            },
            {
                name: t("material_name"),
                selector: (row) => row.materialName,
                wrap: true,
                grow: 2,
            },
            {
                name: t("quantity"),
                selector: (row) => row.quantity,
                right: true,
                width: "100px",
            },
            {
                name: t("comments"),
                selector: (row) =>
                    row.comment ? (
                        <span
                            style={{ cursor: "pointer", color: "#4e79f0ff" }}
                            onClick={() => handleShowMaterialComponentComment(row)}
                        >
                            <FontAwesomeIcon icon={faComment} />
                        </span>
                    ) : null,
                width: "100px",
                right: true,
            },
        ];

        const materialComponentTable = (
            <Table
                noHeader={true}
                dense
                pagination={false}
                columns={materialComponentColumns}
                data={materialComponentData}
            />
        );

        setScrapMaterial(
            <div>
                <div>{table}</div>
                {materialComponentData.length > 0 && (
                    <div className='mt-4'>
                        <h5>{t("material_component_scrap")}</h5>
                        {materialComponentTable}
                    </div>
                )}
            </div>,
        );
        setShowScrap(true);
    };

    const handleShowComments = (row) => {
        setModalComments(
            Object.entries(row)
                .filter(
                    ([key, value]) =>
                        key !== "material" &&
                        key !== "total" &&
                        key !== "relative" &&
                        key !== "comments",
                )
                .map(([key, value]) => ({
                    type: typeMap.current.get(key) || key,
                    value,
                    comment: row.comments?.[key] || "",
                })),
        );
        setShowCommentModal(true);
    };
    const handleShowMaterialComponentComment = (row) => {
        setMaterialComponentComment(row);
        setShowMaterialComponentCommentModal(true);
    };

    useEffect(() => {
        setSelectedCategory(defaultCategory);
    }, []);

    const childrenWithProps = React.Children?.map(props.children, (child) => {
        if (child == null) return child;
        return React.cloneElement(child, {
            option: selectedOption?.value,
            category: selectedCategory,
            graphClick: showScrapByMaterial ? materialBanerHandler : null,
        });
    });
    const options = (selectedCategory) => {
        switch (selectedCategory) {
            case "machine":
                return props.machineGroup?.machines.map((machine) => {
                    return {
                        label: machine.name,
                        value: machine.machineAltKey,
                    };
                });
            case "shift":
                return ["1", "2", "3"].map((shift) => {
                    return {
                        label: shift,
                        value: shift,
                    };
                });
            case "type":
                return props.types.map((type) => {
                    return {
                        label: type.label,
                        value: type.id,
                    };
                });
            case "fault":
                return props.faults.map((fault) => {
                    return {
                        label: fault.label,
                        value: fault.id,
                    };
                });
            default:
                break;
        }
    };
    const placeholder = (selectedCategory) => {
        switch (selectedCategory) {
            case "machine":
                return t("select_machine");
            case "shift":
                return t("select_shift");
            case "type":
                return t("select_part");
            case "fault":
                return t("select_fault");
            default:
                break;
        }
    };

    return (
        <Card style={props.style}>
            <Card.Header>
                <div className='d-flex justify-content-between align-items-center flex-wrap px-1 pt-2'>
                    <h3 className='m-0 p-1'>{title}</h3>
                    <div className='d-flex align-items-center ms-auto'>
                        <ToggleGroup
                            buttons={toggleButtons.filter((button) =>
                                categories.includes(button.value),
                            )}
                            selectedButton={selectedCategory}
                            onSelected={setSelectedDatasetHandler}
                            title={title}
                        />
                        {selectedCategory != "sum" && selectable ? (
                            <div
                                style={{
                                    minWidth: "250px",
                                    marginLeft: "1em",
                                }}
                            >
                                <Select
                                    value={selectedOption}
                                    onChange={(selected) => setSelectedOption(selected)}
                                    placeholder={placeholder(selectedCategory)}
                                    options={
                                        props.sort && selectedCategory == "type"
                                            ? _.sortBy(options(selectedCategory), "label")
                                            : options(selectedCategory)
                                    }
                                    isSearchable={false}
                                />
                            </div>
                        ) : null}
                        {props.actions
                            ? props.actions.map((item, i) => {
                                  if (item?.button) {
                                      return (
                                          <button
                                              key={"action" + i}
                                              className={`btn btn-primary ms-2 ${
                                                  item?.className || ""
                                              }`}
                                              style={{
                                                  backgroundColor: "var(--bs-gray-700)",
                                                  border: "none",
                                                  cursor: "pointer",
                                              }}
                                              onMouseEnter={(e) =>
                                                  (e.currentTarget.style.backgroundColor =
                                                      "var(--bs-gray-800)")
                                              }
                                              onMouseLeave={(e) =>
                                                  (e.currentTarget.style.backgroundColor =
                                                      "var(--bs-gray-700)")
                                              }
                                              onClick={() => item.onClick(props.machineGroup)}
                                          >
                                              <FontAwesomeIcon icon={item?.icon} className='me-2' />
                                              {item?.text}
                                          </button>
                                      );
                                  } else {
                                      return (
                                          <StyledSearch
                                              key={"action" + i}
                                              className='ms-2'
                                              icon={item.icon}
                                              onClick={() => item.onClick(props.machineGroup)}
                                              size='lg'
                                          />
                                      );
                                  }
                              })
                            : null}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>{childrenWithProps}</Card.Body>
            <Collapse in={showScrap}>
                <div>
                    {showScrapByMaterial && scrapMaterial ? (
                        <Card.Footer
                            style={{
                                backgroundColor: "white",
                                boxShadow: "inset 0px 2px 2px #EEEEEE",
                            }}
                        >
                            {scrapMaterial}
                            <div
                                className='w-100 d-flex justify-content-center'
                                style={{ cursor: "pointer" }}
                                onClick={() => setShowScrap(false)}
                            >
                                <FontAwesomeIcon
                                    icon='angle-double-up'
                                    style={{ color: "var(--bs-dark)" }}
                                />
                            </div>
                        </Card.Footer>
                    ) : null}
                </div>
            </Collapse>
            <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{t("comments")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalComments.map((comment, index) => (
                        <div key={index}>
                            <strong>{comment.type}:</strong> {comment.value}
                            <br />
                            <em>{comment.comment}</em>
                            <hr />
                        </div>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowCommentModal(false)}>
                        {t("close")}
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                show={showMaterialComponentCommentModal}
                onHide={() => setShowMaterialComponentCommentModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t("comments")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {materialComponentComment && (
                        <div>
                            <strong>
                                {materialComponentComment.materialName ||
                                    materialComponentComment.material}
                                :
                            </strong>{" "}
                            {materialComponentComment.quantity}
                            <br />
                            <em>{materialComponentComment.comment}</em>
                            <hr />
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant='secondary'
                        onClick={() => setShowMaterialComponentCommentModal(false)}
                    >
                        {t("close")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}

export default GraphSwitchCard;
