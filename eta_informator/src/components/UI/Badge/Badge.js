import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Badge({ text, value, plan }) {
    const formatter = new Intl.NumberFormat("sl", {
        style: "percent",
        minimumFractionDigits: 0,
    });

    return (
        <div className='badge d-flex gap-5 mx-1 align-items-center justify-content-between'>
            <div className='mx-1 fs-6 fs-sm-5 fw-normal'>{text}</div>
            <div className='d-flex align-items-center gap-2'>
                <div className='fs-5 fs-sm-4'>{value}</div>
                <div className='fs-6 fs-sm-4 fw-normal opacity-80'>
                    {value ? `(${formatter.format(value / plan)})` : ""}
                </div>
            </div>
        </div>
    );
}

export default Badge;
