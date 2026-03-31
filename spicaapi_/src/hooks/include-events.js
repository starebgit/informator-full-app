// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const dayjs = require('dayjs');
const { checkIfAvailable } = require('../utils');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const { availability } = context.params;
    const { app, result } = context;
    if (availability.includeAvailability) {
      const { startDate: startDateString, endDate: endDateString } =
        availability;

      const startDate = dayjs(startDateString);
      const endDate = dayjs(endDateString);
      const events = await app.service('events').find({
        query: {
          employeeId: { $in: result.map((employee) => employee.id) },
          dateTime: {
            $gte: startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss.SSS'),
            $lt: endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss.SSS')
          },
          eventId: { $gte: 0 },
          $select: ['employeeId', 'eventId', 'dateTime']
        },
        paginate: false
      });

      const employees = result.map((employee) => {
        const result = {
          employeeId: employee.employeeId,
          firstname: employee.firstName,
          lastname: employee.lastName,
          department: employee.department,
          superior: employee.superior,
          email: employee.email,           // add
          phone: employee.phone,           // add
          mobilePhone: employee.mobilePhone // add
        };
        const dailyEvents = events.reduce((acc, event) => {
          //Group by date and filter by employeeId
          const date = dayjs(event.dateTime).format('YYYY-MM-DD');
          if (event.employeeId === employee.id) {
            acc[date] = acc[date] || [];
            acc[date].push(event.eventId);
          }
          return acc;
        }, {});

        //Map to array of objects
        const availability = Object.keys(dailyEvents).map((date) => {
          return {
            date,
            events: dailyEvents[date],
            ...checkIfAvailable(dailyEvents[date])
          };
        });

        result.availability = availability;
        return result;
      });

      context.result = employees;
    } else {
      const employees = result.map((employee) => {
        return {
          id: employee.id,
          employeeId: employee.employeeId,
          firstname: employee.firstName,
          lastname: employee.lastName,
          department: employee.department,
          superior: employee.superior,
          email: employee.email,           // add
          phone: employee.phone,           // add
          mobilePhone: employee.mobilePhone // add      
        };
      });
      context.result = employees;
    }

    return context;
  };
};
