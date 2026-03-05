import { useField } from "formik";
import ReactSelect from "react-select";
import styled from "styled-components";
import _ from "lodash";

const ErrorMessage = styled.div`
    width: 100%;
    margin-top: 0.25rem;
    font-size: 80%;
    color: #e74c3c;
`;

const findOptionByValue = (options, value) => {
    let option;
    _.forEach(options, (unit) => {
        option = _.find(unit.options, ["value", value]);
        return _.isUndefined(option);
    });
    return option;
};

function Select({ label, options, defaultValue, grouped, ...props }) {
    const [field, meta, helpers] = useField(props);
    const { touched, error, value } = meta;
    const { setValue, setTouched, setError } = helpers;
    const isValid = touched && !error;
    const isInvalid = touched && !!error;
    const customStyles = {
        control: (base, state) => ({
            ...base,
            // state.isFocused can display different borderColor if you need it
            transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            borderColor: state.isFocused
                ? "#ddd"
                : isInvalid
                ? "var(--bs-red)"
                : isValid
                ? "var(--bs-green)"
                : "#ddd",
            // overwrittes hover style
            "&:hover": {
                borderColor: state.isFocused
                    ? "#ddd"
                    : isInvalid
                    ? "var(--bs-red)"
                    : isValid
                    ? "var(--bs-green)"
                    : "#ddd",
            },
        }),
    };

    const dV = grouped
        ? findOptionByValue(options, defaultValue)
        : defaultValue
        ? options.filter((item) => {
              return item.value === defaultValue;
          })
        : null;

    return (
        <div>
            <ReactSelect
                defaultValue={dV}
                isMulti={props.isMulti}
                styles={customStyles}
                options={options}
                name={field.name}
                value={options.filter((options) => {
                    return options.value == value;
                })}
                placeholder={props.placeholder}
                onChange={(option) => {
                    setValue(option.value);
                    setTouched(true);
                    setError(undefined);
                }}
                instanceId={props.iid}
                isDisabled={props.disabled}
                isLoading={props.loading}
                theme={(theme) => ({
                    ...theme,
                    borderRadius: 0,
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
            {isInvalid ? <ErrorMessage>{error}</ErrorMessage> : null}
        </div>
    );
}

export default Select;
