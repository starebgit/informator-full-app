import dayjs from "dayjs";
import * as timezone from "dayjs/plugin/timezone";
import jsonata from "jsonata";
import client, { spicaClient } from "../../../feathers/feathers";
dayjs.extend(timezone);

// eslint-disable-next-line no-template-curly-in-string
const transformExp = jsonata("${$string(`employeeId`):[eventId]}");
// eslint-disable-next-line no-template-curly-in-string
const transformRestExp = jsonata("${`date`:{$string(`employeeId`):[eventId]}}");
//add a bool if the date is max , which will fetch all remaining days.
export async function getEmyployeeEvents(employees, date, endDate = false) {
    // If endDate NOT is set we fetch events for single date
    if (!endDate) {
        return spicaClient
            .service("events")
            .find({
                query: {
                    dateTime: {
                        $gte: date.startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                        $lt: date.endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                    },
                    employeeId: { $in: employees },
                    eventId: { $gt: 0 },
                },
            })
            .then((result) => {
                return transformExp.evaluate(result);
            });
        //If endDate IS set we fetch events for all remaining days with employees of last row.
        //Another check needs to been, if startDate is in the future, then we just fetch last employees and getEmployeeEvents with endDate set.
    } else {
        return spicaClient
            .service("events")
            .find({
                query: {
                    dateTime: {
                        $gte: date.startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                        $lt: endDate.endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                    },
                    employeeId: { $in: employees },
                    eventId: { $gt: 0 },
                },
            })
            .then((result) => {
                return transformRestExp.evaluate(result);
            });
    }
}

export async function getEvents(subunitId, startDate, endDate, foremans) {
    //TODO - Fix the 'all' fetching. It should only include the foremans passed in an array. Currently it fetches all foremans.
    //TODO - The staff service should allow querying by subunitId.
    //Find all staff entries that are between start and end date
    const data =
        foremans == "all"
            ? startDate.isBefore(dayjs())
                ? client.service("staff").find({
                      query: {
                          date: {
                              $gte: startDate.format("YYYY-MM-DD"),
                              $lte: endDate.format("YYYY-MM-DD"),
                          },
                          subunitId: subunitId,
                      },
                  })
                : client.service("staff").find({
                      query: {
                          date: dayjs().format("YYYY-MM-DD"),
                          subunitId: subunitId,
                      },
                  })
            : startDate.isBefore(dayjs())
            ? client.service("staff").find({
                  query: {
                      date: {
                          $gte: startDate.format("YYYY-MM-DD"),
                          $lte: endDate.format("YYYY-MM-DD"),
                      },
                      foremanId: +foremans,
                  },
              })
            : client.service("staff").find({
                  query: {
                      date: dayjs().format("YYYY-MM-DD"),
                      foremanId: +foremans,
                  },
              });

    return data.then(async ({ data }) => {
        //Filter out all other subunits
        const subunitStaff = await data.filter((staffDay) => {
            if (subunitId == -1) return true;
            return staffDay.foreman.subunitId == subunitId;
        });

        //Then merge all entries for same day and same unit
        if (subunitStaff.length == 0) return [];
        const dailyStaff = subunitStaff.reduce((acc, { date, foreman, employeeId }) => {
            acc[date] = acc[date] ? acc[date] : [];
            acc[date] = acc[date].concat(JSON.parse(employeeId));
            return acc;
        }, {});

        //For all the missing entries till the end of the month, copy the last entry
        const lastDate = Object.keys(dailyStaff).sort().reverse()[0];
        const lastStaff = dailyStaff[lastDate];
        const lastStaffDate = dayjs(lastDate);

        const endDateMonth = endDate.endOf("month");

        if (lastStaffDate.isBefore(startDate.startOf("month"))) {
            delete dailyStaff[lastDate];
            let startDateMonth = startDate.startOf("month");
            dailyStaff[startDateMonth.format("YYYY-MM-DD")] = lastStaff;
            while (startDateMonth.isBefore(endDateMonth, "day")) {
                startDateMonth = startDateMonth.add(1, "day");
                dailyStaff[startDateMonth.format("YYYY-MM-DD")] = lastStaff;
            }
        } else if (lastStaffDate.isBefore(endDateMonth)) {
            const diff = endDateMonth.diff(lastStaffDate, "day");
            for (let i = 1; i <= diff; i++) {
                const newDate = lastStaffDate.add(i, "day").format("YYYY-MM-DD");
                dailyStaff[newDate] = lastStaff;
            }
        }

        const mergedDailyStaff = Object.entries(dailyStaff).reduce((acc, [date, staff]) => {
            if (acc.length == 0) {
                acc.push({ startDate: date, endDate: date, staff: staff });
            } else {
                if (staff.length == acc[acc.length - 1].staff.length) {
                    acc[acc.length - 1].endDate = date;
                } else {
                    acc.push({ startDate: date, endDate: date, staff: staff });
                }
            }
            return acc;
        }, []);

        const dailyReports = await Promise.all(
            mergedDailyStaff.map(async (cur) => {
                const { startDate, endDate, staff } = cur;
                const data = await spicaClient.service("daily-report").find({
                    query: {
                        startDate,
                        endDate,
                        employees: staff,
                    },
                });
                return data;
            }),
        ).then((results) => {
            return results.flat();
        });

        return dailyReports;
    });
}

function getStatus(events) {
    const absent = [26, 31, 38, 39, 91, 56, 55, 43, 52, 104, 65, 86];
    return !events.some((event) => absent.includes(event));
}

export async function getEmployees(ids = [], startDate, endDate) {
    return spicaClient
        .service("employee")
        .find({ query: { id: { $in: ids }, department: "ETA " } })
        .then(async (res) => {
            const events = await spicaClient
                .service("events")
                .find({
                    query: {
                        dateTime: {
                            $gte: startDate.startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                            $lt: endDate.endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                        },
                        employeeId: { $in: ids },
                        eventId: { $gt: 0 },
                    },
                })
                .then((res) => res);

            return res.map((employee) => {
                const employeeEvents = events
                    .filter((event) => event.employeeId == employee.id)
                    .map((event) => event.eventId);
                return {
                    ...employee,
                    events: employeeEvents,
                    available: getStatus(employeeEvents),
                };
            });
        });
}

export async function getAllEmployees(startDate, endDate, isVzdrzevanje = false) {
    return spicaClient
        .service("employee")
        .find({
            query: {
                ...(isVzdrzevanje && { orgno: 50068219 }),
                $or: [{ department: "ETA " }, { department: "ETA OSTALI" }],
            },
        })
        .then(async (res) => {
            const ids = res.map((employee) => employee.id);
            const events = await spicaClient
                .service("events")
                .find({
                    query: {
                        dateTime: {
                            $gte: startDate.startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                            $lt: endDate.endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
                        },
                        employeeId: { $in: ids },
                        eventId: { $gt: 0 },
                    },
                })
                .then((res) => res);

            return res.map((employee) => {
                const employeeEvents = events
                    .filter((event) => event.employeeId == employee.id)
                    .map((event) => event.eventId);
                return {
                    ...employee,
                    events: employeeEvents,
                    available: getStatus(employeeEvents),
                };
            });
        });
}
