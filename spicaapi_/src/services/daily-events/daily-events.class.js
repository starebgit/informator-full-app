const dayjs = require('dayjs');
const { BadRequest } = require('@feathersjs/errors');
/* eslint-disable no-unused-vars */
exports.DailyEvents = class DailyEvents {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    const unitKeywords = {
      PLOŠČA: 'hotplate',
      TERMO: 'thermo',
      LIVARNA: 'foundry',
      'PTC 2': 'ptc',
      DESS: 'dess',
      'DESS 1': 'dess 1'
    };

    const { date } = params.query;
    if (date == undefined || date == '')
      throw new BadRequest('Date is required in YYYY-MM-DD format', params);
    const [numPeopleForeman] = await this.options.sequelize.query(
      `SELECT DEPARTMENT as unit, SUBDEPARTMENT as foreman,COUNT(NO) as count FROM [TSSPICA].[dbo].USERS WHERE DIVISION = 'ETA' GROUP BY DEPARTMENT, SUBDEPARTMENT`
    );

    const [numPeopleRetired] = await this.options.sequelize.query(
      `SELECT COUNT(w.[USERNO]) AS count,
      DEPARTMENT as unit,
      SUBDEPARTMENT as foreman
    FROM [TSSPICA].[dbo].[USER_WS] w
    INNER JOIN TSSPICA.dbo.USERS u ON (w.USERNO = u.NO)
    WHERE
    WSID LIKE '3710' AND u.DIVISION = 'ETA'
    AND ( VALID_FROM < CAST(:date as date) AND  VALID_TO IS NULL)
  GROUP BY DEPARTMENT, SUBDEPARTMENT`,
      {
        replacements: {
          date: date
        }
      }
    );
    const dateObj = dayjs(date, 'YYYY-MM-DD');
    const year = dateObj.year();
    const month = dateObj.month() + 1;
    const day = dateObj.date();
    const data = await this.options.sequelize.query(
      `
    SELECT 
      e.[NO]
      ,[USERNO]
      ,u.DEPARTMENT
      ,u.SUBDEPARTMENT
      ,[DT]
      ,[EVENTID]
      ,[TIMESTAMP]
    FROM [TSSPICA].[dbo].[EVENTS] e
      INNER JOIN USERS u ON (e.USERNO = u.NO)
    WHERE DATEPART(YEAR,DT) = :year
      AND DATEPART(MONTH,DT) = :month
      AND DATEPART(DAY,DT) = :day
      AND EVENTID IS NOT NULL
      AND u.DIVISION = 'ETA'
      `,
      {
        replacements: { year: year, month: month, day: day },
        raw: true,
        type: this.options.sequelize.QueryTypes.SELECT
      }
    );

    const schemas = await this.options.sequelize.query(
      `
      SELECT
        [USERNO]
        ,[VALID_FROM]
        ,[VALID_TO]
        ,[WSID]
      FROM [TSSPICA].[dbo].[USER_WS]
      WHERE
        WSID LIKE '3710'
        AND (( VALID_FROM < CAST(:date as date)
        AND VALID_TO > CAST(:date as date)) OR VALID_TO IS NULL)
      `,
      {
        replacements: { date: date },
        raw: true,
        type: this.options.sequelize.QueryTypes.SELECT
      }
    );

    const agg = data.reduce((acc, cur) => {
      if (!acc[cur.DEPARTMENT]) acc[cur.DEPARTMENT] = {};
      else if (!acc[cur.DEPARTMENT][cur.SUBDEPARTMENT])
        acc[cur.DEPARTMENT][cur.SUBDEPARTMENT] = {};
      else if (!acc[cur.DEPARTMENT][cur.SUBDEPARTMENT][cur.USERNO])
        acc[cur.DEPARTMENT][cur.SUBDEPARTMENT][cur.USERNO] = [cur.EVENTID];
      else if (
        !(
          cur.EVENTID == 27 &&
          acc[cur.DEPARTMENT][cur.SUBDEPARTMENT][cur.USERNO].includes(27)
        )
      )
        acc[cur.DEPARTMENT][cur.SUBDEPARTMENT][cur.USERNO] = [
          ...acc[cur.DEPARTMENT][cur.SUBDEPARTMENT][cur.USERNO],
          cur.EVENTID
        ];
      return acc;
    }, {});

    const unitEvents = {};
    for (const [unitKey, foremans] of Object.entries(agg)) {
      if (unitKey == 'null' || unitKey == 'ZUNANJI DELAVCI') continue;
      const unit = unitKeywords[unitKey];
      for (const [foreman, users] of Object.entries(foremans)) {
        const eventsObj = {};
        let absenceCounter = 0;
        let presenceCounter = 0;
        for (const [user, events] of Object.entries(users)) {
          let absent = this._absence(events);
          let present = this._presence(events);
          if (present != 0) presenceCounter++;
          else if (absent != 0) absenceCounter++;
          events.forEach((event) => {
            if (!eventsObj[event]) eventsObj[event] = 1;
            else eventsObj[event] += 1;
          });
        }
        if (!unitEvents[unit]) {
          unitEvents[unit] = {};
        }
        if (!unitEvents[unit][foreman]) {
          const plan = numPeopleForeman.find(
            (entry) => entry.unit == unitKey && entry.foreman == foreman
          );

          const retirements = numPeopleRetired.find(
            (entry) => entry.unit == unitKey && entry.foreman == foreman
          );
          unitEvents[unit][foreman] = {
            plan:
              plan != undefined
                ? retirements != undefined
                  ? plan.count - retirements.count
                  : plan.count
                : undefined,
            absences: absenceCounter,
            presences: presenceCounter,
            ...eventsObj
          };
        }
      }
    }
    return unitEvents;
  }

  _absence(events) {
    if (events.includes(8)) return 1;
    if (events.includes(9)) return 1;
    if (events.includes(21)) return 1;
    if (events.includes(22)) return 1;
    if (events.includes(26)) return 1;
    if (events.includes(31)) return 1;
    if (events.includes(37)) return 1;
    if (events.includes(38)) return 1;
    if (events.includes(39)) return 1;
    if (events.includes(40)) return 1;
    if (events.includes(41)) return 1;
    if (events.includes(43)) return 1;
    if (events.includes(52)) return 1;
    if (events.includes(53)) return 1;
    if (events.includes(54)) return 1;
    if (events.includes(55)) return 1;
    if (events.includes(56)) return 1;
    if (events.includes(57)) return 1;
    if (events.includes(60)) return 1;
    if (events.includes(61)) return 1;
    if (events.includes(62)) return 1;
    if (events.includes(63)) return 1;
    if (events.includes(64)) return 1;
    if (events.includes(65)) return 1;

    if (events.includes(70)) return 1;

    if (events.includes(71)) return 1;
    if (events.includes(76)) return 1;
    if (events.includes(77)) return 1;
    if (events.includes(78)) return 1;
    if (events.includes(79)) return 1;
    if (events.includes(80)) return 1;
    if (events.includes(81)) return 1;
    if (events.includes(82)) return 1;
    if (events.includes(83)) return 1;
    if (events.includes(84)) return 1;
    if (events.includes(85)) return 1;
    if (events.includes(86)) return 1;
    if (events.includes(87)) return 1;
    if (events.includes(88)) return 1;
    if (events.includes(89)) return 1;
    if (events.includes(90)) return 1;
    if (events.includes(91)) return 1;
    if (events.includes(92)) return 1;
    if (events.includes(93)) return 1;
    if (events.includes(94)) return 1;
    if (events.includes(96)) return 1;
    if (events.includes(97)) return 1;
    if (events.includes(98)) return 1;
    if (events.includes(101)) return 1;
    if (events.includes(104)) return 1;
    return 0;
  }

  _presence(events) {
    if (events.includes(10)) return 1;
    if (events.includes(14)) return 1;
    if (events.includes(27)) return 1;
    if (events.includes(28)) return 1;
    if (events.includes(36)) return 1;
    if (events.includes(45)) return 1;
    if (events.includes(48)) return 1;
    if (events.includes(66)) return 1;
    if (events.includes(68)) return 1;
    if (events.includes(75)) return 1;
    if (events.includes(105)) return 1;
    return 0;
  }

  async get(id, params) {
    return id;
  }

  async create(data, params) {
    return data;
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return { id };
  }
};
