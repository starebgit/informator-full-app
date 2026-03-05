import { Card, Col, Container, Row, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Select from "../../components/Forms/CustomInputs/Select/Select";
import SettingCategory from "../../components/Settings/SettingCategory/SettingCategory";
import CountrySelect from "../../components/Forms/CustomInputs/CountrySelect/CountrySelect";
import SettingItem from "../../components/Settings/SettingCategory/SettingItem/SettingItem";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import client from "../../feathers/feathers";
import { SetNavigationContext } from "../../context/NavigationContext/NavigationContext";
import { useHistory } from "react-router";
import { useQueryClient } from "react-query";
import { Controller, useForm } from "react-hook-form";
import { findOptionByKeyword } from "../../components/Forms/CustomInputs/Select/Select";
import ErrorMessage from "../../components/Layout/ManualInput/Forms/ErrorMessage";
import { useMachines } from "../../data/ReactQuery";
import _ from "lodash";

const Body = styled(Card.Body)`
    display: flex;
    flex-direction: column;
    padding: var(--s3) var(--s1);
    .settings-wrap:last-child {
        border: none;
    }
`;

function Settings(props) {
    const { state } = useContext(AuthContext);
    const { t, i18n } = useTranslation(["settings", "labels"]);
    const {
        handleSubmit,
        setValue,
        getValues,
        watch,
        formState: { errors },
        control,
    } = useForm();
    const { isAuth } = state;
    const queryClient = useQueryClient();
    const setNavigationContext = useContext(SetNavigationContext);
    const history = useHistory();
    const unitsLabels = queryClient.getQueryData("unitsLabels");
    const settings = isAuth ? queryClient.getQueryData(["userSettings", state?.user?.id]) : null;
    const [selectedTed, setSelectedTed] = useState(null);
    const unit = watch("defaultSubunit");

    const machines = useMachines(selectedTed, {
        onSuccess: (machines) => {
            const keyword = getValues("defaultSubunit")?.keyword;
            const selectedMachines = JSON.parse(settings.selectedMachines.value);
            const selectedMachinesLabels = generateMachinesLabels(
                machines.filter((machine) => {
                    return _.includes(selectedMachines[keyword], machine.id);
                }),
            );
            setValue("selectedMachines", selectedMachinesLabels);
        },
        enabled: !!settings,
    });

    const lang = [
        { key: "en", value: "en", label: t("en"), flag: "GB", id: 1 },
        { key: "de", value: "de", label: t("de"), flag: "DE", id: 2 },
        { key: "si", value: "si", label: t("si"), flag: "SI", id: 3 },
    ];

    //**MUTATIONS**

    useEffect(() => {
        setNavigationContext.setNavigationHandler({});
    }, []);

    useEffect(() => {
        //setSelectedTed(unit);
        if (isAuth) {
            setSelectedTed(findOptionByKeyword(unitsLabels, settings.defaultSubunit.value).ted);
        }
    }, [isAuth, settings, unitsLabels]);

    const onSubmit = (data) => {
        if (isAuth) {
            const selectedMachineSet = data.selectedMachines.map((machine) => machine.value);
            const machineSets = {
                ...JSON.parse(settings.selectedMachines.value),
                [data.defaultSubunit.keyword]: selectedMachineSet,
            };
            Promise.all([
                client.service("user-settings").patch(settings.selectedMachines.id, {
                    unconstrainedValue: JSON.stringify(machineSets),
                }),
                client.service("user-settings").patch(settings.defaultSubunit.id, {
                    unconstrainedValue: data.defaultSubunit.keyword,
                }),
                client.service("user-settings").patch(settings.language.id, {
                    allowedSettingsValueId: data.defaultLanguage.id,
                }),
            ]).then((response) => {
                queryClient.invalidateQueries("userSettings");
                history.push("/");
            });
        } else {
            i18n.changeLanguage(data.defaultLanguage.value);
            history.goBack();
        }
    };

    function generateMachinesLabels(machines) {
        return machines?.length
            ? machines.map((machine) => {
                  return { label: machine.name, value: machine.idAlt };
              })
            : [];
    }

    return (
        <Container className='mt-3'>
            <Row>
                <Col>
                    <Card>
                        <Body>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div>
                                    <SettingCategory isAuth={isAuth} title={t("data")}>
                                        <SettingItem
                                            title={t("default_section")}
                                            caption={t("default_section_description")}
                                        >
                                            <Controller
                                                name='defaultSubunit'
                                                control={control}
                                                defaultValue={
                                                    isAuth
                                                        ? findOptionByKeyword(
                                                              unitsLabels,
                                                              settings.defaultSubunit.value,
                                                          )
                                                        : null
                                                }
                                                render={({ ref, field }) => {
                                                    return (
                                                        <Select
                                                            {...field}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                                setSelectedTed(value.ted);
                                                            }}
                                                            ref={ref}
                                                            options={unitsLabels}
                                                            placeholder={t(
                                                                "izberite_privzeto_delovno_enoto",
                                                            )}
                                                        />
                                                    );
                                                }}
                                            />
                                            <ErrorMessage>
                                                {errors?.defaultSubunit?.message}
                                            </ErrorMessage>
                                        </SettingItem>
                                        <SettingItem
                                            className='p-4'
                                            title={t("selected_machines")}
                                            caption={t("selected_machines_description")}
                                        >
                                            <Controller
                                                name='selectedMachines'
                                                control={control}
                                                defaultValue={generateMachinesLabels(
                                                    machines?.data,
                                                ).filter((machine) => {
                                                    return _.includes(
                                                        JSON.parse(settings.selectedMachines.value)[
                                                            findOptionByKeyword(
                                                                unitsLabels,
                                                                settings.defaultSubunit.value,
                                                            )
                                                        ],
                                                        machine.value,
                                                    );
                                                })}
                                                render={({ ref, field }) => (
                                                    <Select
                                                        {...field}
                                                        ref={ref}
                                                        name='unitMachines'
                                                        options={generateMachinesLabels(
                                                            machines?.data,
                                                        )}
                                                        isMulti
                                                    />
                                                )}
                                            />
                                        </SettingItem>
                                    </SettingCategory>
                                    <SettingCategory title={t("language")}>
                                        <SettingItem title={t("default_language")}>
                                            <Controller
                                                name='defaultLanguage'
                                                control={control}
                                                defaultValue={lang.filter((item) => {
                                                    return isAuth
                                                        ? item.value == settings?.language.value
                                                        : item.value == i18n.language;
                                                })}
                                                render={({ ref, field }) => (
                                                    <CountrySelect
                                                        {...field}
                                                        ref={ref}
                                                        options={lang}
                                                        placeholder={t("izberite_prevzeti_jezik")}
                                                    />
                                                )}
                                            />
                                        </SettingItem>
                                    </SettingCategory>
                                    <SettingCategory isAuth={isAuth} title={t("labels:password")}>
                                        <div>
                                            <Button
                                                onClick={() => {
                                                    history.push("/login/change");
                                                }}
                                                className='mt-2'
                                            >
                                                {t("labels:change_password")}
                                            </Button>
                                        </div>
                                    </SettingCategory>
                                </div>
                                <div className='d-flex justify-content-end gap-2'>
                                    <Button
                                        variant='light'
                                        onClick={() => {
                                            history.goBack();
                                        }}
                                    >
                                        {t("labels:cancel")}
                                    </Button>
                                    <Button variant='primary' type='submit'>
                                        {t("labels:save")}
                                    </Button>
                                </div>
                            </form>
                        </Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
export default Settings;
