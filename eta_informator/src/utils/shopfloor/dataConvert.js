import dayjs from "dayjs";
import ChartColors from "../../theme/ChartColors";
import _ from "lodash";
import randomColor from "randomcolor";

/**
 *
 * @param {String} indicator
 * @param {Object} obj
 * @returns object with properties mapped to a given indicator
 */
function propertyMapping(indicator, obj, mapping) {
    if (mapping == "sinapro") {
        switch (indicator) {
            case "oee":
                return {
                    oee: [obj.oee],
                    nee: [obj.nee],
                    teep: [obj.teep],
                    performance: [obj.perforamce],
                    quality: [obj.quality],
                    availability: [obj.availability],
                    shiftPlanned: [obj.shiftPlanned],
                };
            case "forms":
                return {
                    quantity: [obj.quantity],
                };
            default:
                return {
                    total: [obj.quantity],
                    good: [obj.good],
                    bad: [obj.scrap],
                    norm: [obj.machineNorm / obj.effectively], //this is commented out
                    // norm: [obj.normDelavec / obj.effectively], //this is uncommented
                    // norm: [obj.achievementWorker / 100],
                    effectively: [obj.effectively],
                    machineNorm: [obj.machineNorm],
                    percentage: [obj.scrap / obj.good],
                };
        }
    } else if (mapping == "static") {
        return {
            total: [obj.total],
            good: [obj.good],
            bad: [obj.bad],
            percentage: [obj.bad / obj.good],
        };
    }
}

function dataGrouper(data, category, indicator, mapping) {
    switch (category) {
        case "sum":
            return data.reduce((acc, cur) => {
                const fields = propertyMapping(indicator, cur, mapping);
                if (!acc[cur.date]) acc[cur.date] = { ...fields };
                else {
                    _.forEach(fields, (value, property) => {
                        acc[cur.date][property].push(...value);
                    });
                }
                return acc;
            }, {});
        case "shift":
            return data.reduce((acc, cur) => {
                const fields = propertyMapping(indicator, cur, mapping);
                if (!acc[cur.date]) acc[cur.date] = {};
                if (!acc[cur.date][cur.shift]) acc[cur.date][cur.shift] = { ...fields };
                else {
                    _.forEach(fields, (value, property) => {
                        acc[cur.date][cur.shift][property].push(...value);
                    });
                }
                return acc;
            }, {});
        case "machine":
            return data.reduce((acc, cur) => {
                const fields = propertyMapping(indicator, cur, mapping);
                const machine = indicator == "oee" ? cur.machineID : cur.machineKeyAlt;
                if (!acc[cur.date]) acc[cur.date] = {};
                if (!acc[cur.date][machine]) acc[cur.date][machine] = { ...fields };
                else {
                    _.forEach(fields, (value, property) => {
                        acc[cur.date][machine][property].push(...value);
                    });
                }
                return acc;
            }, {});
        case "buyer":
            return {};
        default:
            return {};
    }
}

/**
 *
 * @param {array<Number>} array
 * @param {String} parameter
 * @returns value by meaning or summing the array. Operation is selected based on predefined array of parameters that need meaning instead of summing.
 */
function valueFromArray(array, parameter) {
    const meaners = [
        "oee",
        "nee",
        "teep",
        "performance",
        "quality",
        "availability",
        "shiftPlanned",
        "norm",
        "percentage",
    ];
    if (meaners.includes(parameter)) return _.mean(array);
    return _.sum(array);
}

/**
 *
 * @param {} object
 * @returns Arrays of numbers are replaced with values that are sumed or meaned.
 */
function values(object) {
    const values = {};
    _.forEach(object, (array, parameter) => {
        values[parameter] = valueFromArray(array, parameter);
    });
    return values;
}

/**
 * Function for converting object returned by dataGrouper into array of shallower objects
 * @param {Object} data
 * @param {String} category
 * @param {Boolean} condense - Compute arrays or not
 * @param {Boolean} raw - Compute arrays or not
 * @returns An array of objects
 */
function condenseComputeData(data, category, condense = true, raw = false) {
    const object = condense ? [] : {};
    _.forEach(data, (dateObject, date) => {
        if (!condense) object[date] = {};
        if (category == "sum") {
            const dataObject = raw ? dateObject : values(dateObject);
            condense
                ? object.push({ date: date, ...dataObject })
                : (object[date] = { ...dataObject });
        }
        if (category == "shift") {
            _.forEach(dateObject, (shiftObject, shift) => {
                const dataObject = raw ? shiftObject : values(shiftObject);
                condense
                    ? object.push({ date: date, shift: shift, ...dataObject })
                    : (object[date][shift] = { ...dataObject });
            });
        }
        if (category == "machine") {
            _.forEach(dateObject, (machineObject, machine) => {
                const dataObject = raw ? machineObject : values(machineObject);
                condense
                    ? object.push({
                          date: date,
                          machine: machine,
                          ...dataObject,
                      })
                    : (object[date][machine] = { ...dataObject });
            });
        }
    });
    return object;
}

/**
 * Function for generating scrap charts
 */
function scrapGenerator(data, category = "sum", start, end, ids = null, options) {
    let byDay = {};
    const totals = data
        .filter((entry) => entry.typeId != null && entry.typeId != "null")
        .reduce((acc, entry) => {
            const { date, shift, machineId, total } = entry;

            if (!acc[date]) acc[date] = {};
            if (!acc[date][shift]) acc[date][shift] = {};
            if (!acc[date][shift][machineId]) acc[date][shift][machineId] = {};
            acc[date][shift][machineId] = total;
            return acc;
        }, {});
    switch (category) {
        case "sum":
            byDay = data
                .filter((entry) => !(entry.typeId == null || entry.typeId == "null"))
                .reduce((acc, entry) => {
                    const { date, typeId, machineId, total = "0" } = entry;
                    let quantity = entry.quantity;

                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][typeId]) acc[date][typeId] = {};
                    if (!acc[date]["sum"]) acc[date]["sum"] = {};

                    if (!acc[date][typeId][machineId]) {
                        acc[date][typeId][machineId] = {};
                    } else if (acc[date][typeId][machineId][total]) {
                        quantity += acc[date][typeId][machineId][total];
                    }

                    if (!acc[date][typeId][machineId][total]) {
                        acc[date][typeId][machineId][total] = 0;
                    }

                    acc[date][typeId][machineId][total] = quantity;
                    quantity = entry.quantity;

                    if (!acc[date]["sum"][machineId]) {
                        acc[date]["sum"][machineId] = {};
                    } else if (acc[date]["sum"][machineId][total]) {
                        quantity += acc[date]["sum"][machineId][total];
                    }

                    acc[date]["sum"][machineId][total] = quantity;
                    return acc;
                }, {});
            break;
        case "type":
            byDay = data
                .filter((entry) => entry.typeId != null || entry.typeId != "null")
                .reduce((acc, entry) => {
                    const date = entry.date;
                    const typeId = entry.typeId;
                    const shift = entry.shift;
                    const machineId = entry.machineIdAlt;
                    const total = entry.total || "0";
                    let quantity = entry.quantity;

                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][typeId]) acc[date][typeId] = {};
                    if (!acc[date]["sum"]) acc[date]["sum"] = {};

                    if (!acc[date][typeId][machineId]) acc[date][typeId][machineId] = {};
                    if (!acc[date]["sum"][machineId]) acc[date]["sum"][machineId] = {};

                    if (!acc[date][typeId][machineId][shift]) {
                        acc[date][typeId][machineId][shift] = {};
                    } else if (acc[date][typeId][machineId][shift][total]) {
                        quantity += +acc[date][typeId][machineId][shift][total];
                    }

                    acc[date][typeId][machineId][shift][total] = quantity;
                    quantity = entry.quantity;

                    if (!acc[date]["sum"][machineId][shift]) {
                        acc[date]["sum"][machineId][shift] = {};
                    } else if (acc[date]["sum"][machineId][shift][total]) {
                        quantity += +acc[date]["sum"][machineId][shift][total];
                    }

                    acc[date]["sum"][machineId][shift][total] = quantity;
                    return acc;
                }, {});
            break;
        case "fault":
            byDay = data.reduce((acc, entry) => {
                const date = entry.date;
                const faultId = entry.faultId;
                const shift = entry.shift;
                const machineId = entry.machineIdAlt;
                const total = entry.total || "0";
                let quantity = entry.quantity;

                if (!acc[date]) acc[date] = {};
                if (!acc[date][faultId]) acc[date][faultId] = {};
                if (!acc[date][faultId][machineId]) acc[date][faultId][machineId] = {};
                if (!acc[date][faultId][machineId][shift]) {
                    acc[date][faultId][machineId][shift] = {};
                } else if (acc[date][faultId][machineId][shift][total]) {
                    quantity += +acc[date][faultId][machineId][shift][total];
                }
                acc[date][faultId][machineId][shift][total] = quantity;
                return acc;
            }, {});
            break;
        case "material":
            /*return data
                .filter((entry) => entry.typeId != null || entry.typeId != "null")
                .reduce((acc, entry) => {
                    const date = entry.date;
                    const typeId = entry.typeId;
                    const typeLabel = entry.typeLabel;
                    let quantity = entry.quantity;
                    let material = entry.productNumber?.replace("--", "");
                    let materialComponent = entry.materialComponent;
                    let comment = entry.comment;

                    if (!acc[date]) {
                        acc[date] = {};
                        acc[date][material] = {};
                    } else if (!acc[date][material]) {
                        acc[date][material] = {};
                    } else if (acc[date][material][typeId]) {
                        quantity += +acc[date][material][typeId].quantity;
                    }

                    const total = data
                        .filter(e => e.date === date && e.productNumber?.replace("--","") === material)
                        .reduce((sum, e) => sum + (e.total || 0), 0);

                    acc[date][material][typeId] = {
                        label: typeLabel,
                        quantity: quantity,
                        total: total,
                        materialComponent: materialComponent,
                        comment: comment,
                    };
                    return acc;
                }, {});*/
            return data
                .filter((entry) => entry.typeId != null && entry.typeId != "null")
                .reduce((acc, entry) => {
                    const date = entry.date;
                    const typeId = entry.typeId;
                    const typeLabel = entry.typeLabel;
                    const material = entry.productNumber?.replace("--", "");
                    const materialComponent = entry.materialComponent;
                    const comment = entry.comment;

                    // Skupne količine po material + type
                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][material]) acc[date][material] = {};
                    if (!acc[date][material][typeId]) {
                        acc[date][material][typeId] = {
                            label: typeLabel,
                            quantity: 0,
                            total: 0,
                            materialComponent: materialComponent,
                            comment: comment,
                        };
                    }

                    // Seštejemo samo količino in total za ta posamezni zapis
                    acc[date][material][typeId].quantity += entry.quantity;
                    acc[date][material][typeId].total += entry.total || 0;

                    return acc;
                }, {});
        case "shift":
            byDay = data
                .filter((entry) => entry.typeId != null)
                .reduce((acc, entry) => {
                    const date = entry.date;
                    const typeId = entry.typeId;
                    const shift = entry.shift;
                    const total = entry.total || "0";
                    const machineId = entry.machineIdAlt;
                    let quantity = entry.quantity;

                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][shift]) acc[date][shift] = {};
                    if (!acc[date][shift][typeId]) acc[date][shift][typeId] = {};
                    if (!acc[date][shift][typeId][machineId]) {
                        acc[date][shift][typeId][machineId] = {};
                    } else if (acc[date][shift][typeId][machineId][total]) {
                        quantity += +acc[date][shift][typeId][machineId][total];
                    }
                    acc[date][shift][typeId][machineId][total] = quantity;
                    return acc;
                }, {});
            break;
        case "machine":
            byDay = data
                .filter((entry) => entry.typeId != null)
                .reduce((acc, entry) => {
                    const date = entry.date;
                    const typeId = entry.typeId;
                    const shift = entry.shift;
                    const machineId = entry.machineIdAlt;
                    const total = entry.total || 0;
                    let quantity = entry.quantity;
                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][machineId]) acc[date][machineId] = {};
                    if (!acc[date][machineId][typeId]) acc[date][machineId][typeId] = {};
                    if (!acc[date][machineId][typeId][shift])
                        acc[date][machineId][typeId][shift] = {};
                    else if (acc[date][machineId][typeId][shift][total]) {
                        quantity += +acc[date][machineId][typeId][shift][total];
                    }
                    acc[date][machineId][typeId][shift][total] = quantity;
                    return acc;
                }, {});
            break;
        default:
            return {};
    }

    let startDate = dayjs(start);
    const endDate = dayjs(end).add("1", "day");
    const dataset = [];
    while (startDate.isBefore(endDate)) {
        const date = startDate.format("YYYY-MM-DD");
        const day = byDay[date];

        let value = null;
        if (day) {
            const total = Object.values(totals[date]).reduce((sum, shift) => {
                return (
                    sum +
                    (Object.values(shift)
                        .filter((value) => value !== null)
                        .reduce((sum, value) => sum + (value || 0), 0) || 0)
                );
            }, 0);
            switch (category) {
                case "sum":
                    value = averagePercentages(day?.[ids.type], total, options);
                    break;
                case "type":
                    value = averagePercentages(day?.[ids.type]?.[ids.machine], total, options);
                    break;

                case "fault":
                    value = averagePercentages(day?.[ids.fault]?.[ids.machine], total, options);
                    break;
                case "machine":
                    value = averagePercentages(day?.[ids.machine]?.[ids.type], total, options);

                    break;
                case "shift":
                    value = averagePercentages(day?.[ids.shift]?.[ids.type], total, options);
                    break;
                case "material":
                    const material = day[ids.material];
                    value = material ? material[ids.type] : null;
                    break;
                default:
                    return {};
            }
        }
        dataset.push({ x: startDate.format("DD/MM/YYYY"), y: value });
        startDate = startDate.add(1, "day");
    }
    return dataset;
}

/**
 *
 * @param {object} data - Input data from SinaproAPI
 * @param {string} userOptions.indicator - Defines indicator type
 * @param {string} userOptions.category - Defines grouping category
 * @param {boolean} userOptions.condense - If false, the result is not condensed into depth of 1
 * @param {boolean} userOptions.raw - If true, the value array are not comupted into sum or mean
 * @param {boolean} userOptions.mapping - If true, the provided data has custom mapping
 * @returns grouped and condensed dataset
 */
export function groupData(data, userOptions = {}) {
    const defaultOptions = {
        raw: false,
        condense: true,
        indicator: "realization",
        category: "sum",
        mapping: "sinapro",
    };
    const options = { ...defaultOptions, ...userOptions };
    const groupedData = dataGrouper(data, options.category, options.indicator, options.mapping);
    return condenseComputeData(groupedData, options.category, options.condense, options.raw);
}

function perDay(data, userOptions = {}) {
    const defaultOptions = {
        indicator: "realization",
        category: "sum",
        valueType: "total",
        timeFormat: "DD/MM/YYYY",
        id: null,
        mapping: "sinapro",
    };
    const options = { ...defaultOptions, ...userOptions };
    const groupedData2 = dataGrouper(data, options.category, options.indicator, options.mapping);
    return condenseComputeData(groupedData2, options.category);
}

/**
 *
 * @param {object} data
 * @param {string} userOptions.category "day" || "machine" || "shift"
 * @param {string} userOptions.id IDs of grouped elements || null
 * @param {string} userOptions.valueType "total" || "bad" || "good" || "percentage" || "oee" || "nee" || "teep" || "quality"
 * @param {string} timeFormat
 */

function chartDataArray(data, start, end, userOptions = {}) {
    const defaultOptions = {
        category: "sum",
        id: undefined,
        valueType: "total",
        timeFormat: "DD/MM/YYYY",
    };
    const options = Object.assign({}, defaultOptions, userOptions);
    let startDate = dayjs(start);
    const endDate = dayjs(end).add("1", "day");
    const dataset = [];
    while (startDate.isBefore(endDate)) {
        const date = startDate.format("YYYY-MM-DD");
        const day = _.find(data, (entry) => {
            if (options.category == "shift")
                return entry?.date == date && entry.shift == options.id;
            if (options.category == "machine")
                return entry?.date == date && entry.machine == options.id;
            if (options.category == "buyer")
                return entry?.date == date && entry.buyer == options.id;
            return entry?.date == date;
        });

        if (options.valueType == "percentage" && day) {
            day.percentage = day?.bad / day?.good;
        }

        let value =
            options.valueType == "norm" ||
            options.valueType == "percentage" ||
            options.valueType == "oee"
                ? day?.[options.valueType] * 100
                : day?.[options.valueType];
        if (!Number.isFinite(value)) value = null;
        dataset.push({ x: startDate.format(options.timeFormat), y: value });
        startDate = startDate.add(1, "day");
    }
    return dataset;
}

function averagePercentages(percentages, total, options) {
    if (!percentages) return 0;
    let result = [];
    let sumScraps = 0;

    const difference = options.length - Object.keys(percentages).length;
    for (const [key, value] of Object.entries(percentages)) {
        for (const [total, quantity] of Object.entries(value)) {
            sumScraps += +quantity;
            const percentage = (quantity / total) * 100;
            result.push(percentage);
        }
    }
    for (let i = 0; i < difference; i++) {
        result.push(0);
    }

    return (sumScraps / total) * 100;
}

export function chartDatasetObject(label, data, id, options) {
    return {
        id: id,
        label: label,
        data: data,
        borderColor: "rgba(100, 99, 132, 0.2)",
        backgroundColor: "rgb(255, 99, 132)",
        fill: false,
        ...options,
    };
}

export function fetchChartDataset(
    data,
    machines,
    options = {
        indicator: "realization",
        category: "sum",
        valueType: "total",
        startDate: dayjs().startOf("month"),
        endDate: dayjs().endOf("month"),
        conditions: [],
        timeFormat: "DD/MM/YYYY",
        id: null,
        mapping: "sinapro",
        norm: false,
    },
) {
    if (options?.conditions?.length > 0) {
        const regex = options?.conditions.map((condition) => {
            if (condition.exact) {
                return new RegExp("^" + condition.value.replace(".", ".") + "$");
            } else {
                return new RegExp(condition.value.replace(".", "."));
            }
        });
        data = data.filter((row) => {
            return regex.some((rx) => rx.test(row.productF));
        });
    }
    switch (options.category + "") {
        case "sum":
            const groupedData = perDay(data, options);
            const perDayArray = chartDataArray(
                groupedData,
                options.startDate,
                options.endDate,
                options,
            );

            const perDayNormArray = chartDataArray(
                groupedData,
                options.startDate,
                options.endDate,
                {
                    ...options,
                    valueType: "norm",
                },
            );
            const dataset = chartDatasetObject("Skupno", perDayArray, "total", {
                borderColor: ChartColors.sum,
                backgroundColor: ChartColors.sum,
                yAxisID: "value",
            });
            const normDataset = chartDatasetObject("Doseganje norme", perDayNormArray, "norm", {
                borderColor: ChartColors.norm,
                backgroundColor: ChartColors.norm,
                yAxisID: "norm",
            });
            return options.indicator != "static" && options.norm
                ? [dataset, normDataset]
                : [dataset];
        case "machine":
            return machines.map((machine, i) => {
                const color = ChartColors["machines"][i];
                const groupedData = perDay(data, {
                    ...options,
                    id: machine.key + "",
                });
                const perDayArray = chartDataArray(
                    groupedData,
                    options.startDate,
                    options.endDate,
                    {
                        ...options,
                        id: machine.key + "",
                    },
                );
                return chartDatasetObject(machine.name, perDayArray, machine.key, {
                    borderColor: color,
                    backgroundColor: color,
                });
            });
        case "shift":
            const shifts = [1, 2, 3];
            return shifts.map((shift, index) => {
                const groupedData = perDay(data, {
                    ...options,
                    id: shift,
                });
                const perDayArray = chartDataArray(
                    groupedData,
                    options.startDate,
                    options.endDate,
                    {
                        ...options,
                        id: shift,
                    },
                );
                return chartDatasetObject(shift, perDayArray, shift, {
                    borderColor: ChartColors[shift],
                    backgroundColor: ChartColors[shift],
                    fill: true,
                });
            });
        case "buyer":
            const buyers = ["EGO", "EKZ", "ETA"];
            return buyers.map((buyer) => {
                const groupedData = perDay(data, {
                    ...options,
                    id: buyer,
                });
                const perDayArray = chartDataArray(
                    groupedData,
                    options.startDate,
                    options.endDate,
                    {
                        ...options,
                        id: buyer,
                    },
                );
                return chartDatasetObject(buyer, perDayArray, buyer, {
                    borderColor: ChartColors[buyer],
                    backgroundColor: ChartColors[buyer],
                });
            });
        default:
            return null;
    }
}

export function fetchScrapChartDataset(data, category, startDate, endDate, ids, conditions = []) {
    if (conditions.length > 0) {
        const regex = conditions.map((condition) => {
            if (condition.exact) {
                return new RegExp("^" + condition.value.replace(".", ".") + "$");
            } else {
                return new RegExp(condition.value.replace(".", "."));
            }
        });
        data = data.filter((row) => {
            return regex.some((rx) => rx.test(row.productF));
        });
    }

    const types = data.reduce(
        (acc, entry) => {
            const typeLabel = entry.typeLabel;
            const typeId = entry.typeId;
            acc[typeId] = typeLabel;
            return acc;
        },
        { sum: "Skupaj" },
    );

    const faults = data.reduce((acc, entry) => {
        const faultLabel = entry.faultLabel;
        const faultId = entry.faultId;
        acc[faultId] = faultLabel;
        return acc;
    }, {});

    const machines = data.reduce((acc, entry) => {
        const machineId = entry.machineIdAlt;
        const machineLabel = entry.machineLabel;
        acc[machineId] = machineLabel;
        return acc;
    }, {});
    const materials = data.reduce((acc, entry) => {
        const materialNumber = entry.productNumber;
        const materialId = entry.materialId;
        acc[materialId] = materialNumber;
        return acc;
    }, {});

    const shiftsSet = new Set(data.map((entry) => entry.shift));
    const typesSet = new Set(Object.keys(types));
    const faultsSet = new Set(Object.keys(faults));
    const typesLabels = new Set(Object.values(types));
    switch (category + "") {
        case "sum":
            return Object.keys(types)
                .filter((type) => type != "null")
                .map((type, i) => {
                    const id = { type: type };
                    const randColor = randomColor({
                        format: "dark",
                        seed: types[type] + types[type],
                        alpha: 0.75,
                    });
                    const perDayArray = scrapGenerator(
                        data,
                        category,
                        startDate,
                        endDate,
                        id,
                        Object.keys(machines),
                    );
                    return chartDatasetObject(types[type], perDayArray, "total", {
                        borderColor: randColor,
                        backgroundColor: randColor,
                        borderDash: type == "sum" ? [5, 5] : undefined,
                    });
                });

        case "type":
            if (!typesSet.has("" + ids)) return -1;
            return Object.keys(machines).map((machine, i) => {
                const id = { machine: machine, type: ids };
                const color =
                    ChartColors["machines"][(machine + i) % ChartColors["machines"].length];
                const perDayArray = scrapGenerator(
                    data,
                    category,
                    startDate,
                    endDate,
                    id,
                    Array.from(shiftsSet),
                );
                return chartDatasetObject(machines[machine], perDayArray, machine, {
                    borderColor: color,
                    backgroundColor: color,
                });
            });

        case "fault":
            if (!faultsSet.has("" + ids)) return -1;
            return Object.keys(machines).map((machine, i) => {
                const id = { machine: machine, fault: ids };
                const color =
                    ChartColors["machines"][(machine + i) % ChartColors["machines"].length];
                const perDayArray = scrapGenerator(
                    data,
                    category,
                    startDate,
                    endDate,
                    id,
                    Array.from(shiftsSet),
                );
                return chartDatasetObject(machines[machine], perDayArray, machine, {
                    borderColor: color,
                    backgroundColor: color,
                });
            });
        case "machine":
            return Object.keys(types)
                .filter((type) => type != "null")
                .map((type, i) => {
                    const id = { type: type, machine: ids };
                    const colorId = typeColor(types[type]);
                    const color = ChartColors["type"][colorId % ChartColors["type"].length];
                    const perDayArray = scrapGenerator(
                        data,
                        category,
                        startDate,
                        endDate,
                        id,
                        Array.from(shiftsSet),
                    );
                    return chartDatasetObject(types[type], perDayArray, type, {
                        borderColor: color,
                        backgroundColor: color,
                    });
                });
        case "shift":
            if (!shiftsSet.has(+ids)) return -1;
            return Object.keys(types)
                .filter((type) => type != "null")
                .map((type, i) => {
                    const id = { shift: ids, type: type };
                    const colorId = typeColor(types[type]);
                    const color = ChartColors["type"][colorId % ChartColors["type"].length];
                    const perDayArray = scrapGenerator(
                        data,
                        category,
                        startDate,
                        endDate,
                        id,
                        Object.keys(machines),
                    );
                    return chartDatasetObject(types[type], perDayArray, type, {
                        borderColor: color,
                        backgroundColor: color,
                    });
                });
        case "material":
            const perDayArray = scrapGenerator(data, category, startDate, endDate, {});
            return perDayArray;
        default:
            return null;
    }
}

// TODO - figure out a better solution for color coding (maybe somekind of hashing based on label?)
function typeColor(label) {
    switch (label) {
        case "Diastat":
        case "Visokonapetostni preboj":
            return 1;
        case "REOS/REMA":
        case " Odstopanje upornosti":
            return 2;
        case "Pokrov sestav":
        case "Vtisnjen kotni priključek":
            return 3;
        case "Podnožje sestav":
        case "Iztrgan kotni priključek":
            return 4;
        case "Termostat cel":
        case "Poškodba polizdelka":
            return 5;
        case "Izločeno na umerjanju":
            return 6;
        case "Izločeno neskladno":
            return 7;
        case "Izločeno na pakiranju":
            return 8;
        default:
            return Math.round(Math.random() * 10) + 7;
    }
}
