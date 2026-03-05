import React from "react";
import { ToggleButtonGroup, ToggleButton, Button, Dropdown, OverlayTrigger } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
    .btn-sm,
    .btn-group-sm > .btn {
        padding: 0.4rem 0.35rem;
        font-size: 0.85rem;
        line-height: 1;
    }
    .btn-light:not(:disabled):not(.disabled):active,
    .btn-light:not(:disabled):not(.disabled).active,
`;

const StyledToggleButton = styled(ToggleButton)`
    background-color: ${(props) => {
        return props.checked ? "#bdc0c1" : "#ecf0f1";
    }};
    border-radius: 0.6rem;
    border: unset;
    min-width: 50px;
    &:hover {
        background-color: ${(props) => (props.checked ? "#bdc0c1" : "#d7dbdc")} !important;
    }
    transition: background-color 0.1s ease-in-out;
`;

const StyledDropdownItem = styled(Dropdown.Item)`
    &:hover {
        background-color: ${(props) => (props.selected ? "inherit" : "var(--bs-light) !important")};
    }
    background-color: ${(props) => (props.selected ? "#bdc0c1 !important" : "inherit")};
`;

const ToggleGroup = ({
    title,
    selectedButton,
    onSelected,
    buttons,
    customButton,
    align = "right",
    size = "sm",
    breakpoint = "xxl",
}) => {
    const { t } = useTranslation("shopfloor");
    const ButtonComponent = customButton || StyledToggleButton;
    const selectedButtonName = buttons?.find((button) => button.value == selectedButton)?.name;
    return (
        <>
            <StyledToggleButtonGroup
                className={[
                    align == "right" ? "ms-auto" : align == "left" ? "me-auto" : "",
                    `d-none`,
                    `d-${breakpoint}-flex`,
                    "flex-nowrap",
                    `gap-${breakpoint}-1`,
                ]}
                type='radio'
                name={title + "_button_toggles"}
                value={selectedButton}
                onChange={(val) => onSelected(val)}
            >
                {buttons?.map((button, idx) =>
                    button.type == "popover" ? (
                        <OverlayTrigger
                            trigger='click'
                            placement={button.placement}
                            overlay={button.popover}
                            rootClose
                        >
                            <ButtonComponent
                                as={Button}
                                active={selectedButton == button.value}
                                key={title + "category" + idx + "k"}
                                id={title + "category" + idx}
                                variant='light'
                                size={size}
                                value={button.value}
                                onClick={() => onSelected(button.value)}
                            >
                                {t(button.name)}
                            </ButtonComponent>
                        </OverlayTrigger>
                    ) : (
                        <ButtonComponent
                            key={title + "category" + idx + "k"}
                            id={title + "category" + idx}
                            variant='light'
                            size={size}
                            value={button.value}
                        >
                            {t(button.name)}
                        </ButtonComponent>
                    ),
                )}
            </StyledToggleButtonGroup>
            <Dropdown className={[`d-${breakpoint}-none`]}>
                <Dropdown.Toggle
                    style={{
                        minWidth: "125px",
                        fontSize: size == "sm" ? "0.85rem" : "1rem",
                        padding: size == "sm" ? "0.15rem 0.35rem" : "auto",
                    }}
                    variant='light'
                    size={size}
                    id={title + "_dropdown_toggles"}
                >
                    {t(selectedButtonName)}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {buttons?.map((button, idx) =>
                        button.type == "popover" ? (
                            <OverlayTrigger
                                trigger='click'
                                placement={button.placement}
                                overlay={button.popover}
                                rootClose
                            >
                                <StyledDropdownItem
                                    className={[
                                        "text-black",
                                        selectedButton == button.value ? "bg-light" : "",
                                    ]}
                                    selected={selectedButton == button.value}
                                    key={title + "category" + idx + "dropdown"}
                                    value={button.value}
                                    onClick={() => onSelected(button.value)}
                                >
                                    {t(button.name)}
                                </StyledDropdownItem>
                            </OverlayTrigger>
                        ) : (
                            <StyledDropdownItem
                                className={[
                                    "text-black",
                                    selectedButton == button.value ? "bg-light" : "",
                                ]}
                                selected={selectedButton == button.value}
                                key={title + "category" + idx + "dropdown"}
                                value={button.value}
                                onClick={() => onSelected(button.value)}
                            >
                                {t(button.name)}
                            </StyledDropdownItem>
                        ),
                    )}
                </Dropdown.Menu>
            </Dropdown>
        </>
    );
};

export default ToggleGroup;
