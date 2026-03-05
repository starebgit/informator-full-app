import ReactSelect, { components } from "react-select";
import Flag from "react-flagkit";
import React from "react";
import styled from "styled-components";

const OptionWrap = styled.div`
    display: flex;
    align-content: center;
    padding: var(--s5);
    padding-left: var(--s4);
    & > div {
        margin-top: auto;
        margin-bottom: auto;
        margin-right: var(--s4);
    }
`;

const FlagWrap = styled.div`
    display: flex;
    align-content: center;
    padding: var(--s5);
    padding-left: var(--s4);
    & > div {
        margin-top: auto;
        margin-bottom: auto;
        margin-right: var(--s4);
    }
`;

/**
 * !Custom ValueContainer looses focus?
 *    Problem was that I was not rendering children, which even if select has no value includes input component
 *    which is focues when menu is opened.
 */
const SelectedOption = ({ children, ...props }) => {
    const { getValue, hasValue } = props;
    const [value] = getValue();
    const newChildren = [...children];
    if (hasValue) {
        const flag = <Flag country={value.flag} />;
        newChildren[0] = (
            <FlagWrap key='selected'>
                <div>{flag}</div>
                {value.label}
            </FlagWrap>
        );
    }
    return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

const Option = (props) => {
    const { data } = props;
    const flag = <Flag country={data.flag} />;
    return (
        <components.Option {...props}>
            <OptionWrap>
                <div>{flag}</div>
                {props.children}
            </OptionWrap>
        </components.Option>
    );
};

function CountrySelect(props) {
    const components = { Option: Option, ValueContainer: SelectedOption };
    return (
        <ReactSelect
            {...props}
            components={components}
            isSearchable={false}
            styles={{
                valueContainer: (baseStyles, state) => ({
                    ...baseStyles,
                    grid: "none",
                    display: "flex",
                }),
            }}
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
    );
}

export default CountrySelect;
