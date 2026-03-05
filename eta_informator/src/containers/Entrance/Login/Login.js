import { ErrorMessage, Field, Form, Formik } from "formik";
import React, { useContext, useState } from "react";
import { FormControl as BsFormControl, Button } from "react-bootstrap";
import styled from "styled-components";
import * as Yup from "yup";
import client from "../../../feathers/feathers";
import { useHistory, useLocation } from "react-router";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useTranslation } from "react-i18next";

const FormFrame = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
    border: 2px solid var(--bs-light);
    height: 600px;
    width: 400px;
`;

const FormControl = styled(BsFormControl)`
    padding-top: 12px;
    padding-bottom: 12px;
`;

const FieldWrap = styled.div`
    padding: 12px;
`;

const StyledError = styled.span`
    color: var(--bs-red);
    font-size: 14px;
    margin-left: ${(props) => (props.response ? "0px" : "8px")};
`;

const Link = styled.a`
    color: var(--bs-dark);
    text-decoration: unset;
    &:hover {
        color: var(--bs-info);
        text-decoration: unset;
    }
`;

function Login(props) {
    const history = useHistory();
    const location = useLocation();
    const authContext = useContext(AuthContext);
    const [errors, setErrors] = useState(null);
    const { from } = location.state || { from: { pathname: "/shopfloor" } };
    const { t, i18n } = useTranslation("labels");

    const error = errors !== null ? <StyledError response>{errors}</StyledError> : null;
    const login = (response) => {
        client
            .service("user-settings")
            .find({ query: { merged: true, id: response.user.id } })
            .then((settingsRes) => {
                authContext.dispatch({ type: "LOGIN", payload: response });
                response?.user?.role?.role == "human_resources"
                    ? history.push("/dashboard")
                    : history.push("/shopfloor");
            });
    };
    return (
        <FormFrame>
            <h2 className='mx-auto pt-5'>Informator</h2>
            <Formik
                initialValues={{
                    username: "",
                    password: "",
                }}
                validationSchema={Yup.object({
                    username: Yup.string().required(t("required_field")),
                    password: Yup.string().required(t("required_field")),
                })}
                onSubmit={(values, { setSubmitting }) => {
                    client
                        .authenticate({
                            strategy: "local",
                            username: values.username,
                            password: values.password,
                        })
                        .then((response) => {
                            login(response);
                        })
                        .catch((e) => {
                            setErrors(t(e.name));
                            console.error("Auth error:", e);
                        });
                    setSubmitting(false);
                }}
            >
                <Form className='d-flex flex-column my-auto'>
                    <FieldWrap>
                        {/* <label htmlFor='username'>Uporabniško ime</label> */}
                        <Field
                            as={FormControl}
                            name='username'
                            placeholder={t("username")}
                            type='text'
                            autoComplete='off'
                        />
                        <ErrorMessage component={StyledError} name='username' />
                    </FieldWrap>
                    <FieldWrap>
                        <Field
                            as={FormControl}
                            name='password'
                            placeholder={t("password")}
                            type='password'
                            autoComplete='current-password'
                        />
                        <ErrorMessage component={StyledError} name='password' />
                    </FieldWrap>
                    <FieldWrap className='d-grid gap-2'>
                        <Button variant='primary' type='submit'>
                            {t("log_in")}
                        </Button>
                        {error}
                    </FieldWrap>
                    <FieldWrap className='d-grid pt-0'>
                        <Button variant='light' onClick={() => history.push("/infopoint/hub")}>
                            {t("log_in_as_guest")}
                        </Button>
                    </FieldWrap>
                </Form>
            </Formik>
            <div className='text-center'>
                <Link onClick={() => history.push("/login/reset")}>{t("reset_password")}</Link>
            </div>
        </FormFrame>
    );
}

export default Login;
