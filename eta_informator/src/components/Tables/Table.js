import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DataTable from "react-data-table-component";
import { useTranslation } from "react-i18next";
import { PulseLoader } from "react-spinners";

const customStyles = {
    tableHeader: {
        style: {
            display: "flex",
            justifyContent: "around",
        },
    },
    headCells: {
        style: {
            fontWeight: "600",
            fontSize: "var(--h5)",
            color: "var(--bs-primary)",
            textTransform: "",
        },
    },
    cells: {
        style: {
            paddingLeft: "16px", // override the cell padding for data cells
            paddingRight: "16px",
            textAlign: "justify",
            textJustify: "inter-word",
        },
    },
};

const LoadingComponent = () => {
    return (
        <div className='p-5'>
            <p className='lead' style={{ fontWeight: "500" }}>
                <PulseLoader color='var(--bs-secondary)' size={10} />
            </p>
        </div>
    );
};

function Table({ pagination = true, ...props }) {
    const { t } = useTranslation("labels");
    const NoDataComponent = () => {
        return (
            <div className='p-4'>
                <p className='lead'>{t("no_data")}</p>
            </div>
        );
    };
    return (
        <DataTable
            sortIcon={<FontAwesomeIcon icon='sort-down' />}
            customStyles={customStyles}
            pagination={pagination}
            noHeader={props.noHeader}
            noDataComponent={<NoDataComponent />}
            paginationPerPage={5}
            paginationRowsPerPageOptions={[5, 10, 25]}
            paginationComponentOptions={{
                rowsPerPageText: t("rows_per_page"),
                rangeSeparatorText: t("of"),
            }}
            progressComponent={null}
            {...props}
        />
    );
}

export default Table;
