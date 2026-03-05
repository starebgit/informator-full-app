import { useContext } from "react";
import { ToastContext } from "../../context/ToastContext/ToastContext";
import BsToast from "react-bootstrap/Toast";
import { ToastContainer } from "react-bootstrap";

export default function Toast() {
    const { toast, hideToast } = useContext(ToastContext);

    return (
        <ToastContainer className='position-fixed' style={{ right: "1rem", bottom: "1rem" }}>
            <BsToast
                onClose={() => hideToast()}
                show={!!toast}
                bg={toast?.type.toLowerCase()}
                autohide
                delay={2000}
            >
                <BsToast.Header>
                    <strong className='me-auto'>{toast?.title}</strong>
                </BsToast.Header>
                <BsToast.Body className={toast?.type === "dark" && "text-white"}>
                    {toast?.message}
                </BsToast.Body>
            </BsToast>
        </ToastContainer>
    );
}
