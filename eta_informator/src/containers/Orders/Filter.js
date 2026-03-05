import React, { useEffect } from "react";
import { useState } from "react";
import { forwardRef } from "react";
import { Dropdown, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const FilterButton = styled.div`
    border: 2px solid lightgray;
    border-radius: 5px;
    min-width: 150px;
    padding: 0.3rem 1rem;
`;

function Filter({ property, options, setSelected, defaultValue, ...props }) {
    const { t } = useTranslation("shopfloor");
    const [value, setValue] = useState([]);
    const CustomFilter = forwardRef(({ children, onClick }, ref) => (
        <div>
            <label className='mb-0'>{t(property)}</label>
            <FilterButton
                href=''
                ref={ref}
                onClick={(e) => {
                    e.preventDefault();
                    onClick(e);
                }}
            >
                <div>
                    {value?.length == 0 ? (
                        <div>{t(defaultValue)}</div>
                    ) : (
                        <div className='d-flex'>
                            {value.map((entry, i) => {
                                return i == value.length - 1 ? (
                                    <div>{t(entry)}</div>
                                ) : (
                                    <div className='me-1'>{t(entry) + ","}</div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </FilterButton>
        </div>
    ));

    const CustomMenu = React.forwardRef(
        ({ children, style, className, property, "aria-labelledby": labeledBy }, ref) => {
            return (
                <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
                    <div className='text-muted'>{t(property)}</div>
                    <Form>
                        {React.Children.toArray(children).map((entry, i) => {
                            const label = t(entry.props.option);
                            return (
                                <Form.Check
                                    custom
                                    style={{ overflowWrap: "unset" }}
                                    type='checkbox'
                                    checked={value.includes(entry.props.option)}
                                    id={"filter-check-" + property + "-" + i}
                                    label={label.toString()}
                                    onChange={(clickEntry) => {
                                        if (clickEntry.target.checked) {
                                            setValue((selected) => [
                                                ...selected,
                                                entry.props.option,
                                            ]);
                                        } else {
                                            setValue((selected) =>
                                                selected.filter(
                                                    (sEntry) => sEntry != entry.props.option,
                                                ),
                                            );
                                        }
                                        return;
                                    }}
                                />
                            );
                        })}
                    </Form>
                </div>
            );
        },
    );

    useEffect(() => {
        if (Array.isArray(value)) {
            setSelected(value, property);
        }
    }, [value]);

    return (
        <Dropdown className='me-2'>
            <Dropdown.Toggle as={CustomFilter} id={property + "filter"} />
            <Dropdown.Menu
                className='px-4 py-3 mt-1'
                style={{ whiteSpace: "nowrap" }}
                property={property}
                as={CustomMenu}
            >
                {options.map((option) => (
                    <div option={option.key}>{t(option.key)}</div>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default Filter;
