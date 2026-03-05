import UserTag from "./UserTag";
import { useMemo, useState } from "react";
import { PulseLoader } from "react-spinners";
import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import SimpleBar from "simplebar-react";

function EmployeesList({ employees, unitEmployees, editing, dayEntry, active, ...props }) {
    const [filter, setFilter] = useState("");
    const { t } = useTranslation("manual_input");

    // List of selected employees
    const selected = useMemo(() => {
        return dayEntry?.distribution !== undefined && dayEntry?.distribution.length > 0
            ? dayEntry?.distribution?.reduce((acc, curr) => {
                  let employees = [];
                  Object.values(curr.dist).forEach((shift) => {
                      shift.forEach((operation) => {
                          employees = [...employees, ...operation.employees];
                      });
                  });
                  return [...acc, ...employees];
              }, [])
            : [];
    }, [dayEntry?.distribution]);

    // List of employees in the unit
    const unitList = useMemo(
        () => unitEmployees?.data?.map((entry) => +entry),
        [unitEmployees?.data],
    );

    // Map a list of employees
    const list = useMemo(() => {
        if (!employees.data) return [];
        return employees.data
            .filter((entry) => {
                // Filter out the selected employees
                if (selected) {
                    return !selected?.includes(entry?.employeeId);
                }
                return true;
            })
            .filter((entry) => {
                // In case that we are using the search, search in all workers
                return filter != "" || unitList?.includes(entry.id);
            })
            .filter((entry) => {
                // Search by entry
                if (filter == "") return true;
                return (
                    (entry.firstname + " " + entry.lastname)
                        .toLowerCase()
                        .includes(filter.toLowerCase()) ||
                    (entry.lastname + " " + entry.firstname)
                        .toLowerCase()
                        .includes(filter.toLowerCase())
                );
            })
            .sort((a, b) => {
                // Sort by available and then by name
                if (a.available === b.available) {
                    return new Intl.Collator("sl").compare(a.lastname, b.lastname);
                }
                return b.available - a.available;
            })
            .map((entry) => {
                return (
                    <UserTag
                        source='list'
                        key={entry.employeeId}
                        name={entry.firstname + " " + entry.lastname}
                        id={entry.id}
                        employeeId={entry.employeeId}
                        editing={editing}
                        available={entry.available}
                    />
                );
            });
    }, [employees.data, selected, filter, unitList, editing]);

    if (employees.isLoading || unitEmployees.isLoading) {
        return (
            <div className='d-flex justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={5} margin={10} />
            </div>
        );
    }

    return (
        <div style={{ width: "100%" }}>
            <div className='d-flex flex-wrap justify-content-between align-items-end mb-2'>
                <div className='d-flex'>
                    <div>
                        <div className='d-inline-block'>{t("available")}</div>
                        <div className='d-inline-block ms-1 fw-bold'>
                            {
                                employees.data
                                    .filter((entry) => {
                                        return (
                                            !selected?.includes(entry.employeeId) && entry.available
                                        );
                                    })
                                    .filter((entry) => {
                                        return unitList.includes(entry.id);
                                    })?.length
                            }
                        </div>
                    </div>
                    <div className='ms-3'>
                        <div className='d-inline-block'>{t("unavailable")}</div>
                        <div className='d-inline-block ms-1 fw-bold'>
                            {
                                employees.data
                                    .filter((entry) => {
                                        return (
                                            !selected?.includes(entry.employeeId) &&
                                            !entry.available
                                        );
                                    })
                                    .filter((entry) => {
                                        return unitList.includes(entry.id);
                                    })?.length
                            }
                        </div>
                    </div>
                </div>
                <Form.Control
                    size='sm'
                    style={{ width: "225px" }}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t("search")}
                ></Form.Control>
            </div>
            <SimpleBar
                forceVisible='y'
                autoHide={false}
                style={{
                    width: "100%",
                    borderRadius: "5px",
                    boxShadow: "0px 0px 3px 1px lightgray",
                }}
            >
                <div
                    className='d-flex flex-column flex-wrap justify-content-start px-3 pt-2 pb-1 mb-2'
                    style={{
                        width: "100%",
                        maxHeight: "110px",
                        minHeight: "50px",
                    }}
                >
                    {list?.length > 0 ? list : <div>{t("no_matching_entries")}</div>}
                </div>
            </SimpleBar>
        </div>
    );
}

export default EmployeesList;
