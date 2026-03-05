import dayjs from "dayjs";
import { useQuery } from "react-query";
import { PulseLoader } from "react-spinners";
import Indicator from "../Indicators/Indicator"; // eslint-disable-line import/no-webpack-loader-syntax
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import worker from "../../workers/workerFetcher";
function MachineGraph({
    machine,
    indicator,
    category,
    valueType,
    machineData,
    selectedMonth,
    inst,
    conditions,
    ...props
}) {
    let startDay = selectedMonth.startOf("month");
    let copyStartDay = startDay;
    let endDay = selectedMonth.endOf("month");

    //Generate datasets
    const selectedDataset = useQuery(
        ["dataset", selectedMonth.format("MM-YYYY"), machine, category, valueType],
        () => {
            const workerInst = worker();
            return workerInst
                .datasetProvider(machineData, machine, {
                    indicator: indicator,
                    category: category,
                    valueType: valueType,
                    startDate: selectedMonth.startOf("month").format("YYYY-MM-DD"),
                    endDate: selectedMonth.endOf("month").format("YYYY-MM-DD"),
                    conditions: conditions,
                    mapping: "sinapro",
                    norm: false,
                })
                .then((response) => {
                    workerInst.terminate();
                    return response;
                })
                .catch(() => {
                    workerInst.terminate();
                });
        },
        {
            enabled: !!machineData && !!selectedMonth,
            staleTime: 5 * 60 * 1000,
        },
    );
    if (selectedDataset.isIdle) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );
    }

    //Check if hooks are loading
    if (selectedDataset.isLoading)
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <PulseLoader color='#2c3e50' size={15} margin={10} />
            </div>
        );

    if (selectedDataset.isError) {
        return (
            <div className='d-flex h-100 justify-content-center align-items-center'>
                <FontAwesomeIcon icon='times-circle' size='2x' color='red' />
            </div>
        );
    }

    const labels = [];
    while (copyStartDay.isBefore(endDay)) {
        labels.push(copyStartDay.format("DD/MM/YYYY"));
        copyStartDay = copyStartDay.add(1, "day");
    }

    const datasets = {
        labels: labels,
        datasets: selectedDataset.data ? [...selectedDataset.data] : [{ label: "", data: [{}] }],
    };

    if (selectedDataset.isSuccess)
        return (
            <div className='h-100'>
                {category === "machine" || category == "shift" ? (
                    <Indicator
                        indicator={indicator}
                        type='bar'
                        datasets={datasets}
                        annotation={selectedMonth.isSame(dayjs(), "month")}
                    />
                ) : (
                    <Indicator
                        indicator={indicator}
                        type='line'
                        datasets={datasets}
                        annotation={selectedMonth.isSame(dayjs(), "month")}
                    />
                )}
            </div>
        );
}
export default MachineGraph;
