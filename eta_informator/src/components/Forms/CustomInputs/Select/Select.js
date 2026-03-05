import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";
import _ from "lodash";
import { useTranslation } from "react-i18next";

export const findOptionByKeyword = (options, value) => {
    let result = null;
    options.forEach((option) => {
        if (option.keyword === value) return (result = option);
        if (!result && option.options) result = findOptionByKeyword(option.options, value);
    });

    return result;
};

export const findOptionByValue = (options, value) => {
    let option = null;
    _.forEach(options, (unit) => {
        option = _.find(unit.options, ["value", value]);
        return _.isUndefined(option);
    });
    return option;
};

export function CreateSelect(props) {
    const { t } = useTranslation("labels");
    return (
        <CreatableSelect
            styles={{
                menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    position: props.relative ? "relative" : "absolute",
                }),
            }}
            noOptionsMessage={() => t("no_data")}
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
            {...props}
        />
    );
}

function Select(props) {
    const { t } = useTranslation("labels");
    return (
        <ReactSelect
            styles={{
                menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    position: props.relative ? "relative" : "absolute",
                }),
            }}
            noOptionsMessage={() => t("no_data")}
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
            {...props}
        />
    );
}

export default Select;
