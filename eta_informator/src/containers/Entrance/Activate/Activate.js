import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FormRow from "../../../components/Layout/ManualInput/Forms/FormRow";
import FormWrap from "../../../components/Layout/ManualInput/Forms/FormWrap";
import styled from "styled-components";
import axios from "axios";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import ErrorMessage from "../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { useState } from "react";

const FormFrame = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
    border: 2px solid var(--bs-light);
    height: 400px;
    width: 400px;
`;

function Activate(props) {
    const history = useHistory();
    const [success, setSuccess] = useState(false);
    const { t } = useTranslation("labels");
    const { token } = useParams();
    const validationSchema = Yup.object().shape({
        password: Yup.string().required(t("required_field")),
        passwordCheck: Yup.string()
            .oneOf([Yup.ref("password"), null], t("password_not_matching"))
            .required(t("required_field")),
    });
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        control,
        watch,
    } = useForm({ resolver: yupResolver(validationSchema) });
    const onSubmit = (data) => {
        axios
            .post(`http://${process.env.REACT_APP_INFORMATOR}/auth-managment`, {
                action: "verifySignupSetPasswordLong",
                value: {
                    token: token,
                    password: data.password,
                },
            })
            .then((response) => {
                if (response.status == 201) {
                    setSuccess(true);
                }
            });
    };

    return (
        <FormFrame>
            <h2>{t("activate_user")}</h2>
            <FormWrap className='my-auto d-flex flex-column align-items-center justify-content-center'>
                {!success ? (
                    <form className='my-5' onSubmit={handleSubmit(onSubmit)}>
                        <FormRow>
                            <Form.Label>{t("password")}</Form.Label>
                            <Form.Control
                                {...register("password")}
                                type='password'
                                autoComplete='off'
                                placeholder={t("enter_password")}
                            />
                        </FormRow>
                        <FormRow>
                            <Form.Control
                                {...register("passwordCheck")}
                                type='password'
                                autoComplete='off'
                                placeholder={t("enter_password_check")}
                            />
                        </FormRow>
                        <ErrorMessage>
                            {t(errors?.password?.message) || t(errors?.passwordCheck?.message)}
                        </ErrorMessage>
                        <FormRow className='mt-2 d-flex justify-content-center'>
                            <Button className='mx-1' type='submit'>
                                {t("activate")}
                            </Button>
                        </FormRow>
                    </form>
                ) : (
                    <>
                        <h4 className='mb-5'>{t("user_successfully_activated")}</h4>
                        <Button type='button' onClick={() => history.push("/login")}>
                            {t("log_in")}
                        </Button>
                    </>
                )}
            </FormWrap>
        </FormFrame>
    );
}

export default Activate;
