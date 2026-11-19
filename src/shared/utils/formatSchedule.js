const WEEKDAYS = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

function formatTime(time) {
  const [hour, minute] = time.split(':');
  return `${Number(hour)}:${minute}`;
}

function ordinal(day) {
  const remainder = day % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  return `${day}${suffix}`;
}

export function formatSchedule(schedule) {
  const time = formatTime(schedule.time);
  if (schedule.frequency === 'monthly') {
    return `${ordinal(schedule.day_of_month)} of every month, ${time}`;
  }
  if (schedule.frequency === 'weekly') {
    return `${WEEKDAYS[schedule.weekday - 1]}, ${time}`;
  }
  return `Daily, ${time}`;
}
