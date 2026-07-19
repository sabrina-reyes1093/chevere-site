const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function parseSendTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("NEWSLETTER_SEND_TIME must use 24-hour HH:MM format.");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error("NEWSLETTER_SEND_TIME is not a valid time.");
  return { hour, minute };
}

export function chicagoParts(date: Date) {
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function isFridaySendWindow(date: Date, sendTime = "08:30") {
  const parts = chicagoParts(date);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const target = parseSendTime(sendTime);
  const targetMinutes = target.hour * 60 + target.minute;
  return parts.weekday === "Fri" && minutes >= targetMinutes && minutes <= targetMinutes + 120;
}

export function nextFridayAtChicagoTime(from = new Date(), sendTime = "08:30") {
  const target = parseSendTime(sendTime);
  const cursor = new Date(from.getTime() + 60_000);
  cursor.setUTCSeconds(0, 0);
  for (let i = 0; i < 60 * 24 * 9; i += 1) {
    const parts = chicagoParts(cursor);
    if (parts.weekday === "Fri" && Number(parts.hour) === target.hour && Number(parts.minute) === target.minute) return cursor;
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new Error("Could not calculate the next Friday delivery time.");
}
