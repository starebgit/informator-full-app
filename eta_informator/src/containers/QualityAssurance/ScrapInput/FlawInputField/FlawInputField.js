import { useTranslation } from "react-i18next";
import { Button, FormControl, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { useRef } from "react";
import { faComment } from "@fortawesome/free-solid-svg-icons";

function FlawInputField({
    flaw,
    setValue,
    control,
    getValues,
    handleRefChange,
    virtualKeyboard,
    markAsDirty,
    displayLocation = true,
    props,
}) {
    const { t } = useTranslation(["manual_input", "labels"]);
    const defaultValue = flaw.scrap?.value || 0;
    const currentValue = useWatch({
        control,
        name: flaw.name,
        defaultValue: defaultValue,
    });

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comment, setComment] = useState("");

    const handleCommentSave = () => {
        setValue(`${flaw.name}__comment`, comment || "", { shouldDirty: true });
        markAsDirty?.();
        setShowCommentModal(false);
    };

    const handleOpenCommentModal = () => {
        setComment(getValues(`${flaw.name}__comment`) || flaw.scrap?.comment || "");
        setShowCommentModal(true);
    };

    const ref = useRef();

    useEffect(() => {
        setValue(flaw.name, defaultValue);
        setValue(`${flaw.name}__comment`, flaw.scrap?.comment || "");
    }, [defaultValue, flaw.name, flaw.scrap?.comment, setValue]);

    const handleOnBlur = (event) => {
        if (virtualKeyboard) return;
        const input = event.target.value;
        setValue(flaw.name, input === "" ? "" : Number(input), { shouldDirty: true });
        markAsDirty?.();
    };

    const handleOnMinus = () => {
        if (Number(currentValue) <= 0) return;
        setValue(flaw.name, Number(currentValue) - 1, { shouldDirty: true });
        markAsDirty?.();
    };

    const handleOnPlus = () => {
        setValue(flaw.name, Number(currentValue || 0) + 1, { shouldDirty: true });
        markAsDirty?.();
    };

    return (
        <div>
            <div className='d-flex flex-column'>
                {displayLocation && (
                    <div className='small p-0 m-0 text-muted'>{flaw.flawLocation.name}</div>
                )}
                <div className='fs-6 p-0 m-0'>{flaw.name}</div>
            </div>
            <div className='d-flex gap-2'>
                <Button variant='primary' onClick={handleOnMinus}>
                    <span>
                        <FontAwesomeIcon icon='minus' />
                    </span>
                </Button>
                <div
                    className='w-100 w-xs-auto'
                    ref={ref}
                    onClick={() => handleRefChange(ref, flaw.name)}
                >
                    <Controller
                        defaultValue={defaultValue || 0}
                        control={control}
                        name={flaw.name}
                        render={({ field }) => (
                            <FormControl {...field} onBlur={handleOnBlur} autoComplete='off' />
                        )}
                    />
                </div>
                {Number(currentValue) > 0 && (
                    <Button
                        variant='warning'
                        onClick={handleOpenCommentModal} // <-- spremeni handler
                        style={{ color: "#fff" }}
                    >
                        <FontAwesomeIcon icon={faComment} />
                    </Button>
                )}
                <Button variant='primary' onClick={handleOnPlus}>
                    <span>
                        <FontAwesomeIcon icon='plus' />
                    </span>
                </Button>
            </div>
            {/* Modal za komentar */}
            <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t("Vnesi komentar")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FormControl
                        type='text'
                        maxLength={30}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t("Komentar (max 30 znakov)")}
                        autoFocus
                    />
                    <div className='text-end small text-muted mt-1'>{comment.length}/30</div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => setShowCommentModal(false)}>
                        {t("Prekliči")}
                    </Button>
                    <Button variant='primary' onClick={handleCommentSave}>
                        {t("Shrani")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default FlawInputField;
