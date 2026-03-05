import React, { useEffect } from "react";
import styled from "styled-components";
import { FormControl } from "react-bootstrap";
import ReactDatePicker from "react-datepicker";
import { useFormikContext, useField } from "formik";
import { useTranslation } from "react-i18next";

const SelectWrap = styled.div`
    .react-datepicker-wrapper {
        width: 100%;
    }
    .react-datepicker-popper {
        z-index: 100 !important;
    }
`;

const CustomDatePicker = React.forwardRef(({ value, onClick, ...props }, ref) => {
    return <FormControl onClick={onClick} ref={ref} value={value} {...props}></FormControl>;
});

function DatePicker({ ...props }) {
    const { i18n } = useTranslation();
    return (
        <SelectWrap>
            <ReactDatePicker
                {...props}
                locale={i18n.language}
                customInput={<CustomDatePicker disabled={props?.disabled} />}
            />
        </SelectWrap>
    );
}

export default DatePicker;
