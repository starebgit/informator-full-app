import React, { useEffect } from "react";
import styled from "styled-components";
import { FormControl } from "react-bootstrap";
import ReactDatePicker from "react-datepicker";
import { useFormikContext, useField } from "formik";

const SelectWrap = styled.div`
    .react-datepicker-wrapper {
        width: 100%;
    }
`;

const Error = styled.div`
    width: 100%;
    margin-top: 0.25rem;
    font-size: 80%;
    color: #e74c3c;
`;

const CustomDatePicker = React.forwardRef(({ value, onClick, isValid, isInvalid }, ref) => (
    <FormControl
        style={{ color: "var(--bs-primary" }}
        as='div'
        onClick={onClick}
        ref={ref}
        isValid={isValid}
        isInvalid={isInvalid}
    >
        {value}
    </FormControl>
));

function FormikDatePicker({ ...props }) {
    const { setFieldValue, setFieldTouched, setFieldError } = useFormikContext();
    const [field, meta] = useField(props);
    const { touched, error } = meta;
    useEffect(() => {
        if (field.value === "") setFieldValue(field.name, new Date());
    }, []);
    return (
        <SelectWrap>
            <ReactDatePicker
                {...field}
                {...props}
                selected={(field.value && new Date(field.value)) || null}
                onChange={(val) => {
                    setFieldValue(field.name, val);
                }}
                onCalendarClose={() => {
                    setFieldTouched(field.name, true);
                }}
                customInput={
                    <CustomDatePicker isValid={touched && !error} isInvalid={touched && !!error} />
                }
            />
            {!!meta.error ? <Error type='invalid'>{meta.error}</Error> : null}
        </SelectWrap>
    );
}

export default FormikDatePicker;
