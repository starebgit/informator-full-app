import styled from "styled-components";
import Filecard from "./FileCard";
import TagCard from "./TagCard";
import dayjs from "dayjs";
import { pdfUrl } from "../../../utils/utils";
import { useState, useEffect } from "react";

const Card = styled.div`
    border-radius: 1rem;
    background-color: var(--bs-gray-100);
    box-shadow: var(--bs-box-shadow);
    margin: 1rem 0;
`;

const CategoryCard = ({ category, documents, onClickHandler, expandAll = false }) => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setExpanded(Boolean(expandAll));
    }, [expandAll]);

    const subcategoryGroupedDocuments = documents.reduce((acc, curr) => {
        //If there is no subcategory then put it in the 'documents' category
        if (!curr.subcategory) {
            if (acc["documents"]) {
                acc["documents"].push(curr);
            } else {
                acc["documents"] = [curr];
            }
            return acc;
        }
        if (acc[curr.subcategory.name]) {
            acc[curr.subcategory.name].push(curr);
        } else {
            acc[curr.subcategory.name] = [curr];
        }
        return acc;
    }, {});
    return (
        <Card className='p-3'>
            <div
                className='d-flex justify-content-between align-items-center'
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded((prev) => !prev)}
            >
                <h4>{category}</h4>
                <span style={{ fontSize: "1.5rem" }}>{expanded ? "−" : "+"}</span>
            </div>

            {expanded && (
                <div className='d-flex flex-column gap-2 mx-1 mx-xl-2'>
                    {subcategoryGroupedDocuments.documents?.map((document) => (
                        <Filecard
                            key={document.id + "_file_card"}
                            file={document}
                            isNew={dayjs(document.createdAt).isAfter(dayjs().subtract(1, "week"))}
                            onClick={() => {
                                if (document.name === "Stroškovna mesta") {
                                    window.open(
                                        "https://blancfischer.sharepoint.com/:x:/r/sites/INTRANET_EGOETA/_layouts/15/Doc2.aspx?action=edit&sourcedoc=%7B9eb177bc-15ec-49ee-8323-ff1492064af3%7D&wdOrigin=TEAMS-MAGLEV.teamsSdk_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1771323752192&web=1",
                                        "_blank",
                                    );
                                } else {
                                    if (document.uploads.length == 0)
                                        console.error(
                                            "No upload url found for document: ",
                                            document.name,
                                        );
                                    const uploadUrl = document.uploads[0].path;
                                    onClickHandler(pdfUrl(uploadUrl));
                                }
                            }}
                        />
                    ))}
                    {Object.keys(subcategoryGroupedDocuments).map((subcategory) => {
                        if (subcategory == "documents") return null;
                        return (
                            <TagCard tag={subcategory}>
                                {subcategoryGroupedDocuments[subcategory].map((document) => {
                                    return (
                                        <Filecard
                                            key={document.id + "_file_card"}
                                            file={document}
                                            isNew={dayjs(document.createdAt).isAfter(
                                                dayjs().subtract(1, "week"),
                                            )}
                                            onClick={() => {
                                                if (document.uploads.length == 0)
                                                    console.error(
                                                        "No upload url found for document: ",
                                                        document.name,
                                                    );
                                                const uploadUrl = document.uploads[0].path;
                                                onClickHandler(pdfUrl(uploadUrl));
                                            }}
                                        />
                                    );
                                })}
                            </TagCard>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default CategoryCard;
