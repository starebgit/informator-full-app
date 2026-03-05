import { useFormikContext, useField } from "formik";
import { useDropzone } from "react-dropzone";

function FormikDropzone({ ...props }) {
    const { setFieldValue } = useFormikContext();
    const [field, meta] = useField(props);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ".pdf",
        onDrop: (acceptedFiles) => {
            const newValue = [...field.value, ...acceptedFiles];

            setFieldValue(field.name, newValue);
        },
    });
    return (
        <>
            <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />

                {isDragActive ? (
                    <div
                        style={{
                            height: "50px",
                            border: "2px dotted lightgray",
                            textAlign: "center",
                        }}
                    >
                        <p>Odložite tukaj</p>
                    </div>
                ) : (
                    <div
                        style={{
                            height: "50px",
                            border: "2px solid lightgray",
                            textAlign: "center",
                            verticalAlign: "middle",
                        }}
                    >
                        <p>Kliknite ali potegnite datoteke.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default FormikDropzone;
