function Parameter({ property, value, title = false, props }) {
    if (value === null || value === "" || value == undefined) return null;
    return (
        <div className='d-flex align-items-baseline me-3'>
            <div className='fw-bold text-muted me-1'>{property}</div>
            <div className={title ? "h5 mb-0" : ""} style={{ textTransform: "capitalize" }}>
                {value}
            </div>
        </div>
    );
}

export default Parameter;
