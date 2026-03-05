import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import FormRow from "../../../components/Layout/ManualInput/Forms/FormRow";
import FormWrap from "../../../components/Layout/ManualInput/Forms/FormWrap";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import ErrorMessage from "../../../components/Layout/ManualInput/Forms/ErrorMessage";
import { ClipLoader } from "react-spinners";

const FormFrame = styled.div`
    display: flex;
    flex-direction: column;
    padding: 24px;
    border: 2px solid var(--bs-light);
    height: 600px;
    width: 400px;
`;

function Change(props) {
    const { t } = useTranslation("labels");
    const [success, setSuccess] = useState(0);
    const history = useHistory();
    const { state } = useContext(AuthContext);
    const validationSchema = Yup.object().shape({
        oldPassword: Yup.string().required(t("required_field")),
        newPassword: Yup.string().required(t("required_field")),
        newPasswordCheck: Yup.string()
            .oneOf([Yup.ref("newPassword"), null], t("password_not_matching"))
            .required(t("required_field")),
    });
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: yupResolver(validationSchema) });

    const onSubmit = (data) => {
        setSuccess(1);
        axios
            .post(`http://${process.env.REACT_APP_INFORMATOR}/auth-managment`, {
                action: "passwordChange",
                value: {
                    user: { email: state.user.email },
                    oldPassword: data.oldPassword,
                    password: data.newPassword,
                },
            })
            .then((response) => {
                if (response.status == 201) {
                    setSuccess(2);
                } else {
                    setSuccess(3);
                }
            });
    };

    let content;
    switch (success) {
        case 0:
            content = (
                <FormWrap className='my-auto'>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FormRow>
                            <Form.Label>{t("old_password")}</Form.Label>
                            <Form.Control
                                {...register("oldPassword")}
                                type='password'
                                autoComplete='off'
                                placeholder={t("enter_old_password")}
                            />
                        </FormRow>
                        <FormRow>
                            <Form.Label>{t("new_password")}</Form.Label>
                            <Form.Control
                                {...register("newPassword")}
                                type='password'
                                autoComplete='off'
                                placeholder={t("enter_new_password")}
                            />
                        </FormRow>
                        <FormRow>
                            <Form.Control
                                {...register("newPasswordCheck")}
                                type='password'
                                autoComplete='off'
                                placeholder={t("enter_new_password_check")}
                            />
                        </FormRow>
                        <ErrorMessage>
                            {t(errors?.newPassword?.message) ||
                                t(errors?.newPasswordCheck?.message)}
                        </ErrorMessage>
                        <FormRow className='mt-5 d-flex justify-content-center'>
                            <Button
                                className='btn-danger mx-1'
                                type='button'
                                onClick={() => history.push("/shopfloor")}
                            >
                                {t("cancel")}
                            </Button>
                            <Button className='mx-1' type='submit'>
                                {t("change")}
                            </Button>
                        </FormRow>
                    </form>
                </FormWrap>
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
                <div className='h-100 w-100 d-flex flex-column justify-content-center align-items-center text-center'>
                    <h3>{t("password_change_success")}</h3>
                    <Button onClick={() => history.push("/shopfloor")}>{t("finish")}</Button>
                </div>
            );
            break;
        case 3:
            content = (
                <div className='h-100 w-100 d-flex flex-column justify-content-center align-items-center text-center'>
                    <h3>{t("password_change_failed")}</h3>
                    <Button onClick={() => history.push("/shopfloor")}>{t("back")}</Button>
                </div>
            );
            break;

        default:
            break;
    }

    return (
        <FormFrame>
            <h2 className='mx-auto p-5'>{t("password_change")}</h2>
            {content}
        </FormFrame>
    );
}

export default Change;
