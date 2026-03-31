module.exports = {
  checkIfAvailable: checkIfAvailable
};
function checkIfAvailable(events) {
  const absent = [26, 31, 38, 39, 91, 56, 55, 43, 52, 104, 65, 86];
  const sick = [
    37, 43, 52, 54, 55, 56, 60, 61, 62, 63, 64, 65, 70, 71, 76, 77, 78, 79, 80,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90
  ];
  const waiting = [92, 93, 96, 97, 101, 102, 103];
  const remote = [14];
  const specialLeave = [9, 31, 39];
  const hourUse = [10, 26];
  const materinity = [8, 21];
  const holiday = [22];
  const leave = [38];
  const presence = [27, 48];
  const higherForce = [91];
  const quarantine = [104, 65, 86];

  return {
    available: !events.some((event) => absent.includes(event)),
    sick: events.some((event) => sick.includes(event)),
    waiting: events.some((event) => waiting.includes(event)),
    remote: events.some((event) => remote.includes(event)),
    specialLeave: events.some((event) => specialLeave.includes(event)),
    hourUse: events.some((event) => hourUse.includes(event)),
    materinity: events.some((event) => materinity.includes(event)),
    holiday: events.some((event) => holiday.includes(event)),
    leave: events.some((event) => leave.includes(event)),
    presence: events.some((event) => presence.includes(event)),
    higherForce: events.some((event) => higherForce.includes(event)),
    quarantine: events.some((event) => quarantine.includes(event))
  };
}
