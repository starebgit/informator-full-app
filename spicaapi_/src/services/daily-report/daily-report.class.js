const dayjs = require('dayjs');
const { checkIfAvailable } = require('../../utils');

/* eslint-disable no-unused-vars */
exports.DailyReport = class DailyReport {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    // We can either get passed in an array of subdepartments or an array of employees.
    // If we get an array of subdepartments, we need to get all employees in those subdepartments.
    // If we get an array of employees, we need to get only those employees.
    // We cannot have both subdepartments and employees in the same request.
    const { subdepartments, employees, startDate, endDate } = params.query;
    if (subdepartments && employees) {
      throw new Error(
        'Cannot have both subdepartments and employees params in the same request.'
      );
    }

    if (!subdepartments && !employees) {
      throw new Error('Either subdepartments or employees params must be set.');
    }

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate params must be set.');
    }

    const { app } = this.options;
    const employeesArray = Array.isArray(employees)
      ? employees
      : employees.replaceAll(' ', '').split(',');
    const events = await app.service('events').find({
      query: {
        employeeId: { $in: employeesArray },
        dateTime: {
          $gte: dayjs(startDate)
            .startOf('day')
            .format('YYYY-MM-DD HH:mm:ss.SSS'),
          $lt: dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss.SSS')
        },
        eventId: { $gte: 0 }
      },
      paginate: false
    });

    // Group events by date and employeeId
    const dailyEvents = events.reduce((acc, event) => {
      const date = dayjs(event.dateTime).format('YYYY-MM-DD');
      acc[date] = acc[date] || {};
      acc[date][event.employeeId] = acc[date][event.employeeId] || [];
      acc[date][event.employeeId].push(event.eventId);
      return acc;
    }, {});

    // Check if any date is missing between startDate and endDate in dailyEvents
    const dates = Object.keys(dailyEvents);
    const missingDates = {};
    for (
      let date = dayjs(startDate);
      date.isBefore(dayjs(endDate).add(1, 'day'), 'day');
      date = date.add(1, 'day')
    ) {
      if (!dates.includes(date.format('YYYY-MM-DD'))) {
        missingDates[date.format('YYYY-MM-DD')] = { 0: [] };
      }
    }

    return Object.entries({ ...dailyEvents, ...missingDates })
      .filter(([date, _]) => {
        return dayjs(date).isBefore(dayjs(endDate).add(1, 'day'), 'day');
      })
      .map(([date, employeeEvents]) => {
        const dailySum = Object.entries(employeeEvents).reduce(
          (acc, [employeeId, events]) => {
            const {
              presence,
              absence,
              leave,
              sick,
              remote,
              specialLeave,
              hourUse,
              materinity,
              higherForce,
              quarantine
            } = checkIfAvailable(events);
            presence && acc.presence++;
            absence && acc.absence++;
            leave && acc.leave++;
            sick && acc.sick++;
            remote && acc.remote++;
            specialLeave && acc.specialLeave++;
            hourUse && acc.hourUse++;
            materinity && acc.materinity++;
            higherForce && acc.higherForce++;
            quarantine && acc.quarantine++;
            return acc;
          },
          {
            presence: 0,
            absence: 0,
            leave: 0,
            sick: 0,
            remote: 0,
            specialLeave: 0,
            hourUse: 0,
            materinity: 0,
            higherForce: 0,
            quarantine: 0,
            plan: employees.length
          }
        );
        return {
          date,
          ...dailySum,
          absence: dailySum.plan - dailySum.presence
        };
      });
  }

  async get(id, params) {
    return new Error('Not available.');
  }

  async create(data, params) {
    return new Error('Not available.');
  }

  async update(id, data, params) {
    return new Error('Not available.');
  }

  async patch(id, data, params) {
    return new Error('Not available.');
  }

  async remove(id, params) {
    return new Error('Not available.');
  }
};
