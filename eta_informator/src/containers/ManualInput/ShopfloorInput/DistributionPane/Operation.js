import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";
import { useEffect, useState } from "react";
import { Button, Row, InputGroup, FormControl, Form, Fade, Dropdown } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Dropbox from "./Dropbox";

const Frame = styled.div`
    background: rgb(212, 227, 228);
    background: transparent;

    width: 100%;
`;

const Input = styled(FormControl)`
    background: rgba(255, 255, 255, 0.75);
    border-radius: unset;
    border: unset;
    border-bottom: 1px solid lightgray;
    transition: background 0.2s ease;
    padding: 0.75em 0.75em;
    height: 2em;
    width: 100%;
    &:focus {
        border: unset;
        border-bottom: 1px solid lightgray;
        box-shadow: unset;
        background: rgba(255, 255, 255, 1);
    }

    :hover {
        background: rgba(255, 255, 255, 1);
    }
`;

const InputButton = styled(Button)`
    margin-left: -28px;
    z-index: 10;
    height: 2em;
    padding: unset;
    color: gray;
`;
const Toggle = styled.div`
    padding: 0.3em 0.7em;
    border-radius: 2em;
    transition: background-color 0.3s ease;
    &:hover {
        background-color: lightgray;
    }
`;

const Item = styled(Dropdown.Item)`
    color: black;
    transition: background-color 0.3s ease;
    &:hover {
        color: black;
        background-color: lightgray;
    }
`;

function Operation({
    id,
    name,
    employees,
    allEmployees,
    editing,
    active,
    machine,
    renameOperation,
    removeOperation,
    ...props
}) {
    const { t } = useTranslation("manual_input");
    const [rename, setRename] = useState(false);
    const { register, handleSubmit } = useForm();
    const clickHandler = (e) => {
        if (e.detail == 2 && editing) {
            setRename(true);
        }
    };

    const submitHandler = (value) => {
        renameOperation(id, value.rename, machine);
        setRename(false);
    };

    const CustomMore = forwardRef(({ children, onClick }, ref) => (
        <Toggle
            href=''
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
        >
            <FontAwesomeIcon className='text-black-50' icon='caret-down' />
        </Toggle>
    ));

    return (
        <Frame className='pb-1'>
            <div className='m-0 d-flex justify-content-between align-items-center'>
                {!(rename && editing) ? (
                    <div className='h6 mb-0' onClick={clickHandler}>
                        {name.includes("!") ? name.split("!")[1] : name}
                    </div>
                ) : (
                    <Form
                        className='w-100 mb-1'
                        style={{ marginRight: "10px" }}
                        onSubmit={handleSubmit(submitHandler)}
                    >
                        <InputGroup>
                            <Input
                                {...register("rename")}
                                placeholder={name}
                                defaultValue={name}
                                autoComplete='off'
                            />
                            <InputButton type='submit' variant='text'>
                                <FontAwesomeIcon icon='check' />
                            </InputButton>
                        </InputGroup>
                    </Form>
                )}
                {!rename && (
                    <div>
                        <div className='d-inline-block'>
                            <Fade in={editing}>
                                <Dropdown>
                                    <Dropdown.Toggle
                                        as={CustomMore}
                                        id='more_tgl'
                                    ></Dropdown.Toggle>
                                    <Dropdown.Menu style={{ zIndex: 1000 }}>
                                        <Item
                                            eventKey='1'
                                            onClick={() => {
                                                setRename(true);
                                            }}
                                        >
                                            {t("labels:rename_operation")}
                                        </Item>
                                        <Item
                                            eventKey='2'
                                            onClick={() => {
                                                removeOperation(id, machine);
                                            }}
                                        >
                                            {t("labels:remove_operation")}
                                        </Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Fade>
                        </div>
                    </div>
                )}
            </div>
            <Row className='m-0'>
                <Dropbox
                    employees={employees}
                    operation={name}
                    editing={editing}
                    active={active}
                    machine={machine}
                />
                {/* <Button size='sm'>Add employees</Button> */}
            </Row>
        </Frame>
    );
}

export default Operation;
