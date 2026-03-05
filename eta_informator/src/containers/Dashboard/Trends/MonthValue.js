function MonthValue({ label, entry, indicator, ...props }) {
    const value =
        indicator == "bad"
            ? entry?.bad / entry?.total
            : indicator == "staff"
            ? entry
            : entry?.[indicator];

    const format =
        indicator == "bad"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 1,
              }).format(value)
            : indicator == "oee"
            ? new Intl.NumberFormat("sl", {
                  style: "percent",
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
              }).format(value)
            : new Intl.NumberFormat("sl").format(value);

    return (
        <div>
            <div className='h1 mb-0'>{format}</div>
            <div className='text-muted'>{label}</div>
        </div>
    );
}

export default MonthValue;
