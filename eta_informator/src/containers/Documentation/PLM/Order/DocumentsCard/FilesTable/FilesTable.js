import { truncate } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Table from "../../../../../../components/Tables/Table";

function FilesTable({ files, path, clicked, ...props }) {
    const { t } = useTranslation("labels");
    const columns = useMemo(
        () => [
            {
                name: t("title"),
                selector: (row) => row.title,
                wrap: true,
            },
            {
                name: t("file_name"),
                selector: (row) => row.file_name,
                wrap: false,
            },
            {
                name: "path",
                selector: (row) => row.path,
                omit: true,
            },
        ],
        [t],
    );

    return (
        <Table
            columns={columns}
            noHeader={true}
            dense
            data={files.map((value) => {
                return {
                    title: value.titel,
                    file_name: value.dateiname.replace(" ", "_"),
                    path: path + value.dateiname,
                };
            })}
            onRowClicked={(row) => {
                clicked(row.path);
            }}
            pointerOnHover={true}
            highlightOnHover
        />
    );
}

export default FilesTable;
