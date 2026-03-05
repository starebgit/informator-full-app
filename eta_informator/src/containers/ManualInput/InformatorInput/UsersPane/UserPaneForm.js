import { Controller, useForm } from "react-hook-form";
import FormWrap from "../../../../components/Layout/ManualInput/Forms/FormWrap";
import FormRow from "../../../../components/Layout/ManualInput/Forms/FormRow";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Form, FormControl, Col, Button, FormLabel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ReactSelect, {
    findOptionByValue,
} from "../../../../components/Forms/CustomInputs/Select/Select";
import { Link, useHistory, useParams } from "react-router-dom";
import client from "../../../../feathers/feathers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createUser, editUser } from "../../../../data/API/Informator/InformatorAPI";
import ErrorMessage from "../../../../components/Layout/ManualInput/Forms/ErrorMessage";

function UserPaneForm() {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { t } = useTranslation(["manual_input", "labels"]);
    const { id } = useParams();
    const validationSchema = Yup.object().shape({
        username: Yup.string().required(t("labels:required_field")),
        name: Yup.string().required(t("labels:required_field")),
        lastname: Yup.string().required(t("labels:required_field")),
        role: Yup.object().nullable().required(t("labels:required_field")),
        email: Yup.string().email().required(t("labels:required_field")),
    });

    const addUserMutation = useMutation((values) => createUser(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("users");
                history.push(".");
            }, 2000);
        },
    });

    const editUserMutation = useMutation((values) => editUser(values), {
        onSuccess: async () => {
            setTimeout(() => {
                queryClient.invalidateQueries("users");
                history.push("..");
            }, 2000);
        },
    });

    const isAdding = !id;
    const rolesLabels = queryClient.getQueryData("rolesLabels");
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        control,
    } = useForm({ resolver: yupResolver(validationSchema) });

    const user = useQuery(
        ["user", id],
        async () => {
            return client
                .service("users")
                .get(id, {})
                .then((result) => result);
        },
        {
            enabled: !!id,
            onSuccess: (data) => {
                const role = rolesLabels.find((role) => {
                    return role.value == data.roleId;
                });
                setValue("username", data.username);
                setValue("email", data.email);
                setValue("name", data.name);
                setValue("lastname", data.lastname);
                setValue("role", role);
            },
        },
    );

    const onSubmit = (values) => {
        isAdding
            ? addUserMutation.mutate({
                  ...values,
                  roleId: values.role.value,
              })
            : editUserMutation.mutate({
                  id: id,
                  ...values,
                  roleId: values.role.value,
              });
    };

    return (
        <>
            <h2>{isAdding ? t("labels:add_user") : t("labels:edit_user")}</h2>
            <FormWrap>
                <form onSubmit={handleSubmit(onSubmit)} onReset={reset}>
                    <FormRow>
                        <Col>
                            <FormLabel>{t("labels:firstname")}</FormLabel>
                            <FormControl
                                {...register("name")}
                                type='text'
                                placeholder={t("labels:enter_firstname")}
                            />
                            <ErrorMessage>{errors?.name?.message}</ErrorMessage>
                        </Col>
                        <Col>
                            <FormLabel>{t("labels:lastname")}</FormLabel>
                            <FormControl
                                {...register("lastname")}
                                type='text'
                                placeholder={t("labels:enter_lastname")}
                            />
                            <ErrorMessage>{errors?.lastname?.message}</ErrorMessage>
                        </Col>
                    </FormRow>
                    <FormRow>
                        <Col>
                            <FormLabel>{t("labels:email")}</FormLabel>
                            <FormControl
                                {...register("email")}
                                type='text'
                                placeholder={t("labels:enter_email")}
                            />
                            <ErrorMessage>{errors?.email?.message}</ErrorMessage>
                        </Col>
                    </FormRow>
                    <FormRow>
                        <Col>
                            <FormLabel>{t("labels:username")}</FormLabel>
                            <FormControl
                                {...register("username")}
                                type='text'
                                placeholder={t("labels:enter_username")}
                                readOnly={!isAdding}
                            />
                            <ErrorMessage>{errors?.username?.message}</ErrorMessage>
                        </Col>
                        <Col>
                            <FormLabel>{t("labels:role")}</FormLabel>
                            <Controller
                                name='role'
                                control={control}
                                defaultValue={isAdding ? false : false}
                                render={({ ref, field }) => (
                                    <ReactSelect
                                        {...field}
                                        ref={ref}
                                        options={rolesLabels}
                                        placeholder={t("labels:select_role")}
                                    />
                                )}
                            />
                            <ErrorMessage>{errors?.role?.message}</ErrorMessage>
                        </Col>
                    </FormRow>
                    <div className='d-flex justify-content-end gap-2'>
                        <Link to={isAdding ? "." : ".."} className='btn btn-danger ms-auto me-1'>
                            {t("labels:cancel")}
                        </Link>
                        <Button variant='primary' type='submit'>
                            {isAdding ? t("labels:add") : t("labels:edit")}
                        </Button>
                    </div>
                </form>
            </FormWrap>
        </>
    );
}

export default UserPaneForm;
