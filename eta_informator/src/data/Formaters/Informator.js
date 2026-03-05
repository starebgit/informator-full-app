import i18n from "../../i18n/i18n";
import _ from "lodash";
import dayjs from "dayjs";
//GENERIRA UNIT SELECT LABELS
export function generateSubunitLabels(data) {
    return data.map((unit) => {
        const subunits = unit.subunits.map((subunit) => {
            return {
                label: i18n.t("labels:" + subunit.keyword),
                value: subunit.id,
                keyword: subunit.keyword,
                subunitId: subunit.id,
                ted: subunit.ted,
                unitId: unit.id,
            };
        });
        return {
            sfm: unit.sfm,
            keyword: unit.name,
            label: i18n.t("labels:" + unit.name),
            options: subunits,
            id: unit.id,
        };
    });
}

export function generateUnitLabels(data) {
    return data.map((unit) => {
        const subunits = unit.subunits.map((subunit) => {
            return subunit.ted;
        });
        return {
            sfm: unit.sfm,
            keyword: unit.name,
            label: i18n.t("labels:" + unit.name),
            value: subunits,
            id: unit.id,
        };
    });
}

export function generateTypeLabels(data) {
    return data.map((type) => {
        return {
            value: type.id,
            label: i18n.t("labels:" + type.type),
        };
    });
}

export function generateRolesLabels(data) {
    return data.map((role) => {
        return {
            value: role.id,
            label: i18n.t("labels:" + role.role),
        };
    });
}

export function generateKeywordsLabels(data) {
    return data.map((keyword) => {
        return {
            value: keyword.id,
            label: i18n.t("labels:" + keyword.keyword).toUpperCase(),
        };
    });
}

export function generateMachineGroupsLabels(data) {
    if (!data) return [];
    return data.map((machineGroup) => {
        return { label: machineGroup.name, value: "" + machineGroup.id };
    });
}

export function generateMachinesLabels(machines) {
    return machines.map((machine) => {
        return {
            label: `${machine.idAlt} - ${machine.name}`,
            value: machine.idAlt,
            ted: machine.tedId,
        };
    });
}

export function generateMachinesLabelsShort(machines) {
    return machines.map((machine) => {
        return {
            label: `${machine.idAlt} - ${machine.nameShort}`,
            name: `${machine.idAlt} - ${machine.nameShort}`,
            value: machine.idAlt,
            ted: machine.tedId,
        };
    });
}

export function generateMachinesLabelsInternal(machines) {
    return machines.map((machine) => {
        return {
            label: `${machine.idAlt} - ${machine.name}`,
            value: machine.id,
            ted: machine.tedId,
        };
    });
}

export function findOptionByKeyword(options, value) {
    let result = null;
    options.forEach((option) => {
        if (option.keyword === value) return (result = option);
        if (!result && option.options) result = findOptionByKeyword(option.options, value);
    });
    return result;
}

export function getMachineNameById(machines, id) {
    return _.find(machines, (o) => o.key == id)?.name ?? id;
}

export function generateCauseLabels(data, t) {
    if (data == undefined) return [];
    return data.map((cause) => {
        return { ...cause, label: t(`labels:${cause.cause}`), value: cause.id };
    });
}

export function generateLocationsLabels(data, t) {
    if (data == undefined) return [];
    return data.map((location) => {
        return {
            ...location,
            label: t(`labels:${location.name}`),
            value: location.id,
        };
    });
}

export function generateFlawLocationsLabels(data, t) {
    if (data == undefined) return [];
    return data.map((location) => {
        return {
            ...location,
            label: t(`labels:${location.name}`),
            value: location.id,
        };
    });
}

export function tableForm(data, indicator, category) {
    if (data == undefined) return [];
    const weekEntries = [];
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        const week = dayjs(element.date, "YYYY-MM-DD").week();
        const value =
            indicator == "oee"
                ? element.oee
                : indicator == "quality"
                ? element.percentage
                : element.good;

        //Firstly add a summed per week category
        const [sum] = _.remove(weekEntries, (o) => o.sum);
        if (!sum) {
            const newSumEntry =
                category == "machines" ? { machine: "Σ", sum: true } : { shift: "Σ", sum: true };
            newSumEntry[week] = [value];
            weekEntries.push(newSumEntry);
        } else {
            if (sum[week]) {
                sum[week].push(value);
            } else {
                sum[week] = [value];
            }
            weekEntries.push(sum);
        }

        const [entry] = _.remove(weekEntries, (o) =>
            category == "machines" ? o.machine == element.machine : o.shift == element.shift,
        );
        if (!entry) {
            const newEntry =
                category == "machines" ? { machine: element.machine } : { shift: element.shift };
            newEntry[week] = [value];
            weekEntries.push(newEntry);
        } else {
            if (entry[week]) {
                entry[week].push(value);
            } else {
                entry[week] = [value];
            }
            weekEntries.push(entry);
        }
    }
    weekEntries.forEach((entry) => {
        let sumArray = [];
        _.forEach(entry, (value, key) => {
            if (Array.isArray(value)) {
                _.update(entry, key, () => _.mean(entry[key]));
                sumArray = [...sumArray, +entry[key]];
            }
            if (key == "machine" && value == "Σ") return;
        });
        _.set(entry, "all", _.mean(sumArray));
    });

    return weekEntries;
}

export function startEndTimeArrayGenerator(data, start, end, userOptions = {}) {
    const defaultOptions = {
        category: "sum",
        id: undefined,
        valueType: "total",
        timeFormat: "DD/MM/YYYY",
    };
    const options = Object.assign({}, defaultOptions, userOptions);
    let startDate = dayjs(start, "DD/MM/YYYY");
    const endDate = dayjs(end, "DD/MM/YYYY").add("1", "day");
    const dataset = [];
    //* Iterate from startDate to endDate
    while (startDate.isBefore(endDate)) {
        const date = startDate.format("YYYY-MM-DD");
        //* Find entry for a certain day, optionally machine and shift
        const day = _.find(data, (entry) => {
            if (options.category == "machine")
                return entry?.date == date && entry?.machine == options.id;
            if (options.category == "shift")
                return entry?.date == date && entry?.shift == options.id;
            return entry?.date == date;
        });
        //* Get day value for given category and value type
        let value = null;
        if (day) {
            value = _.round(day[options.valueType] * 100);
            value =
                options.valueType == "percentage" && value != null
                    ? value.toFixed(2)
                    : value != null
                    ? value.toFixed(2)
                    : value;
        }
        //* Push it into the dataset
        dataset.push({ x: startDate.format(options.timeFormat), y: value });
        startDate = startDate.add(1, "day");
    }
    return dataset;
}

export function productionDataMerger(data, aggregate) {
    const workDays = {};
    data.forEach((entry) => {
        if (!workDays[entry[aggregate]]) workDays[entry[aggregate]] = 1;
        else workDays[entry[aggregate]] += 1;
    });

    const grouped = data.reduce((prev, cur) => {
        const meta = {
            workDays: workDays[cur[aggregate]],
            month: cur.month,
            quarter: cur.quarter,
            year: cur.year,
        };
        const values = {
            total: [+cur.total],
            good: [+cur.good],
            bad: [+cur.bad],
        };
        if (!prev[cur[aggregate]]) prev[cur[aggregate]] = { ...meta, ...values };
        else {
            for (const [key, value] of Object.entries(values)) {
                prev[cur[aggregate]][key].push(...value);
            }
        }
        return prev;
    }, {});

    const meaned = Object.values(grouped).map((entry) => {
        return {
            ...entry,
            total: _.round(_.sum(entry.total) / entry.workDays),
            good: _.round(_.sum(entry.good) / entry.workDays),
            bad: _.round(_.sum(entry.bad) / entry.workDays),
        };
    });
    return _.sortBy(meaned, ["year", "month"]);
}

export function oeeDataMerger(data, aggregate) {
    const grouped = data.reduce((prev, cur) => {
        const date = dayjs(cur.date);
        const meta = {
            month: date.month() + 1,
            quarter: date.quarter(),
            year: date.year(),
        };
        const values = {
            breaks: [+cur.breaks],
            oee: [+cur.oee],
            nee: [+cur.nee],
            teep: [+cur.teep],
            quality: [+cur.quality],
            performance: [+cur.perforamce],
            availability: [+cur.availability],
            shiftPlanned: [+cur.shiftPlanned],
        };
        if (!prev[meta[aggregate]]) prev[meta[aggregate]] = { ...meta, ...values };
        else {
            for (const [key, value] of Object.entries(values)) {
                prev[meta[aggregate]][key].push(...value);
            }
        }
        return prev;
    }, {});

    const meaned = Object.values(grouped).map((entry) => {
        return {
            ...entry,
            breaks: _.sum(entry.breaks),
            oee: _.mean(entry.oee),
            nee: _.mean(entry.nee),
            teep: _.mean(entry.teep),
            quality: _.mean(entry.quality),
            performance: _.mean(entry.performance),
            availability: _.mean(entry.availability),
            shiftPlanned: _.mean(entry.shiftPlanned),
        };
    });
    return _.sortBy(meaned, ["year", aggregate]);
}

export const eventCategories = {
    0: 0,
    37: "sick",
    43: "sick",
    52: "sick",
    54: "sick",
    55: "sick",
    56: "sick",
    60: "sick",
    61: "sick",
    62: "sick",
    63: "sick",
    64: "sick",
    65: "sick",
    70: "sick",
    71: "sick",
    76: "sick",
    77: "sick",
    78: "sick",
    79: "sick",
    80: "sick",
    81: "sick",
    82: "sick",
    83: "sick",
    84: "sick",
    85: "sick",
    86: "sick",
    87: "sick",
    88: "sick",
    89: "sick",
    90: "sick",

    92: "waiting",
    93: "waiting",
    96: "waiting",
    97: "waiting",
    101: "waiting",
    102: "waiting",
    103: "waiting",

    14: "remote",

    9: "special_leave",
    31: "special_leave",
    39: "special_leave",

    10: "hour_use",
    26: "hour_use",

    40: "other",
    41: "other",
    53: "other",
    57: "other",
    91: "other",
    94: "other",
    98: "other",
    104: "other",

    8: "maternity",
    21: "maternity",

    22: "holiday",

    38: "leave",

    27: "physical_attendance",
    48: "physical_attendance",

    absences: "absences",
    presences: "presences",
    plan: "plan",
};

export const eventNames = {
    1: "Imuniteta",
    2: "Dovoljenje za nadur. delo",
    3: "Zamenjava urnika",
    4: "Vnos dopusta",
    5: "Korekcija salda",
    6: "Vnos ur",
    7: "Vnos nadur",
    8: "Porodniški  dopust",
    9: "Študijski dopust",
    10: "Koriščenje ur Odhod/Prihod",
    11: "Prenos dopusta",
    12: "Urnik",
    13: "Včerajšnja vrednost",
    14: "Začetek Delo od doma",
    15: "Začetek dežurstva",
    16: "Konec dežurstva",
    17: "Dežurstvo",
    18: "Začetek pripravljenosti",
    19: "Konec pripravljenosti",
    20: "Nadure pripravljenost",
    21: "Očetovski dopust",
    22: "Praznik po urah",
    23: "Vnos lanskega dopusta",
    24: "Korekcija nadur",
    25: "Korekcija poizmenske meje",
    26: "Koriščenje ur Celodnevno",
    27: "Prihod-Odhod",
    28: "Sl. prihod - odhod",
    29: "Redni dopust po urah",
    30: "Zdravniški pregled po urah",
    31: "Izredni dopust (vnos vodje)",
    32: "Plačilo ur GDČ",
    33: "Zaačetek odsotnosti",
    34: "Odobritev Društvene dejavnosti",
    35: "Konec odsotnosti",
    36: "Službena pot",
    37: "Bolniška odsotnost",
    38: "Redni dopust",
    39: "Izredni dopust",
    40: "Neplačana odsotnost",
    41: "Refundirana odsotnost",
    42: "Ročni vnos opravila",
    43: "01 Bolezen",
    44: "Prevoz",
    45: "Zdravniški pregled",
    46: "Korekcija Dni dopusta",
    47: "Odobren dodatni čas",
    48: "Redno delo",
    49: "Preklic odsotnosti",
    50: "Odobritev koriščenja po urah",
    51: "Odobritev službene odsotnosti",
    52: "02 Poškodba izven dela",
    53: "Sindikalna prisotnost",
    54: "Bolniška odsotnost po urah",
    55: "Bolniška brez boln. lista",
    56: "Bolniška brez boln. lista po urah",
    57: "Sindikalno delo",
    58: "Dodatna prisotnost",
    59: "Začetek Sindik prisotnost",
    60: "03 Poklicna bolezen",
    61: "04 Poškodba pri delu",
    62: "05 Poškodba po tretji osebi izven dela",
    63: "06 Nega",
    64: "07 Transplantacija",
    65: "08 Izolacija",
    66: "Prihod",
    67: "Odhod",
    68: "Službeni izhod",
    69: "Odhod na služb. pot",
    70: "Bolniški izhod",
    71: "09 Spremstvo",
    72: "Malica",
    73: "Službeni prihod",
    74: "Privatni izhod",
    75: "Privatni prihod",
    76: "10 Usposabljanje za rehabilitacijo otroka",
    77: "11 Poškodba (aktivnosti iz 18. čl. zakona)",
    78: "12 Darovanje krvi",
    79: "01 Bolezen - ure",
    80: "02 Poškodba izven dela - ure",
    81: "03 Poklicna bolezen - ure",
    82: "04 Poškodba pri delu - ure",
    83: "05 Poškodba po tretji osebi izven dela - ure",
    84: "06 Nega - ure",
    85: "07 Transplantacija - ure",
    86: "08 Izolacija - ure",
    87: "09 Spremstvo - ure",
    88: "10 Usposabljanje za rehabilitacijo otroka - ure",
    89: "11 Poškodba (aktivnosti iz 18. čl. zakona) - ure",
    90: "12 Darovanje krvi - ure",
    91: "Odsotnost - Višja sila",
    92: "Čakanje 100",
    93: "Čakanje 100 (po urah)",
    94: "Odsotnost Višja sila (po urah)",
    95: "Konec Delo od doma",
    96: "Čakanje 80",
    97: "Čakanje 80 (po urah)",
    98: "Refundirano ( po urah)",
    99: "Prenehanje delovnega razmerja",
    100: "Začetek delovnega razmerja",
    101: "Čakanje Korona",
    102: "Čakanje Korona (po urah)",
    103: "Čakanje Skrajšan DČ",
    104: "Karantena",
    105: "Službena pot tujina",
    106: "Omogoči delo čez polnoč",
    107: "Intervencija Začetek",
    108: "Pripravljenost",
    109: "Potni nalog",
};

export function staffDataMerger(data, aggregate, start, end) {
    const allowedIds = [8, 10, 14, 29, 31, 37, 65, 91, 104];
    const grouped = data?.reduce((prev, cur) => {
        const date = dayjs(cur.date, "YYYY-MM-DD");
        const meta = {
            day: date.format("YYYY-MM-DD"),
            month: date.month() + 1,
            quarter: date.quarter(),
            year: date.year(),
        };
        const events = {};
        for (const [id, value] of Object.entries(JSON.parse(cur.events))) {
            if (eventCategories[id]) {
                if (!events[eventCategories[id]]) events[eventCategories[id]] = value;
                else events[eventCategories[id]] += value;
            }
        }
        if (!prev[meta[aggregate] + "-" + meta["year"]])
            prev[meta[aggregate] + "-" + meta["year"]] = {
                ...meta,
                events: { ...events },
            };
        else {
            for (const [key, value] of Object.entries(events)) {
                if (prev[meta[aggregate] + "-" + meta["year"]]["events"][key])
                    prev[meta[aggregate] + "-" + meta["year"]]["events"][key] =
                        prev[meta[aggregate] + "-" + meta["year"]]["events"][key] + value;
                else prev[meta[aggregate] + "-" + meta["year"]]["events"][key] = value;
            }
        }
        return prev;
    }, {});

    const idsObject = allowedIds.reduce((acc, cur) => {
        acc[cur] = null;
        return acc;
    }, {});
    /* 	while(startDate.isBefore(endDate)){
			if(grouped[startDate.format('YYYY-MM-DD')]){
				allowedIds.forEach(id => {
					if(!Object.hasOwn(grouped[startDate.format('YYYY-MM-DD')]["events"],id)){
						grouped[startDate.format('YYYY-MM-DD')]["events"][id] = null
					}
				});
			}else{
				grouped[startDate.format('YYYY-MM-DD')] = {
					day: startDate.format('YYYY-MM-DD'),
					month: startDate.month() + 1,
					quarter: startDate.quarter(),
					year: startDate.year(),
					events: idsObject
				}
			}
	
	
			startDate = startDate.add(1,'day')
		} */

    Object.values(grouped).map((entry) => {
        const entries = {};
        allowedIds.forEach((id) => {});
    });

    return grouped;
}

export const generateOrderGanttData = (selectedRow, selectedDetail) => {
    return [selectedRow].reduce((acc, order) => {
        order.pozicije.forEach((pozicija) => {
            const progress = pozicija.tehnoloskiListi.reduce(
                (pAcc, tl) => {
                    pAcc.all += 1;
                    if (tl.statusTL == "Zaključen") {
                        pAcc.finished++;
                    } else {
                        pAcc.inprogress++;
                    }
                    return pAcc;
                },
                { inprogress: 0, finished: 0, all: 0 },
            );

            const pozicijaTask = {
                type: "position",
                id: pozicija.id,
                name: pozicija.nazivIzdelka,
                start: dayjs().toDate(),
                end: dayjs().add(1, "hour").toDate(),
                progress: (progress.finished / progress.all) * 100,
            };

            acc.push(pozicijaTask);

            pozicija.tehnoloskiListi
                .filter((entry) => {
                    if (selectedDetail == 1) {
                        return entry.statusTL != "Zaključen" && entry.statusTL != "Izdelan";
                    } else if (selectedDetail == 2) {
                        return entry.statusTL == "Izdelan" || entry.statusTL == "Zaključen";
                    }
                    return true;
                })
                .forEach((tl) => {
                    const tlProgress = tl.aktivnosti
                        .filter((entry) => entry.id != undefined)
                        .reduce(
                            (tAcc, activity) => {
                                tAcc.all += 1;
                                if (activity.status == "Zaključena") {
                                    tAcc.finished++;
                                } else {
                                    tAcc.inprogress++;
                                }
                                return tAcc;
                            },
                            { inprogress: 0, finished: 0, all: 0 },
                        );
                    const tlTask = {
                        type: "tl",
                        id: tl.id,
                        name: tl.naziv,
                        start: dayjs().add(2, "hour").toDate(),
                        end: dayjs().add(3, "hour").toDate(),
                        progress:
                            tlProgress.finished == 0
                                ? 0
                                : (tlProgress.finished / tlProgress.all) * 100,
                        dependencies: [pozicija.id],
                        status: tl.statusTL,
                        activities: tlProgress,
                        styles: {
                            progressColor:
                                (tlProgress.finished / tlProgress.all) * 100 >= 100
                                    ? "var(--bs-success)"
                                    : "var(--bs-info)",
                            progressSelectedColor:
                                (tlProgress.finished / tlProgress.all) * 100 >= 100
                                    ? "var(--bs-success)"
                                    : "var(--bs-info)",
                        },
                    };

                    acc.push(tlTask);

                    tl.aktivnosti
                        .filter((entry) => {
                            return entry.id != undefined;
                        })
                        .forEach((activity) => {
                            const aProgress = (+activity.realUr / +activity.planUr) * 100;

                            const aTask = {
                                type: "activity",
                                id: activity.id,
                                name: activity.naziv,
                                start: dayjs().add(4, "hour").toDate(),
                                end: dayjs().add(5, "hour").toDate(),
                                dependencies: [tl.id],
                                progress: aProgress > 100 ? 100 : aProgress,
                                status: activity.status,
                                hours: {
                                    planned: activity.planUr,
                                    realized: activity.realUr,
                                },
                                styles: {
                                    backgroundColor:
                                        activity.status == "Zaključena"
                                            ? "var(--bs-success)"
                                            : "lightgray",
                                    backgroundSelectedColor:
                                        activity.status == "Zaključena"
                                            ? "var(--bs-success)"
                                            : "lightgray",
                                    progressColor:
                                        activity.status == "Zaključena"
                                            ? +activity.planUr > +activity.realUr
                                                ? "var(--bs-info)"
                                                : "var(--bs-success)"
                                            : "var(--bs-info)",
                                    progressSelectedColor:
                                        activity.status == "Zaključena"
                                            ? +activity.planUr > +activity.realUr
                                                ? "var(--bs-info)"
                                                : "var(--bs-success)"
                                            : "var(--bs-info)",
                                },
                            };

                            acc.push(aTask);
                        });
                });
        });
        return acc;
    }, []);
};

export const generateReportGanttData = (reports) => {
    if (!reports) return [];
    return reports.reverse().map((report, i, arr) => {
        return {
            type: "report",
            id: report.id,
            name: report.operation,
            start: dayjs(report.date, "YYYYMMDD").toDate(),
            end: dayjs(report.date, "YYYYMMDD").add(24, "hour").toDate(),
            dependencies: i > 0 ? [arr[i - 1].id] : null,
            hours: +report.hours,
            employee: report.employeeName,
            operation: report.operation,
        };
    });
};
