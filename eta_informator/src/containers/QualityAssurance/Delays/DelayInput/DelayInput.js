import React, { useEffect, useMemo, useState, useContext } from "react";
import { useQueryClient, useMutation } from "react-query";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactSelect from "react-select";
import dayjs from "dayjs";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DatePicker from "../../../../components/Forms/CustomInputs/DatePicker/DatePicker";
import { qualityClient } from "../../../../feathers/feathers";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useApprovers, useMachinesAll } from "../../../../data/ReactQuery";
import { findSubunitById } from "../../../../utils/finders";

const getDelayId = (row) =>
    row?.id ?? row?.ID ?? row?.delayId ?? row?.delayID ?? row?.Id ?? row?.__delayId ?? null;

const DelayInput = ({ selectedSubunit }) => {
    const { t } = useTranslation(["labels", "shopfloor"]);
    const queryClient = useQueryClient();
    const history = useHistory();
    const location = useLocation();
    const { url } = useRouteMatch();
    const [date, setDate] = useState(new Date());
    const [shift, setShift] = useState("");
    const [machine, setMachine] = useState("");
    const [delayType, setDelayType] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [approverId, setApproverId] = useState("");
    const [department, setDepartment] = useState(selectedSubunit ?? null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errors, setErrors] = useState({});
    const { user } = useContext(AuthContext);
    const editingDelay = location?.state?.delay ?? null;
    const editingDelayId = getDelayId(editingDelay);
    const editIdFromQuery = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const rawId = params.get("editId");
        return rawId ? Number(rawId) : null;
    }, [location.search]);
    const [resolvedEditingDelay, setResolvedEditingDelay] = useState(editingDelay);
    const isEditMode = Boolean(editingDelayId || editIdFromQuery);

    const machinesAll = useMachinesAll();
    const departmentId = department?.subunitId ?? department?.value ?? null;
    const machineOptions = useMemo(() => {
        const all = machinesAll?.data ?? [];
        const filtered = departmentId
            ? all.filter((machine) => String(machine.tedId) === String(department?.ted))
            : all;
        return filtered.map((machine) => {
            const label =
                machine.idAlt && machine.nameShort
                    ? `${machine.idAlt} - ${machine.nameShort}`
                    : machine.idAlt || machine.name || String(machine.id);
            return {
                label,
                value: machine.id,
            };
        });
    }, [machinesAll?.data, departmentId, department?.ted]);
    const approversQuery = useApprovers();
    const approverOptions = useMemo(() => {
        const raw = approversQuery?.data ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [approversQuery?.data]);
    const unitsLabels = queryClient.getQueryData("unitsLabels") ?? [];
    const delaysListUrl = url.replace(/\/delay-input$/, "");

    const resetForm = () => {
        setDate(new Date());
        setShift("");
        setMachine("");
        setDelayType("");
        setDurationMinutes("");
        setApproverId("");
    };

    const createDelay = async () => {
        const payload = {
            date: dayjs(date).format("YYYY-MM-DD"),
            shift: Number(shift),
            machine_name: machine ? String(machine) : null,
            delay_type: delayType.trim(),
            duration: Number(durationMinutes),
            subunitID: department?.subunitId ?? department?.value ?? null,
            userID: user?.id ?? null,
            approverID: approverId ? Number(approverId) : null,
        };

        if (isEditMode) {
            const delayId = getDelayId(resolvedEditingDelay) ?? editIdFromQuery;
            if (!delayId) throw new Error("Missing delay id for edit mode.");
            return qualityClient.service("delays").patch(delayId, payload);
        }

        return qualityClient.service("delays").create(payload);
    };

    const createMutation = useMutation(createDelay, {
        onSuccess: () => {
            queryClient.invalidateQueries("delays");
            setShowSuccessModal(true);
            if (!isEditMode) {
                resetForm();
            }
        },
        onError: (error) => {
            // Helps diagnose missing Feathers service or backend mismatch
            console.error("Failed to create delay", {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                className: error?.className,
                errors: error?.errors,
                data: error?.data,
                stack: error?.stack,
            });
        },
    });

    useEffect(() => {
        setDepartment(selectedSubunit ?? null);
    }, [selectedSubunit]);

    useEffect(() => {
        if (editingDelayId) {
            setResolvedEditingDelay(editingDelay);
            return;
        }

        if (!editIdFromQuery) return;

        qualityClient
            .service("delays")
            .get(editIdFromQuery)
            .then((res) => setResolvedEditingDelay(res))
            .catch(() => setResolvedEditingDelay(null));
    }, [editingDelay, editingDelayId, editIdFromQuery]);

    useEffect(() => {
        if (!isEditMode || !resolvedEditingDelay) return;

        const matchedSubunit =
            findSubunitById(unitsLabels, Number(resolvedEditingDelay?.subunitID)) ??
            selectedSubunit ??
            null;

        const machineRawValue =
            resolvedEditingDelay?.machine_name != null
                ? String(resolvedEditingDelay.machine_name)
                : "";
        const matchedMachine = (machinesAll?.data ?? []).find((item) => {
            return (
                String(item?.id) === machineRawValue ||
                String(item?.idAlt) === machineRawValue ||
                String(item?.machineAltKey) === machineRawValue
            );
        });
        const machineValue =
            matchedMachine?.id != null ? String(matchedMachine.id) : machineRawValue;

        setDate(
            resolvedEditingDelay?.date ? dayjs(resolvedEditingDelay.date).toDate() : new Date(),
        );
        setShift(resolvedEditingDelay?.shift != null ? String(resolvedEditingDelay.shift) : "");
        setMachine(machineValue);
        setDelayType(resolvedEditingDelay?.delay_type ?? "");
        setDurationMinutes(
            resolvedEditingDelay?.duration != null ? String(resolvedEditingDelay.duration) : "",
        );
        setApproverId(
            resolvedEditingDelay?.approverID != null ? String(resolvedEditingDelay.approverID) : "",
        );
        setDepartment(matchedSubunit);
    }, [isEditMode, resolvedEditingDelay, unitsLabels, selectedSubunit, machinesAll?.data]);

    useEffect(() => {
        if (!showSuccessModal) return undefined;

        const timer = setTimeout(() => {
            setShowSuccessModal(false);
            if (isEditMode) {
                history.push(delaysListUrl);
            }
        }, 1400);

        return () => clearTimeout(timer);
    }, [showSuccessModal, isEditMode, history, delaysListUrl]);

    return (
        <div className='delay-input-page'>
            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
                <Modal.Body
                    style={{
                        fontSize: "1.1rem",
                        textAlign: "center",
                        padding: "2rem 1.5rem",
                    }}
                >
                    <FontAwesomeIcon
                        icon='check-circle'
                        color='#28a745'
                        size='3x'
                        style={{ marginBottom: 12 }}
                    />
                    <div>
                        {isEditMode ? t("labels:successfully_edited") : t("labels:delay_saved")}
                    </div>
                </Modal.Body>
            </Modal>
            <form
                className='mt-4'
                onSubmit={(event) => {
                    event.preventDefault();
                    const newErrors = {};
                    if (!date) newErrors.date = true;
                    if (!shift) newErrors.shift = true;
                    if (!machine) newErrors.machine = true;
                    if (!delayType) newErrors.delayType = true;
                    if (!durationMinutes) newErrors.durationMinutes = true;
                    if (!department) newErrors.department = true;
                    setErrors(newErrors);
                    if (Object.keys(newErrors).length === 0) {
                        createMutation.mutate();
                    }
                }}
            >
                <div className='row justify-content-center'>
                    <div className='col-12 col-lg-8'>
                        <div className='row g-3'>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-date'>
                                    {t("date")}
                                </label>
                                <DatePicker
                                    id='delay-date'
                                    selected={date}
                                    onChange={(value) => {
                                        setDate(value);
                                        setErrors((e) => ({ ...e, date: false }));
                                    }}
                                    className='form-control'
                                    dateFormat='dd. MM. yyyy'
                                />
                                {errors.date && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-shift'>
                                    {t("shift")}
                                </label>
                                <select
                                    id='delay-shift'
                                    className='form-select'
                                    value={shift}
                                    onChange={(event) => {
                                        setShift(event.target.value);
                                        setErrors((e) => ({ ...e, shift: false }));
                                    }}
                                >
                                    <option value=''>{t("select_shift")}</option>
                                    <option value='1'>1</option>
                                    <option value='2'>2</option>
                                    <option value='3'>3</option>
                                </select>
                                {errors.shift && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-department'>
                                    {t("subunit")}
                                </label>
                                <ReactSelect
                                    inputId='delay-department'
                                    options={unitsLabels}
                                    value={department}
                                    placeholder={t("subunit")}
                                    onChange={(selected) => {
                                        setDepartment(selected);
                                        setErrors((e) => ({ ...e, department: false }));
                                    }}
                                    styles={{
                                        menu: (provided) => ({
                                            ...provided,
                                            zIndex: 9999,
                                        }),
                                    }}
                                    components={{
                                        DropdownIndicator: () => null,
                                        IndicatorSeparator: () => null,
                                    }}
                                    theme={(theme) => ({
                                        ...theme,
                                        colors: {
                                            ...theme.colors,
                                            primary25: window
                                                .getComputedStyle(document.documentElement)
                                                .getPropertyValue("--p25"),
                                            primary50: window
                                                .getComputedStyle(document.documentElement)
                                                .getPropertyValue("--p50"),
                                            primary75: window
                                                .getComputedStyle(document.documentElement)
                                                .getPropertyValue("--p75"),
                                            primary: window
                                                .getComputedStyle(document.documentElement)
                                                .getPropertyValue("--p100"),
                                            danger: window
                                                .getComputedStyle(document.documentElement)
                                                .getPropertyValue("--danger"),
                                        },
                                    })}
                                />
                                {errors.department && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-machine'>
                                    {t("machine")}
                                </label>
                                <select
                                    id='delay-machine'
                                    className='form-select'
                                    value={machine}
                                    onChange={(event) => {
                                        setMachine(event.target.value);
                                        setErrors((e) => ({ ...e, machine: false }));
                                    }}
                                >
                                    <option value=''>{t("select_machine")}</option>
                                    {machineOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.machine && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-type'>
                                    {t("delay_description")}
                                </label>
                                <textarea
                                    id='delay-type'
                                    className='form-control'
                                    value={delayType}
                                    onChange={(event) => {
                                        setDelayType(event.target.value);
                                        setErrors((e) => ({ ...e, delayType: false }));
                                    }}
                                    placeholder={t("enter_delay_description")}
                                    rows={5}
                                />
                                {errors.delayType && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-duration'>
                                    {t("duration_minutes")}
                                </label>
                                <input
                                    id='delay-duration'
                                    type='number'
                                    min='0'
                                    className='form-control'
                                    value={durationMinutes}
                                    onChange={(event) => {
                                        setDurationMinutes(event.target.value);
                                        setErrors((e) => ({ ...e, durationMinutes: false }));
                                    }}
                                    placeholder={t("enter_duration_minutes")}
                                />
                                {errors.durationMinutes && (
                                    <div style={{ color: "red", fontSize: 13 }}>
                                        {t("labels:required_field")}
                                    </div>
                                )}
                            </div>
                            <div className='col-12 col-md-6'>
                                <label className='form-label' htmlFor='delay-approver'>
                                    {t("approver")}
                                </label>
                                <select
                                    id='delay-approver'
                                    className='form-select'
                                    value={approverId}
                                    onChange={(event) => setApproverId(event.target.value)}
                                >
                                    <option value=''>{t("select_approver")}</option>
                                    {approverOptions.map((option, index) => {
                                        const value = option?.id ?? option?.value ?? "";
                                        const label =
                                            option?.name ??
                                            option?.label ??
                                            option?.value ??
                                            option?.id;

                                        return (
                                            <option
                                                key={
                                                    option?.id ??
                                                    option?.name ??
                                                    option?.value ??
                                                    index
                                                }
                                                value={value}
                                            >
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className='d-flex justify-content-end gap-2 mt-4'>
                            <button
                                type='button'
                                className='btn btn-danger ms-auto'
                                onClick={() => history.push(delaysListUrl)}
                            >
                                {t("cancel")}
                            </button>
                            <button type='submit' className='btn btn-primary'>
                                {isEditMode ? t("labels:edit") : t("save")}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DelayInput;
