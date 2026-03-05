import { Row, Col, Modal, Button, FormControl } from "react-bootstrap";
import SubmitMessage from "../../../../components/UI/UserMessages/SubmitMessage";
import Table from "../../../../components/Tables/Table";
import client from "../../../../feathers/feathers";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { useTranslation } from "react-i18next";
import { Fragment, useMemo, useState } from "react";
import { Switch, useRouteMatch, Link } from "react-router-dom";
import PrivateRoute from "../../../../routes/PrivateRoute";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserPaneForm from "./UserPaneForm";
import { removeUser } from "../../../../data/API/Informator/InformatorAPI";
import { PulseLoader } from "react-spinners";

function UsersPane(props) {
    const { path } = useRouteMatch();
    const { t } = useTranslation(["manual_input", "labels"]);
    const queryClient = useQueryClient();
    const users = useQuery(["users"], () => {
        return client
            .service("users")
            .find()
            .then((response) => response.data);
    });
    const [searchText, setSearchText] = useState("");

    const removeUserMutation = useMutation((id) => removeUser(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries("users");
            setTimeout(() => {
                setShow(false);
                setTimeout(() => {
                    removeUserMutation.reset();
                }, 300);
            }, 2000);
        },
    });
    const [show, setShow] = useState(false);
    const [selectedUser, setSelectedUser] = useState(false);
    const columns = useMemo(
        () => [
            { name: "ID", selector: (row) => row.id, width: "60px", center: true },
            { name: t("labels:username"), selector: (row) => row.username, wrap: true },
            { name: t("labels:firstname"), selector: (row) => row.name, wrap: true },
            { name: t("labels:lastname"), selector: (row) => row.lastname },
            { name: t("labels:email"), selector: (row) => row.email, grow: 2 },
            { name: t("labels:role"), selector: (row) => row.role },
            { name: "role", selector: (row) => row.roleId, omit: true },
            {
                name: t("labels:verified"),
                selector: (row) => row.verified,
                width: "90px",
                center: true,
                format: (row) => {
                    if (row.verified) {
                        return <FontAwesomeIcon icon='check' />;
                    } else {
                        return <FontAwesomeIcon icon='times' />;
                    }
                },
            },
            {
                name: t("created_at"),
                selector: (row) => row.createdAt,
                sortable: true,
                grow: 2,
                format: (row) => {
                    return dayjs(row.createdAt).format("LL");
                },
            },
            {
                name: t("edit"),
                selector: (row) => row.edit,
                right: true,
                cell: (row) => (
                    <div className='d-flex'>
                        {row.verified ? (
                            <div
                                className='btn btn-link btn-sm'
                                onClick={() => {
                                    client
                                        .service("auth-managment")
                                        .create({
                                            action: "sendResetPwd",
                                            value: { email: row.email },
                                        })
                                        .then((data) => data);
                                }}
                            >
                                <FontAwesomeIcon
                                    className='mx-1'
                                    icon='key'
                                    style={{ fontSize: "21px" }}
                                />
                            </div>
                        ) : null}

                        <div className='btn btn-link btn-sm'>
                            <Link
                                as={Button}
                                style={{ fontSize: "14px" }}
                                to={"/manual-input/informator/users/edit/" + row.id}
                            >
                                <FontAwesomeIcon
                                    icon='pencil-alt'
                                    style={{ fontSize: "21px" }}
                                    className='mx-1'
                                />
                            </Link>
                        </div>

                        <div
                            className='btn btn-link btn-sm'
                            onClick={() => {
                                setSelectedUser(row.id);
                                setShow(true);
                            }}
                        >
                            <FontAwesomeIcon
                                icon='trash-alt'
                                style={{
                                    fontSize: "21px",
                                    color: "var(--bs-danger)",
                                }}
                                className='mx-1'
                            />
                        </div>
                    </div>
                ),
            },
        ],
        [t, setSelectedUser, setShow],
    );

    if (users.isLoading) {
        return (
            <>
                <Row className='mb-2 no-gutters'>
                    <Col>
                        <h3>{t("users")}</h3>
                    </Col>
                </Row>
                <div className='d-flex h-100 justify-content-center align-items-center'>
                    <PulseLoader color='#2c3e50' size={15} margin={10} />
                </div>
            </>
        );
    }

    const data = users.data.map((user) => {
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: t("labels:" + user.role.role),
            roleId: user.role.id,
            createdAt: user.createdAt,
            verified: user.isVerified,
        };
    });

    const filteredData = data.filter(
        (user) =>
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchText.toLowerCase()),
    );

    const userPane = (
        <Fragment>
            <Row className='mb-2 no-gutters'>
                <Col>
                    <h3>{t("users")}</h3>
                </Col>
            </Row>
            <Row className='mb-3 no-gutters'>
                <Col>
                    <FormControl
                        type='text'
                        placeholder='Išči uporabniško ime, ime ali priimek'
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table
                        actions={
                            <div>
                                <Link className='btn btn-primary' to={`${path}/add`}>
                                    {t("labels:add_user")}
                                </Link>
                            </div>
                        }
                        data={filteredData}
                        columns={columns}
                        defaultSortField='createdAt'
                        defaultSortAsc={false}
                        noDataComponent={t("no_notices")}
                    />
                </Col>
            </Row>
            <Modal centered onHide={() => setShow(false)} show={show}>
                <Modal.Body>
                    {removeUserMutation.isSuccess ? (
                        <SubmitMessage isSuccess={true} message='successfully_removed' />
                    ) : (
                        <div className='d-flex flex-column align-items-center'>
                            <h5 className='p-4'>{t("removal_prompt")}</h5>
                            <div>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='primary'
                                    onClick={() => setShow(false)}
                                >
                                    {t("labels:cancel")}
                                </Button>
                                <Button
                                    className='mx-1'
                                    size='sm'
                                    variant='danger'
                                    onClick={() => removeUserMutation.mutate(selectedUser)}
                                >
                                    {t("labels:remove")}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Fragment>
    );

    return (
        <Switch>
            <PrivateRoute exact path={path} allowRoles={["admin"]}>
                {userPane}
            </PrivateRoute>
            <PrivateRoute path={path + "/add"} allowRoles={["admin"]}>
                <UserPaneForm />
            </PrivateRoute>
            <PrivateRoute path={path + "/edit/:id"} allowRoles={["admin"]}>
                <UserPaneForm />
            </PrivateRoute>
        </Switch>
    );
}

export default UsersPane;
