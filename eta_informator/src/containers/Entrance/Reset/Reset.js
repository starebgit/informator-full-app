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
import { ClipLoader } from "react-spinners";

const FormFrame = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
    border: 2px solid var(--bs-light);
    height: 400px;
    width: 400px;
`;

function Reset() {
    const history = useHistory();
    const [resetSuccess, setResetSuccess] = useState(0);
    const [sendSuccess, setSendSuccess] = useState(false);
    const { t } = useTranslation("labels");
    const { token } = useParams();
    const validationSchema = !!token
        ? Yup.object().shape({
              password: Yup.string().required(t("required_field")),
              passwordCheck: Yup.string()
                  .oneOf([Yup.ref("password"), null], t("password_not_matching"))
                  .required(t("required_field")),
          })
        : Yup.object().shape({
              email: Yup.string().email().required(t("required_field")),
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
        if (!!token) {
            setResetSuccess(1);
            axios
                .post(`http://${process.env.REACT_APP_INFORMATOR}/auth-managment`, {
                    action: "resetPwdLong",
                    value: {
                        token: token,
                        password: data.password,
                    },
                })
                .then((response) => {
                    if (response.status == 201) {
                        setResetSuccess(2);
                    } else {
                        setResetSuccess(3);
                    }
                });
        }
        axios
            .post(`http://${process.env.REACT_APP_INFORMATOR}/auth-managment`, {
                action: "sendResetPwd",
                value: {
                    email: data.email,
                },
            })
            .then((response) => {
                if (response.status == 201) {
                    setSendSuccess(true);
                }
            })
            .catch((e) => console.log(e));
    };

    let content;

    switch (resetSuccess) {
        case 0:
            content = (
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
                            {t("reset")}
                        </Button>
                    </FormRow>
                </form>
            );
            break;
        case 1:
            content = (
                <div className='h-100 w-100 d-flex justify-content-center align-items-center'>
                    <ClipLoader size='75px' />
                </div>
            );
            break;
        case 2:
            content = (
                <>
                    <h4 className='mb-5 text-center'>{t("password_reset_success")}</h4>
                    <Button type='button' onClick={() => history.push("/login")}>
                        {t("log_in")}
                    </Button>
                </>
            );
            break;
        case 3:
            content = (
                <>
                    <h4 className='mb-5 text-center'>{t("password_reset_failed")}</h4>
                    <Button type='button' onClick={() => history.push("/login")}>
                        {t("back")}
                    </Button>
                </>
            );
            break;
        default:
            break;
    }

    return (
        <FormFrame>
            <h2>{t("reset_password")}</h2>
            <FormWrap className='my-auto d-flex flex-column align-items-center justify-content-center'>
                {token ? (
                    content
                ) : sendSuccess ? (
                    <div className='text-center'>
                        <h5 className='mb-5'>{t("email_sent_success")}</h5>
                        <Button type='button' onClick={() => history.push("/login")}>
                            {t("back")}
                        </Button>
                    </div>
                ) : (
                    <form className='my-5' onSubmit={handleSubmit(onSubmit)}>
                        <FormRow>
                            <Form.Label>{t("email")}</Form.Label>
                            <Form.Control
                                {...register("email")}
                                type='text'
                                autoComplete='off'
                                placeholder={t("enter_email")}
                            />
                        </FormRow>
                        <FormRow className='mt-2 d-flex justify-content-center'>
                            <Button
                                className='mx-1 btn-danger'
                                type='button'
                                onClick={() => {
                                    history.push("/login");
                                }}
                            >
                                {t("back")}
                            </Button>
                            <Button className='mx-1' type='submit'>
                                {t("reset")}
                            </Button>
                        </FormRow>
                    </form>
                )}
            </FormWrap>
        </FormFrame>
    );
}

export default Reset;
